import { ok } from "@/lib/shared/contracts";
import { getBearerUser, jsonError, jsonOk } from "@/lib/shared/supabaseServer";

export async function POST(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { data, error: insertError } = await supabase
      .from("sync_failures")
      .insert({
        user_id: user.id,
        client: body.client || "mobile",
        resource: body.resource || null,
        action: body.action || null,
        error_message: body.error_message || body.message || "Sync failure",
        payload: body.payload || {},
        app_version: body.app_version || body.appVersion || null
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return jsonOk(ok(data, { resource: "sync_log" }));
  } catch (err) {
    console.error("[api/v1/sync/log] failed:", err);
    return jsonError(err.message || "Unable to log sync failure");
  }
}
