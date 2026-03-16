"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

function buildRedirectUrl(pathname, searchParams) {
  const qs = searchParams?.toString();
  const full = qs ? `${pathname}?${qs}` : pathname;
  return `/signin?redirect=${encodeURIComponent(full)}`;
}

export default function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allowed = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const role = user?.role;
    return !!role && allowedRoles.includes(role);
  }, [allowedRoles, user?.role]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(buildRedirectUrl(pathname, searchParams));
      return;
    }
    if (!allowed) {
      router.replace(buildRedirectUrl(pathname, searchParams));
    }
  }, [allowed, loading, pathname, router, searchParams, user]);

  if (loading) return null;
  if (!user) return null;
  if (!allowed) return null;

  return children;
}

