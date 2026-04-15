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
    const { firstName, lastName, email, phone, category, type, role, remarks } = body;

    // 1. Insert into partner_requests
    const { data: partnerReq, error: insertError } = await supabaseAdmin
      .from('partner_requests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        category: category,
        type: category === "Turf Booking" ? "professional_service" : (type || "event_organiser"),
        role: role,
        remarks: remarks,
        status: 'Pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. Fetch email settings
    const { data: config } = await supabaseAdmin
      .from('system_config')
      .select('value')
      .eq('key', 'email_settings')
      .single();

    const settings = config?.value ? (typeof config.value === 'string' ? JSON.parse(config.value) : config.value) : null;

    if (settings && settings.provider === 'MICROSOFT_365' && settings.microsoft_365) {
      const fromEmail = settings.from;
      const adminEmail = 'hello@bookmyticket.net';

      // 3. Send User Confirmation
      const userSubject = "Partner Request Received - BookMyTicket";
      const userHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #8b5cf6;">Hello ${firstName},</h2>
          <p>Thank you for your interest in becoming a partner with <strong>BookMyTicket</strong>.</p>
          <p>We have received your request for the <strong>${type === 'event_organiser' ? 'Event Organiser' : 'Professional Service'}</strong> category.</p>
          <p>Our team will review your details and get back to you within 24–48 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated confirmation. Please do not reply directly to this email.</p>
        </div>
      `;

      // 4. Send Admin Notification
      const adminSubject = `New Partner Request: ${firstName} ${lastName}`;
      const adminHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #ec4899;">New Partner Request</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Remarks:</strong> ${remarks || 'N/A'}</p>
          <div style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin?tab=partner_requests" style="background: #8b5cf6; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Admin Panel</a>
          </div>
        </div>
      `;

      // Dispatch emails
      try {
        await sendM365Email(settings.microsoft_365, fromEmail, email, userSubject, userHtml);
        await sendM365Email(settings.microsoft_365, fromEmail, adminEmail, adminSubject, adminHtml);
      } catch (emailErr) {
        console.error("Failed to send notification emails:", emailErr);
        // We don't throw here to ensure the user still sees success on the frontend
      }
    }

    return NextResponse.json({ success: true, id: partnerReq.id });

  } catch (err) {
    console.error("Partner request API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
