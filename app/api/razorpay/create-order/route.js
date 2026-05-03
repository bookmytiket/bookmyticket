import Razorpay from "razorpay";
import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        let key_id = process.env.RAZORPAY_KEY_ID;
        let key_secret = process.env.RAZORPAY_KEY_SECRET;

        const { data: gateway } = await supabaseAdmin
            .from('payment_gateways')
            .select('config')
            .eq('name', 'Razorpay')
            .single();

        if (gateway?.config) {
            key_id = gateway.config.keyId || gateway.config.apiKey || key_id;
            key_secret = gateway.config.keySecret || gateway.config.apiSecret || key_secret;
        }

        if (!key_id || !key_secret) {
            return NextResponse.json({ error: "Razorpay credentials not configured in environment or database." }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
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
