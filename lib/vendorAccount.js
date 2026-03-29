/**
 * Convex vendor data keys bookings/profiles by organiser email (organisers.userId).
 * AuthContext stores that value on `identifier` for organisers; staff records use
 * `organiserId` pointing at the same key (see organiser panel `effectiveEmail`).
 */
export function getVendorAccountKey(user) {
  if (!user) return "";
  if (user.role === "staff") {
    return String(user.organiserId || "").trim();
  }
  return String(user.identifier || user.email || "").trim();
}
