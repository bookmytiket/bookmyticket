"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

function buildRedirectUrl(pathname, searchParams) {
  const qs = searchParams?.toString();
  const full = qs ? `${pathname}?${qs}` : pathname;
  // If the path is branding related, send to branding signin
  if (pathname?.startsWith("/branding")) {
    return `/branding/signin?redirect=${encodeURIComponent(full)}`;
  }
  return `/signin?redirect=${encodeURIComponent(full)}`;
}

export default function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const [showRetry, setShowRetry] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Show a retry button if loading takes too long (e.g., 6 seconds)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowRetry(true), 6000);
      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [loading]);

  const allowed = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const role = user?.role;
    return !!role && allowedRoles.includes(role);
  }, [allowedRoles, user?.role]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const dest = buildRedirectUrl(pathname, searchParams);
      console.log(`[RequireAuth] No user found on ${pathname}. Redirecting to ${dest}`);
      router.replace(dest);
      return;
    }

    // SPECIAL CASE: Staff users are ONLY allowed on /scanner
    if (user.role === "staff" && pathname !== "/scanner") {
      console.log(`[RequireAuth] Staff user on ${pathname}. Redirecting to /scanner`);
      router.replace("/scanner");
      return;
    }

    // KYC CHECK FOR ORGANISERS: If not approved, must complete onboarding (Admins/Super Admins bypass this)
    const isAdmin = user.role === "admin" || user.role === "super_admin" || user.role === "system_admin";
    const kycStatus = (user.kyc_status || "").toLowerCase();
    const isKycApproved = [
      "approved", "active", "kyc completed", "kyc verified", "verified", "completed", "live", "pending", "submitted", "kyc_verified", "kyc_completed"
    ].includes(kycStatus) || user.is_approved === true || user.status?.toLowerCase() === 'active' || user.status?.toLowerCase() === 'approved';
    
    if (!isAdmin && user.role === "organiser" && !isKycApproved && !pathname.startsWith("/onboarding")) {
      console.log(`[RequireAuth] Organiser KYC not approved. Role: ${user.role}, Status: ${user.status}, KYC Status: ${user.kyc_status}. Redirecting to /onboarding`);
      router.replace("/onboarding");
      return;
    }

    if (!allowed) {
      router.replace(buildRedirectUrl(pathname, searchParams));
    }
  }, [allowed, loading, pathname, router, searchParams, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px]" />
        
        {/* Branded Loader */}
        <div className="relative z-10">
          <div className="relative w-20 h-20 mb-8 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-pink-500/20 border-t-pink-500" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-purple-500 [animation-duration:1.5s]" />
            <div className="absolute inset-3 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
              <span className="text-white font-black text-xl italic tracking-tighter">BT</span>
            </div>
          </div>
          
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">
            Authenticating <span className="text-pink-500">Access</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] ">
            Establishing Secure Handshake...
          </p>

          {showRetry && (
            <div className="mt-12    ">
              <p className="text-slate-600 text-xs mb-4 max-w-[240px] mx-auto leading-relaxed">
                Connection taking longer than expected. This can happen on first-load cold starts.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95"
              >
                Manual Retry
              </button>
            </div>
          )}
        </div>

        {/* CSS Animation fix for spin speed */}
        <style jsx>{`
          .animate-spin-slow { animation: none; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user || !allowed) return null;

  return children;
}

