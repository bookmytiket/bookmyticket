/**
 * Compute ticket total: base + convenience fee + GST.
 * Organiser wallet is credited only baseAmount (not fee or GST).
 * Fee settings come from admin (localStorage admin_fee_settings).
 */
export const DEFAULT_FEE_SETTINGS = {
  convenienceFeeType: 'percent',
  convenienceFeeValue: 5,
  gstPercent: 18,
};

export function getFeeBreakdown(baseAmount, feeSettings = {}) {
  const type = feeSettings.convenienceFeeType || DEFAULT_FEE_SETTINGS.convenienceFeeType;
  const feeVal = Number(feeSettings.convenienceFeeValue) ?? DEFAULT_FEE_SETTINGS.convenienceFeeValue;
  const gstPct = Number(feeSettings.gstPercent) ?? DEFAULT_FEE_SETTINGS.gstPercent;

  const convenienceFee = type === 'fixed' ? feeVal : (baseAmount * feeVal) / 100;
  const afterConvenience = baseAmount + convenienceFee;
  const gst = (afterConvenience * gstPct) / 100;
  const total = baseAmount + convenienceFee + gst;

  return {
    baseAmount,
    convenienceFee,
    gst,
    total,
    gstPercent: gstPct,
  };
}
