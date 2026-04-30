import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emailService";
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
      await sendEmail({
        to: email,
        subject: "Verification Code for your Message",
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Verify your Email</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              Please use the following 6-digit code to verify your email address and send your message to BookMyTicket support.
            </p>
            <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; border: 2px dashed #cbd5e1; margin-bottom: 32px;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 0.5em; color: #f84464;">${otp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">
              This code will expire in 10 minutes.
            </p>
          </div>
        `
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
