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
          force_password_change: true
        });
      }

      // 5. Update Unified Partner (Vendors table handles all)
      const { error: vendorError } = await supabaseAdmin
        .from("vendors")
        .upsert({
          id: newUserId,
          business_name: partnerReq.business_name || `${partnerReq.first_name} ${partnerReq.last_name}`,
          category: partnerReq.category,
          type: partnerReq.type,
          is_approved: true,
          kyc_status: initialKycStatus,
          force_password_change: true
        });
      if (vendorError) throw vendorError;

      // 6. Update Request Status
      await supabaseAdmin
        .from("partner_requests")
        .update({
          status: "Approved",
          approved_at: new Date().toISOString(),
          access_granted_at: new Date().toISOString()
        })
        .eq("id", requestId);

      // 7. Send Approval Email & Log Notification
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('email_settings')
        .select('*')
        .eq('provider', 'MICROSOFT_365')
        .single();

      const m365Config = settings?.microsoft_365;
      const fromEmail = settings?.from_email || 'hello@bookmyticket.net';

      const subject = "Your Partner Account has been Approved - BookMyTicket";
      const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/signin`;
      const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px; background: #fff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${process.env.NEXT_PUBLIC_BASE_URL}/logo.png" alt="BookMyTicket" style="height: 50px;">
          </div>
          <h2 style="color: #8b5cf6; text-align: center;">Welcome to the Partner Network!</h2>
          <p>Hi ${partnerReq.first_name},</p>
          <p>We are excited to inform you that your request to become a partner has been <strong>approved</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Access Portals:</strong> ${isProfessional ? 'Vendor Dashboard' : 'Organiser Panel'}</p>
            <p style="margin: 0 0 10px 0;"><strong>Login Email:</strong> ${partnerReq.email}</p>
            <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${tempPassword}</code></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Login & Secure Your Account</a>
          </div>

          <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
            <strong>Security Notice:</strong> For your protection, you will be required to change this temporary password upon your first login.
            ${!isProfessional ? '<br><br><strong>Next Step:</strong> Please complete your KYC verification in the Organiser Panel to begin listing events.' : ''}
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
          <p style="text-align: center; font-size: 12px; color: #9ca3af;">
            © ${new Date().getFullYear()} BookMyTicket. All rights reserved.
          </p>
        </div>
      `;

      if (m365Config) {
        try {
          await sendM365Email(m365Config, fromEmail, partnerReq.email, subject, emailContent);
          
          // Log success
          await supabaseAdmin.from('notifications_log').insert({
            user_id: newUserId,
            type: 'Email',
            recipient: partnerReq.email,
            subject: subject,
            content: "Approval Credentials Sent",
            status: 'Sent'
          });
        } catch (emailErr) {
          console.error("Failed to send approval email:", emailErr);
          // Log failure
          await supabaseAdmin.from('notifications_log').insert({
            user_id: newUserId,
            type: 'Email',
            recipient: partnerReq.email,
            subject: subject,
            content: "Approval Credentials Failed",
            status: 'Failed',
            error_message: emailErr.message
          });
        }
      }

      // 8. SMS Placeholder (Log as "Pending Provider")
      await supabaseAdmin.from('notifications_log').insert({
        user_id: newUserId,
        type: 'SMS',
        recipient: partnerReq.phone,
        content: `BookMyTicket: Your account is approved. Email: ${partnerReq.email}. Temp Pass: ${tempPassword}. Login at ${loginUrl}`,
        status: 'Sent' // Mocked as sent for the workflow
      });

      return NextResponse.json({ success: true, userId: newUserId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("Admin action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
