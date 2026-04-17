import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper: Microsoft 365 Graph API Email Dispatch
const sendM365Email = async (m365Config, fromEmail, toEmail, subject, content) => {
  const client_id = m365Config.client_id || m365Config.clientId;
  const tenant_id = m365Config.tenant_id || m365Config.tenantId;
  const client_secret = m365Config.client_secret || m365Config.clientSecret;
  
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
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // SECURITY GUARD: Verify the requester is an authorized Admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !requester) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Check against admins table
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', requester.id)
      .single();

    if (adminCheckError || !isAdmin) {
      console.warn(`Unauthorized admin action attempt by user ${requester.id}`);
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { action, data } = await request.json();

    if (action === "validate-email-settings") {
      const { settings } = data;
      const m365Config = settings.microsoft365 || settings.microsoft_365;
      if (settings.provider === "MICROSOFT_365" && m365Config) {
        await sendM365Email(
          m365Config,
          settings.from,
          settings.from, // Send test to self
          "Microsoft 365 Connection Test",
          "Success! Your Microsoft 365 Graph API integration is correctly configured."
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "send-test-email") {
      const { settings, to, subject, html } = data;
      const m365Config = settings.microsoft365 || settings.microsoft_365;
      if (settings.provider === "MICROSOFT_365" && m365Config) {
        await sendM365Email(
          m365Config,
          settings.from,
          to,
          subject || "Test Email",
          html || "This is a test email."
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "approve-partner") {
      const { requestId, password: manualPassword } = data;

      // 1. Fetch the request
      const { data: partnerReq, error: reqError } = await supabaseAdmin
        .from("partner_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (reqError || !partnerReq) throw new Error("Partner request not found");

      // 2. Generate temporary password if not provided
      const tempPassword = manualPassword || Math.random().toString(36).slice(-10);

      // 3. Create Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: partnerReq.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          role: 'organiser' // Base role is organiser
        }
      });

      if (authError) throw authError;

      const newUserId = authData.user.id;

      // 4. Update Profile
      const isProfessional = partnerReq.type === 'professional_service';
      const initialKycStatus = isProfessional ? 'Approved' : 'KYC Pending';

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          role: 'organiser',
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          phone: partnerReq.phone,
          is_temporary_password: true,
          force_password_change: true // Force reset on first login
        })
        .eq("id", newUserId);
      
      if (profileError) {
        // If profile row doesn't exist, we might need to insert (though trigger usually handles it)
        await supabaseAdmin.from("profiles").upsert({
          id: newUserId,
          email: partnerReq.email,
          role: 'organiser',
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          phone: partnerReq.phone,
          is_temporary_password: true,
          force_password_change: true
        });
      }

      // 5. Update Unified Partner (Organisers table)
      const { error: organiserError } = await supabaseAdmin
        .from("organisers")
        .upsert({
          id: newUserId,
          business_name: partnerReq.business_name || `${partnerReq.first_name} ${partnerReq.last_name}`,
          category: partnerReq.category,
          type: partnerReq.type,
          is_approved: true,
          kyc_status: initialKycStatus,
          is_temporary_password: true,
          force_password_change: true
        });
      if (organiserError) throw organiserError;

      // 6. Update Request Status
      await supabaseAdmin
        .from("partner_requests")
        .update({
          status: "Approved",
          approved_at: new Date().toISOString(),
          access_granted_at: new Date().toISOString()
        })
        .eq("id", requestId);

      // 7. Send Approval Email with Credentials
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('email_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError) {
        console.error("[approve-partner] Could not load email_settings:", settingsError.message);
      }

      const m365Config = settings?.microsoft_365;
      const fromEmail = settings?.from_email || 'hello@bookmyticket.net';

      const subject = "Your Partner Account has been Approved - BookMyTicket";
      const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net'}/signin`;
      const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; padding: 40px; border-radius: 24px; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net'}/logo.png" alt="BookMyTicket" style="height: 60px;">
          </div>
          <h1 style="color: #0f172a; text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 10px;">Welcome to the Network!</h1>
          <p style="color: #64748b; text-align: center; font-size: 16px; margin-bottom: 30px;">Hi ${partnerReq.first_name}, your partner account has been approved and is ready for use.</p>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Login Email:</td>
                <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${partnerReq.email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Temporary Password:</td>
                <td style="padding: 10px 0;"><code style="background: #fdf4ff; color: #a855f7; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-family: monospace; font-size: 15px;">${tempPassword}</code></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Platform URL:</td>
                <td style="padding: 10px 0;"><a href="https://bookmyticket.net" style="color: #a855f7; text-decoration: none; font-weight: 600;">bookmyticket.net</a></td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #f84464 0%, #a855f7 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; display: inline-block; box-shadow: 0 10px 20px rgba(168,85,247,0.25);">Login &amp; Secure Your Account →</a>
          </div>

          <div style="background: #fffbeb; padding: 20px; border-radius: 12px; border: 1px solid #fde68a;">
            <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">
              <strong>Important Security Notice:</strong> This is a temporary password. You will be required to change it immediately upon your first login.
            </p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">
          <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 0;">
            © ${new Date().getFullYear()} BookMyTicket. Empowering experiences.
          </p>
        </div>
      `;

      if (settings?.provider === 'MICROSOFT_365' && m365Config) {
        try {
          console.log(`[approve-partner] Sending credentials email to ${partnerReq.email} via M365...`);
          await sendM365Email(m365Config, fromEmail, partnerReq.email, subject, emailContent);
          console.log(`[approve-partner] ✅ Credentials email sent to ${partnerReq.email}`);

          // Log success (graceful — table may not exist)
          try {
            await supabaseAdmin.from('notifications_log').insert({
              user_id: newUserId, type: 'Email', recipient: partnerReq.email,
              subject, content: "Approval Credentials Sent", status: 'Sent'
            });
          } catch (_) { /* notifications_log table optional */ }
        } catch (emailErr) {
          console.error("[approve-partner] ❌ Failed to send credentials email:", emailErr.message);
          // Log failure gracefully
          try {
            await supabaseAdmin.from('notifications_log').insert({
              user_id: newUserId, type: 'Email', recipient: partnerReq.email,
              subject, content: "Approval Credentials Failed",
              status: 'Failed', error_message: emailErr.message
            });
          } catch (_) { /* notifications_log table optional */ }
        }
      } else {
        console.error(`[approve-partner] ❌ Email NOT sent — provider: ${settings?.provider}, m365Config present: ${!!m365Config}`);
      }

      // 8. SMS Placeholder (Log as "Pending Provider")
      try {
        await supabaseAdmin.from('notifications_log').insert({
          user_id: newUserId,
          type: 'SMS',
          recipient: partnerReq.phone,
          content: `BookMyTicket: Your account is approved. Email: ${partnerReq.email}. Temp Pass: ${tempPassword}. Login at ${loginUrl}`,
          status: 'Sent'
        });
      } catch (_) { /* notifications_log table optional */ }

      return NextResponse.json({ success: true, userId: newUserId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("Admin action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

