import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, email, purpose, code } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    if (action === 'send') {
      // 1. Generate OTP
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

      // 2. Insert securely bypassing RLS
      const { error } = await supabaseAdmin.from('otps').insert({
        email,
        code: newCode,
        purpose: purpose || 'signup',
        expires_at: expiresAt
      });

      if (error) throw error;

      // 3. Send Email Dispatch Selection
      try {
        const subject = 'Your BookMyTicket Verification Code';
        const html = `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #f1f5f9; border-radius: 24px; background: #fff;">
            <div style="margin-bottom: 30px;">
              <h1 style="color: #1e293b; font-size: 24px; font-weight: 800; margin: 0;">BookMyTicket</h1>
            </div>
            <h2 style="color: #334155; font-size: 20px; font-weight: 700;">Verify Your Account</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Welcome! Please use the following code to complete your verification.</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 30px 0; color: #f43f5e; background: #fff1f2; padding: 20px; border-radius: 16px;">
              ${newCode}
            </div>
            <p style="color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `;

        await sendEmail({ to: email, subject, html });
      } catch (mailErr) {
        console.error("Local email dispatch error:", mailErr);
      }

      return NextResponse.json({ success: true, message: 'OTP sent' });
    } 
    
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ success: false, error: 'Code is required.' }, { status: 400 });
      }

      // 3. Verify OTP
      const { data, error } = await supabaseAdmin
        .from('otps')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('purpose', purpose || 'signup')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP.' }, { status: 400 });
      }

      // Optional: Delete or invalidate OTP after successful use
      await supabaseAdmin.from('otps').delete().eq('id', data.id);

      return NextResponse.json({ success: true, message: 'OTP verified' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    console.error("OTP API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
