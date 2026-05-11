"use client";

import RequireAuth from "@/components/RequireAuth";

export default function OrganiserLayout({ children }) {
  // Staff are allowed into organiser panel (scanner etc)
  return <RequireAuth allowedRoles={["organiser", "staff", "admin", "super_admin", "system_admin"]}>{children}</RequireAuth>;
}

