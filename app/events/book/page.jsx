"use client";
import React, { useEffect } from 'react';
import EventBookClient from '../components/EventBookClient';
import { useSearchParams, useRouter } from 'next/navigation';
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

    return <EventBookClient id={id} />;
}
