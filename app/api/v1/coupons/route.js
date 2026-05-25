import { ok } from "@/lib/shared/contracts";
import { jsonError, jsonOk, requireAdminClient } from "@/lib/shared/supabaseServer";

function normalizeCoupon(row) {
  return {
    ...row,
    code: row.code || row.coupon_code,
    type: row.type || (row.discount_type === "Percentage" ? "percent" : "fixed"),
    value: row.value ?? row.discount_value ?? row.discount_amount ?? 0,
    min_tickets: row.min_tickets || 1,
    offerTitle: row.offerTitle || row.campaign_name || row.title || row.name
  };
}

export async function GET(request) {
  const { supabase, error } = requireAdminClient();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event_id");

    const couponRes = await supabase.from("coupons").select("*").eq("is_active", true).order("created_at", { ascending: false });
    
    // Ignore relationship/missing table errors for campaigns
    const campaignRes = await supabase
      .from("partner_campaigns")
      .select("*, partner_campaign_coupons!inner(*)")
      .eq("partner_campaign_coupons.status", "Active");
      
    if (couponRes.error && couponRes.error.code !== "PGRST205") throw couponRes.error;
    if (campaignRes.error && !campaignRes.error.message?.includes("relationship") && campaignRes.error.code !== "PGRST205") {
      throw campaignRes.error;
    }

    const coupons = (couponRes.data || [])
      .filter((coupon) => !eventId || !coupon.event_id || coupon.event_id === eventId)
      .map(normalizeCoupon);

    const campaignCoupons = (campaignRes.data || []).map((campaign) => {
      const activeCoupon = Array.isArray(campaign.partner_campaign_coupons)
        ? campaign.partner_campaign_coupons.find((coupon) => coupon.status === "Active")
        : campaign.partner_campaign_coupons;
      if (!activeCoupon) return null;
      return normalizeCoupon({
        id: activeCoupon.id,
        coupon_code: activeCoupon.coupon_code,
        discount_type: campaign.discount_type,
        discount_value: campaign.discount_value,
        campaign_name: campaign.campaign_name,
        campaignId: campaign.id,
        isCampaign: true
      });
    }).filter(Boolean);

    return jsonOk(ok([...coupons, ...campaignCoupons], { resource: "coupons" }));
  } catch (err) {
    console.error("[api/v1/coupons] failed:", err);
    return jsonError(err.message || "Unable to load coupons");
  }
}

export async function POST(request) {
  const { supabase, error } = requireAdminClient();
  if (error) return error;

  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const quantity = Number(body.quantity || 1);
    if (!code) return jsonError("Coupon code is required", 400, "coupon_code_required");

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    let match = coupon;

    if (!match) {
      let campaign = null;
      try {
        const res = await supabase
          .from("partner_campaigns")
          .select("*, partner_campaign_coupons!inner(*)")
          .eq("partner_campaign_coupons.coupon_code", code)
          .eq("partner_campaign_coupons.status", "Active")
          .maybeSingle();
        campaign = res.data;
      } catch (e) {
        // Ignore relation errors
      }

      if (campaign) {
        match = {
          code,
          type: campaign.discount_type === "Percentage" ? "percent" : "fixed",
          value: campaign.discount_value,
          isCampaign: true,
          campaignId: campaign.id,
          campaign_name: campaign.campaign_name
        };
      }
    }

    if (!match) return jsonError("Invalid or expired coupon", 404, "coupon_not_found");
    if (match.expiry_date && new Date(match.expiry_date) < new Date()) {
      return jsonError("Coupon has expired", 400, "coupon_expired");
    }
    if (quantity < Number(match.min_tickets || 1)) {
      return jsonError(`Minimum ${match.min_tickets || 1} tickets required`, 400, "coupon_min_tickets");
    }

    return jsonOk(ok(normalizeCoupon(match), { resource: "coupon" }));
  } catch (err) {
    console.error("[api/v1/coupons:POST] failed:", err);
    return jsonError(err.message || "Unable to validate coupon");
  }
}
