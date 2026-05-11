"use client";

import RequireAuth from "@/components/RequireAuth";

export default function AdminLayout({ children }) {
  return <RequireAuth allowedRoles={["admin", "super_admin", "system_admin"]}>{children}</RequireAuth>;
}
