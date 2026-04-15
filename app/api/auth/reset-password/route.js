import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Helper: Microsoft 365 Graph API Email Dispatch
const sendM365Email = async (supabaseAdmin, m365Config, fromEmail, toEmail, subject, content) => {
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
  try {
    const body = await request.json();
    const { action, email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    if (action === 'send') {
      // 1. Generate Token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

      // 2. Store Token in existing 'otps' table
      const { error } = await supabaseAdmin.from('otps').insert({
        email,
        code: token,
        purpose: 'reset',
        expires_at: expiresAt
      });

      if (error) {
        console.error("Token DB Save Error:", error);
        throw new Error("Failed to secure reset token in backup storage.");
      }

      // 3. Create Reset Link
      const resetLink = `https://bookmyticket.net/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      // 4. Send Email via OAuth2 (Graph API)
      try {
        const { data: settings } = await supabaseAdmin.from('email_settings').select('*').single();
        if (!settings) throw new Error("No mail dispatcher configuration found.");

        const subject = 'Reset Your BookMyTicket Password';
        const html = `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #ec4899; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">This link will expire in 10 minutes.</p>
          </div>
        `;

        if (settings.provider === 'MICROSOFT_365' && settings.microsoft_365) {
          console.log(`Attempting to send reset email via Microsoft Graph API for ${email}`);
          const fromEmail = "hello@bookmyticket.net";
          await sendM365Email(settings.microsoft_365, fromEmail, email, subject, html);
          console.log(`Reset email successfully sent to ${email} via Microsoft Graph API.`);
        }
        else {
            throw new Error(`Email provider is not configured for MICROSOFT_365.`);
        }
      } catch (mailErr) {
        console.error("Local email dispatch error:", mailErr);
        throw mailErr;
      }

      return NextResponse.json({ success: true, message: 'Password reset email sent' });
    }

    if (action === 'verify') {
      const { token } = body;
      if (!token) return NextResponse.json({ success: false, error: 'Token is required.' }, { status: 400 });

      const { data, error } = await supabaseAdmin.from('otps')
        .select('*')
        .eq('email', email)
        .eq('code', token)
        .eq('purpose', 'reset')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ success: false, error: 'Link is invalid or expired.' });

      return NextResponse.json({ success: true });
    }

    if (action === 'update') {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        return NextResponse.json({ success: false, error: 'Token and new password are required.' }, { status: 400 });
      }

      // 1. Double check token again
      const { data: validToken, error: tokenError } = await supabaseAdmin.from('otps')
        .select('*')
        .eq('email', email)
        .eq('code', token)
        .eq('purpose', 'reset')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (tokenError || !validToken) {
        return NextResponse.json({ success: false, error: 'Invalid reset session. Please request a new link.' }, { status: 401 });
      }

      // 2. Perform the actual password change using Supabase Admin API
      // First, get the user ID by email to be more explicit
      const { data: userData, error: getErr } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (getErr || !userData?.user) {
        throw new Error(getErr?.message || "User account not found.");
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
        password: newPassword
      });

      if (authError) {
        console.error("Supabase Admin Auth Error:", authError);
        throw new Error(authError.message || "Failed to update security credentials.");
      }


      // 3. Clear force_password_change flag if it exists for this user
      if (authData?.user?.id) {
        await supabaseAdmin.from('organiser_details')
          .update({ force_password_change: false })
          .eq('id', authData.user.id);
      }

      // 4. Cleanup: Remove used token
      await supabaseAdmin.from('otps').delete().eq('id', validToken.id);


      return NextResponse.json({ success: true, message: 'Password updated successfully.' });
    }


    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });


  } catch (error) {
    console.error("Reset API Error:", error);
    
    // Check if it's a "relation not found" error or timeout
    let errorMessage = error.message || 'Internal Server Error';
    if (errorMessage.toLowerCase().includes("fetch failed") || errorMessage.toLowerCase().includes("timeout")) {
      errorMessage = "Database connection timeout. Please try again in a few seconds.";
    }

    // Ensure we ALWAYS return JSON
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

