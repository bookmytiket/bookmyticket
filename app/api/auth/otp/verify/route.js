import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { email, phone, code } = await req.json();
    const identifier = email || phone;

    if (!identifier || !code) {
      return NextResponse.json({ success: false, error: "Identifier and Code required" }, { status: 400 });
    }

    // 1. Verify OTP from our custom table
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('identifier', identifier)
      .eq('code', code)
      .single();

    if (otpError || !otpData) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 401 });
    }

    // Check expiry
    if (new Date(otpData.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "OTP has expired" }, { status: 401 });
    }

    // 2. Clear the OTP (prevent replay)
    await supabaseAdmin.from('otps').delete().eq('id', otpData.id);

    // 3. Bridge to Supabase Auth
    // We generate a magic link for this user (this also creates the user if they don't exist)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      // If it's phone, we'd use 'sms' type, but Supabase magiclink via admin is mostly email based
      // For phone, we might need a different bridge or just use email for now
    });

    if (linkError) throw linkError;

    // 4. Verify the link internally to get a session
    // This effectively "logs in" the user on the server and gives us the session tokens
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      email: email,
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink'
    });

    if (sessionError) throw sessionError;

    // 5. Return the session to the client
    return NextResponse.json({
      success: true,
      session: sessionData.session,
      user: sessionData.user
    });

  } catch (err) {
    console.error("OTP Verify API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
