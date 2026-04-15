import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client with service-role key for internal operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  try {
    const { action, data } = await request.json();

    if (action === "validate-email-settings") {
      const { settings } = data;
      if (settings.provider === "MICROSOFT_365") {
        await sendM365Email(
          settings.microsoft365,
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
      if (settings.provider === "MICROSOFT_365") {
        await sendM365Email(
          settings.microsoft365,
          settings.from,
          to,
          subject || "Test Email",
          html || "This is a test email."
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "approve-partner") {
      const { requestId, password } = data;

      // 1. Fetch the request
      const { data: partnerReq, error: reqError } = await supabaseAdmin
        .from("partner_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (reqError || !partnerReq) throw new Error("Partner request not found");

      // 2. Create Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: partnerReq.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          role: 'organiser'
        }
      });

      if (authError) throw authError;

      const newUserId = authData.user.id;

      // 3. Update Profile
      await supabaseAdmin
        .from("profiles")
        .update({
          role: 'organiser',
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          phone: partnerReq.phone
        })
        .eq("id", newUserId);

      // 4. Update Organiser Details
      await supabaseAdmin
        .from("organiser_details")
        .upsert({
          id: newUserId,
          business_name: `${partnerReq.first_name} ${partnerReq.last_name}'s Business`,
          category: partnerReq.category,
          type: partnerReq.type,
          is_approved: true,
          kyc_status: partnerReq.type === 'professional_service' ? 'Not Required' : 'Completed'
        });

      // 5. Update Request Status
      await supabaseAdmin
        .from("partner_requests")
        .update({
          status: "Access Granted",
          approved_at: new Date().toISOString(),
          access_granted_at: new Date().toISOString()
        })
        .eq("id", requestId);

      return NextResponse.json({ success: true, userId: newUserId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("Admin action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
