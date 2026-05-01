import { Cashfree, CFEnvironment } from "cashfree-pg";
import { NextResponse } from "next/server";

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
        const body = await request.json();
        const { bookingId, amount, customerName, customerEmail, customerPhone, eventName } = body;

        if (!bookingId || !amount || !customerName || !customerEmail || !customerPhone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const requestData = {
            order_amount: parseFloat(amount),
            order_currency: "INR",
            order_id: bookingId,
            customer_details: {
                customer_id: customerEmail.replace(/[^a-zA-Z0-9]/g, '_'), // Ensure valid ID
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
            },
            order_meta: {
                return_url: `${origin}/events/book/payment?bookingId={order_id}&status={order_status}`,
                notify_url: `${origin}/api/cashfree/webhook`,
                payment_methods: "" 
            },
            order_note: `Payment for ${eventName || 'Event Booking'}`
        };

        const response = await cashfree.PGCreateOrder("2023-08-01", requestData);
        
        return NextResponse.json(response.data);
    } catch (err) {
        console.error("Cashfree Order Creation Error:", err.response?.data || err.message);
        return NextResponse.json({ 
            error: "Failed to create order", 
            details: err.response?.data?.message || err.message 
        }, { status: 500 });
    }
}
