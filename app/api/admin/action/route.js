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
          role: partnerReq.type === 'professional_service' ? 'organiser' : 'organiser' // Both use organiser role but handled differently
        }
      });

      if (authError) throw authError;

      const newUserId = authData.user.id;

      // 4. Update Profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          role: 'organiser',
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          phone: partnerReq.phone,
          is_temporary_password: true // Set the flag for force-reset
        })
        .eq("id", newUserId);
      
      if (profileError) throw profileError;

      // 5. Update Organiser Details or Service Provider
      if (partnerReq.type === 'professional_service') {
        const { error: spError } = await supabaseAdmin
          .from("service_providers")
          .upsert({
            id: newUserId,
            business_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
            category: partnerReq.category,
            status: 'Approved'
          });
        if (spError) throw spError;
      }

      const { error: odError } = await supabaseAdmin
        .from("organiser_details")
        .upsert({
          id: newUserId,
          business_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          category: partnerReq.category,
          type: partnerReq.type,
          is_approved: true,
          kyc_status: partnerReq.type === 'professional_service' ? 'Not Required' : 'KYC Completed'
        });
      
      if (odError) throw odError;

      // 6. Update Request Status
      await supabaseAdmin
        .from("partner_requests")
        .update({
          status: "Approved",
          approved_at: new Date().toISOString(),
          access_granted_at: new Date().toISOString()
        })
        .eq("id", requestId);

      // 7. Send Approval Email
      const { data: config } = await supabaseAdmin
        .from('system_config')
        .select('value')
        .eq('key', 'email_settings')
        .single();

      const settings = config?.value ? (typeof config.value === 'string' ? JSON.parse(config.value) : config.value) : null;
      const m365Config = settings?.microsoft365 || settings?.microsoft_365;

      if (settings && settings.provider === 'MICROSOFT_365' && m365Config) {
        const subject = "Your Partner Account has been Approved - BookMyTicket";
        const content = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #10b981;">Congratulations!</h2>
            <p>Your request to become a partner at <strong>BookMyTicket</strong> has been approved.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Login Email:</strong> ${partnerReq.email}</p>
              <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; borderRadius: 4px;">${tempPassword}</code></p>
            </div>
            <p>Click the link below to login and set your new password:</p>
            <div style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/signin" style="background: #8b5cf6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login & Reset Password</a>
            </div>
            <p style="margin-top: 24px; font-size: 13px; color: #666;">For security reasons, you will be required to change your password upon your first login.</p>
          </div>
        `;
        try {
          await sendM365Email(settings.microsoft_365, settings.from, partnerReq.email, subject, content);
        } catch (emailErr) {
          console.error("Failed to send approval email:", emailErr);
        }
      }

      return NextResponse.json({ success: true, userId: newUserId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("Admin action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
