export const API_VERSION = "v1";
export const MIN_MOBILE_APP_VERSION = "1.0.0";

export const SYNC_TABLES = [
  "events",
  "bookings",
  "booking_items",
  "payments",
  "tickets",
  "seat_inventory",
  "general_inventory",
  "wallets",
  "wallet_transactions",
  "notifications",
  "feature_flags",
  "coupons",
  "partner_campaigns",
  "coupon_usage",
  "ticket_scan_logs",
  "staff_validation_logs"
];

export const FEATURE_FLAGS = {
  multiShowBooking: "multi_show_booking",
  couponEngine: "coupon_engine",
  staffVerification: "staff_verification",
  generalEvents: "general_events",
  partnerRewards: "partner_rewards",
  qrTickets: "qr_tickets",
  unifiedRealtime: "unified_realtime",
  offlineQueue: "offline_queue"
};

export function ok(data, meta = {}) {
  return {
    ok: true,
    apiVersion: API_VERSION,
    serverTime: new Date().toISOString(),
    data,
    meta
  };
}

export function fail(message, code = "request_failed", details = null) {
  return {
    ok: false,
    apiVersion: API_VERSION,
    serverTime: new Date().toISOString(),
    error: { code, message, details }
  };
}

export function normalizeBooking(row) {
  if (!row) return null;
  const paymentStatus = row.payment_status || (row.status === "Confirmed" ? "paid" : "pending");
  const bookingStatus = row.booking_status || row.status || "Pending";

  return {
    ...row,
    payment_status: paymentStatus,
    booking_status: bookingStatus,
    status: bookingStatus,
    ticket_count: row.ticket_count || row.quantity || 1,
    booking_ref: row.booking_ref || (row.id ? String(row.id).slice(-8).toUpperCase() : null)
  };
}

export function normalizeNotification(row) {
  if (!row) return null;
  return {
    ...row,
    message: row.message || row.body || "",
    body: row.body || row.message || "",
    is_read: row.is_read ?? row.status === "read"
  };
}

export function platformMatches(scope, platform) {
  if (!scope || scope === "all") return true;
  if (Array.isArray(scope)) return scope.includes(platform) || scope.includes("all");
  return String(scope).split(",").map((item) => item.trim()).includes(platform);
}
