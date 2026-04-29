import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 });
    }

    // 1. Initialize Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Fetch last OTP for this email
    const { data: record, error: dbError } = await supabaseAdmin
      .from('careers_otps')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !record) {
      return NextResponse.json({ success: false, error: "No OTP found. Please send a new one." }, { status: 400 });
    }

    // 3. Validate
    if (record.otp !== otp) {
      return NextResponse.json({ success: false, error: "Invalid OTP code" }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // 4. Success - Clear used OTP (optional but recommended)
    await supabaseAdmin.from('careers_otps').delete().eq('email', email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("OTP Verify Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
