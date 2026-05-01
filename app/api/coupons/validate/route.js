import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/couponHelper";

export async function POST(request) {
    try {
        const { code, userId, ticketCount, eventId } = await request.json();

        if (!code || !userId || !ticketCount || !eventId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await validateCoupon(code, userId, ticketCount, eventId);

        return NextResponse.json(result);
    } catch (err) {
        console.error("Coupon Validation API Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
