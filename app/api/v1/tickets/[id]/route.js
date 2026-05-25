import { normalizeBooking, ok } from "@/lib/shared/contracts";
import { getBearerUser, jsonError, jsonOk, readProfileRole } from "@/lib/shared/supabaseServer";

export async function GET(_request, { params }) {
  const request = _request;
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const { id } = await params;
    const role = await readProfileRole(supabase, user.id);

    let query = supabase
      .from("bookings")
      .select("*, events(*), tickets(*)")
      .eq("id", id);

    if (role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data, error: queryError } = await query.maybeSingle();
    if (queryError) throw queryError;
    if (!data) return jsonError("Ticket not found", 404, "ticket_not_found");

    // Fetch booking_items separately to avoid relationship errors
    const { data: bookingItems, error: itemsError } = await supabase
      .from("booking_items")
      .select("*")
      .eq("booking_id", id);

    if (bookingItems) {
      data.booking_items = bookingItems;
    }

    return jsonOk(ok(normalizeBooking(data), { resource: "ticket" }));
  } catch (err) {
    console.error("[api/v1/tickets/:id] failed:", err);
    return jsonError(err.message || "Unable to load ticket");
  }
}
