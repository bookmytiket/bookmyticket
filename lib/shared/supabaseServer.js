import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fail } from "@/lib/shared/contracts";

export function jsonOk(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Data-Source": "BookMyTicket-Unified-API",
      ...(init.headers || {})
    }
  });
}

export function jsonError(message, status = 500, code = "request_failed", details = null) {
  return jsonOk(fail(message, code, details), { status });
}

export function requireAdminClient() {
  if (!supabaseAdmin) {
    return { error: jsonError("Supabase admin is not configured", 500, "server_not_configured") };
  }
  return { supabase: supabaseAdmin };
}

export async function getBearerUser(request) {
  const { supabase, error } = requireAdminClient();
  if (error) return { error };

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return { error: jsonError("Authentication required", 401, "auth_required") };
  }

  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data?.user) {
    return { error: jsonError("Invalid or expired session", 401, "invalid_session") };
  }

  return { supabase, user: data.user };
}

export async function readProfileRole(supabase, userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role || "user";
}
