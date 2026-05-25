import { ok } from "@/lib/shared/contracts";
import { jsonError, jsonOk } from "@/lib/shared/supabaseServer";

export async function POST(request) {
  try {
    const origin = new URL(request.url).origin;
    const body = await request.json();
    const response = await fetch(`${origin}/api/scanner/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) return jsonError(data.message || data.error || "Ticket action failed", response.status, data.status || "ticket_action_failed", data);

    return jsonOk(ok(data, { resource: "staff_validation" }), { status: response.status });
  } catch (err) {
    console.error("[api/v1/staff/ticket-action] failed:", err);
    return jsonError(err.message || "Unable to submit ticket action");
  }
}
