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
    const body = await request.json();
    const { firstName, lastName, email, phone, category, type, role, remarks, businessName, serviceType, city, experience, portfolioLink, coverageArea } = body;

    let partnerReq;
    let insertError;

    if (type === 'professional_service') {
      const psRemarks = `Business Name: ${businessName || 'N/A'}\nService Type: ${serviceType || 'N/A'}\nCity: ${city || 'N/A'}\nExperience: ${experience || 'N/A'}\nPortfolio: ${portfolioLink || 'N/A'}\nCoverage Area: ${coverageArea || 'N/A'}\nRemarks: ${remarks || ''}`;
      const res = await supabaseAdmin
        .from('partner_requests')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          category: category,
          type: type,
          role: role || 'Individual',
          remarks: psRemarks,
          kyc_details: {
            businessName,
            serviceType,
            city,
            experience,
            portfolioLink,
            coverageArea
          },
          status: 'Pending'
        })
        .select()
        .single();
      partnerReq = res.data;
      insertError = res.error;
    } else {
      const res = await supabaseAdmin
        .from('partner_requests')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          category: category,
          type: type,
          role: role,
          remarks: remarks,
          status: 'Pending'
        })
        .select()
        .single();
      partnerReq = res.data;
      insertError = res.error;
    }

    if (insertError) throw insertError;

    // 2. Fetch email settings from dedicated table
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .eq('provider', 'MICROSOFT_365')
      .single();

    if (!settingsError && settings && settings.microsoft_365) {
      const fromEmail = settings.from_email || 'hello@bookmyticket.net';
      const m365Config = settings.microsoft_365;
      const adminEmail = 'hello@bookmyticket.net';

      // 3. User Confirmation Email
      const userSubject = "Partner Request Received - BookMyTicket";
      const userHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; background: #fff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <img src="${process.env.NEXT_PUBLIC_BASE_URL}/logo.png" alt="BookMyTicket" style="height: 50px;">
          </div>
          <h2 style="color: #8b5cf6; margin-bottom: 20px;">Hi ${firstName},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Thank you for applying to join the <strong>BookMyTicket Partner Network</strong>.
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <p style="margin: 0; font-weight: bold; color: #1f2937;">Request Details:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;">
              <li><strong>Type:</strong> ${type === 'event_organiser' ? 'Event Organiser' : 'Professional Service'}</li>
              <li><strong>Category:</strong> ${category}</li>
              <li><strong>Status:</strong> Under Review</li>
            </ul>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            Our onboarding team is currently reviewing your application. You can expect to hear from us within <strong>24 to 48 hours</strong> with the next steps.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="text-align: center; font-size: 12px; color: #9ca3af;">
            © ${new Date().getFullYear()} BookMyTicket. All rights reserved.
          </p>
        </div>
      `;

      // 4. Admin Notification Email
      const adminSubject = `New Partner Request: ${firstName} ${lastName} (${category})`;
      const adminHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; background: #fdf2f8;">
          <h2 style="color: #db2777; margin-bottom: 20px;">New Partner Application</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;"><strong>Applicant:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;">${email}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;">${phone}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;"><strong>Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;">${type}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;"><strong>Category:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;">${category}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;"><strong>Remarks:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #fce7f3;">${remarks || 'N/A'}</td></tr>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin?tab=partner_requests" style="background: #db2777; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review in Admin Panel</a>
          </div>
        </div>
      `;

      // Dispatch & Log
      try {
        // Dispatch to User
        await sendM365Email(m365Config, fromEmail, email, userSubject, userHtml);
        await supabaseAdmin.from('notifications_log').insert({
          type: 'Email', recipient: email, subject: userSubject,
          content: 'User submission confirmation sent', status: 'Sent'
        });

        // Dispatch to Admin
        await sendM365Email(m365Config, fromEmail, adminEmail, adminSubject, adminHtml);
        await supabaseAdmin.from('notifications_log').insert({
          type: 'Email', recipient: adminEmail, subject: adminSubject,
          content: 'Admin notification of new partner request sent', status: 'Sent'
        });

      } catch (emailErr) {
        console.error("Partner notification failure:", emailErr);
        await supabaseAdmin.from('notifications_log').insert({
          type: 'Email', recipient: email, subject: userSubject,
          content: 'Notification dispatch failed', status: 'Failed',
          error_message: emailErr.message
        });
      }
    }

    return NextResponse.json({ success: true, id: partnerReq.id });

  } catch (err) {
    console.error("Partner request API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
