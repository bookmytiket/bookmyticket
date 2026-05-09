import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, sendTemplatedEmail } from "@/lib/emailService";
import { sendSMS } from "@/lib/commService";

export async function POST(req) {
  try {
    const { email, phone } = await req.json();

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: "Email or Phone is required" }, { status: 400 });
    }

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 2. Initialize Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Store OTP in DB
    const { error: dbError } = await supabaseAdmin
      .from('contact_otps')
      .insert([{ email, phone, otp, expires_at: expiresAt }]);

    if (dbError) throw dbError;

    // 4. Send Verification (Email or SMS)
    if (email) {
      await sendTemplatedEmail({
        templateIdentifier: 'otp',
        to: email,
        variables: {
          otp,
          purpose: 'Message Verification'
        }
      });
    }

    if (phone) {
      await sendSMS({
        phoneNumber: phone,
        message: `Your verification code for BookMyTicket is: ${otp}. Valid for 10 minutes.`,
        type: "OTP"
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact Send OTP Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
