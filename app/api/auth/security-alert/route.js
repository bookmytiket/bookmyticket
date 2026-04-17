import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase admin client (bypasses RLS) ──────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Calls the email-service Edge Function directly, passing the
 * failed_login_attempts record so it sends a security alert email.
 */
async function triggerSecurityAlertEmail(record) {
  const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-service`;
  try {
    const res = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Service-role key so the Edge Function can access email_settings
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        type: "INSERT",
        table: "failed_login_attempts",
        record,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[security-alert] Edge Function call failed:", err);
    } else {
      console.log("[security-alert] Email dispatch triggered successfully.");
    }
  } catch (err) {
    // Non-fatal — the DB row was already inserted; email is best-effort
    console.error("[security-alert] Could not reach email-service:", err.message);
  }
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
      // Don't hard-fail — still attempt the email
    }

    // 2. Fire the security alert email (non-blocking)
    const alertRecord = inserted || record;
    triggerSecurityAlertEmail(alertRecord); // intentionally not awaited

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[security-alert] Unexpected error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
