import { ok } from "@/lib/shared/contracts";
import { getBearerUser, jsonError, jsonOk, readProfileRole } from "@/lib/shared/supabaseServer";

export async function GET(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const role = await readProfileRole(supabase, user.id);
    const { searchParams } = new URL(request.url);
    const ownerId = role === "admin" ? searchParams.get("owner_id") || user.id : user.id;

    const [walletRes, transactionsRes, withdrawalsRes] = await Promise.all([
      supabase.from("wallets").select("*").or(`owner_id.eq.${ownerId},organiser_id.eq.${ownerId},user_id.eq.${ownerId}`).limit(1),
      supabase.from("wallet_transactions").select("*").or(`owner_id.eq.${ownerId},organiser_id.eq.${ownerId}`).order("created_at", { ascending: false }).limit(100),
      supabase.from("withdraw_requests").select("*").or(`owner_id.eq.${ownerId},organiser_id.eq.${ownerId}`).order("created_at", { ascending: false }).limit(100)
    ]);

    if (walletRes.error) throw walletRes.error;
    if (transactionsRes.error) throw transactionsRes.error;
    if (withdrawalsRes.error) throw withdrawalsRes.error;

    return jsonOk(ok({
      wallet: walletRes.data?.[0] || { balance: 0, owner_id: ownerId },
      transactions: transactionsRes.data || [],
      withdrawRequests: withdrawalsRes.data || []
    }, { resource: "wallet" }));
  } catch (err) {
    console.error("[api/v1/wallet] failed:", err);
    return jsonError(err.message || "Unable to load wallet");
  }
}
