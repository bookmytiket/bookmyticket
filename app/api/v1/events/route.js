import { ok } from "@/lib/shared/contracts";
import { fetchPublicEvents } from "@/lib/shared/eventService";
import { jsonError, jsonOk, requireAdminClient } from "@/lib/shared/supabaseServer";

export async function GET(request) {
  const { supabase, error } = requireAdminClient();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const events = await fetchPublicEvents(supabase, {
      district: searchParams.get("district"),
      city: searchParams.get("city"),
      type: searchParams.get("type"),
      featured: searchParams.get("featured") === "true"
    });

    return jsonOk(ok(events, { resource: "events" }));
  } catch (err) {
    console.error("[api/v1/events] failed:", err);
    return jsonError(err.message || "Unable to load events");
  }
}
