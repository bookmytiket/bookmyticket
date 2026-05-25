import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emailService";
import { parseEmailTemplate } from "@/lib/templateParser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(req) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase credentials missing" }, { status: 500 });
    }
    const { templateId, target, filter, customSubject, customBody } = await req.json();

    // 1. Fetch Template
    let template = { subject: customSubject, body: customBody };
    if (templateId) {
      const { data, error } = await supabaseAdmin
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      if (error) throw new Error("Template not found");
      template = {
        ...data,
        subject: data.subject_template || data.subject,
        body: data.html_content || data.body
      };
    }

    if (!template.subject || !template.body) {
      throw new Error("Subject and Body are required (either from template or custom)");
    }

    // 2. Determine Recipients
    let recipients = [];
    if (target === "all_users") {
      const { data, error } = await supabaseAdmin.from("profiles").select("email, full_name");
      if (error) throw error;
      recipients = data.map(u => ({ email: u.email, name: u.full_name }));
    } else if (target === "all_subscribers") {
      const { data, error } = await supabaseAdmin.from("subscribers").select("email").eq("status", "Active");
      if (error) throw error;
      recipients = data.map(u => ({ email: u.email, name: "Subscriber" }));
    } else if (target === "filtered") {
      // Example: Filter by role or category
      let query = supabaseAdmin.from("profiles").select("email, full_name");
      if (filter.role) query = query.eq("role", filter.role);
      const { data, error } = await query;
      if (error) throw error;
      recipients = data.map(u => ({ email: u.email, name: u.full_name }));
    } else if (target === "test") {
      recipients = [{ email: filter.email, name: "Test User" }];
    }

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, message: "No recipients found for the selected target." });
    }

    // 3. Send Emails (Bulk)
    // Note: In a production app, this should be handled by a queue/background job.
    // For now, we process them in chunks or all at once if count is low.
    const results = [];
    for (const recipient of recipients) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmyticket.net';
      const variables = {
        name: recipient.name || "User",
        email: recipient.email,
        site_url: baseUrl,
        reset_link: `${baseUrl.replace(/\/$/, '')}/reset-password?token=TEST_TOKEN&email=${encodeURIComponent(recipient.email)}`,
        otp: "123456",
        ticket_url: `${baseUrl.replace(/\/$/, '')}/ticket/TEST_ID`,
        eventName: "Sample Event",
        date: new Date().toLocaleDateString(),
        bookingId: "BMT-TEST-123",
        ...filter?.variables // Additional custom variables if any
      };

      const finalSubject = parseEmailTemplate(template.subject, variables);
      const finalBody = parseEmailTemplate(template.body, variables);

      // We wrap the text in a basic HTML structure if it's not already HTML
      const html = finalBody.includes("<") ? finalBody : `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">${finalBody.replace(/\n/g, '<br/>')}</div>`;

      try {
        const sendRes = await sendEmail({ to: recipient.email, subject: finalSubject, html });
        results.push({ email: recipient.email, status: sendRes.success ? "success" : "failed", error: sendRes.error });
        
        // Log to email_logs
        await supabaseAdmin.from("email_logs").insert([{
          user_id: recipient.id || null,
          email: recipient.email,
          subject: finalSubject,
          body: html,
          status: sendRes.success ? "SUCCESS" : "FAILED",
          error: sendRes.error || null
        }]);
      } catch (err) {
        results.push({ email: recipient.email, status: "failed", error: err.message });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const failCount = results.length - successCount;

    if (successCount === 0 && failCount > 0) {
      // If everything failed (e.g. invalid credentials), show the exact error from the first failure
      return NextResponse.json({
        success: false,
        error: `Failed to send email. Reason: ${results[0].error}`,
        results: results.slice(0, 100)
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully sent ${successCount} emails. ${failCount} failed.`,
      results: results.slice(0, 100) // Return first 100 results for UI
    });

  } catch (err) {
    console.error("Broadcast API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
