"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminCatchAll() {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    // If we're at /admin/some/path, take the last part as the tab
    const tab = segments[segments.length - 1];
    if (tab && tab !== 'admin') {
      router.replace(`/admin?tab=${tab}`);
    } else {
      router.replace("/admin");
    }
  }, [router, pathname]);
  
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Routing to Module...</p>
      </div>
    </div>
  );
}
