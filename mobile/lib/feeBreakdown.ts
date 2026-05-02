/**
 * Shared Fee Breakdown Logic for Mobile (Expo)
 * Mirrors app/utils/feeBreakdown.js
 */

export const DEFAULT_FEE_SETTINGS = {
  convenienceFeeType: 'percent',
  convenienceFeeValue: 7, 
  gstPercent: 18,
  partnerSharePercent: 2,
};

export function resolveFeeSettings(systemSettings: any = {}, organiserConfig: any = {}, eventConfig: any = {}) {
  let finalConfig = {
    convenienceFeeType: systemSettings.convenienceFeeType || DEFAULT_FEE_SETTINGS.convenienceFeeType,
    convenienceFeeValue: Number(systemSettings.convenienceFeeValue) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue,
    gstPercent: Number(systemSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent,
    gstApplyOn: systemSettings.gstApplyOn || systemSettings.gst_apply_on || 'fee_only',
    applyGst: true
  };

  if (organiserConfig?.override_global) {
    if (organiserConfig.fee_type) finalConfig.convenienceFeeType = organiserConfig.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (organiserConfig.fee_value !== undefined) finalConfig.convenienceFeeValue = Number(organiserConfig.fee_value);
    if (organiserConfig.apply_gst !== undefined) finalConfig.applyGst = !!organiserConfig.apply_gst;
    if (organiserConfig.gst_percent !== undefined) finalConfig.gstPercent = Number(organiserConfig.gst_percent);
    if (organiserConfig.gst_apply_on) finalConfig.gstApplyOn = organiserConfig.gst_apply_on;
  }

  if (eventConfig?.override_global) {
    if (eventConfig.fee_type) finalConfig.convenienceFeeType = eventConfig.fee_type === 'percentage' ? 'percent' : 'fixed';
    if (eventConfig.fee_value !== undefined) finalConfig.convenienceFeeValue = Number(eventConfig.fee_value);
    if (eventConfig.apply_gst !== undefined) finalConfig.applyGst = !!eventConfig.apply_gst;
    if (eventConfig.gst_percent !== undefined) finalConfig.gstPercent = Number(eventConfig.gst_percent);
    if (eventConfig.gst_apply_on) finalConfig.gstApplyOn = eventConfig.gst_apply_on;
  }

  return finalConfig;
}

export function getFeeBreakdown(baseAmount: number, feeSettings: any = {}) {
  const type = feeSettings.convenience_fee_type || feeSettings.convenienceFeeType || (feeSettings.fee_type === 'percentage' ? 'percent' : 'fixed') || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const feeVal = Number(feeSettings.convenience_fee_value ?? feeSettings.convenienceFeeValue ?? feeSettings.fee_value) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  const applyGst = feeSettings.apply_gst !== undefined ? feeSettings.apply_gst : (feeSettings.applyGst !== undefined ? feeSettings.applyGst : true);
  const gstPct = applyGst ? (Number(feeSettings.gst_percent ?? feeSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent) : 0;
  const gstApplyOn = feeSettings.gst_apply_on ?? feeSettings.gstApplyOn ?? 'fee_only';
  
  const convenienceFee = baseAmount > 0 ? (type === 'fixed' ? feeVal : (baseAmount * feeVal) / 100) : 0;
  
  let gst = 0;
  if (gstPct > 0) {
    if (gstApplyOn === 'ticket_only') {
      gst = (baseAmount * gstPct) / 100;
    } else if (gstApplyOn === 'both') {
      gst = ((baseAmount + convenienceFee) * gstPct) / 100;
    } else {
      gst = (convenienceFee * gstPct) / 100;
    }
  }
  
  const total = baseAmount + convenienceFee + gst;

  return {
    baseAmount,
    convenienceFee,
    gst,
    total,
    gstPercent: gstPct,
    gstApplyOn
  };
}
