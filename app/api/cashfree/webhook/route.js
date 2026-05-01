import { Cashfree, CFEnvironment } from "cashfree-pg";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
            // 1. Fetch Booking and Event details for notification
            const { data: booking, error: fetchErr } = await supabaseAdmin
                .from('bookings')
                .select('*, events(*)')
                .eq('id', bookingId)
                .single();

            if (fetchErr) throw fetchErr;

            // 2. Update Booking Status
            const { error: bookingErr } = await supabaseAdmin
                .from('bookings')
                .update({ status: 'Confirmed' })
                .eq('id', bookingId);

            if (bookingErr) throw bookingErr;

            // 3. Record Payment
            await supabaseAdmin.from('payments').insert({
                booking_id: bookingId,
                payment_gateway: 'Cashfree',
                payment_id: payment.cf_payment_id,
                status: 'success',
                amount: payment.payment_amount
            });

            // 4. Generate Ticket Record
            const ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
            await supabaseAdmin.from('tickets').insert({
                booking_id: bookingId,
                ticket_number: ticketNumber,
                status: 'active'
            });

            // 4a. Record Coupon Usage
            if (booking.coupon_id) {
                await supabaseAdmin.from('coupon_usage').insert({
                    user_id: booking.user_id,
                    coupon_id: booking.coupon_id,
                    booking_id: bookingId
                });
            }

            // 4b. Credit Organiser Wallet
            const creditAmount = booking.base_amount - (booking.discount_amount || 0);
            const organiserId = booking.events?.organiser_id;

            if (organiserId && creditAmount > 0) {
                // Get or create wallet
                const { data: wallet } = await supabaseAdmin
                    .from('wallets')
                    .select('id, balance')
                    .eq('organiser_id', organiserId)
                    .single();

                if (wallet) {
                    await supabaseAdmin
                        .from('wallets')
                        .update({ balance: wallet.balance + creditAmount })
                        .eq('id', wallet.id);

                    // Record transaction
                    await supabaseAdmin.from('wallet_transactions').insert({
                        organiser_id: organiserId,
                        booking_id: bookingId,
                        amount: creditAmount,
                        type: 'credit',
                        description: `Earnings from booking ${bookingId}`
                    });
                }
            }

            // 5. Trigger Notifications
            try {
                const customerDetails = booking.customer_details || {};
                const phoneNumber = customerDetails.phone || customerDetails.mobile;
                const email = customerDetails.email;
                const customerName = customerDetails.name || "Customer";

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
                                name: customerName,
                                eventName: booking.events?.title || "Event",
                                date: booking.events?.date || "TBA",
                                bookingId: bookingId,
                                ticketNumber: ticketNumber
                            }
                        })
                    });
                }
            } catch (notifyErr) {
                console.error("Failed to trigger notification:", notifyErr.message);
                // Don't fail the whole webhook if notification fails
            }
        } else if (paymentStatus === "FAILED") {
            await supabaseAdmin
                .from('bookings')
                .update({ status: 'Failed' })
                .eq('id', bookingId);

            await supabaseAdmin.from('payments').insert({
                booking_id: bookingId,
                payment_gateway: 'Cashfree',
                payment_id: payment.cf_payment_id,
                status: 'failed',
                amount: payment.payment_amount
            });
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Cashfree Webhook Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
