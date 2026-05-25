import { ok } from "@/lib/shared/contracts";
import { getBearerUser, jsonError, jsonOk } from "@/lib/shared/supabaseServer";

export async function POST(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const body = await request.json();
    const deviceId = body.device_id || body.deviceId;
    if (!deviceId) return jsonError("device_id is required", 400, "device_id_required");

    const payload = {
      user_id: user.id,
      platform: body.platform || "expo",
      device_id: deviceId,
      push_token: body.push_token || body.pushToken || null,
      app_version: body.app_version || body.appVersion || null,
      last_seen: new Date().toISOString()
    };

    const { data, error: upsertError } = await supabase
      .from("devices")
      .upsert(payload, { onConflict: "user_id,device_id" })
      .select()
      .single();

    if (upsertError) throw upsertError;
    return jsonOk(ok(data, { resource: "device" }));
  } catch (err) {
    console.error("[api/v1/devices/register] failed:", err);
    return jsonError(err.message || "Unable to register device");
  }
}
