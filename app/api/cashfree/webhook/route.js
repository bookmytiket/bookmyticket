import { Cashfree, CFEnvironment } from "cashfree-pg";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { after } from "next/server";
import crypto from "crypto";
import { generateSecureQRToken } from "@/lib/security";
import { queueJob, executeJob } from "@/app/utils/backgroundJobs";
import { assignBibNumber } from "@/lib/bibGenerator";

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

        const nowIso = new Date().toISOString();

        if (paymentStatus === "SUCCESS") {
            // 1. Fetch Booking and Event details
            const { data: booking, error: fetchErr } = await supabaseAdmin
                .from('bookings')
                .select('*, events(*)')
                .eq('id', bookingId)
                .single();

            if (fetchErr) throw fetchErr;

            // 1.5 Automatically Assign BIB Number before confirming
            const categoryName = booking.category || booking.race_category_id || "default";
            let assignedBibNumber = null;
            try {
                assignedBibNumber = await assignBibNumber(booking.event_id, bookingId, categoryName, true);
            } catch (bibErr) {
                console.error("Auto BIB generation failed in cashfree webhook:", bibErr.message);
            }

            const updatedCustomerDetails = {
                ...(booking.customer_details || {}),
                ...(assignedBibNumber ? { bib_number: assignedBibNumber } : {})
            };

            // 2. Update Booking Status immediately
            await supabaseAdmin
                .from('bookings')
                .update({ 
                    status: 'Confirmed',
                    payment_status: 'paid',
                    confirmed_at: nowIso,
                    booking_ref: bookingId.slice(-8).toUpperCase(),
                    customer_details: updatedCustomerDetails,
                    ...(assignedBibNumber ? { bib_number: assignedBibNumber } : {})
                })
                .eq('id', bookingId);

            // 2.5 Mark individual seats as sold in seat_inventory
            if (booking.selected_seats && booking.selected_seats.length > 0) {
                try {
                    for (const seat of booking.selected_seats) {
                        const seatId = seat.id;
                        const showtimeId = booking.showtime_id || booking.customer_details?.showtimeId || null;
                        
                        let query = supabaseAdmin
                            .from('seat_inventory')
                            .select('id')
                            .eq('event_id', booking.event_id)
                            .eq('seat_number', seatId);
                            
                        if (showtimeId) {
                            query = query.eq('showtime_id', showtimeId);
                        } else {
                            query = query.is('showtime_id', null);
                        }
                        
                        const { data: existingSeat } = await query.maybeSingle();

                        if (existingSeat) {
                            await supabaseAdmin.from('seat_inventory').update({ status: 'sold' }).eq('id', existingSeat.id);
                        } else {
                            await supabaseAdmin.from('seat_inventory').insert({ 
                                event_id: booking.event_id, 
                                seat_number: seatId, 
                                status: 'sold',
                                showtime_id: showtimeId
                            });
                        }
                    }
                } catch (seatErr) {
                    console.error("Seat update error in cashfree/webhook:", seatErr.message);
                }
            }

            // 3. Record Payment
            const { data: paymentRecord } = await supabaseAdmin.from('payments').insert({
                booking_id: bookingId,
                user_id: booking.user_id,
                type: 'event',
                reference_id: bookingId,
                payment_gateway: 'Cashfree',
                payment_id: payment.cf_payment_id,
                status: 'success',
                total_amount: payment.payment_amount,
                base_amount: booking.base_amount,
                platform_fee: booking.platform_charge,
                gst_amount_col: booking.gst_amount
            }).select().single();

            // 4. Generate Ticket Record with Secure QR Token
            const ticketId = crypto.randomUUID();
            const ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
            const qrCodeToken = generateSecureQRToken({
                ticketId,
                bookingId,
                eventId: booking.event_id,
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

            // 5. Record Coupon Usage (Synchronous and fast)
            if (booking.coupon_id) {
                await supabaseAdmin.from('coupon_usage').insert({
                    user_id: booking.user_id,
                    coupon_id: booking.coupon_id,
                    booking_id: bookingId
                });
            }



            // ── DEFERRED BACKGROUND PROCESSING ─────────────────────────────────────
            const protocol = headers['x-forwarded-proto'] || 'https';
            const host = headers['host'];
            const origin = `${protocol}://${host}`;

            after(async () => {
                console.log(`[After-Response Cashfree Webhook] Triggering background jobs for booking: ${bookingId}`);

                // 1. Settlement Job
                const organiserId = booking.events?.organiser_id;
                if (paymentRecord?.id) {
                    const { jobId } = await queueJob({
                        jobType: "settlement",
                        bookingId,
                        payload: {
                            paymentId: paymentRecord.id,
                            totalAmount: payment.payment_amount,
                            baseAmount: booking.partner_total || (booking.base_amount - (booking.discount_amount || 0)),
                            platformFee: booking.platform_charge || 0,
                            gstAmount: booking.gst_amount || 0,
                            providerId: organiserId,
                            eventId: booking.event_id,
                            description: `Earnings from booking ${bookingId} (via Cashfree)`
                        }
                    });

                    await executeJob({
                        jobId,
                        jobType: "settlement",
                        bookingId,
                        payload: {
                            paymentId: paymentRecord.id,
                            totalAmount: payment.payment_amount,
                            baseAmount: booking.partner_total || (booking.base_amount - (booking.discount_amount || 0)),
                            platformFee: booking.platform_charge || 0,
                            gstAmount: booking.gst_amount || 0,
                            providerId: organiserId,
                            eventId: booking.event_id,
                            description: `Earnings from booking ${bookingId} (via Cashfree)`
                        }
                    });
                }

                // 2. Rewards Job
                const { jobId: rewardsJobId } = await queueJob({
                    jobType: "rewards",
                    bookingId,
                    payload: {
                        userId: booking.user_id,
                        eventId: booking.event_id
                    }
                });

                await executeJob({
                    jobId: rewardsJobId,
                    jobType: "rewards",
                    bookingId,
                    payload: {
                        userId: booking.user_id,
                        eventId: booking.event_id
                    }
                });

                // 3. Notifications Job
                const customerDetails = booking.customer_details || {};
                const phoneNumber = customerDetails.phone || customerDetails.mobile;
                const email = customerDetails.email;
                
                const customerName = (customerDetails.participant && (customerDetails.participant["Full Name"] || customerDetails.participant.fullname || customerDetails.participant.name)) || customerDetails["Full Name"] || customerDetails.fullname || customerDetails.name || "Customer";

                if (phoneNumber || email) {
                    const { jobId: notifyJobId } = await queueJob({
                        jobType: "notifications",
                        bookingId,
                        payload: {
                            phoneNumber,
                            email,
                            name: customerName,
                            eventName: booking.events?.title || "Event",
                            date: booking.events?.date || "TBA",
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
                            name: customerName,
                            eventName: booking.events?.title || "Event",
                            date: booking.events?.date || "TBA",
                            ticketNumber
                        },
                        origin
                    });
                }
            });

        } else if (paymentStatus === "FAILED") {
            await supabaseAdmin
                .from('bookings')
                .update({ 
                    status: 'Failed',
                    payment_status: 'failed'
                })
                .eq('id', bookingId);
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Cashfree Webhook Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
