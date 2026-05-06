"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MapsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Determine the base URL for redirection
    const isLocal = window.location.hostname === 'localhost';
    const redirectUrl = isLocal ? '/' : 'https://www.bookmyticket.net';
    
    // Perform the redirect to the home page
    router.replace(redirectUrl);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#f84464] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-slate-400">Redirecting to Home...</p>
      </div>
    </div>
  );
}
