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

        const nowIso = new Date().toISOString();

        if (type === "booking" || type === "event") {
            // 2. Fetch Booking and Event details
            const { data: booking, error: fetchErr } = await supabaseAdmin
                .from('bookings')
                .select('*, events(*)')
                .eq('id', id)
                .single();

            if (fetchErr) throw fetchErr;

            // 3. Update Booking Status immediately
            await supabaseAdmin
                .from('bookings')
                .update({ 
                    status: 'Confirmed',
                    payment_status: 'paid',
                    confirmed_at: nowIso,
                    booking_ref: id.slice(-8).toUpperCase()
                })
                .eq('id', id);

            // 3.5 Mark individual seats as sold in seat_inventory
            if (booking.selected_seats && booking.selected_seats.length > 0) {
                try {
                    for (const seat of booking.selected_seats) {
                        const seatId = seat.id;
                        const { data: existingSeat } = await supabaseAdmin
                            .from('seat_inventory')
                            .select('id')
                            .eq('event_id', booking.event_id)
                            .eq('seat_number', seatId)
                            .maybeSingle();

                        if (existingSeat) {
                            await supabaseAdmin.from('seat_inventory').update({ status: 'sold' }).eq('id', existingSeat.id);
                        } else {
                            await supabaseAdmin.from('seat_inventory').insert({ event_id: booking.event_id, seat_number: seatId, status: 'sold' });
                        }
                    }
                } catch (seatErr) {
                    console.error("Seat update error in razorpay/verify:", seatErr.message);
                }
            }

            // 4. Record Payment (Legacy payments table)
            const { data: paymentRecord } = await supabaseAdmin.from('payments').insert({
                booking_id: id,
                user_id: booking.user_id,
                type: 'event',
                reference_id: id,
                payment_gateway: 'Razorpay',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                signature: razorpay_signature,
                status: 'success',
                total_amount: booking.total_price,
                base_amount: booking.base_amount,
                platform_fee: booking.platform_charge,
                gst_amount_col: booking.gst_amount
            }).select().single();

            // 5. Generate Ticket Record with Secure QR Token
            const ticketId = crypto.randomUUID();
            const ticketNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
            const qrCodeToken = generateSecureQRToken({
                ticketId,
                bookingId: id,
                eventId: booking.event_id,
                ticketCode: ticketNumber
            });
            await supabaseAdmin.from('tickets').insert({
                id: ticketId,
                booking_id: id,
                ticket_number: ticketNumber,
                ticket_code: ticketNumber,
                qr_token: qrCodeToken,
                issued_at: nowIso,
                status: 'active',
                qr_code: qrCodeToken
            });

            // 6. Record Coupon Usage (Synchronous and fast)
            if (booking.coupon_id) {
                await supabaseAdmin.from('coupon_usage').insert({
                    user_id: booking.user_id,
                    coupon_id: booking.coupon_id,
                    booking_id: id
                });
            }

            // ── DEFERRED BACKGROUND PROCESSING ─────────────────────────────────────
            const protocol = request.headers.get('x-forwarded-proto') || 'https';
            const host = request.headers.get('host');
            const origin = `${protocol}://${host}`;

            after(async () => {
                console.log(`[After-Response Legacy] Triggering background jobs for booking: ${id}`);

                // 1. Settlement Job
                const organiserId = booking.events?.organiser_id;
                if (paymentRecord?.id) {
                    const { jobId } = await queueJob({
                        jobType: "settlement",
                        bookingId: id,
                        payload: {
                            paymentId: paymentRecord.id,
                            totalAmount: booking.total_price,
                            baseAmount: booking.partner_total || (booking.base_amount - (booking.discount_amount || 0)),
                            platformFee: booking.platform_charge || 0,
                            gstAmount: booking.gst_amount || 0,
                            providerId: organiserId,
                            eventId: booking.event_id,
                            description: `Earnings from event booking ${id}`
                        }
                    });

                    await executeJob({
                        jobId,
                        jobType: "settlement",
                        bookingId: id,
                        payload: {
                            paymentId: paymentRecord.id,
                            totalAmount: booking.total_price,
                            baseAmount: booking.partner_total || (booking.base_amount - (booking.discount_amount || 0)),
                            platformFee: booking.platform_charge || 0,
                            gstAmount: booking.gst_amount || 0,
                            providerId: organiserId,
                            eventId: booking.event_id,
                            description: `Earnings from event booking ${id}`
                        }
                    });
                }

                // 2. Rewards Job
                const { jobId: rewardsJobId } = await queueJob({
                    jobType: "rewards",
                    bookingId: id,
                    payload: {
                        userId: booking.user_id,
                        eventId: booking.event_id
                    }
                });

                await executeJob({
                    jobId: rewardsJobId,
                    jobType: "rewards",
                    bookingId: id,
                    payload: {
                        userId: booking.user_id,
                        eventId: booking.event_id
                    }
                });

                // 3. Notifications Job
                const customerDetails = booking.customer_details || {};
                const phoneNumber = customerDetails.phone || customerDetails.mobile;
                const email = customerDetails.email;

                if (phoneNumber || email) {
                    const { jobId: notifyJobId } = await queueJob({
                        jobType: "notifications",
                        bookingId: id,
                        payload: {
                            phoneNumber,
                            email,
                            name: customerDetails.name || "Customer",
                            eventName: booking.events?.title || "Event",
                            date: booking.events?.date || "TBA",
                            ticketNumber
                        }
                    });

                    await executeJob({
                        jobId: notifyJobId,
                        jobType: "notifications",
                        bookingId: id,
                        payload: {
                            phoneNumber,
                            email,
                            name: customerDetails.name || "Customer",
                            eventName: booking.events?.title || "Event",
                            date: booking.events?.date || "TBA",
                            ticketNumber
                        },
                        origin
                    });
                }
            });

        } else if (type === "service") {
            // Service Booking flow (Synchronous)
            const { data: sBooking, error: sErr } = await supabaseAdmin
                .from('vendor_bookings')
                .select('*')
                .eq('id', id)
                .single();
            
            if (sErr) throw sErr;

            await supabaseAdmin.from('vendor_bookings').update({ status: 'Paid' }).eq('id', id);

            const { data: paymentRecord } = await supabaseAdmin.from('payments').insert({
                user_id: sBooking.user_id,
                type: 'service',
                reference_id: id,
                payment_gateway: 'Razorpay',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                status: 'success',
                total_amount: sBooking.total_amount,
                base_amount: sBooking.total_amount,
                platform_fee: 0,
                gst_amount_col: 0
            }).select().single();

            // Run wallet settlement for service bookings async via after
            after(async () => {
                if (paymentRecord) {
                    const { jobId } = await queueJob({
                        jobType: "settlement",
                        bookingId: id,
                        payload: {
                            paymentId: paymentRecord.id,
                            totalAmount: sBooking.total_amount,
                            baseAmount: sBooking.total_amount,
                            platformFee: 0,
                            gstAmount: 0,
                            providerId: sBooking.vendor_id,
                            description: `Earnings from service session ${id}`
                        }
                    });

                    await executeJob({
                        jobId,
                        jobType: "settlement",
                        bookingId: id,
                        payload: {
                            paymentId: paymentRecord.id,
                            totalAmount: sBooking.total_amount,
                            baseAmount: sBooking.total_amount,
                            platformFee: 0,
                            gstAmount: 0,
                            providerId: sBooking.vendor_id,
                            description: `Earnings from service session ${id}`
                        }
                    });
                }
            });

        } else if (type === "subscription" || type === "staff_subscription") {
            // Subscription payments (Synchronous)
            const { data: pkg, error: pkgErr } = await supabaseAdmin
                .from('staff_packages')
                .select('*')
                .eq('id', id)
                .single();
            
            if (pkgErr) throw pkgErr;

            const organiserId = body.organiserId;
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);

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

            const basePrice = pkg.monthly_price || pkg.package_price || 0;
            const discount = basePrice * ((pkg.discount_percentage || 0) / 100);
            const priceAfterDiscount = basePrice - discount;
            const gstAmount = priceAfterDiscount * ((pkg.gst_percentage || 18) / 100);

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
