import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { handlePaymentSuccess } from "@/app/utils/paymentUtils";
import { unlockPartnerReward } from "@/lib/partnerRewards";
import { generateSecureQRToken } from "@/lib/security";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            sessionToken, 
            gateway,
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            cashfree_order_id,
            cashfree_payment_id,
            cashfree_status
        } = body;

        if (!sessionToken || !gateway) {
            return NextResponse.json({ error: "Session token and gateway are required" }, { status: 400 });
        }

        // 1. Fetch booking session along with event details
        const { data: session, error: sessionErr } = await supabaseAdmin
            .from("booking_sessions")
            .select("*, events(*)")
            .eq("id", sessionToken)
            .maybeSingle();

        if (sessionErr || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const bookingId = session.participant_data?.bookingId;
        if (!bookingId) {
            return NextResponse.json({ error: "No booking associated with this session" }, { status: 400 });
        }

        // 2. Fetch the Booking record
        const { data: booking, error: bookingErr } = await supabaseAdmin
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

        if (bookingErr || !booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // 3. Verify Payment Signature/Status
        let isVerified = false;
        let finalPaymentId = "";
        let finalOrderId = "";

        if (gateway === "Free" || booking.total_price === 0) {
            isVerified = true;
            finalPaymentId = "FREE_" + Date.now();
            finalOrderId = "FREE_" + Date.now();
        } else if (gateway === "Razorpay") {
            let key_secret = process.env.RAZORPAY_KEY_SECRET;

            const { data: gatewayConfig } = await supabaseAdmin
                .from('payment_gateways')
                .select('config')
                .eq('name', 'Razorpay')
                .maybeSingle();

            if (gatewayConfig?.config) {
                key_secret = gatewayConfig.config.keySecret || gatewayConfig.config.apiSecret || key_secret;
            }

            if (!key_secret) {
                return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
            }

            const text = razorpay_order_id + "|" + razorpay_payment_id;
            const generated_signature = crypto
                .createHmac("sha256", key_secret)
                .update(text)
                .digest("hex");

            if (generated_signature === razorpay_signature) {
                isVerified = true;
                finalPaymentId = razorpay_payment_id;
                finalOrderId = razorpay_order_id;
            } else {
                return NextResponse.json({ error: "Invalid signature verification" }, { status: 400 });
            }
        } else if (gateway === "Cashfree") {
            // In Cashfree client integrations, we verify order status
            if (cashfree_status === "PAID" || cashfree_status === "SUCCESS") {
                isVerified = true;
                finalPaymentId = cashfree_payment_id || "CF_" + Date.now();
                finalOrderId = cashfree_order_id;
            } else {
                return NextResponse.json({ error: "Cashfree payment failed or pending" }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: "Unsupported gateway verification" }, { status: 400 });
        }

        if (!isVerified) {
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }

        // 4. Update Booking Status to Confirmed
        await supabaseAdmin
            .from("bookings")
            .update({ status: "Confirmed" })
            .eq("id", bookingId);

        // 5. Update payment_transactions status
        await supabaseAdmin
            .from("payment_transactions")
            .update({
                payment_status: "success",
                response_payload: body
            })
            .eq("booking_id", bookingId)
            .eq("gateway", gateway);

        // 6. Record in payments table (legacy support)
        const { data: paymentRecord } = await supabaseAdmin.from('payments').insert({
            booking_id: bookingId,
            user_id: session.user_id,
            type: 'event',
            reference_id: bookingId,
            payment_gateway: gateway,
            payment_id: finalPaymentId,
            order_id: finalOrderId,
            signature: razorpay_signature || "",
            status: 'pending',
            total_amount: booking.total_price,
            base_amount: booking.base_amount,
            platform_fee: booking.platform_charge,
            gst_amount_col: booking.gst_amount
        }).select().single();

        // 7. Unified Payment Logic (Wallet Credit & Revenue split)
        const organiserId = session.events?.organiser_id;
        if (paymentRecord?.id) {
            await handlePaymentSuccess({
                paymentId: paymentRecord.id,
                type: 'event',
                referenceId: bookingId,
                totalAmount: booking.total_price,
                baseAmount: booking.partner_total || booking.base_amount || 0,
                platformFee: booking.platform_charge || 0,
                gstAmount: booking.gst_amount || 0,
                providerId: organiserId,
                eventId: session.event_id,
                description: `Earnings from event booking #${bookingId.slice(-8).toUpperCase()}`
            });
        }

        // 8. Decrement event ticket inventory
        try {
            const ticketsBought = booking.ticket_count || 1;
            const { data: ev } = await supabaseAdmin
                .from('events')
                .select('total_seats')
                .eq('id', session.event_id)
                .maybeSingle();
            if (ev) {
                // Count all confirmed bookings for this event to get accurate sold count
                const { count: soldCount } = await supabaseAdmin
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', session.event_id)
                    .eq('status', 'Confirmed');
                
                const bookedSeats = soldCount || 0;
                await supabaseAdmin
                    .from('events')
                    .update({ 
                        normal_ticket_capacity: Math.max(0, (ev.total_seats || 0) - bookedSeats)
                    })
                    .eq('id', session.event_id);
            }
        } catch (invErr) {
            console.warn('[verify-payment] Inventory update error:', invErr.message);
        }

        // 9. Generate Ticket Record
        const ticketId = crypto.randomUUID();
        const ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
        const qrCodeToken = generateSecureQRToken({
            ticketId,
            bookingId,
            eventId: session.event_id,
            ticketCode: ticketNumber
        });
        await supabaseAdmin.from('tickets').insert({
            id: ticketId,
            booking_id: bookingId,
            ticket_number: ticketNumber,
            status: 'active',
            qr_code: qrCodeToken
        });

        // 9. Record Coupon / Partner Campaign Voucher Usage
        const pricingSnapshot = session.pricing_snapshot || {};
        
        if (pricingSnapshot.appliedCampaignId) {
            // Partner Voucher Redemption
            const { data: coupon } = await supabaseAdmin
                .from("coupon_inventory")
                .select("id")
                .eq("coupon_code", pricingSnapshot.appliedCouponCode)
                .maybeSingle();

            if (coupon) {
                // Mark coupon as redeemed
                await supabaseAdmin
                    .from("coupon_inventory")
                    .update({
                        status: "redeemed",
                        redeemed_at: new Date().toISOString()
                    })
                    .eq("id", coupon.id);

                // Add log to coupon_usage_logs
                await supabaseAdmin
                    .from("coupon_usage_logs")
                    .insert({
                        user_id: session.user_id,
                        coupon_id: coupon.id,
                        booking_id: bookingId,
                        action: "redeem"
                    });
            }
        } else if (pricingSnapshot.appliedCouponId) {
            // Regular Coupon Redemption
            await supabaseAdmin.from('coupon_usage').insert({
                user_id: session.user_id,
                coupon_id: pricingSnapshot.appliedCouponId,
                booking_id: bookingId
            });
        }

        // 10. Update booking session status to completed
        await supabaseAdmin
            .from("booking_sessions")
            .update({ status: "completed" })
            .eq("id", sessionToken);

        // 11. Post-Payment Reward Coupon Distribution
        let rewardInfo = null;
        try {
            const rewardResult = await unlockPartnerReward(bookingId, session.user_id, session.event_id);
            if (rewardResult.success && rewardResult.rewards && rewardResult.rewards.length > 0) {
                rewardInfo = rewardResult.rewards[0];
            }
        } catch (rewardErr) {
            console.error("[REWARDS] Error in verify-payment unlockPartnerReward:", rewardErr.message);
        }

        // 12. Trigger Email/SMS Notifications
        try {
            const customerDetails = booking.customer_details || {};
            const phoneNumber = customerDetails.phone || customerDetails.mobile;
            const email = customerDetails.email;

            if (phoneNumber || email) {
                const protocol = request.headers.get('x-forwarded-proto') || 'https';
                const host = request.headers.get('host');
                const origin = `${protocol}://${host}`;

                await fetch(`${origin}/api/comm/trigger`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phoneNumber,
                        email,
                        type: "BOOKING",
                        data: {
                            name: customerDetails.name || "Customer",
                            eventName: session.events?.title || "Event",
                            date: session.events?.date || "TBA",
                            bookingId: bookingId,
                            ticketNumber: ticketNumber
                        }
                    })
                });
            }
        } catch (notifyErr) {}

        return NextResponse.json({ 
            success: true, 
            bookingId,
            rewardInfo
        });
    } catch (err) {
        console.error("Verify Payment Error:", err);
        return NextResponse.json({ error: err.message || "Failed to verify payment" }, { status: 500 });
    }
}
