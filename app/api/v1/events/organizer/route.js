import { ok } from "@/lib/shared/contracts";
import { jsonError, jsonOk, getBearerUser } from "@/lib/shared/supabaseServer";

export async function GET(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("events")
      .select("*, event_drafts(id, completion_percentage, last_saved_at)")
      .eq("organiser_id", user.id);
      
    if (status) {
        query = query.eq("status", status);
    }

    const { data: events, error: fetchError } = await query.order("updated_at", { ascending: false });

    if (fetchError) throw fetchError;

    return jsonOk(ok(events, { resource: "organizer_events" }));
  } catch (err) {
    console.error("[api/v1/events/organizer] failed:", err);
    return jsonError(err.message || "Unable to load organizer events");
  }
}
