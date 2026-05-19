import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { handlePaymentSuccess } from "@/app/utils/paymentUtils";
import { unlockPartnerReward } from "@/lib/partnerRewards";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            id,
            type = "booking" // "booking" for events, "service" for professional services
        } = body;

        let key_secret = process.env.RAZORPAY_KEY_SECRET;

        const { data: gateway } = await supabaseAdmin
            .from('payment_gateways')
            .select('config')
            .eq('name', 'Razorpay')
            .maybeSingle();

        if (gateway?.config) {
            key_secret = gateway.config.keySecret || gateway.config.apiSecret || key_secret;
        }

        if (!key_secret) {
            return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
        }

        // 1. Verify Signature
        const text = razorpay_order_id + "|" + razorpay_payment_id;
        const generated_signature = crypto
            .createHmac("sha256", key_secret)
            .update(text)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        if (type === "booking" || type === "event") {
            // 2. Fetch Booking and Event details
            const { data: booking, error: fetchErr } = await supabaseAdmin
                .from('bookings')
                .select('*, events(*)')
                .eq('id', id)
                .single();

            if (fetchErr) throw fetchErr;

            // 3. Update Booking Status
            const { error: bookingErr } = await supabaseAdmin
                .from('bookings')
                .update({ status: 'Confirmed' })
                .eq('id', id);

            if (bookingErr) throw bookingErr;

            // 4. Record Payment
            const { data: paymentRecord } = await supabaseAdmin.from('payments').insert({
                booking_id: id,
                user_id: booking.user_id,
                type: 'event',
                reference_id: id,
                payment_gateway: 'Razorpay',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                signature: razorpay_signature,
                status: 'pending', // Will be updated by handlePaymentSuccess
                total_amount: booking.total_price,
                base_amount: booking.base_amount,
                platform_fee: booking.platform_charge,
                gst_amount_col: booking.gst_amount
            }).select().single();

            const paymentId = paymentRecord?.id;

            // 5. Unified Payment Logic (Wallet Credit & Revenue split)
            const organiserId = booking.events?.organiser_id;
            if (paymentId) {
                await handlePaymentSuccess({
                    paymentId,
                    type: 'event',
                    referenceId: id,
                    totalAmount: booking.total_price,
                    baseAmount: booking.partner_total || (booking.base_amount - (booking.discount_amount || 0)),
                    platformFee: booking.platform_charge || 0,
                    gstAmount: booking.gst_amount || 0,
                    providerId: organiserId,
                    description: `Earnings from event booking ${id}`
                });
            }

            // 6. Generate Ticket Record
            let ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
            await supabaseAdmin.from('tickets').insert({
                booking_id: id,
                ticket_number: ticketNumber,
                status: 'active'
            });

            // 6.1 Unlock Partner Rewards post-booking
            try {
                await unlockPartnerReward(id, booking.user_id, booking.event_id);
            } catch (rewardErr) {
                console.error("[REWARDS] Error in verify unlockPartnerReward:", rewardErr.message);
            }

            // 7. Record Coupon Usage
            if (booking.coupon_id) {
                await supabaseAdmin.from('coupon_usage').insert({
                    user_id: booking.user_id,
                    coupon_id: booking.coupon_id,
                    booking_id: id
                });
            }

            // 8. Trigger Notifications
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
                                eventName: booking.events?.title || "Event",
                                date: booking.events?.date || "TBA",
                                bookingId: id,
                                ticketNumber: ticketNumber
                            }
                        })
                    });
                }
            } catch (notifyErr) {}

        } else if (type === "service") {
            // 1. Fetch Service Booking details
            const { data: sBooking, error: sErr } = await supabaseAdmin
                .from('vendor_bookings')
                .select('*')
                .eq('id', id)
                .single();
            
            if (sErr) throw sErr;

            // 2. Update Status
            await supabaseAdmin.from('vendor_bookings').update({ status: 'Paid' }).eq('id', id);

            // 3. Record Payment
            const { data: paymentRecord } = await supabaseAdmin.from('payments').insert({
                user_id: sBooking.user_id,
                type: 'service',
                reference_id: id,
                payment_gateway: 'Razorpay',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                status: 'pending',
                total_amount: sBooking.total_amount,
                base_amount: sBooking.total_amount, // For now, services take full base
                platform_fee: 0,
                gst_amount_col: 0
            }).select().single();

            // 4. Unified Wallet logic
            if (paymentRecord) {
                await handlePaymentSuccess({
                    paymentId: paymentRecord.id,
                    type: 'service',
                    referenceId: id,
                    totalAmount: sBooking.total_amount,
                    baseAmount: sBooking.total_amount,
                    platformFee: 0,
                    gstAmount: 0,
                    providerId: sBooking.vendor_id,
                    description: `Earnings from service session ${id}`
                });
            }
        } else if (type === "subscription" || type === "staff_subscription") {
            // 1. Fetch Package details
            const { data: pkg, error: pkgErr } = await supabaseAdmin
                .from('staff_packages')
                .select('*')
                .eq('id', id)
                .single();
            
            if (pkgErr) throw pkgErr;

            // 2. Fetch Organiser ID from request body
            const organiserId = body.organiserId;

            // 3. Update/Insert Organiser Subscription
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month plan

            const { error: subErr } = await supabaseAdmin
                .from('organiser_subscriptions')
                .upsert({
                    organiser_id: organiserId,
                    package_id: id,
                    subscription_status: 'active',
                    active_until: expiryDate.toISOString(),
                    last_payment_id: razorpay_payment_id
                }, { onConflict: 'organiser_id' });

            if (subErr) throw subErr;

            // 4. Calculate GST for logging
            const basePrice = pkg.monthly_price || pkg.package_price || 0;
            const discount = basePrice * ((pkg.discount_percentage || 0) / 100);
            const priceAfterDiscount = basePrice - discount;
            const gstAmount = priceAfterDiscount * ((pkg.gst_percentage || 18) / 100);

            // 5. Record Subscription Payment log
            await supabaseAdmin.from('subscription_payments').insert({
                organiser_id: organiserId,
                package_id: id,
                paid_amount: priceAfterDiscount + gstAmount,
                gst_amount: gstAmount,
                transaction_id: razorpay_payment_id,
                gateway: 'Razorpay',
                gateway_payment_id: razorpay_payment_id,
                gateway_order_id: razorpay_order_id,
                payment_status: 'success',
                description: `Upgrade to ${pkg.package_name}`
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Razorpay Verification Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
