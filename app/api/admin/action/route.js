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
      const pwd = (manualPassword || "").trim();
      const tempPassword = pwd || Math.random().toString(36).slice(-10);

      const email = partnerReq.email.trim().toLowerCase();
      let userId;

      // 3. Robust User Lookup: Search directly in Auth to be 100% sure we have the right ID
      const { data: listRes } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = listRes?.users?.find(u => u.email?.toLowerCase() === email);

      if (authUser) {
        userId = authUser.id;
        console.log(`[approve-partner] User found in Auth system: ${userId}`);
      } else {
        // Check profiles table as a secondary fallback (though they should be in sync)
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        
        if (profile) {
          userId = profile.id;
          console.log(`[approve-partner] User found in Profiles only: ${userId}`);
        } else {
          // 4. Create new Auth User if absolutely not found anywhere
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
              role: 'organiser'
            }
          });

          if (authError) {
             console.error("[approve-partner] Auth Create Error:", authError);
             throw authError;
          }
          userId = authData.user.id;
          console.log(`[approve-partner] New user created: ${userId}`);
        }
      }

      const newUserId = userId;
      console.log(`[approve-partner] Proceeding with Auth Update for ID: ${newUserId}`);

      // Always update and confirm user
      // We use both email_confirm and email_confirmed_at for maximum compatibility across Supabase versions
      const { data: updateData, error: finalAuthError } = await supabaseAdmin.auth.admin.updateUserById(newUserId, {
        password: tempPassword,
        email_confirm: true,
        user_metadata: { 
          role: 'organiser',
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`
        },
        // Explicitly confirm to bypass any "email not confirmed" blocks
        email_confirmed_at: new Date().toISOString()
      });

      if (finalAuthError) {
        console.error("[approve-partner] Auth Update Failed:", finalAuthError);
        // If it's just a "same password" error, we can proceed
        if (!finalAuthError.message.includes("same as the old one")) {
           throw new Error("Critical Auth update failed: " + finalAuthError.message);
        }
      } else {
        console.log(`[approve-partner] Auth account successfully updated and confirmed for ${email}`);
      }


      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: newUserId,
          email: email,
          role: 'organiser',
          full_name: `${partnerReq.first_name} ${partnerReq.last_name}`,
          phone: partnerReq.phone,
          is_temporary_password: false,
          force_password_change: false
        });

      // 5. Update the correct partner table based on type
      const isProfessional = partnerReq.type === 'professional_service';

      if (isProfessional) {
        // Professional services go to vendors table
        const { error: vendorError } = await supabaseAdmin
          .from("vendors")
          .upsert({
            id: newUserId,
            business_name: partnerReq.business_name || `${partnerReq.first_name} ${partnerReq.last_name}`,
            category: partnerReq.category,
            type: partnerReq.type,
            is_approved: true,
            kyc_status: 'Approved'
          });
        if (vendorError) throw vendorError;
      } else {
        // Event organisers go to organisers table
        const { error: organiserError } = await supabaseAdmin
          .from("organisers")
          .upsert({
            id: newUserId,
            business_name: partnerReq.business_name || `${partnerReq.first_name} ${partnerReq.last_name}`,
            type: partnerReq.type,
            is_approved: true,
            kyc_status: 'KYC Pending'
          });
        if (organiserError) throw organiserError;
      }

      // 6. Update Request Status
      await supabaseAdmin
        .from("partner_requests")
        .update({
          status: isProfessional ? "Approved" : "KYC Initiated",
          kyc_status: isProfessional ? "Approved" : "Pending",
          approved_at: new Date().toISOString(),
          access_granted_at: isProfessional ? new Date().toISOString() : null
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
          <h1 style="color: #0f172a; text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 10px;">Welcome to the Network!</h1>
          <p style="color: #64748b; text-align: center; font-size: 16px; margin-bottom: 30px;">Hi ${partnerReq.first_name}, your partner account has been approved!</p>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> <code style="background: #fdf4ff; color: #a855f7; padding: 4px 10px; border-radius: 6px; font-weight: 700;">${tempPassword}</code></p>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #f84464 0%, #a855f7 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; display: inline-block;">Login to Portal →</a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} BookMyTicket</p>
        </div>
      `;

      if (settings?.provider === 'MICROSOFT_365' && m365Config) {
        try {
          await sendM365Email(m365Config, fromEmail, email, subject, emailContent);
          console.log(`[approve-partner] ✅ Credentials email sent to ${email}`);
          const { error: logError } = await supabaseAdmin.from('notifications_log').insert({
            user_id: newUserId, 
            type: 'Email', 
            recipient: email,
            subject, 
            content: "Approval Credentials Sent", 
            status: 'Sent'
          });
          if (logError) console.error("[approve-partner] ⚠️ Failed to log notification:", logError.message);
        } catch (emailErr) {
          console.error("[approve-partner] ❌ Failed to send credentials email:", emailErr.message);
        }
      }

      return NextResponse.json({ success: true, userId: newUserId });
    }

    if (action === "reject-partner") {
      const { requestId, reason } = data;
      await supabaseAdmin
        .from("partner_requests")
        .update({
          status: "Rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId);
      
      return NextResponse.json({ success: true });
    }

    if (action === "verify-kyc") {
      const { requestId, organiserId, status, reason } = data;
      
      // Update kyc_details table
      await supabaseAdmin
        .from("kyc_details")
        .update({
          status,
          rejection_reason: reason,
          verified_at: status === 'Approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", organiserId);

      // Update organisers table
      await supabaseAdmin
        .from("organisers")
        .update({
          kyc_status: status,
          is_approved: status === 'Approved',
          updated_at: new Date().toISOString()
        })
        .eq("id", organiserId);

      // Update partner_requests table if exists
      if (requestId) {
        await supabaseAdmin
          .from("partner_requests")
          .update({
            status: status === 'Approved' ? "Access Granted" : "KYC Rejected",
            kyc_status: status,
            updated_at: new Date().toISOString()
          })
          .eq("id", requestId);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("Admin action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

