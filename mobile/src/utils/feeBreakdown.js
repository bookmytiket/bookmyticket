export const DEFAULT_FEE_SETTINGS = {
  convenienceFeeType: 'percent',
  convenienceFeeValue: 7, 
  gstPercent: 18,
  partnerSharePercent: 2,
};

export function getFeeBreakdown(baseAmount, feeSettings = {}) {
  // Support both snake_case (DB) and camelCase (code) field names
  const type = feeSettings.convenience_fee_type || feeSettings.convenienceFeeType || (feeSettings.fee_type === 'percentage' ? 'percent' : 'fixed') || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const feeVal = Number(feeSettings.convenience_fee_value ?? feeSettings.convenienceFeeValue ?? feeSettings.fee_value) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  const applyGst = feeSettings.apply_gst !== undefined ? feeSettings.apply_gst : (feeSettings.applyGst !== undefined ? feeSettings.applyGst : true);
  const gstPct = applyGst ? (Number(feeSettings.gst_percent ?? feeSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent) : 0;
  
  const partnerSharePct = Number(feeSettings.partner_share_percent ?? feeSettings.partnerSharePercent) || DEFAULT_FEE_SETTINGS.partnerSharePercent;

  // Step 1: Platform Charge (Convenience Fee)
  const convenienceFee = baseAmount > 0 ? (type === 'fixed' ? feeVal : (baseAmount * feeVal) / 100) : 0;
  
  // Step 2: GST on Platform Charge ONLY
  const gst = convenienceFee > 0 ? (convenienceFee * gstPct) / 100 : 0;
  
  // Step 3: Partner Share from Platform Charge
  const partnerBonus = baseAmount > 0 ? (baseAmount * partnerSharePct) / 100 : 0;
  
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
