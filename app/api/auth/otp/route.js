import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Helper: Microsoft 365 Graph API Email Dispatch
const sendM365Email = async (m365Config, fromEmail, toEmail, subject, content) => {
  const client_id = m365Config.client_id || m365Config.clientId;
  const tenant_id = m365Config.tenant_id || m365Config.tenantId;
  const client_secret = m365Config.client_secret || m365Config.clientSecret;
  
  if (!client_id || !tenant_id || !client_secret) {
    throw new Error("Incomplete M365 configuration (missing client_id, tenant_id, or client_secret).");
  }

  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id,
      client_secret,
      scope: "https://graph.microsoft.com/.default",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || "Authentication with Microsoft 365 failed.");
  }

  const access_token = tokenData.access_token;

  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
    }),
  });

  if (!sendRes.ok) {
    const errData = await sendRes.json();
    throw new Error(errData.error?.message || "Failed to send email via Microsoft Graph API.");
  }

  return true;
};

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
        const { data: settings } = await supabaseAdmin.from('email_settings').select('*').single();
        if (!settings) throw new Error("No mail dispatcher configuration found.");

        const subject = 'Your BookMyTicket Verification Code';
        const html = `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
            <h2>Welcome to BookMyTicket!</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #4F46E5;">
              ${newCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `;

        if (settings.provider === 'SMTP' && settings.host) {
          const nodemailer = require('nodemailer');
          console.log(`Attempting to send OTP via SMTP: ${settings.host}:${settings.port} for ${email}`);
          const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port || 587,
            secure: settings.encryption === 'SSL' || settings.port == 465,
            auth: {
              user: settings.user_name,
              pass: settings.pass
            }
          });

          await transporter.sendMail({
            from: `"${settings.from_name || 'BookMyTicket'}" <${settings.from_email || settings.user_name}>`,
            to: email,
            subject,
            html
          });
          console.log(`OTP locally sent to ${email} via SMTP.`);
        } 
        else if (settings.provider === 'MICROSOFT_365' && settings.microsoft_365) {
          console.log(`Attempting to send OTP via Microsoft Graph API for ${email}`);
          const fromEmail = settings.from_email || "hello@bookmyticket.net";
          await sendM365Email(settings.microsoft_365, fromEmail, email, subject, html);
          console.log(`OTP locally sent to ${email} via Microsoft Graph API.`);
        }
        else {
            console.log(`No active provider config matches (SMTP or M365). Relying on background webhook fallback.`);
        }
      } catch (mailErr) {
        console.error("Local email dispatch error:", mailErr);
        // We do not throw because the Webhook might still be configured to catch it.
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
