import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, email, phone, purpose, code } = await request.json();
    const identifier = email || phone;

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Identifier (Email or Phone) is required.' }, { status: 400 });
    }

    if (action === 'send') {
      // 1. Fetch SMTP Config & OTP Settings
      const { data: configData } = await supabaseAdmin.from('communicationSettings').select('value').eq('key', 'otp_settings').maybeSingle();
      const otpConfig = configData?.value;
      
      const { data: smtpSettings } = await supabaseAdmin.from('email_settings').select('from_email, from_name').maybeSingle();
      const fromEmail = smtpSettings?.from_email || 'hello@bookmyticket.net';

      // 2. Generate OTP
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirySecs = otpConfig?.expirySeconds || 600;
      const expiresAt = new Date(Date.now() + expirySecs * 1000).toISOString();

      // 3. Upsert secure record
      const { error } = await supabaseAdmin.from('otps').upsert({
        identifier,
        code: newCode,
        purpose: purpose || 'signup',
        expires_at: expiresAt
      }, { onConflict: 'identifier' });

      if (error) throw error;

      // 4. Dispatch Email
      if (email) {
        const subject = `${newCode} is your BookMyTicket OTP`;
        const html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 20px auto; padding: 40px; text-align: center; border: 1px solid #f1f5f9; border-radius: 32px; background: #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.05);">
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 900; margin-bottom: 8px; letter-spacing: -1px;">BookMyTicket</h1>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Verification Code</p>
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; margin: 30px 0; color: #f43f5e; background: #fff1f2; padding: 30px; border-radius: 24px; border: 2px dashed #fecaca;">
              ${newCode}
            </div>
            <p style="color: #94a3b8; font-size: 13px; font-weight: 600;">Valid for ${Math.floor(expirySecs/60)} minutes.</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
            <p style="color: #cbd5e1; font-size: 11px;">Sent via ${fromEmail}</p>
          </div>
        `;
        await sendEmail({ to: email, subject, html });
      }

      return NextResponse.json({ success: true, message: 'Verification code sent successfully.' });
    } 
    
    if (action === 'verify') {
      if (!code) return NextResponse.json({ success: false, error: 'Code is required.' }, { status: 400 });

      // 1. Verify OTP in table
      const { data: otpData, error: otpError } = await supabaseAdmin
        .from('otps')
        .select('*')
        .eq('identifier', identifier)
        .eq('code', code)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (otpError) throw otpError;
      if (!otpData) return NextResponse.json({ success: false, error: 'Invalid or expired OTP.' }, { status: 400 });

      // 2. Clean up OTP
      await supabaseAdmin.from('otps').delete().eq('id', otpData.id);

      // 3. BRIDGED LOGIN (If purpose is login)
      if (purpose === 'login' || purpose === 'signin') {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        });

        if (linkError) throw linkError;

        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
          email: email,
          token_hash: linkData.properties.hashed_token,
          type: 'magiclink'
        });

        if (sessionError) throw sessionError;

        return NextResponse.json({ 
          success: true, 
          message: 'OTP verified and user logged in.',
          session: sessionData.session,
          user: sessionData.user
        });
      }

      // Default success for other purposes (like signup)
      return NextResponse.json({ success: true, message: 'OTP verified successfully.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    console.error("OTP API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
