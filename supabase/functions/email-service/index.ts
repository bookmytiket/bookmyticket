import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- M365 Email Helper ---
async function sendM365Email(m365Config, fromEmail, toEmail, subject, content, isBcc = false) {
  const client_id = m365Config.client_id || m365Config.clientId;
  const tenant_id = m365Config.tenant_id || m365Config.tenantId;
  const client_secret = m365Config.client_secret || m365Config.clientSecret;
  
  if (!client_id || !tenant_id || !client_secret) {
    throw new Error("Incomplete M365 configuration.");
  }

  // 1. Get OAuth Token
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

  if (!tokenRes.ok) {
    const errData = await tokenRes.json();
    throw new Error(errData.error_description || "Auth with M365 failed.");
  }
  const { access_token } = await tokenRes.json();

  // 2. Format Recipients
  const recipients = Array.isArray(toEmail) ? toEmail : [toEmail];
  const recipientKey = isBcc ? "bccRecipients" : "toRecipients";
  const formattedRecipients = recipients.map(email => ({ emailAddress: { address: email } }));

  // 3. Send Email
  console.log(`Dispatching email via Graph API: ${fromEmail} -> ${toEmail} | Subject: ${subject}`);
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
        [recipientKey]: formattedRecipients,
      },
    }),
  });

  if (!sendRes.ok) {
    const errData = await sendRes.json();
    console.error("Graph API Error Details:", JSON.stringify(errData));
    throw new Error(errData.error?.message || "Failed to send email via MS Graph.");
  }
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const { table, record, type, old_record } = payload;

    // --- PRE-REQUISITE: FETCH CONFIG ---
    const { data: emailConfig } = await supabaseAdmin.from('email_settings').select('*').limit(1).single();
    if (!emailConfig || (emailConfig.provider === 'MICROSOFT_365' && !emailConfig.microsoft_365)) {
      throw new Error("Microsoft 365 configuration is missing in the database.");
    }
    const fromEmail = emailConfig.from_email || "hello@bookmyticket.net";

    const logNotification = async (email, subject, content, status, error = null) => {
      try {
        await supabaseAdmin.from('notifications_log').insert({
          user_id: record?.user_id,
          type: 'Email',
          recipient: email,
          subject,
          content: content.slice(0, 5000), // Limit content size
          status: status === 'sent' ? 'Sent' : 'Failed',
          error_message: error
        });
      } catch (err) {
        console.error("Logging failed:", err);
      }
    };

    const sendMultiEmail = async (emails, subject, html) => {
      const results = [];
      for (const email of emails) {
        if (!email) continue;
        try {
          await sendM365Email(emailConfig.microsoft_365, fromEmail, email, subject, html);
          await logNotification(email, subject, html, 'sent');
          results.push({ email, success: true });
        } catch (err) {
          console.error(`Failed to send email to ${email}:`, err);
          await logNotification(email, subject, html, 'failed', err.message);
          results.push({ email, success: false, error: err.message });
        }
      }
      return results;
    };

    // --- PROCESS BASED ON TABLE ---
    
    // 1. OTPS
    if (table === 'otps' && type === 'INSERT') {
      const { email, code, purpose } = record;
      const subject = `${code} is your verification code`;
      const html = `<h2>BookMyTicket</h2><p>Your OTP for ${purpose} is:</p><h1 style="color: #ec4899; spacing: 5px;">${code}</h1><p>Do not share this code.</p>`;
      await sendMultiEmail([email], subject, html);
    } 

    // 2. BOOKINGS (Events)
    else if (table === 'bookings') {
      const isConfirmed = record.status === 'Confirmed' && (type === 'INSERT' || old_record?.status !== 'Confirmed');
      if (!isConfirmed) return new Response("Booking not confirmed, skipping", { status: 200 });

      const { id, event_id, user_id, ticket_count, total_price, customer_details } = record;
      const { data: event } = await supabaseAdmin.from('events').select('title, organiser_id').eq('id', event_id).single();
      const { data: userProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', user_id).single();
      const { data: organiserProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', event?.organiser_id).maybeSingle();
      
      const userEmail = customer_details?.email || userProfile?.email;
      const userName = customer_details?.name || 'Customer';
      const organiserEmail = organiserProfile?.email;

      const userSubject = "Booking Confirmed";
      const userHtml = `<h2>Booking Confirmed</h2><p>Your booking for <strong>${event?.title}</strong> is confirmed.</p><p>Tickets: ${ticket_count}<br/>Amount: ₹${total_price}<br/>ID: ${id}</p>`;

      const orgSubject = "New Booking Received";
      const orgHtml = `<h2>New Booking</h2><p><strong>User:</strong> ${userName}<br/><strong>Event:</strong> ${event?.title}<br/><strong>Tickets:</strong> ${ticket_count}<br/><strong>ID:</strong> ${id}</p>`;

      await sendMultiEmail([userEmail], userSubject, userHtml);
      if (organiserEmail) await sendMultiEmail([organiserEmail], orgSubject, orgHtml);
    }

    // 3. TURF BOOKINGS
    else if (table === 'turf_bookings') {
      const isConfirmed = (record.booking_status === 'confirmed' || record.status === 'confirmed') && 
                          (type === 'INSERT' || (old_record?.booking_status !== 'confirmed' && old_record?.status !== 'confirmed'));
      if (!isConfirmed) return new Response("Turf booking not confirmed, skipping", { status: 200 });

      const { id, organiser_id, turf_name, date, start_time, total_amount, customer_details, customer_name, customer_email } = record;
      const { data: organiserProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', organiser_id).maybeSingle();
      
      const userEmail = customer_email || customer_details?.email;
      const userName = customer_name || customer_details?.name || 'Customer';
      const organiserEmail = organiserProfile?.email;

      const userSubject = "Booking Confirmed";
      const userHtml = `<h2>Turf Booking Confirmed</h2><p>Your booking for <strong>${turf_name}</strong> on ${date} is confirmed.</p><p>Amount: ₹${total_amount}<br/>ID: ${id}</p>`;

      const orgSubject = "New Turf Booking";
      const orgHtml = `<h2>New Booking Received</h2><p><strong>User:</strong> ${userName}<br/><strong>Facility:</strong> ${turf_name}<br/><strong>Date:</strong> ${date}<br/><strong>ID:</strong> ${id}</p>`;

      await sendMultiEmail([userEmail], userSubject, userHtml);
      if (organiserEmail) await sendMultiEmail([organiserEmail], orgSubject, orgHtml);
    }

    // 4. VENDOR BOOKINGS
    else if (table === 'vendor_bookings') {
      const isConfirmed = (record.status === 'confirmed' || record.status === 'Confirmed') && 
                          (type === 'INSERT' || (old_record?.status !== 'confirmed' && old_record?.status !== 'Confirmed'));
      if (!isConfirmed) return new Response("Vendor booking not confirmed, skipping", { status: 200 });

      const { id, vendor_id, service_type, booking_date, total_amount, customer_details, customer_name, customer_email } = record;
      const { data: vendorProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', vendor_id).maybeSingle();
      
      const userEmail = customer_email || customer_details?.email;
      const userName = customer_name || customer_details?.name || 'Customer';
      const vendorEmail = vendorProfile?.email;

      const userSubject = "Booking Confirmed";
      const userHtml = `<h2>Service Booking Confirmed</h2><p>Your booking for <strong>${service_type}</strong> on ${booking_date} is confirmed.</p><p>Amount: ₹${total_amount}<br/>ID: ${id}</p>`;

      const vendorSubject = "New Booking Received";
      const vendorHtml = `<h2>New Booking</h2><p><strong>User:</strong> ${userName}<br/><strong>Service:</strong> ${service_type}<br/><strong>Date:</strong> ${booking_date}<br/><strong>ID:</strong> ${id}</p>`;

      await sendMultiEmail([userEmail], userSubject, userHtml);
      if (vendorEmail) await sendMultiEmail([vendorEmail], vendorSubject, vendorHtml);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Email service error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
