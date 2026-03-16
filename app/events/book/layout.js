"use client";

import RequireAuth from "@/components/RequireAuth";

export default function EventsBookLayout({ children }) {
  // Booking requires a logged-in user (any role is ok for now).
  return <RequireAuth>{children}</RequireAuth>;
}

