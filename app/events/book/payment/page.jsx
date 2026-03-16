"use client";
import React from 'react';
import PaymentClient from '../../components/PaymentClient';
import { useSearchParams } from 'next/navigation';

export default function EventPaymentPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const bookingId = searchParams.get('bookingId');
    
    if (!id || !bookingId) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>Event ID and Booking ID are required</h2>
            </div>
        );
    }

    return <PaymentClient id={id} bookingId={bookingId} />;
}
