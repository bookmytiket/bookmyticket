export const dynamic = 'force-dynamic';
import { ok } from "@/lib/shared/contracts";
import { fetchEventDetail } from "@/lib/shared/eventService";
import { jsonError, jsonOk, requireAdminClient } from "@/lib/shared/supabaseServer";

export async function GET(_request, { params }) {
  const { supabase, error } = requireAdminClient();
  if (error) return error;

  try {
    const { id } = await params;
    const event = await fetchEventDetail(supabase, id);
    if (!event) return jsonError("Event not found", 404, "event_not_found");
    return jsonOk(ok(event, { resource: "event" }));
  } catch (err) {
    console.error("[api/v1/events/:id] failed:", err);
    return jsonError(err.message || "Unable to load event");
  }
}
