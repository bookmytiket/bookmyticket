import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { phone, countryCode } = await req.json();

        if (!phone) {
            return NextResponse.json({ success: false, error: "Phone number is required." }, { status: 400 });
        }

        // Mocking an external SMS API call (Twilio/Msg91/etc.)
        console.log(`[OTP API] Sending 6-digit code to ${countryCode} ${phone}`);

        // Simulating 500ms API latency
        await new Promise(res => setTimeout(res, 500));

        // Return success response to the frontend
        return NextResponse.json({
            success: true,
            message: "OTP sent successfully.",
            transactionId: "TID" + Math.random().toString(36).substr(2, 9).toUpperCase()
        });

    } catch (error) {
        console.error("[OTP API ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
    }
}
