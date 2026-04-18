import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";

export async function POST(req) {
  try {
    const { to, subject, html, bookingDetails, vendorDetails, userDetails } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Dispatch the email using the centralized email service
    const result = await sendEmail({ to, subject, html });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Booking Email API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
