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

    // --- HELPER: PARSE TEMPLATE ---
    const parseTemplate = (text: string, vars: any) => {
      if (!text) return "";
      return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        // Support for nested properties like {{record.customer_details.name}}
        const value = trimmedKey.split('.').reduce((obj, k) => obj?.[k], vars);
        return value !== undefined ? value : match;
      });
    };

    const fetchAndSendTemplate = async (identifier: string, to: string[], vars: any) => {
      const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('identifier', identifier)
        .single();
      
      if (!template) {
        console.warn(`Template ${identifier} not found, falling back to basic.`);
        return false;
      }

      const subject = parseTemplate(template.subject, vars);
      const html = parseTemplate(template.body, vars);
      
      await sendMultiEmail(to, subject, html);
      return true;
    };

    // --- PROCESS BASED ON TABLE ---
    
    const vars = { record, old_record, site_url: "https://bookmyticket.net" };

    // 1. OTPS
    if (table === 'otps' && type === 'INSERT') {
      await fetchAndSendTemplate('otp', [record.email], { ...vars, otp: record.code, purpose: record.purpose });
    } 

    // 2. BOOKINGS (Events)
    else if (table === 'bookings') {
      const isConfirmed = record.status === 'Confirmed' && (type === 'INSERT' || old_record?.status !== 'Confirmed');
      if (!isConfirmed) return new Response("Booking not confirmed, skipping", { status: 200 });

      const { data: event } = await supabaseAdmin.from('events').select('title, organiser_id, image_url').eq('id', record.event_id).single();
      const { data: userProfile } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', record.user_id).single();
      const { data: organiserProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', event?.organiser_id).maybeSingle();
      
      const userEmail = record.customer_details?.email || userProfile?.email;
      const organiserEmail = organiserProfile?.email;

      const bookingVars = {
        ...vars,
        name: record.customer_details?.name || userProfile?.full_name || 'Customer',
        eventName: event?.title,
        bookingId: record.id,
        ticketCount: record.ticket_count,
        amount: record.total_price,
        date: new Date().toLocaleDateString(),
        eventImage: event?.image_url
      };

      await fetchAndSendTemplate('booking', [userEmail], bookingVars);
      if (organiserEmail) {
        await fetchAndSendTemplate('organiser_new_booking', [organiserEmail], bookingVars);
      }
    }

    // 3. TURF BOOKINGS
    else if (table === 'turf_bookings') {
      const isConfirmed = (record.booking_status === 'confirmed' || record.status === 'confirmed') && 
                          (type === 'INSERT' || (old_record?.booking_status !== 'confirmed' && old_record?.status !== 'confirmed'));
      if (!isConfirmed) return new Response("Turf booking not confirmed, skipping", { status: 200 });

      const { data: organiserProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', record.organiser_id).maybeSingle();
      const userEmail = record.customer_email || record.customer_details?.email;
      const organiserEmail = organiserProfile?.email;

      const turfVars = {
        ...vars,
        name: record.customer_name || record.customer_details?.name || 'Customer',
        turfName: record.turf_name,
        date: record.date,
        time: record.start_time,
        amount: record.total_amount,
        bookingId: record.id
      };

      await fetchAndSendTemplate('turf_booking_confirmed', [userEmail], turfVars);
      if (organiserEmail) {
        await fetchAndSendTemplate('organiser_new_turf_booking', [organiserEmail], turfVars);
      }
    }

    // 5. PROFILES (Welcome Email)
    else if (table === 'profiles' && type === 'INSERT') {
      await fetchAndSendTemplate('welcome_registration', [record.email], { ...vars, name: record.full_name });
    }

    // 4. VENDOR BOOKINGS
    else if (table === 'vendor_bookings') {
      const isConfirmed = (record.status === 'confirmed' || record.status === 'Confirmed') && 
                          (type === 'INSERT' || (old_record?.status !== 'confirmed' && old_record?.status !== 'Confirmed'));
      
      const isRequested = (type === 'INSERT' && (record.status === 'pending' || record.status === 'Pending'));

      const { data: vendorProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', record.vendor_id).maybeSingle();
      const userEmail = record.customer_email || record.customer_details?.email;
      const vendorEmail = vendorProfile?.email;

      const vendorVars = {
        ...vars,
        name: record.customer_name || record.customer_details?.name || 'Customer',
        serviceType: record.service_type,
        date: record.booking_date,
        amount: record.total_amount,
        bookingId: record.id
      };

      if (isConfirmed) {
        await fetchAndSendTemplate('vendor_booking_confirmed', [userEmail], vendorVars);
        if (vendorEmail) await fetchAndSendTemplate('vendor_new_booking_confirmed', [vendorEmail], vendorVars);
      } 
      else if (isRequested) {
        await fetchAndSendTemplate('vendor_booking_requested', [userEmail], vendorVars);
        if (vendorEmail) await fetchAndSendTemplate('vendor_action_required', [vendorEmail], vendorVars);
      }
    }

    // 6. KYC VERIFICATIONS
    else if (table === 'kyc_details' && type === 'UPDATE') {
      if (record.status !== old_record.status) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('email').eq('id', record.id).single();
        if (profile?.email) {
          const kycVars = {
            ...vars,
            status: record.status,
            notes: record.rejection_reason || 'Your KYC application has been processed.',
            color: record.status === 'Approved' ? '#16a34a' : '#ef4444'
          };
          await fetchAndSendTemplate('kyc_status_update', [profile.email], kycVars);
        }
      }
    }

    // 7. WITHDRAW REQUESTS
    else if (table === 'withdraw_requests' && type === 'UPDATE') {
      if (record.status !== old_record.status) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('email').eq('id', record.organiser_id || record.user_id).single();
        if (profile?.email) {
          const withdrawVars = {
            ...vars,
            status: record.status,
            amount: record.amount,
            requestId: record.id
          };
          await fetchAndSendTemplate('withdraw_status_update', [profile.email], withdrawVars);
        }
      }
    }

    // 8. EVENT PUBLISHED (Approval)
    else if (table === 'events' && type === 'UPDATE') {
      if (record.status === 'Published' && old_record.status !== 'Published') {
        const { data: profile } = await supabaseAdmin.from('profiles').select('email').eq('id', record.organiser_id).single();
        if (profile?.email) {
          const eventVars = {
            ...vars,
            eventName: record.title,
            eventImage: record.image_url
          };
          await fetchAndSendTemplate('event_published_alert', [profile.email], eventVars);
        }
      }
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
