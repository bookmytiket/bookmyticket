"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next") || "/";

    useEffect(() => {
        // Supabase client-side JS automatically handles the OAuth code/token in the URL.
        // We listen for the SIGNED_IN event or check if the session exists, then redirect.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace(nextUrl);
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" || session) {
                router.replace(nextUrl);
            }
        });

        // Fallback: If no event fires within 3 seconds, redirect to home.
        const timer = setTimeout(() => {
            router.replace(nextUrl);
        }, 3000);

        return () => {
            authListener?.subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [router, nextUrl]);

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
