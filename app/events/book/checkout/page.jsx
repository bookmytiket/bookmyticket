"use client";
import React from 'react';
import CheckoutClient from '../../components/CheckoutClient';
import { useSearchParams } from 'next/navigation';

export default function EventCheckoutPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
    if (!id) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>Event ID is required</h2>
            </div>
        );
    }

    return <CheckoutClient id={id} />;
}
