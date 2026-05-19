import { Cashfree, CFEnvironment } from "cashfree-pg";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { handlePaymentSuccess } from "@/app/utils/paymentUtils";
import { unlockPartnerReward } from "@/lib/partnerRewards";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure Cashfree SDK
const cashfree = new Cashfree(
    process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION" 
        ? CFEnvironment.PRODUCTION 
        : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

export async function POST(request) {
    try {
        const payload = await request.text();
        const headers = Object.fromEntries(request.headers.entries());
        const signature = headers["x-webhook-signature"];
        const timestamp = headers["x-webhook-timestamp"];

        // Verify Signature
        try {
            cashfree.PGVerifyWebhookSignature(signature, payload, timestamp);
        } catch (err) {
            console.error("Cashfree Webhook Signature Verification Failed:", err.message);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const data = JSON.parse(payload);
        const { order, payment } = data.data;
        const bookingId = order.order_id;
        const paymentStatus = payment.payment_status; // SUCCESS, FAILED, PENDING

        console.log(`Cashfree Webhook received for Booking ${bookingId}: ${paymentStatus}`);

        if (paymentStatus === "SUCCESS") {
            // 1. Fetch Booking and Event details
            const { data: booking, error: fetchErr } = await supabaseAdmin
                .from('bookings')
                .select('*, events(*)')
                .eq('id', bookingId)
                .single();

            if (fetchErr) throw fetchErr;

            // 2. Update Booking Status
            await supabaseAdmin
                .from('bookings')
                .update({ status: 'Confirmed' })
                .eq('id', bookingId);

            // 3. Record Payment
            const { data: paymentRecord } = await supabaseAdmin.from('payments').insert({
                booking_id: bookingId,
                user_id: booking.user_id,
                type: 'event',
                reference_id: bookingId,
                payment_gateway: 'Cashfree',
                payment_id: payment.cf_payment_id,
                status: 'pending',
                total_amount: payment.payment_amount,
                base_amount: booking.base_amount,
                platform_fee: booking.platform_charge,
                gst_amount_col: booking.gst_amount
            }).select().single();

            // 4. Unified Payment Logic
            const organiserId = booking.events?.organiser_id;
            if (paymentRecord) {
                await handlePaymentSuccess({
                    paymentId: paymentRecord.id,
                    type: 'event',
                    referenceId: bookingId,
                    totalAmount: payment.payment_amount,
                    baseAmount: booking.partner_total || (booking.base_amount - (booking.discount_amount || 0)),
                    platformFee: booking.platform_charge || 0,
                    gstAmount: booking.gst_amount || 0,
                    providerId: organiserId,
                    description: `Earnings from booking ${bookingId} (via Cashfree)`
                });
            }

            // 5. Generate Ticket Record
            const ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
            await supabaseAdmin.from('tickets').insert({
                booking_id: bookingId,
                ticket_number: ticketNumber,
                status: 'active'
            });

            // 5.1 Unlock Partner Rewards post-booking
            try {
                await unlockPartnerReward(bookingId, booking.user_id, booking.event_id);
            } catch (rewardErr) {
                console.error("[REWARDS] Error in cashfree unlockPartnerReward:", rewardErr.message);
            }

            // 6. Record Coupon Usage
            if (booking.coupon_id) {
                await supabaseAdmin.from('coupon_usage').insert({
                    user_id: booking.user_id,
                    coupon_id: booking.coupon_id,
                    booking_id: bookingId
                });
            }

            // 7. Trigger Notifications
            try {
                const customerDetails = booking.customer_details || {};
                const phoneNumber = customerDetails.phone || customerDetails.mobile;
                const email = customerDetails.email;

                if (phoneNumber || email) {
                    const protocol = headers['x-forwarded-proto'] || 'https';
                    const host = headers['host'];
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
                                bookingId: bookingId,
                                ticketNumber: ticketNumber
                            }
                        })
                    });
                }
            } catch (notifyErr) {}
        } else if (paymentStatus === "FAILED") {
            await supabaseAdmin
                .from('bookings')
                .update({ status: 'Failed' })
                .eq('id', bookingId);
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Cashfree Webhook Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
