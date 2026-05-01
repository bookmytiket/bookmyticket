import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
    try {
        const { bookingId, amount, currency = "INR" } = await request.json();

        if (!bookingId || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt: `receipt_${bookingId}`,
            notes: {
                bookingId: bookingId
            }
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json(order);
    } catch (err) {
        console.error("Razorpay Order Creation Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
