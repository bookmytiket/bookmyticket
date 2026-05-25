import { ok } from "@/lib/shared/contracts";
import { jsonError, jsonOk, requireAdminClient } from "@/lib/shared/supabaseServer";

export async function GET(request) {
  const { supabase, error } = requireAdminClient();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event_id");
    const showtimeId = searchParams.get("showtime_id");
    if (!eventId) return jsonError("event_id is required", 400, "event_id_required");

    let query = supabase
      .from("seat_inventory")
      .select("*")
      .eq("event_id", eventId)
      .order("seat_number", { ascending: true });

    query = showtimeId ? query.eq("showtime_id", showtimeId) : query.is("showtime_id", null);

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    return jsonOk(ok(data || [], { resource: "seat_inventory" }));
  } catch (err) {
    console.error("[api/v1/seat-inventory] failed:", err);
    return jsonError(err.message || "Unable to load seat inventory");
  }
}
