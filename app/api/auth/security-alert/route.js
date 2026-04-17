import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase admin client (bypasses RLS) ──────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── M365 Graph API — send email directly (no Edge Function needed) ─────────
async function sendSecurityAlertEmail({ m365Config, fromEmail, toEmail, record }) {
  const { client_id, tenant_id, client_secret, clientId, tenantId, clientSecret } = m365Config;
  const cid = client_id || clientId;
  const tid = tenant_id || tenantId;
  const csec = client_secret || clientSecret;

  if (!cid || !tid || !csec) {
    throw new Error("Incomplete M365 config (missing client_id / tenant_id / client_secret).");
  }

  // 1. Obtain OAuth2 token
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: cid,
        client_secret: csec,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  if (!tokenRes.ok) {
    const errData = await tokenRes.json();
    throw new Error(errData.error_description || "M365 OAuth2 token request failed.");
  }
  const { access_token } = await tokenRes.json();

  // 2. Build the rich HTML email body
  const { identifier, ip, user_agent, created_at } = record;

  const attemptDate = created_at ? new Date(created_at) : new Date();
  const formattedTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(attemptDate);

  const ua = user_agent || "Unknown device";
  let browser = "Unknown Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg"))   browser = "Google Chrome";
  else if (ua.includes("Firefox"))                     browser = "Mozilla Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Apple Safari";
  else if (ua.includes("Edg"))                         browser = "Microsoft Edge";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";
  else if (ua !== "Unknown device")                    browser = ua.substring(0, 60);

  // Try to find the user's first name for personalisation
  let displayName = toEmail;
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("email", toEmail)
      .maybeSingle();
    if (profile?.full_name) displayName = profile.full_name;
  } catch (_) { /* graceful — no name, use email */ }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Security Alert</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- BANNER -->
        <tr>
          <td style="background:linear-gradient(135deg,#f84464 0%,#a855f7 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🚨</div>
            <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-.02em;">Security Alert</h1>
            <p style="color:rgba(255,255,255,.85);font-size:14px;margin:0;">
              An unrecognized login attempt was detected on your account
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">
              Hi <strong>${displayName}</strong>,
            </p>
            <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
              We detected a <strong>failed login attempt</strong> on your BookMyTicket account.
              Someone entered the wrong password for <strong>${identifier}</strong>.
              If this was <em>you</em>, no action is needed. If not, secure your account immediately.
            </p>

            <!-- DETAILS CARD -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fdf4ff;border:1.5px solid #e9d5ff;border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#a855f7;text-transform:uppercase;letter-spacing:.05em;">
                  Attempt Details
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;">
                      <span style="font-size:13px;color:#64748b;font-weight:600;">🕐 Time</span>
                    </td>
                    <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;text-align:right;">
                      <span style="font-size:13px;color:#1e293b;font-weight:700;">${formattedTime} IST</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;">
                      <span style="font-size:13px;color:#64748b;font-weight:600;">🌐 IP Address</span>
                    </td>
                    <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;text-align:right;">
                      <span style="font-size:13px;color:#1e293b;font-weight:700;font-family:monospace;">${ip || "Unknown"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;">
                      <span style="font-size:13px;color:#64748b;font-weight:600;">💻 Browser / Device</span>
                    </td>
                    <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;text-align:right;">
                      <span style="font-size:13px;color:#1e293b;font-weight:700;">${browser}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="font-size:13px;color:#64748b;font-weight:600;">📧 Target Account</span>
                    </td>
                    <td style="padding:8px 0;text-align:right;">
                      <span style="font-size:13px;color:#1e293b;font-weight:700;">${identifier}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net'}/reset-password"
                   style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f84464 0%,#a855f7 100%);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:.02em;box-shadow:0 4px 14px rgba(168,85,247,0.35);">
                  🔒 Secure My Account
                </a>
              </td></tr>
            </table>

            <!-- TIPS -->
            <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
              <p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 12px;">💡 Recommended Security Actions</p>
              <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:2;">
                <li>Change your password immediately if you didn't attempt this login</li>
                <li>Choose a strong password with letters, numbers &amp; symbols</li>
                <li>Never share your credentials with anyone</li>
                <li>Use a unique password for BookMyTicket</li>
              </ul>
            </div>

            <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0;">
              If you made this attempt and simply forgot your password, you can
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net'}/reset-password" style="color:#a855f7;font-weight:600;">reset it here</a>.
              This is an automated security notification — please do not reply to this email.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} BookMyTicket ·
              <a href="https://bookmyticket.net" style="color:#a855f7;text-decoration:none;">bookmyticket.net</a>
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">
              This email was sent because a failed login attempt was made on your account.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // 3. Send via Graph API
  const sendRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: "⚠️ Security Alert: Failed Login Attempt on Your BookMyTicket Account",
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: toEmail } }],
        },
      }),
    }
  );

  if (!sendRes.ok) {
    const errData = await sendRes.json();
    console.error("[security-alert] Graph API error:", JSON.stringify(errData));
    throw new Error(errData.error?.message || "Graph API sendMail failed.");
  }

  console.log(`[security-alert] ✅ Alert email sent to ${toEmail}`);
  return true;
}

// ─── Route Handler ─────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, ip, userAgent, timestamp } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const record = {
      identifier: email.trim().toLowerCase(),
      ip: ip || "Unknown",
      user_agent: userAgent || "Unknown",
      created_at: timestamp || new Date().toISOString(),
    };

    // 1. Persist the failed attempt (service-role bypasses RLS)
    const { data: inserted, error: dbError } = await supabaseAdmin
      .from("failed_login_attempts")
      .insert(record)
      .select()
      .single();

    if (dbError) {
      console.error("[security-alert] DB insert error:", dbError.message);
      // Non-fatal — still send the email
    }

    // 2. Fetch M365 config from email_settings
    const { data: emailConfig, error: cfgError } = await supabaseAdmin
      .from("email_settings")
      .select("*")
      .limit(1)
      .single();

    if (cfgError || !emailConfig) {
      console.error("[security-alert] Could not load email_settings:", cfgError?.message);
      return NextResponse.json({ success: true, warning: "Email config missing — alert not sent." }, { status: 200 });
    }

    if (emailConfig.provider !== "MICROSOFT_365" || !emailConfig.microsoft_365) {
      console.warn("[security-alert] Provider is not MICROSOFT_365 — skipping email.");
      return NextResponse.json({ success: true, warning: "Non-M365 provider — alert not sent." }, { status: 200 });
    }

    const fromEmail = emailConfig.from_email || "hello@bookmyticket.net";
    const alertRecord = inserted || record;

    // 3. Send the security alert email directly via M365 Graph API
    await sendSecurityAlertEmail({
      m365Config: emailConfig.microsoft_365,
      fromEmail,
      toEmail: alertRecord.identifier,
      record: alertRecord,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[security-alert] Error:", err.message);
    // Still return 200 — don't surface internal errors to the client
    return NextResponse.json({ success: true, warning: err.message }, { status: 200 });
  }
}
