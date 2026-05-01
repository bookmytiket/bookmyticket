"use client";
import React, { useEffect, useState } from 'react';
import EventBookClient from '../components/EventBookClient';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function EventBookingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading } = useAuth();
    const id = searchParams.get('id');
    
    useEffect(() => {
        if (!loading && !user && typeof window !== 'undefined') {
            const currentUrl = window.location.pathname + window.location.search;
            router.push(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 600 }}>Authenticating...</p>
            </div>
        );
    }

    if (!user) return null;

    if (!id) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>Event ID is required</h2>
                <p style={{ color: '#64748b', marginTop: '8px' }}>Please select an event from the home page.</p>
            </div>
        );
    }

    const error = searchParams.get('error');
    const [showError, setShowError] = useState(!!error);

    return (
        <>
            {showError && error === 'payment_failed' && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-rose-50 border border-rose-100 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <CheckCircle2 size={20} className="rotate-45" /> 
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Payment Declined</h4>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Transaction could not be completed. Please try again.</p>
                    </div>
                    <button onClick={() => setShowError(false)} className="ml-4 text-slate-400 hover:text-slate-900 transition-colors font-black text-xs">✕</button>
                </div>
            )}
            <EventBookClient id={id} />
        </>
    );
}
