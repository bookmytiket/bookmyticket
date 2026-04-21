import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { parseEmailTemplate } from './templateParser';

/**
 * Reusable Email Service for BookMyTicket
 * Supports SMTP and Microsoft 365 (via Graph API)
 */

/**
 * Helper: Microsoft 365 Graph API Email Dispatch
 */
const sendM365Email = async (m365Config, fromEmail, toEmail, subject, html) => {
  const client_id = m365Config.client_id || m365Config.clientId;
  const tenant_id = m365Config.tenant_id || m365Config.tenantId;
  const client_secret = m365Config.client_secret || m365Config.clientSecret;
  
  if (!client_id || !tenant_id || !client_secret) {
    throw new Error("Incomplete M365 configuration.");
  }

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
  if (!tokenRes.ok) throw new Error(tokenData.error_description || "M365 Auth Failed");

  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
    }),
  });

  if (!sendRes.ok) {
    const errData = await sendRes.json();
    throw new Error(errData.error?.message || "M365 Send Failed");
  }

  return true;
};

/**
 * Centralized Email Dispatcher
 */
export const sendEmail = async ({ to, subject, html }) => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data: settings, error: settingsError } = await supabaseAdmin.from('email_settings').select('*').single();
    if (settingsError) throw new Error(`Settings Fetch Error: ${settingsError.message}`);
    if (!settings) throw new Error("No mail dispatcher configuration found.");

    if (settings.provider === 'SMTP' && settings.host) {
      const transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port || 587,
        secure: settings.encryption === 'SSL' || settings.port == 465,
        auth: {
          user: settings.user_name,
          pass: settings.pass
        }
      });

      await transporter.sendMail({
        from: `"${settings.from_name || 'BookMyTicket'}" <${settings.from_email || settings.user_name}>`,
        to,
        subject,
        html
      });
      return { success: true, provider: 'SMTP' };
    } 
    
    if (settings.provider === 'MICROSOFT_365' && settings.microsoft_365) {
      const fromEmail = settings.from_email || "hello@bookmyticket.net";
      await sendM365Email(settings.microsoft_365, fromEmail, to, subject, html);
      return { success: true, provider: 'MICROSOFT_365' };
    }

    throw new Error(`No active provider config matches (Current: ${settings.provider}).`);
  } catch (err) {
    const errMsg = err.message || JSON.stringify(err);
    console.error("Email Service Error Details:", errMsg);
    return { success: false, error: errMsg };
  }
};

/**
 * Sends a templated email and logs the result.
 */
export const sendTemplatedEmail = async ({ templateIdentifier, to, variables = {}, metadata = {} }) => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Fetch template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('identifier', templateIdentifier)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateIdentifier}`);
    }

    // 2. Parse subject and body
    const subject = parseEmailTemplate(template.subject, variables);
    const body = parseEmailTemplate(template.body, variables);

    // 3. Send email
    const result = await sendEmail({ to, subject, html: body });

    // 4. Log result
    await supabaseAdmin.from('email_logs').insert({
      email: to,
      subject,
      body, // Log the body too for auditing
      status: result.success ? 'SUCCESS' : 'FAILED',
      error: result.error || null,
      user_id: variables.user_id || null
    });

    return result;
  } catch (err) {
    console.error("Templated Email Error:", err.message);
    return { success: false, error: err.message };
  }
};
