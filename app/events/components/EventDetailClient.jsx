"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Languages,
    ShieldCheck,
    Armchair,
    CheckCircle,
    Warehouse,
    Info,
    ChevronDown,
    Star,
    Share2,
    Heart,
    Video,
    Lock,
    ExternalLink,
    Play,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import { isVirtualEvent } from '@/app/utils/eventUtils';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';
const DEFAULT_FEATURES = [
    { icon: '🛡️', label: 'All safety measures enabled' },
    { icon: '🪑', label: 'Seating (FCFS)' },
    { icon: '✓', label: 'Mandatory Check-In' },
    { icon: '🏛️', label: 'Indoor Event' },
];
const DEFAULT_REFUND = ['Organizer-Managed Cancellations', 'No Refund for Missed Events', 'Event Cancellations or Postponements'];

export default function EventDetailClient({ id }) {
    const { user } = useAuth();
    const router = useRouter();
    const { data: convexEvents } = useSupabaseQuery('events', (q) => q.or('status.eq.published,status.eq.Active'), []);
    const [storageLoaded, setStorageLoaded] = useState(false);

    // Fetch user bookings to check if they've already booked this event
    const { data: userBookings } = useSupabaseQuery('bookings', (q) => 
        q.eq('user_id', user?.id),
        [user?.id],
        { enabled: !!user?.id }
    );
    
    // Check if this specific event is already booked by the user
    const existingBooking = useMemo(() => {
        if (!userBookings || !id) return null;
        return userBookings.find(b => String(b.event_id) === String(id));
    }, [userBookings, id]);

    useEffect(() => {
        setStorageLoaded(true);
    }, []);

    const event = useMemo(() => {
        if (!convexEvents) return null;
        const fromHome = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).find(e => String(e.id) === id);
        const fromConvex = (Array.isArray(convexEvents) ? convexEvents : []).find(e => String(e.id) === id);
        const raw = fromHome || fromConvex;
        if (!raw) return null;
        const location = raw.location || raw.venue || raw.address || 'Venue';
        const city = raw.city || (location && location.split(',')[0]?.trim()) || '—';
        const venue = raw.venue || raw.location || location;
        return {
            ...raw,
            id: raw._id || raw.id,
            img: raw.img || raw.bannerPreview || DEFAULT_IMG,
            title: raw.title || 'Event',
            date: raw.date || 'TBA',
            time: raw.time || '',
            location,
            venue,
            city: raw.city || city,
            category: raw.category || 'Event',
            ageLimit: raw.ageLimit || 'All ages',
            language: raw.language || 'English',
            description: raw.description || 'Join us for this event. Book your tickets now.',
            features: Array.isArray(raw.features) && raw.features.length > 0 ? raw.features : DEFAULT_FEATURES,
            refundPolicy: Array.isArray(raw.refundPolicy) && raw.refundPolicy.length > 0 ? raw.refundPolicy : DEFAULT_REFUND,
            parking: raw.parking || 'Paid Parking Available at the Venue.',
            tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : [raw.category || 'Event'].filter(Boolean),
        };
    }, [id, convexEvents]);

    useEffect(() => {
        if (!event || typeof window === 'undefined') return;
        try {
            const key = 'recently_viewed_events';
            const raw = localStorage.getItem(key);
            const list = raw ? JSON.parse(raw) : [];
            const item = { id: event.id, title: event.title, img: event.img, date: event.date, location: event.location, type: event.type || 'Paid' };
            const filtered = list.filter((e) => String(e.id) !== String(event.id));
            const next = [item, ...filtered].slice(0, 12);
            localStorage.setItem(key, JSON.stringify(next));
        } catch (_) { }
    }, [event]);

    if (!event) {
        if (convexEvents === undefined || !storageLoaded) {
            return (
                <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '150px', textAlign: 'center' }}>
                    <div className="container">
                        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading event details…</p>
                    </div>
                </main>
            );
        }
        return (
            <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '150px', textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>Event Not Found</h2>
                    <p style={{ color: '#6b7280', marginTop: '10px' }}>The event you are looking for does not exist or has been removed.</p>
                    <Link href="/">
                        <button style={{ marginTop: '20px', padding: '12px 24px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                            Back to Home
                        </button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#fafbfc] pt-[40px] md:pt-[60px] pb-24">
            <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-4">
                
                {/* Compact High Impact Wide Banner Card */}
                <div className="w-full h-[200px] md:h-[350px] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-xl relative mb-4 border-2 border-white group">
                    <img src={event.img || DEFAULT_IMG} className="absolute inset-0 w-full h-full object-cover transition-transform  group-hover:scale-105" alt={event.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="max-w-[1200px] mx-auto w-full">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg">
                                        {event.category || 'Event'}
                                    </span>
                                </div>
                                <h1 className="text-white text-[32px] md:text-[64px] font-bold uppercase tracking-tight leading-tight mt-2 drop-shadow-2xl">
                                    {event.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-white/90 mt-4 font-bold uppercase text-[13px] tracking-wide">
                                    <div className="flex items-center gap-2"><MapPin size={18} className="text-pink-400" /> {event.venue}, {event.city}</div>
                                    <div className="w-1.5 h-1.5 bg-white/30 rounded-full hidden md:block" />
                                    <div className="flex items-center gap-2"><Calendar size={18} className="text-pink-400" /> {event.date} | {event.time || "6:30 PM"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Link 
                        href="/"
                        className="absolute top-8 left-8 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </Link>
                </div>

                {/* Info Bar below Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-2">
                    <div className="flex flex-wrap items-center gap-8 text-[14px] font-bold text-slate-500 uppercase tracking-tight">
                        <div className="flex items-center gap-3"><Clock size={18} className="text-slate-400" /> Duration 2 hr</div>
                        <div className="flex items-center gap-3"><Users size={18} className="text-slate-400" /> {event.ageLimit || "All age groups"}</div>
                        <div className="flex items-center gap-3"><Languages size={18} className="text-slate-400" /> {event.language || "Tamil"}</div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight"><Share2 size={18} /> Share</button>
                        <button className="flex items-center gap-2 text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight"><Heart size={18} /> Wishlist</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left: Event Information */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="px-6 py-2 bg-slate-900 text-white text-[12px] font-bold uppercase tracking-widest rounded-2xl">
                                    {event.category || 'Concert'}
                                </span>
                                <span className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[12px] font-bold uppercase tracking-widest rounded-2xl shadow-lg">
                                    Recommended
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 md:p-14 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-bl-full -z-0" />
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-[#111827] uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <Info className="text-pink-500" size={28} /> About the Event
                                </h3>
                                <p className="text-[17px] font-medium text-slate-600 leading-relaxed whitespace-pre-line mb-12">
                                    {event.description}
                                </p>
                                
                                <hr className="border-slate-100 mb-12" />
                                
                                <h3 className="text-2xl font-bold text-[#111827] uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <Warehouse className="text-pink-500" size={28} /> Venue & Comforts
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                                    {event.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md shrink-0 text-2xl">
                                                {feature.icon || "✓"}
                                            </div>
                                            <span className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">{feature.label || feature}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-12 pt-12 border-t border-slate-100">
                                    <h3 className="text-2xl font-bold text-[#111827] uppercase tracking-tight mb-8 flex items-center gap-3">
                                        <CheckCircle className="text-pink-500" size={28} /> Things to Know
                                    </h3>
                                    <ul className="space-y-6">
                                        {event.refundPolicy.map((rule, idx) => (
                                            <li key={idx} className="flex items-start gap-5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0 mt-2.5 shadow-lg shadow-pink-500/40"></div>
                                                <span className="text-[16px] font-medium text-slate-500 leading-relaxed">{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Premium Booking Widget */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-8 sticky top-[120px]">
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl p-10 pb-12">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Starting from</div>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tight">₹{event.price || "950"}<span className="text-sm font-bold text-slate-400 ml-1 tracking-tight">onwards</span></div>
                                </div>
                                <div className="px-4 py-2 bg-green-50 text-green-600 text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2 border border-green-100">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full " /> Selling Fast
                                </div>
                            </div>
                            
                            {existingBooking ? (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-center gap-3 p-6 bg-green-50 border border-green-100 rounded-[32px]">
                                        <CheckCircle2 size={24} className="text-green-500" />
                                        <span className="text-[16px] font-bold text-green-700 uppercase tracking-tight">Ticket Booked!</span>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/bookings')}
                                        className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-bold uppercase tracking-widest text-[14px] hover:bg-black transition-all shadow-lg"
                                    >
                                        View My Tickets
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const bookUrl = `/events/book?id=${id}`;
                                        if (!user) router.push(`/signin?redirect=${encodeURIComponent(bookUrl)}`);
                                        else router.push(bookUrl);
                                    }}
                                    className="w-full py-7 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[32px] font-bold uppercase tracking-[0.3em] text-[15px] shadow-2xl shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {event.price === 0 ? "Get Free Ticket" : "Book Now"}
                                </button>
                            )}

                            <div className="mt-10 flex flex-col items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest italic text-center">
                                <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Instant Confirmation</div>
                                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> Secure Checkout</div>
                            </div>
                        </div>

                        {/* Organized By Card */}
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-lg p-10">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8 italic">Organized By</h4>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-white shadow-lg">
                                    <Warehouse size={32} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-900 uppercase tracking-tight leading-tight">Motta Maadi Music</div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Loved by event-goers</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
