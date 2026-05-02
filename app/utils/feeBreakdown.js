/**
 * Compute ticket total: base + convenience fee + GST.
 */
export const DEFAULT_FEE_SETTINGS = {
  convenienceFeeType: 'percent',
  convenienceFeeValue: 7, 
  gstPercent: 18,
  partnerSharePercent: 2,
  gstApplyOn: 'both',
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
    gstApplyOn: systemSettings.gstApplyOn || systemSettings.gst_apply_on || DEFAULT_FEE_SETTINGS.gstApplyOn,
    applyGst: true // System default usually applies GST
  };

  // Organiser Override
  if (organiserConfig?.override_global) {
    if (organiserConfig.fee_type) finalConfig.convenienceFeeType = organiserConfig.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (organiserConfig.fee_value !== undefined) finalConfig.convenienceFeeValue = Number(organiserConfig.fee_value);
    if (organiserConfig.apply_gst !== undefined) finalConfig.applyGst = !!organiserConfig.apply_gst;
    if (organiserConfig.gst_percent !== undefined) finalConfig.gstPercent = Number(organiserConfig.gst_percent);
    if (organiserConfig.gst_apply_on) finalConfig.gstApplyOn = organiserConfig.gst_apply_on;
  }

  // Event Override (highest priority)
  if (eventConfig?.override_global) {
    if (eventConfig.fee_type) finalConfig.convenienceFeeType = eventConfig.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (eventConfig.fee_value !== undefined) finalConfig.convenienceFeeValue = Number(eventConfig.fee_value);
    if (eventConfig.apply_gst !== undefined) finalConfig.applyGst = !!eventConfig.apply_gst;
    if (eventConfig.gst_percent !== undefined) finalConfig.gstPercent = Number(eventConfig.gst_percent);
    if (eventConfig.gst_apply_on) finalConfig.gstApplyOn = eventConfig.gst_apply_on;
  }

  return finalConfig;
}

export function getFeeBreakdown(baseAmount, feeSettings = {}) {
  // Support both snake_case (DB) and camelCase (code) field names
  const type = feeSettings.convenience_fee_type || feeSettings.convenienceFeeType || (feeSettings.fee_type === 'percentage' ? 'percent' : 'fixed') || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const feeVal = Number(feeSettings.convenience_fee_value ?? feeSettings.convenienceFeeValue ?? feeSettings.fee_value) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  const applyGst = feeSettings.apply_gst !== undefined ? feeSettings.apply_gst : (feeSettings.applyGst !== undefined ? feeSettings.applyGst : true);
  const gstPct = applyGst ? (Number(feeSettings.gst_percent ?? feeSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent) : 0;
  const partnerSharePct = Number(feeSettings.partner_share_percent ?? feeSettings.partnerSharePercent) || DEFAULT_FEE_SETTINGS.partnerSharePercent;
  const gstApplyOn = feeSettings.gst_apply_on ?? feeSettings.gstApplyOn ?? DEFAULT_FEE_SETTINGS.gstApplyOn;

  // Step 1: Platform Charge (Convenience Fee)
  let convenienceFee = baseAmount > 0 ? (type === 'fixed' ? feeVal : (baseAmount * feeVal) / 100) : 0;
  convenienceFee = Math.round(convenienceFee * 100) / 100;

  // Step 2: GST Calculation based on mode
  let gst = 0;
  if (gstPct > 0) {
    if (gstApplyOn === 'ticket_only') {
      gst = (baseAmount * gstPct) / 100;
    } else if (gstApplyOn === 'both') {
      gst = ((baseAmount + convenienceFee) * gstPct) / 100;
    } else {
      // Default: fee_only
      gst = (convenienceFee * gstPct) / 100;
    }
  }
  gst = Math.round(gst * 100) / 100;
  
  // Step 3: Partner Share from Platform Charge
  const partnerBonus = baseAmount > 0 ? (baseAmount * partnerSharePct) / 100 : 0;
  
  // Step 4: Final Totals
  const total = Math.round(baseAmount + convenienceFee + gst);
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
    gstApplyOn
  };
}
