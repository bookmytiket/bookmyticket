import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTemplatedEmail } from "@/lib/emailService";

export async function POST(req) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { email, phone } = await req.json();
    const identifier = email || phone;

    if (!identifier) {
      return NextResponse.json({ success: false, error: "Email or Phone required" }, { status: 400 });
    }

    // 1. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 2. Save OTP to database
    const { error: otpError } = await supabaseAdmin
      .from('otps')
      .upsert({
        identifier,
        code: otpCode,
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'identifier' }); // Update if already exists for this email/phone

    if (otpError) throw otpError;

    // 3. Send Email (if email provided)
    if (email) {
      const emailResult = await sendTemplatedEmail({
        templateIdentifier: 'otp',
        to: email,
        variables: {
          otp: otpCode,
          site_url: process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net'
        }
      });

      if (!emailResult.success) {
        throw new Error(`Email sending failed: ${emailResult.error}`);
      }
    }

    // 4. Send SMS (if phone provided - placeholder for now)
    if (phone) {
      console.log(`[SMS OTP] To: ${phone}, Code: ${otpCode}`);
      // Integrate Twilio/Gupshup here if needed
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP Send API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
