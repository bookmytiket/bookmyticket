import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail, sendTemplatedEmail } from '@/lib/emailService';

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

      if (purpose === 'login' || purpose === 'signin') {
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
        if (!profile) {
           return NextResponse.json({ success: false, error: 'User not found. Please sign up.' }, { status: 404 });
        }
      } else if (purpose === 'signup') {
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
        if (profile) {
           return NextResponse.json({ success: false, error: 'User already exists. Please log in.' }, { status: 409 });
        }
      }

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
        await sendTemplatedEmail({
          templateIdentifier: 'otp',
          to: email,
          variables: {
            otp: newCode,
            purpose: purpose || 'signup'
          }
        });
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
