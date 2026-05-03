/**
 * Shared Fee Breakdown Logic for Mobile (Expo)
 * Mirrors app/utils/feeBreakdown.js
 */

export const DEFAULT_FEE_SETTINGS = {
  convenienceFeeType: 'percent',
  convenienceFeeValue: 7, 
  gstPercent: 18,
  partnerSharePercent: 2,
  gstApplyOn: 'both',
};

export function resolveFeeSettings(systemSettings: any = {}, organiserConfig: any = {}, eventConfig: any = {}) {
  let finalConfig = {
    convenienceFeeType: systemSettings.convenienceFeeType || DEFAULT_FEE_SETTINGS.convenienceFeeType,
    convenienceFeeValue: (!isNaN(Number(systemSettings.convenienceFeeValue)) && systemSettings.convenienceFeeValue !== null && systemSettings.convenienceFeeValue !== undefined) ? Number(systemSettings.convenienceFeeValue) : DEFAULT_FEE_SETTINGS.convenienceFeeValue,
    gstPercent: (!isNaN(Number(systemSettings.gstPercent)) && systemSettings.gstPercent !== null && systemSettings.gstPercent !== undefined) ? Number(systemSettings.gstPercent) : DEFAULT_FEE_SETTINGS.gstPercent,
    gstApplyOn: systemSettings.gstApplyOn || systemSettings.gst_apply_on || DEFAULT_FEE_SETTINGS.gstApplyOn,
    applyGst: true
  };

  // Organiser Override (Check both flat and nested fee_config)
  const orgFee = organiserConfig?.fee_config || organiserConfig || {};
  const isOrgOverride = organiserConfig?.override_global || orgFee?.override_global;

  if (isOrgOverride) {
    if (orgFee.fee_type) finalConfig.convenienceFeeType = orgFee.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (orgFee.fee_value !== undefined && !isNaN(Number(orgFee.fee_value))) finalConfig.convenienceFeeValue = Number(orgFee.fee_value);
    if (orgFee.apply_gst !== undefined) finalConfig.applyGst = !!orgFee.apply_gst;
    if (orgFee.gst_percent !== undefined && !isNaN(Number(orgFee.gst_percent))) finalConfig.gstPercent = Number(orgFee.gst_percent);
    if (orgFee.gst_apply_on) finalConfig.gstApplyOn = orgFee.gst_apply_on;
  }

  // Event Override (highest priority)
  const evtFee = eventConfig?.fee_config || eventConfig || {};
  const isEvtOverride = eventConfig?.override_global || evtFee?.override_global;

  if (isEvtOverride) {
    if (evtFee.fee_type) finalConfig.convenienceFeeType = evtFee.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (evtFee.fee_value !== undefined && !isNaN(Number(evtFee.fee_value))) finalConfig.convenienceFeeValue = Number(evtFee.fee_value);
    if (evtFee.apply_gst !== undefined) finalConfig.applyGst = !!evtFee.apply_gst;
    if (evtFee.gst_percent !== undefined && !isNaN(Number(evtFee.gst_percent))) finalConfig.gstPercent = Number(evtFee.gst_percent);
    if (evtFee.gst_apply_on) finalConfig.gstApplyOn = evtFee.gst_apply_on;
  }

  return finalConfig;
}

export function getFeeBreakdown(baseAmount: number, feeSettings: any = {}, discountAmount: number = 0) {
  const safeBase = Number(baseAmount || 0);
  const safeDiscount = Number(discountAmount || 0);
  const discountedBase = Math.max(0, safeBase - safeDiscount);

  const type = feeSettings.convenience_fee_type || feeSettings.convenienceFeeType || (feeSettings.fee_type === 'percentage' ? 'percent' : 'fixed') || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const rawFeeVal = feeSettings.convenience_fee_value ?? feeSettings.convenienceFeeValue ?? feeSettings.fee_value;
  const feeVal = (!isNaN(Number(rawFeeVal)) && rawFeeVal !== null && rawFeeVal !== undefined) ? Number(rawFeeVal) : DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  
  const applyGst = feeSettings.apply_gst !== undefined ? !!feeSettings.apply_gst : (feeSettings.applyGst !== undefined ? !!feeSettings.applyGst : true);
  
  const rawGstPct = feeSettings.gst_percent ?? feeSettings.gstPercent;
  const gstPct = applyGst ? ((!isNaN(Number(rawGstPct)) && rawGstPct !== null && rawGstPct !== undefined) ? Number(rawGstPct) : DEFAULT_FEE_SETTINGS.gstPercent) : 0;
  
  const gstApplyOn = feeSettings.gst_apply_on ?? feeSettings.gstApplyOn ?? DEFAULT_FEE_SETTINGS.gstApplyOn;
  
  let convenienceFee = discountedBase > 0 ? (type === 'fixed' ? feeVal : (discountedBase * feeVal) / 100) : 0;
  convenienceFee = Math.round(convenienceFee * 100) / 100; // Round to 2 decimals
  
  let gst = 0;
  if (gstPct > 0) {
    if (gstApplyOn === 'ticket_only' || gstApplyOn === 'ticket') {
      gst = (discountedBase * gstPct) / 100;
    } else if (gstApplyOn === 'both') {
      gst = ((discountedBase + convenienceFee) * gstPct) / 100;
    } else {
      gst = (convenienceFee * gstPct) / 100;
    }
  }
  gst = Math.round(gst * 100) / 100; // Round to 2 decimals
  
  const preciseTotal = Number((discountedBase + convenienceFee + gst).toFixed(2));

  return {
    baseAmount: discountedBase,
    convenienceFee,
    gst,
    total: preciseTotal,
    paymentTotal: Math.round(preciseTotal),
    gstPercent: gstPct,
    gstApplyOn
  };
}
