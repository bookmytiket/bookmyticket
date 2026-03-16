"use client";
import React, { use } from 'react';
import EventDetailClient from '../components/EventDetailClient';
import { useSearchParams } from 'next/navigation';

export default function EventDetailPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
    if (!id) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>Event ID is required</h2>
            </div>
        );
    }

    return <EventDetailClient id={id} />;
}
