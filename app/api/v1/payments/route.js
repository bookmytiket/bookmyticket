import { ok } from "@/lib/shared/contracts";
import { getBearerUser, jsonError, jsonOk, readProfileRole } from "@/lib/shared/supabaseServer";

export async function GET(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const role = await readProfileRole(supabase, user.id);
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");
    const userId = role === "admin" ? searchParams.get("user_id") || user.id : user.id;

    let query = supabase
      .from("payments")
      .select("*, bookings(id,user_id,event_id,booking_ref,booking_status,payment_status,total_price)")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (bookingId) query = query.eq("booking_id", bookingId);
    if (role !== "admin") query = query.eq("user_id", userId);
    if (role === "admin" && userId !== "all") query = query.eq("user_id", userId);

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    return jsonOk(ok(data || [], { resource: "payments" }));
  } catch (err) {
    console.error("[api/v1/payments] failed:", err);
    return jsonError(err.message || "Unable to load payments");
  }
}
