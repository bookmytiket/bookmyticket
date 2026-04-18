import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';
import { sendSMS } from '@/lib/commService';

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, email, phone, purpose, code } = await request.json();

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: 'Identifier (Email or Phone) is required.' }, { status: 400 });
    }

    if (action === 'send') {
      // 1. Fetch OTP Config
      const { data: configData } = await supabaseAdmin.from('communicationSettings').select('value').eq('key', 'otp_settings').maybeSingle();
      const otpConfig = configData?.value;
      
      // If we are doing 'login' or 'signup' verification and it's disabled, skip
      if (otpConfig && !otpConfig.enabled && (purpose === 'signup' || purpose === 'login')) {
          // Note: Standard signup might still want email verification, but here we honor the global toggle
          // For now, we allow sending if requested, but we'll check this again in registration logic
      }

      // 2. Generate OTP
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirySecs = otpConfig?.expirySeconds || 600;
      const expiresAt = new Date(Date.now() + expirySecs * 1000).toISOString();

      // 3. Insert secure record
      const otpData = {
        email: email || null,
        code: newCode,
        purpose: purpose || 'signup',
        expires_at: expiresAt
      };
      
      // Only add phone if it's provided to avoid 'missing column' errors if DB is not updated
      if (phone) {
        otpData.phone = phone;
      }

      const { error } = await supabaseAdmin.from('otps').insert(otpData);

      if (error) throw error;

      // 4. Dispatch via appropriate channel
      if (phone) {
          await sendSMS({ 
              phoneNumber: phone, 
              message: `Your BookMyTicket verification code is: ${newCode}. Valid for ${Math.floor(expirySecs/60)} mins.`,
              type: 'OTP'
          });
      } else {
          const subject = 'Your BookMyTicket Verification Code';
          const html = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #f1f5f9; border-radius: 24px; background: #fff;">
              <h1 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 30px;">BookMyTicket</h1>
              <h2 style="color: #334155; font-size: 20px; font-weight: 700;">Verify Your Account</h2>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 30px 0; color: #f43f5e; background: #fff1f2; padding: 20px; border-radius: 16px;">
                ${newCode}
              </div>
              <p style="color: #94a3b8; font-size: 12px;">Valid for ${Math.floor(expirySecs/60)} minutes.</p>
            </div>
          `;
          await sendEmail({ to: email, subject, html });
      }

      return NextResponse.json({ success: true, message: 'Verification code sent successfully.' });
    } 
    
    if (action === 'verify') {
      if (!code) return NextResponse.json({ success: false, error: 'Code is required.' }, { status: 400 });

      const query = supabaseAdmin.from('otps').select('*').eq('code', code).eq('purpose', purpose || 'signup').gte('expires_at', new Date().toISOString());
      
      if (email) query.eq('email', email);
      if (phone) query.eq('phone', phone);

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ success: false, error: 'Invalid or expired OTP.' }, { status: 400 });

      await supabaseAdmin.from('otps').delete().eq('id', data.id);
      return NextResponse.json({ success: true, message: 'OTP verified successfully.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    console.error("OTP API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
