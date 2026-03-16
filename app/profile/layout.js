"use client";

import RequireAuth from "@/components/RequireAuth";

export default function ProfileLayout({ children }) {
  // Any authenticated user can view profile.
  return <RequireAuth>{children}</RequireAuth>;
}

