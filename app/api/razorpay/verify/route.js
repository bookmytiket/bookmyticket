import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            id,
            type = "booking"
        } = await request.json();

        let key_secret = process.env.RAZORPAY_KEY_SECRET;

        const { data: gateway } = await supabaseAdmin
            .from('payment_gateways')
            .select('config')
            .eq('name', 'Razorpay')
            .single();

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

        if (type === "booking") {
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

            // 4. Record Payment (Graceful)
            try {
                const { error: paymentErr } = await supabaseAdmin.from('payments').insert({
                    booking_id: id,
                    payment_gateway: 'Razorpay',
                    payment_id: razorpay_payment_id,
                    status: 'success',
                    amount: booking.total_price
                });
                if (paymentErr) console.warn("Payments insert failed (table might be missing):", paymentErr.message);
            } catch (e) {
                console.warn("Payments exception:", e.message);
            }

            // 5. Generate Ticket Record (Graceful)
            let ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
            try {
                const { error: ticketErr } = await supabaseAdmin.from('tickets').insert({
                    booking_id: id,
                    ticket_number: ticketNumber,
                    status: 'active'
                });
                if (ticketErr) console.warn("Tickets insert failed (table might be missing):", ticketErr.message);
            } catch (e) {
                console.warn("Tickets exception:", e.message);
            }

            // 5a. Record Coupon Usage (Graceful)
            if (booking.coupon_id) {
                try {
                    const { error: couponErr } = await supabaseAdmin.from('coupon_usage').insert({
                        user_id: booking.user_id,
                        coupon_id: booking.coupon_id,
                        booking_id: id
                    });
                    if (couponErr) console.warn("Coupon usage insert failed:", couponErr.message);
                } catch (e) {}
            }

            // 5b. Credit Organiser Wallet (Graceful)
            const creditAmount = booking.base_amount - (booking.discount_amount || 0);
            const organiserId = booking.events?.organiser_id;

            if (organiserId && creditAmount > 0) {
                try {
                    // Get or create wallet
                    const { data: wallet, error: walletFetchErr } = await supabaseAdmin
                        .from('wallets')
                        .select('id, balance')
                        .eq('organiser_id', organiserId)
                        .maybeSingle();

                    if (wallet) {
                        await supabaseAdmin
                            .from('wallets')
                            .update({ balance: wallet.balance + creditAmount })
                            .eq('id', wallet.id);

                        await supabaseAdmin.from('wallet_transactions').insert({
                            organiser_id: organiserId,
                            booking_id: id,
                            amount: creditAmount,
                            type: 'credit',
                            description: `Earnings from booking ${id}`
                        });
                    }
                } catch (e) {
                    console.warn("Wallet update failed:", e.message);
                }
            }

            // 6. Trigger Notifications
            try {
                const customerDetails = booking.customer_details || {};
                const phoneNumber = customerDetails.phone || customerDetails.mobile;
                const email = customerDetails.email;
                const customerName = customerDetails.name || "Customer";

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
                                name: customerName,
                                eventName: booking.events?.title || "Event",
                                date: booking.events?.date || "TBA",
                                bookingId: id,
                                ticketNumber: ticketNumber
                            }
                        })
                    });
                }
            } catch (notifyErr) {
                console.error("Failed to trigger notification:", notifyErr.message);
            }
        } else if (type === "advertise") {
            // Update Advertise Banner Status
            const { error: bannerErr } = await supabaseAdmin
                .from('advertise_banners')
                .update({ status: 'paid' })
                .eq('id', id);

            if (bannerErr) throw bannerErr;

            // Record Payment for Advertise
            await supabaseAdmin.from('payments').insert({
                advertise_id: id,
                payment_gateway: 'Razorpay',
                payment_id: razorpay_payment_id,
                status: 'success'
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Razorpay Verification Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
