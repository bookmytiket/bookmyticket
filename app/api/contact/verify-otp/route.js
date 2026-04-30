import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { email, phone, otp, messageData } = await req.json();

    if (!otp || (!email && !phone)) {
      return NextResponse.json({ success: false, error: "OTP and identifier (Email/Phone) are required" }, { status: 400 });
    }

    // 1. Initialize Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Fetch latest OTP
    let query = supabaseAdmin
      .from('contact_otps')
      .select('*')
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (email) query = query.eq('email', email);
    else if (phone) query = query.eq('phone', phone);

    const { data: otpRecords, error: fetchError } = await query;

    if (fetchError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 });
    }

    // 3. Save the actual Inquiry
    const { error: insertError } = await supabaseAdmin
      .from('contact_inquiries')
      .insert([messageData]);

    if (insertError) throw insertError;

    // 4. Cleanup OTPs for this identifier
    let deleteQuery = supabaseAdmin.from('contact_otps').delete();
    if (email) deleteQuery = deleteQuery.eq('email', email);
    else if (phone) deleteQuery = deleteQuery.eq('phone', phone);
    
    await deleteQuery;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact Verify OTP Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
