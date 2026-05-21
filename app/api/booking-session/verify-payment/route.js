import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { after } from "next/server";
import crypto from "crypto";
import { generateSecureQRToken } from "@/lib/security";
import { queueJob, executeJob } from "@/app/utils/backgroundJobs";

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

        // ── SYNCHRONOUS CRITICAL PATH ──────────────────────────────────────────
        // Executed instantly to confirm booking, issue e-ticket and secure QR

        const nowIso = new Date().toISOString();

        // 4. Update Booking Status to Confirmed immediately
        await supabaseAdmin
            .from("bookings")
            .update({ 
                status: "Confirmed",
                payment_status: "paid",
                confirmed_at: nowIso,
                booking_ref: bookingId.slice(-8).toUpperCase()
            })
            .eq("id", bookingId);

        // 5. Update payment_transactions status
        await supabaseAdmin
            .from("payment_transactions")
            .update({
                payment_status: "success",
                booking_session_id: sessionToken,
                gateway_payment_id: finalPaymentId,
                gateway_order_id: finalOrderId,
                verified_at: nowIso,
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
            status: 'success', // confirmed instantly
            total_amount: booking.total_price,
            base_amount: booking.base_amount,
            platform_fee: booking.platform_charge,
            gst_amount_col: booking.gst_amount
        }).select().single();

        // 7. Decrement event ticket inventory
        try {
            const { data: ev } = await supabaseAdmin
                .from('events')
                .select('total_seats')
                .eq('id', session.event_id)
                .maybeSingle();
            if (ev) {
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

        // 7.5 Mark individual seats as sold in seat_inventory
        if (booking.selected_seats && booking.selected_seats.length > 0) {
            try {
                for (const seat of booking.selected_seats) {
                    const seatId = seat.id; // e.g. "VIP-A-1"
                    // Try to update existing, or insert if not exists
                    const { data: existingSeat } = await supabaseAdmin
                        .from('seat_inventory')
                        .select('id')
                        .eq('event_id', session.event_id)
                        .eq('seat_number', seatId)
                        .maybeSingle();

                    if (existingSeat) {
                        await supabaseAdmin.from('seat_inventory').update({ status: 'sold' }).eq('id', existingSeat.id);
                    } else {
                        await supabaseAdmin.from('seat_inventory').insert({ event_id: session.event_id, seat_number: seatId, status: 'sold' });
                    }
                }
            } catch (seatUpdateErr) {
                console.warn('[verify-payment] Seat status update error:', seatUpdateErr.message);
            }
        }

        // 8. Generate Ticket Record with Secure QR Token
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
            ticket_code: ticketNumber,
            qr_token: qrCodeToken,
            issued_at: nowIso,
            status: 'active',
            qr_code: qrCodeToken
        });

        // 9. Record Coupon / Partner Campaign Voucher Usage
        const pricingSnapshot = session.pricing_snapshot || {};
        if (pricingSnapshot.appliedCampaignId) {
            const { data: coupon } = await supabaseAdmin
                .from("coupon_inventory")
                .select("id")
                .eq("coupon_code", pricingSnapshot.appliedCouponCode)
                .maybeSingle();

            if (coupon) {
                await supabaseAdmin
                    .from("coupon_inventory")
                    .update({
                        status: "redeemed",
                        redeemed_at: nowIso
                    })
                    .eq("id", coupon.id);

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

        // ── ASYNCHRONOUS DEFERRED PATH (USING NEXT.JS AFTER) ──────────────────
        // Heavy settlements, rewards and slow external notifications are run async
        // keeping checkout confirmation times under 2 seconds!

        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const host = request.headers.get('host');
        const origin = `${protocol}://${host}`;

        after(async () => {
            console.log(`[After-Response] Triggering background jobs for booking: ${bookingId}`);

            // 1. Financial Settlement Job
            const organiserId = session.events?.organiser_id;
            if (paymentRecord?.id) {
                const { jobId } = await queueJob({
                    jobType: "settlement",
                    bookingId,
                    payload: {
                        paymentId: paymentRecord.id,
                        totalAmount: booking.total_price,
                        baseAmount: booking.partner_total || booking.base_amount || 0,
                        platformFee: booking.platform_charge || 0,
                        gstAmount: booking.gst_amount || 0,
                        providerId: organiserId,
                        eventId: session.event_id,
                        description: `Earnings from event booking #${bookingId.slice(-8).toUpperCase()}`
                    }
                });

                // Instantly execute the job
                await executeJob({
                    jobId,
                    jobType: "settlement",
                    bookingId,
                    payload: {
                        paymentId: paymentRecord.id,
                        totalAmount: booking.total_price,
                        baseAmount: booking.partner_total || booking.base_amount || 0,
                        platformFee: booking.platform_charge || 0,
                        gstAmount: booking.gst_amount || 0,
                        providerId: organiserId,
                        eventId: session.event_id,
                        description: `Earnings from event booking #${bookingId.slice(-8).toUpperCase()}`
                    }
                });
            }

            // 2. Rewards Job
            const { jobId: rewardsJobId } = await queueJob({
                jobType: "rewards",
                bookingId,
                payload: {
                    userId: session.user_id,
                    eventId: session.event_id
                }
            });

            await executeJob({
                jobId: rewardsJobId,
                jobType: "rewards",
                bookingId,
                payload: {
                    userId: session.user_id,
                    eventId: session.event_id
                }
            });

            // 3. Notifications Job
            const customerDetails = booking.customer_details || {};
            const phoneNumber = customerDetails.phone || customerDetails.mobile;
            const email = customerDetails.email;

            if (phoneNumber || email) {
                const { jobId: notifyJobId } = await queueJob({
                    jobType: "notifications",
                    bookingId,
                    payload: {
                        phoneNumber,
                        email,
                        name: customerDetails.name || "Customer",
                        eventName: session.events?.title || "Event",
                        date: session.events?.date || "TBA",
                        ticketNumber
                    }
                });

                await executeJob({
                    jobId: notifyJobId,
                    jobType: "notifications",
                    bookingId,
                    payload: {
                        phoneNumber,
                        email,
                        name: customerDetails.name || "Customer",
                        eventName: session.events?.title || "Event",
                        date: session.events?.date || "TBA",
                        ticketNumber
                    },
                    origin
                });
            }
        });

        // Instant redirect response
        return NextResponse.json({ 
            success: true, 
            bookingId
        });

    } catch (err) {
        console.error("Verify Payment Error:", err);
        return NextResponse.json({ error: err.message || "Failed to verify payment" }, { status: 500 });
    }
}
