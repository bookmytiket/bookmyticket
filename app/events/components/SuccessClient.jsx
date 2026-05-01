"use client";

import React, { useEffect, useState } from 'react';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { CheckCircle2, Home, Download, Share2, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import DigitalTicket from '@/components/DigitalTicket';
import confetti from 'canvas-confetti';

export default function SuccessClient({ eventId, bookingId }) {
    const [celebrated, setCelebrated] = useState(false);

    const { data: booking, loading: bookingLoading } = useSupabaseQuery('bookings', (q) => 
        q.eq('id', bookingId).single(),
        [bookingId]
    );

    const { data: ticket, loading: ticketLoading } = useSupabaseQuery('tickets', (q) => 
        q.eq('booking_id', bookingId).maybeSingle(),
        [bookingId]
    );

    useEffect(() => {
        if (!bookingLoading && !eventLoading && !ticketLoading && booking && event && !celebrated) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B']
            });
            setCelebrated(true);
        }
    }, [bookingLoading, eventLoading, ticketLoading, booking, event, celebrated]);

    if (bookingLoading || eventLoading || ticketLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-pink-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Generating your E-Ticket...</p>
            </div>
        );
    }

    if (!booking || !event) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle2 size={64} className="text-slate-200 mb-6" />
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Booking Confirmed</h2>
                <p className="text-slate-500 mt-2 mb-8">We found your booking, but couldn't load all details. Please check your email for the ticket.</p>
                <Link href="/" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Back to Home</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFCFB] pt-12 pb-24 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
                        Booking Successful!
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
                        Your spot is secured. Your digital ticket is ready below.
                    </p>
                </div>

                {/* Ticket Display */}
                <div className="mb-12">
                    <DigitalTicket 
                        booking={booking} 
                        event={event} 
                        ticket={ticket}
                        showDownload={true} 
                    />
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link href="/" className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all shadow-sm">
                        <Home size={16} /> Back to Dashboard
                    </Link>
                    <button 
                        onClick={() => window.print()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
                    >
                        <Download size={16} /> Print Ticket (PDF)
                    </button>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `My Ticket for ${event.title}`,
                                    text: `Check out my ticket for ${event.title}!`,
                                    url: window.location.href
                                });
                            }
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
                    >
                        <Share2 size={16} /> Share Ticket
                    </button>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Powered by BookMyTicket Secure Gateway</p>
                    <div className="flex justify-center gap-8 opacity-40">
                         <div className="flex items-center gap-2 text-[9px] font-bold text-slate-900"><TicketIcon size={12}/> Verified Ticket</div>
                         <div className="flex items-center gap-2 text-[9px] font-bold text-slate-900"><CheckCircle2 size={12}/> Entry Guaranteed</div>
                    </div>
                </div>
            </div>
        </main>
    );
}
