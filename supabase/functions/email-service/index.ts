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
    throw new Error("Incomplete M365 configuration (missing client_id, tenant_id, or client_secret).");
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

  let backgroundTask = Promise.resolve();

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const { table, record, type } = payload;

    // Only process inserts
    if (type !== 'INSERT' && !payload.force_test) {
      return new Response("Not an INSERT event, skipping", { status: 200 });
    }

    // --- PRE-REQUISITE: FETCH CONFIG ---
    const { data: emailConfig } = await supabaseAdmin.from('email_settings').select('*').limit(1).single();
    if (!emailConfig || (emailConfig.provider === 'MICROSOFT_365' && !emailConfig.microsoft_365)) {
      throw new Error("Microsoft 365 configuration is missing in the database.");
    }
    
    // Determine the from email to use
    const fromEmail = emailConfig.from_email || "hello@bookmyticket.net";

    // --- PROCESS BASED ON TABLE ---
    if (table === 'otps') {
      const { email, code, purpose } = record;
      const subject = `${code} is your verification code`;
      const html = `<h2>BookMyTicket</h2><p>Your OTP for ${purpose} is:</p><h1 style="color: #ec4899; spacing: 5px;">${code}</h1><p>Do not share this code.</p>`;
      
      if (emailConfig.provider === 'MICROSOFT_365') {
        backgroundTask = sendM365Email(emailConfig.microsoft_365, fromEmail, email, subject, html);
      } else {
        return new Response("Provider is not MICROSOFT_365, ignoring OTP event as SMTP is handled in API route.", { status: 200 });
      }
    } 
    else if (table === 'profiles') {
      const { email, role } = record;
      if (role === 'user') { // Welcome email only for new standard users
        const subject = "Welcome to BookMyTicket!";
        const html = `<h2>Welcome to BookMyTicket!</h2><p>Your account has been created. Start exploring amazing events nearby!</p>`;
        
        if (emailConfig.provider === 'MICROSOFT_365') {
          backgroundTask = sendM365Email(emailConfig.microsoft_365, fromEmail, email, subject, html);
        }
      }
    } 
    else if (table === 'bookings') {
      const { user_id, ticket_count, total_price, customer_details } = record;
      const { data: user } = await supabaseAdmin.from('profiles').select('email').eq('id', user_id).single();
      const customerEmail = customer_details?.email || user?.email;
      
      if (customerEmail && emailConfig.provider === 'MICROSOFT_365') {
        const subject = `Booking Confirmation - ${ticket_count} Tickets`;
        const html = `<h2>Booking Confirmed!</h2><p>You have successfully booked ${ticket_count} tickets.</p><p>Total Paid: ₹${total_price}</p><p>You can view your digital tickets in your dashboard.</p>`;
        backgroundTask = sendM365Email(emailConfig.microsoft_365, fromEmail, customerEmail, subject, html);
      }
    } 
    else if (table === 'events') {
      // BULK EMAIL OPTIMIZATION for New Events
      const { title, date, location } = record;
      
      if (emailConfig.provider === 'MICROSOFT_365') {
        backgroundTask = (async () => {
          try {
            const { data: subs } = await supabaseAdmin.from('subscribers').select('email');
            const { data: profiles } = await supabaseAdmin.from('profiles').select('email').eq('role', 'user');
            
            const rawEmails = [...(subs || []), ...(profiles || [])].map(r => r.email).filter(Boolean);
            const uniqueEmails = [...new Set(rawEmails)]; // Deduplicate

            if (uniqueEmails.length === 0) return;

            const subject = "🎉 New Event Available on BookMyTicket!";
            const html = `<h2>New Event!</h2><br/><strong>Event:</strong> ${title}<br/><strong>Date:</strong> ${date}<br/><strong>Location:</strong> ${location || 'TBA'}<br/><br/><a href="https://bookmyticket.net">Book Now</a>`;

            // Process in batches of 400 (Graph API allows 500 BCC max)
            const chunkSize = 400;
            for (let i = 0; i < uniqueEmails.length; i += chunkSize) {
              const batch = uniqueEmails.slice(i, i + chunkSize);
              await sendM365Email(emailConfig.microsoft_365, fromEmail, batch, subject, html, true);
            }
          } catch (e) {
            console.error("Bulk email error:", e);
          }
        })();
      }
    } else {
       return new Response(`Table [${table}] processing not defined.`, { status: 200 });
    }

    // Safely execute in background natively for Deno/Supabase
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTask);
    } else {
      // If run locally, just await it or don't await so webhook returns fast. 
      // It's dangerous not to await without waitUntil in standard node, but fine here.
      // We will await it just in case as webhooks have 5s limit and most individual emails are < 1s.
      if (table !== 'events') {
         await backgroundTask;
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Email dispatch started" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 202
    });

  } catch (error) {
    console.error("Email service error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
