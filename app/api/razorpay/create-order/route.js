import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const { id, amount, currency = "INR", type = "booking" } = await request.json();

        if (!id || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt: `rcpt_${type}_${id}`.substring(0, 40),
            notes: {
                id: id,
                type: type
            }
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json(order);
    } catch (err) {
        console.error("Razorpay Order Creation Error:", err);
        const errorMessage = err.error ? err.error.description : (err.message || "Unknown Razorpay error");
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
