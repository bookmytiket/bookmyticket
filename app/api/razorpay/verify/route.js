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

        // 1. Verify Signature
        const text = razorpay_order_id + "|" + razorpay_payment_id;
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
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

            // 4. Record Payment
            await supabaseAdmin.from('payments').insert({
                booking_id: id,
                payment_gateway: 'Razorpay',
                payment_id: razorpay_payment_id,
                status: 'success',
                amount: booking.total_price
            });

            // 5. Generate Ticket Record
            const ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
            await supabaseAdmin.from('tickets').insert({
                booking_id: id,
                ticket_number: ticketNumber,
                status: 'active'
            });

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
