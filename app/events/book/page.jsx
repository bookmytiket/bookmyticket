"use client";
import React from 'react';
import EventBookClient from '../components/EventBookClient';
import { useSearchParams } from 'next/navigation';

export default function EventBookingPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
    if (!id) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>Event ID is required</h2>
            </div>
        );
    }

    return <EventBookClient id={id} />;
}
