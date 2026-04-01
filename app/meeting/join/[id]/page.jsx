"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import MeetingJoinClient from '@/components/MeetingJoinClient';

export default function MeetingJoinPage() {
    const params = useParams();
    const id = params.id;

    if (!id) {
        return (
            <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800">Invalid Meeting Link</h2>
                    <p className="text-slate-500">Missing event identifier.</p>
                </div>
            </div>
        );
    }

    return <MeetingJoinClient id={id} />;
}
