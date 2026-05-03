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
    applyGst: true
  };

  // Organiser Override (Check both flat and nested fee_config)
  const orgFee = organiserConfig?.fee_config || organiserConfig || {};
  const isOrgOverride = organiserConfig?.override_global || orgFee?.override_global;

  if (isOrgOverride) {
    if (orgFee.fee_type) finalConfig.convenienceFeeType = orgFee.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (orgFee.fee_value !== undefined) finalConfig.convenienceFeeValue = Number(orgFee.fee_value);
    if (orgFee.apply_gst !== undefined) finalConfig.applyGst = !!orgFee.apply_gst;
    if (orgFee.gst_percent !== undefined) finalConfig.gstPercent = Number(orgFee.gst_percent);
    if (orgFee.gst_apply_on) finalConfig.gstApplyOn = orgFee.gst_apply_on;
  }

  // Event Override (highest priority)
  const evtFee = eventConfig?.fee_config || eventConfig || {};
  const isEvtOverride = eventConfig?.override_global || evtFee?.override_global;

  if (isEvtOverride) {
    if (evtFee.fee_type) finalConfig.convenienceFeeType = evtFee.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (evtFee.fee_value !== undefined) finalConfig.convenienceFeeValue = Number(evtFee.fee_value);
    if (evtFee.apply_gst !== undefined) finalConfig.applyGst = !!evtFee.apply_gst;
    if (evtFee.gst_percent !== undefined) finalConfig.gstPercent = Number(evtFee.gst_percent);
    if (evtFee.gst_apply_on) finalConfig.gstApplyOn = evtFee.gst_apply_on;
  }

  return finalConfig;
}

export function getFeeBreakdown(baseAmount, feeSettings = {}) {
  // Support all variants of naming
  const type = feeSettings.convenience_fee_type || feeSettings.convenienceFeeType || (feeSettings.fee_type === 'percentage' ? 'percent' : 'fixed') || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const feeVal = Number(feeSettings.convenience_fee_value ?? feeSettings.convenienceFeeValue ?? feeSettings.fee_value) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  const applyGst = feeSettings.apply_gst !== undefined ? !!feeSettings.apply_gst : (feeSettings.applyGst !== undefined ? !!feeSettings.applyGst : true);
  const gstPct = applyGst ? (Number(feeSettings.gst_percent ?? feeSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent) : 0;
  const partnerSharePct = Number(feeSettings.partner_share_percent ?? feeSettings.partnerSharePercent) || DEFAULT_FEE_SETTINGS.partnerSharePercent;
  const gstApplyOn = feeSettings.gst_apply_on ?? feeSettings.gstApplyOn ?? DEFAULT_FEE_SETTINGS.gstApplyOn;

  // Step 1: Platform Charge (Convenience Fee)
  let convenienceFee = baseAmount > 0 ? (type === 'fixed' ? feeVal : (baseAmount * feeVal) / 100) : 0;
  convenienceFee = Math.round(convenienceFee * 100) / 100; // Exact value to 2 decimal places

  // Step 2: GST Calculation
  let gst = 0;
  if (gstPct > 0) {
    if (gstApplyOn === 'ticket_only' || gstApplyOn === 'ticket') {
      gst = (baseAmount * gstPct) / 100;
    } else if (gstApplyOn === 'both') {
      gst = ((baseAmount + convenienceFee) * gstPct) / 100;
    } else {
      gst = (convenienceFee * gstPct) / 100;
    }
  }
  gst = Math.round(gst * 100) / 100; // Exact value to 2 decimal places
  
  // Step 3: Partner Share
  const partnerBonus = baseAmount > 0 ? (baseAmount * partnerSharePct) / 100 : 0;
  
  // Step 4: Final Totals (Keep decimals for exact value display)
  const preciseTotal = Number((baseAmount + convenienceFee + gst).toFixed(2));
  
  return {
    baseAmount,
    convenienceFee,
    gst,
    total: preciseTotal,
    paymentTotal: Math.round(preciseTotal), // Rounded for payment gateways
    partnerBonus,
    platformRevenue: Number((convenienceFee - partnerBonus).toFixed(2)),
    partnerTotal: Number((baseAmount + partnerBonus).toFixed(2)),
    gstPercent: gstPct,
    gstApplyOn
  };
}
