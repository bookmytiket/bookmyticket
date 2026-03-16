"use client";

import RequireAuth from "@/components/RequireAuth";

export default function AdminLayout({ children }) {
  return <RequireAuth allowedRoles={["admin"]}>{children}</RequireAuth>;
}

