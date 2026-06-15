import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { sessionToken, gateway } = await request.json();

        if (!sessionToken) {
            return NextResponse.json({ error: "Session token is required" }, { status: 400 });
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

        const participantData = session.participant_data || {};
        const pricingSnapshot = session.pricing_snapshot || {};
        const event = session.events;

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 2. Insert or retrieve booking
        let bookingId = participantData.bookingId;
        let booking = null;

        if (bookingId) {
            const { data: b, error: bErr } = await supabaseAdmin
                .from("bookings")
                .select("*")
                .eq("id", bookingId)
                .maybeSingle();
            if (!bErr && b) {
                booking = b;
                const pKeys = Object.keys(participantData);
                const findKey = (searchStrs) => {
                    const k = pKeys.find(key => searchStrs.some(s => key.toLowerCase() === s.toLowerCase()));
                    return k ? participantData[k] : null;
                };

                const participantName = findKey(["name", "full name", "fullname"]);
                const participantEmail = findKey(["email", "email address", "emailaddress"]);
                const participantPhone = findKey(["phone", "phone number", "phonenumber", "mobile"]);

                // Update booking details with current session and pricing snapshot
                const customerDetails = {
                    name: participantName || booking.customer_details?.name || "Guest User",
                    email: participantEmail || booking.customer_details?.email || "",
                    phone: participantPhone || booking.customer_details?.phone || "",
                    applied_campaign_id: pricingSnapshot.appliedCampaignId || null,
                    applied_campaign_code: pricingSnapshot.appliedCampaignCode || null,
                    showtime_id: participantData.showtimeId || null,
                    showtime_name: participantData.showtimeName || null,
                    category: session.package_id || pricingSnapshot.categoryName || booking.customer_details?.category || null,
                    ...participantData
                };

                const { data: updatedBooking, error: updateErr } = await supabaseAdmin
                    .from("bookings")
                    .update({
                        ticket_count: participantData.quantity || 1,
                        base_amount: Number(pricingSnapshot.baseAmount) || Number(event.price) || 0,
                        platform_charge: Number(pricingSnapshot.convenienceFee) || 0,
                        gst_amount: Number(pricingSnapshot.gst) || 0,
                        gst_percent: Number(pricingSnapshot.gstPercent) || 0,
                        partner_bonus: Number(pricingSnapshot.partnerBonus) || 0,
                        platform_revenue: Number(pricingSnapshot.platformRevenue) || 0,
                        partner_total: Number(pricingSnapshot.partnerTotal) || 0,
                        discount_amount: Number(pricingSnapshot.discountAmount) || 0,
                        coupon_id: pricingSnapshot.appliedCouponId || null,
                        total_price: Number(pricingSnapshot.totalPrice) || 0,
                        selected_seats: participantData.selectedSeats || [],
                        customer_details: customerDetails,
                        showtime_id: participantData.showtimeId || null,
                        race_category_id: session.package_id || pricingSnapshot.categoryName || null
                    })
                    .eq("id", bookingId)
                    .select()
                    .single();

                if (!updateErr && updatedBooking) {
                    booking = updatedBooking;
                }
            }
        }

        if (!booking) {
            // Get user details
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("*")
                .eq("id", session.user_id)
                .maybeSingle();

            const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(session.user_id);
            const authUser = authUserData?.user;
            const fallbackName = authUser?.user_metadata?.full_name || authUser?.email || "Guest User";

            const pKeys = Object.keys(participantData);
            const findKey = (searchStrs) => {
                const k = pKeys.find(key => searchStrs.some(s => key.toLowerCase() === s.toLowerCase()));
                return k ? participantData[k] : null;
            };

            const participantName = findKey(["name", "full name", "fullname"]);
            const participantEmail = findKey(["email", "email address", "emailaddress"]);
            const participantPhone = findKey(["phone", "phone number", "phonenumber", "mobile"]);

            const customerDetails = {
                name: participantName || profile?.full_name || fallbackName,
                email: participantEmail || profile?.email || authUser?.email || "",
                phone: participantPhone || profile?.phone || authUser?.phone || "",
                applied_campaign_id: pricingSnapshot.appliedCampaignId || null,
                applied_campaign_code: pricingSnapshot.appliedCampaignCode || null,
                showtime_id: participantData.showtimeId || null,
                showtime_name: participantData.showtimeName || null,
                category: session.package_id || pricingSnapshot.categoryName || null,
                ...participantData
            };

            const { data: newBooking, error: bookingErr } = await supabaseAdmin
                .from("bookings")
                .insert([{
                    event_id: String(session.event_id),
                    user_id: session.user_id,
                    ticket_count: participantData.quantity || 1,
                    base_amount: Number(pricingSnapshot.baseAmount) || Number(event.price) || 0,
                    platform_charge: Number(pricingSnapshot.convenienceFee) || 0,
                    gst_amount: Number(pricingSnapshot.gst) || 0,
                    gst_percent: Number(pricingSnapshot.gstPercent) || 0,
                    partner_bonus: Number(pricingSnapshot.partnerBonus) || 0,
                    platform_revenue: Number(pricingSnapshot.platformRevenue) || 0,
                    partner_total: Number(pricingSnapshot.partnerTotal) || 0,
                    discount_amount: Number(pricingSnapshot.discountAmount) || 0,
                    coupon_id: pricingSnapshot.appliedCouponId || null,
                    total_price: Number(pricingSnapshot.totalPrice) || 0,
                    status: "Pending",
                    scanned: false,
                    selected_seats: participantData.selectedSeats || [],
                    event_name: event.title,
                    location: event.location,
                    customer_details: customerDetails,
                    showtime_id: participantData.showtimeId || null,
                    race_category_id: session.package_id || pricingSnapshot.categoryName || null
                }])
                .select()
                .single();

            if (bookingErr) throw bookingErr;
            booking = newBooking;
            bookingId = booking.id;

            // Save bookingId back to session
            participantData.bookingId = bookingId;
            await supabaseAdmin
                .from("booking_sessions")
                .update({ participant_data: participantData })
                .eq("id", sessionToken);
        }

        // If no gateway is requested, just return the booking details
        if (!gateway) {
            return NextResponse.json({
                success: true,
                bookingId
            });
        }

        // 3. Create payment transaction record in payment_transactions table
        await supabaseAdmin
            .from("payment_transactions")
            .insert({
                booking_id: bookingId,
                gateway: gateway,
                payment_status: "pending",
                amount: booking.total_price
            });

        // 4. Generate order on the gateway
        if (gateway === "Razorpay") {
            let key_id = process.env.RAZORPAY_KEY_ID;
            let key_secret = process.env.RAZORPAY_KEY_SECRET;

            const { data: gatewayConfig } = await supabaseAdmin
                .from('payment_gateways')
                .select('config')
                .eq('name', 'Razorpay')
                .maybeSingle();

            if (gatewayConfig?.config) {
                key_id = gatewayConfig.config.keyId || gatewayConfig.config.apiKey || key_id;
                key_secret = gatewayConfig.config.keySecret || gatewayConfig.config.apiSecret || key_secret;
            }

            if (!key_id || !key_secret) {
                return NextResponse.json({ error: "Razorpay credentials not configured." }, { status: 400 });
            }

            const razorpay = new Razorpay({ key_id, key_secret });

            const options = {
                amount: Math.round(booking.total_price * 100), // paise
                currency: "INR",
                receipt: `rcpt_booking_${bookingId}`.substring(0, 40),
                notes: { id: bookingId, type: "booking" }
            };

            const order = await razorpay.orders.create(options);

            // Update transaction gateway order ID
            await supabaseAdmin
                .from("payment_transactions")
                .update({ gateway_order_id: order.id })
                .eq("booking_id", bookingId)
                .eq("gateway", "Razorpay");

            return NextResponse.json({
                success: true,
                gateway: "Razorpay",
                order,
                bookingId,
                keyId: key_id
            });

        } else if (gateway === "Cashfree") {
            const appId = process.env.CASHFREE_APP_ID;
            const secretKey = process.env.CASHFREE_SECRET_KEY;

            if (!appId || !secretKey) {
                return NextResponse.json({ error: "Cashfree credentials not configured." }, { status: 400 });
            }

            const cashfree = new Cashfree(
                process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION" 
                    ? CFEnvironment.PRODUCTION 
                    : CFEnvironment.SANDBOX,
                appId,
                secretKey
            );

            const protocol = request.headers.get("x-forwarded-proto") || "https";
            const host = request.headers.get("host");
            const origin = `${protocol}://${host}`;

            const customerName = booking.customer_details?.name || "Customer";
            const customerEmail = booking.customer_details?.email || "customer@example.com";
            const customerPhone = booking.customer_details?.phone || "9999999999";

            const requestData = {
                order_amount: parseFloat(booking.total_price),
                order_currency: "INR",
                order_id: bookingId,
                customer_details: {
                    customer_id: customerEmail.replace(/[^a-zA-Z0-9]/g, '_'),
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                },
                order_meta: {
                    return_url: `${origin}/events/book/payment?bookingId={order_id}&status={order_status}`,
                    notify_url: `${origin}/api/cashfree/webhook`,
                },
                order_note: `Payment for ${event.title}`
            };

            const response = await cashfree.PGCreateOrder("2023-08-01", requestData);

            // Update transaction gateway order ID
            await supabaseAdmin
                .from("payment_transactions")
                .update({ gateway_order_id: response.data.order_id })
                .eq("booking_id", bookingId)
                .eq("gateway", "Cashfree");

            return NextResponse.json({
                success: true,
                gateway: "Cashfree",
                order: response.data,
                bookingId
            });
        }

        return NextResponse.json({ error: "Unsupported gateway" }, { status: 400 });
    } catch (err) {
        console.error("Create Payment Order Error:", err);
        return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
    }
}
