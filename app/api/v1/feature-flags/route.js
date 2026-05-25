import { FEATURE_FLAGS, ok, platformMatches } from "@/lib/shared/contracts";
import { jsonError, jsonOk, requireAdminClient } from "@/lib/shared/supabaseServer";

export async function GET(request) {
  const { supabase, error } = requireAdminClient();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") || "all";
    const { data, error: queryError } = await supabase
      .from("feature_flags")
      .select("*")
      .order("feature_key", { ascending: true });

    if (queryError) throw queryError;

    const rows = data?.length ? data : Object.values(FEATURE_FLAGS).map((key) => ({
      feature_key: key,
      enabled: true,
      platform_scope: "all"
    }));

    const flags = {};
    rows.forEach((row) => {
      if (platformMatches(row.platform_scope, platform)) {
        flags[row.feature_key] = Boolean(row.enabled);
      }
    });

    return jsonOk(ok(flags, { resource: "feature_flags", platform }));
  } catch (err) {
    console.error("[api/v1/feature-flags] failed:", err);
    return jsonError(err.message || "Unable to load feature flags");
  }
}
