"use client";
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SuccessClient from '../../components/SuccessClient';

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const bookingId = searchParams.get('bookingId');

    if (!id || !bookingId) {
        return (
            <div style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>Invalid Success Link</h2>
                <p>Missing booking or event information.</p>
            </div>
        );
    }

    return <SuccessClient eventId={id} bookingId={bookingId} />;
}

export default function EventSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading confirmation...</div>}>
            <SuccessPageContent />
        </Suspense>
    );
}
