/**
 * Compute ticket total: base + convenience fee + GST.
 */
export const DEFAULT_FEE_SETTINGS = {
  convenienceFeeType: 'percent',
  convenienceFeeValue: 7, 
  gstPercent: 18,
  partnerSharePercent: 2,
};

/**
 * Resolves the final fee configuration based on hierarchy:
 * 1. Event Level Override
 * 2. Organiser Level Override
 * 3. System Default
 */
export function resolveFeeSettings(systemSettings = {}, organiserConfig = {}, eventConfig = {}) {
  let finalConfig = {
    convenienceFeeType: systemSettings.convenienceFeeType || DEFAULT_FEE_SETTINGS.convenienceFeeType,
    convenienceFeeValue: Number(systemSettings.convenienceFeeValue) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue,
    gstPercent: Number(systemSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent,
    applyGst: true // System default usually applies GST
  };

  // Organiser Override
  if (organiserConfig?.override_global) {
    finalConfig.convenienceFeeType = organiserConfig.fee_type === 'percentage' ? 'percent' : 'fixed';
    finalConfig.convenienceFeeValue = Number(organiserConfig.fee_value);
    finalConfig.applyGst = !!organiserConfig.apply_gst;
    finalConfig.gstPercent = Number(organiserConfig.gst_percent) || 0;
  }

  // Event Override (highest priority)
  if (eventConfig?.override_global) {
    finalConfig.convenienceFeeType = eventConfig.fee_type === 'percentage' ? 'percent' : 'fixed';
    finalConfig.convenienceFeeValue = Number(eventConfig.fee_value);
    finalConfig.applyGst = !!eventConfig.apply_gst;
    finalConfig.gstPercent = Number(eventConfig.gst_percent) || 0;
  }

  return finalConfig;
}

export function getFeeBreakdown(baseAmount, feeSettings = {}) {
  // Support both old and new field names for backward compatibility during transition
  const type = feeSettings.convenienceFeeType || (feeSettings.fee_type === 'percentage' ? 'percent' : 'fixed') || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const feeVal = Number(feeSettings.convenienceFeeValue ?? feeSettings.fee_value) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  const applyGst = feeSettings.applyGst !== undefined ? feeSettings.applyGst : (feeSettings.apply_gst !== undefined ? feeSettings.apply_gst : true);
  const gstPct = applyGst ? (Number(feeSettings.gstPercent ?? feeSettings.gst_percent) ?? DEFAULT_FEE_SETTINGS.gstPercent) : 0;
  
  const partnerSharePct = Number(feeSettings.partnerSharePercent) || DEFAULT_FEE_SETTINGS.partnerSharePercent;

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
