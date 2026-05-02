"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const nextUrl = searchParams.get("next") || "/";

    useEffect(() => {
        if (!authLoading && user) {
            // Determine final destination
            let dest = nextUrl;
            
            const role = user.role?.toLowerCase();

            // USER SPECIFIC OVERRIDES (MANDATORY)
            // 2. Normal users from events page go to profile
            if ((role === 'public' || role === 'user') && dest?.includes('/events')) {
                dest = "/profile";
            }
            // 3. Role-based defaults for home/profile redirects
            else if (dest === "/" || dest === "/profile") {
                if (role === "admin" || role === "super_admin") dest = "/admin";
                else if (role === "staff") dest = "/pwa-scan";
                else if (role === "vendor") dest = "/vendor/dashboard";
                else if (role === "organiser" || role === "organizer") dest = "/organiser";
                else dest = "/profile";
            }
            
            console.log("AuthCallback: Redirecting to", dest);
            router.replace(dest);
        }
    }, [user, authLoading, router, nextUrl]);

    // Fallback timer if auth seems stuck
    useEffect(() => {
        const timer = setTimeout(() => {
            if (authLoading) {
                console.warn("AuthCallback: Auth still loading after 5s, forcing redirect to", nextUrl);
                router.replace(nextUrl);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [authLoading, nextUrl, router]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '4px solid #f43f5e', 
                    borderTopColor: 'transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite', 
                    margin: '0 auto 16px' 
                }} />
                <h2 style={{ color: '#1e293b', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Authenticating...</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Please wait while we complete your login.</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #f43f5e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <h2 style={{ color: '#1e293b', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Loading...</h2>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
