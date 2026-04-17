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

    // Support both INSERT and UPDATE for pushing live 'events'
    if (type !== 'INSERT' && !payload.force_test) {
      // Allow UPDATE for events strictly when status changes to 'published'
      if (table === 'events' && type === 'UPDATE') {
        const { record: newRecord, old_record: oldRecord } = payload;
        if (newRecord.status !== 'published' || oldRecord?.status === 'published') {
          return new Response("Event update does not trigger notification", { status: 200 });
        }
      } else {
        return new Response("Not a translatable event, skipping", { status: 200 });
      }
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
      const { title, date, location, status } = record;

      if (status !== 'published') {
        return new Response("Event is not published, skipping email notification.", { status: 200 });
      }
      
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
    } else if (table === 'failed_login_attempts') {
      // ── Security Alert Email ────────────────────────────────────────────
      const { identifier, ip, user_agent, created_at } = record;
      const recipientEmail = identifier;

      if (!recipientEmail) {
        return new Response("No identifier (email) in failed_login_attempts record.", { status: 200 });
      }

      // Try to get the user's display name for personalisation
      let displayName = recipientEmail;
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('email', recipientEmail)
          .maybeSingle();
        if (profile?.full_name) displayName = profile.full_name;
      } catch (_) { /* graceful — proceed without name */ }

      // Parse timestamp to IST
      const attemptDate = created_at ? new Date(created_at) : new Date();
      const istFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const formattedTime = istFormatter.format(attemptDate);

      // Parse browser name from user-agent for readability
      const ua = user_agent || 'Unknown device';
      let browser = 'Unknown Browser';
      if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome';
      else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
      else if (ua.includes('Edg')) browser = 'Microsoft Edge';
      else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
      else if (ua !== 'Unknown device') browser = ua.substring(0, 60);

      const subject = `⚠️ Security Alert: Failed Login Attempt on Your BookMyTicket Account`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Security Alert</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- RED ALERT BANNER -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:32px 40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">🚨</div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;">Security Alert</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">An unrecognized login attempt was detected on your account</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">Hi <strong>${displayName}</strong>,</p>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
                We detected a <strong>failed login attempt</strong> on your BookMyTicket account. 
                Someone entered the wrong password for <strong>${recipientEmail}</strong>.
                If this was <em>you</em>, no action is needed. If not, secure your account immediately.
              </p>

              <!-- DETAILS CARD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;">Attempt Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #fee2e2;">
                          <span style="font-size:13px;color:#64748b;font-weight:600;">🕐 Time</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #fee2e2;text-align:right;">
                          <span style="font-size:13px;color:#1e293b;font-weight:700;">${formattedTime} IST</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #fee2e2;">
                          <span style="font-size:13px;color:#64748b;font-weight:600;">🌐 IP Address</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #fee2e2;text-align:right;">
                          <span style="font-size:13px;color:#1e293b;font-weight:700;font-family:monospace;">${ip || 'Unknown'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #fee2e2;">
                          <span style="font-size:13px;color:#64748b;font-weight:600;">💻 Browser / Device</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #fee2e2;text-align:right;">
                          <span style="font-size:13px;color:#1e293b;font-weight:700;">${browser}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:13px;color:#64748b;font-weight:600;">📧 Target Account</span>
                        </td>
                        <td style="padding:8px 0;text-align:right;">
                          <span style="font-size:13px;color:#1e293b;font-weight:700;">${recipientEmail}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://bookmyticket.net/reset-password"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.02em;">
                      🔒 Secure My Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- TIPS -->
              <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                <p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 12px;">💡 Recommended Security Actions</p>
                <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:2;">
                  <li>Change your password immediately if you didn't attempt this login</li>
                  <li>Choose a strong password with letters, numbers &amp; symbols</li>
                  <li>Never share your credentials with anyone</li>
                  <li>Enable a unique password for BookMyTicket</li>
                </ul>
              </div>

              <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0;">
                If you made this login attempt and simply forgot your password, you can safely 
                <a href="https://bookmyticket.net/reset-password" style="color:#f43f5e;">reset it here</a>. 
                This is an automated security notification — please do not reply to this email.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} BookMyTicket · 
                <a href="https://bookmyticket.net" style="color:#f43f5e;text-decoration:none;">bookmyticket.net</a>
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">This email was sent because a login attempt was made on your account.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      if (emailConfig.provider === 'MICROSOFT_365') {
        backgroundTask = sendM365Email(
          emailConfig.microsoft_365,
          fromEmail,
          recipientEmail,
          subject,
          html
        );
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
