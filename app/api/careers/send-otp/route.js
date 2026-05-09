import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, sendTemplatedEmail } from "@/lib/emailService";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
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
      .from('careers_otps')
      .insert([{ email, otp, expires_at: expiresAt }]);

    if (dbError) throw dbError;

    // 4. Send Email
    const emailResult = await sendTemplatedEmail({
      templateIdentifier: 'otp',
      to: email,
      variables: {
        otp,
        purpose: 'Job Application'
      }
    });

    if (!emailResult.success) throw new Error(emailResult.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("OTP API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
