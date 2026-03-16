"use client";

import RequireAuth from "@/components/RequireAuth";

export default function AdvertisePaymentLayout({ children }) {
  // Payment route should not be accessible without authentication.
  return <RequireAuth>{children}</RequireAuth>;
}

