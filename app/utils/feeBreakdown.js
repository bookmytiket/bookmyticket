/**
 * Compute ticket total: base + convenience fee + GST.
 * New Revenue Sharing Model:
 * - convenienceFee: Calculated on baseAmount (e.g. 7%)
 * - gst: Calculated ONLY on the convenienceFee (e.g. 18% of fee)
 * - partnerBonus: Bonus shared with partner (e.g. 2% of baseAmount)
 * - platformRevenue: Net for platform (convenienceFee - partnerBonus)
 * - partnerTotal: Base + Bonus (credited to partner)
 */
export const DEFAULT_FEE_SETTINGS = {
  convenienceFeeType: 'percent',
  convenienceFeeValue: 7, // 7% as per new requirement
  gstPercent: 18,
  partnerSharePercent: 2, // 2% share for partner
};

export function getFeeBreakdown(baseAmount, feeSettings = {}) {
  const type = feeSettings.convenienceFeeType || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const feeVal = Number(feeSettings.convenienceFeeValue) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  const gstPct = Number(feeSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent;
  const partnerSharePct = Number(feeSettings.partnerSharePercent) ?? DEFAULT_FEE_SETTINGS.partnerSharePercent;

  // Step 1: Platform Charge (Convenience Fee)
  const convenienceFee = type === 'fixed' ? feeVal : (baseAmount * feeVal) / 100;
  
  // Step 2: GST on Platform Charge ONLY
  const gst = (convenienceFee * gstPct) / 100;
  
  // Step 3: Partner Share from Platform Charge
  const partnerBonus = (baseAmount * partnerSharePct) / 100;
  
  // Step 4: Final Totals
  const total = baseAmount + convenienceFee + gst;
  const platformRevenue = convenienceFee - partnerBonus;
  const partnerTotal = baseAmount + partnerBonus;

  return {
    baseAmount,
    convenienceFee,
    gst,
    total,
    partnerBonus,
    platformRevenue,
    partnerTotal,
    gstPercent: gstPct,
  };
}
