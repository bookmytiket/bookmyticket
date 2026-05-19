"use client";
import React from 'react';
import CheckoutClient from '../../components/CheckoutClient';
import { useSearchParams } from 'next/navigation';

export default function EventCheckoutPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const sessionToken = searchParams.get('sessionToken');
    
    if (!id && !sessionToken) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>Checkout Session or Event ID is required</h2>
            </div>
        );
    }

    return (
        <React.Suspense fallback={
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin mx-auto" />
                <p style={{ marginTop: '20px', color: '#64748b', fontWeight: 'bold' }}>LOADING SECURE CHECKOUT...</p>
            </div>
        }>
            <CheckoutClient id={id} sessionToken={sessionToken} />
        </React.Suspense>
    );
}
