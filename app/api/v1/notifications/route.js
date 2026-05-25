import { normalizeNotification, ok } from "@/lib/shared/contracts";
import { getBearerUser, jsonError, jsonOk } from "@/lib/shared/supabaseServer";

export async function GET(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (queryError) throw queryError;
    return jsonOk(ok((data || []).map(normalizeNotification), { resource: "notifications" }));
  } catch (err) {
    console.error("[api/v1/notifications] failed:", err);
    return jsonError(err.message || "Unable to load notifications");
  }
}
