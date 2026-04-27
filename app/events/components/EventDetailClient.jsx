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
        user?.id ? q.eq('user_id', user.id) : q.eq('user_id', 'none'),
        [user?.id]
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
            <div className="max-w-[1240px] mx-auto px-6 py-4">
                
                {/* High Impact Banner Card */}
                <div className="w-full h-[400px] md:h-[520px] rounded-[48px] overflow-hidden shadow-2xl relative mb-12 border-4 border-white group">
                    <img src={event.img || DEFAULT_IMG} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={event.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Share/Wishlist Floating Buttons */}
                    <div className="absolute top-8 right-8 flex gap-3 z-30">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[12px] font-black uppercase hover:bg-white hover:text-slate-900 transition-all shadow-lg"><Share2 size={16} /> Share</button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[12px] font-black uppercase hover:bg-white hover:text-slate-900 transition-all shadow-lg"><Heart size={16} /> Wishlist</button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="max-w-[1200px] mx-auto w-full">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                        {event.category || 'Event'}
                                    </span>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[12px] font-black uppercase italic">
                                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                        <span>4.9 (24 Reviews)</span>
                                    </div>
                                </div>
                                <h1 className="text-white text-[40px] md:text-[72px] font-black uppercase italic tracking-tighter leading-none mt-2 drop-shadow-2xl">
                                    {event.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-white/90 mt-4 font-black uppercase italic text-[14px] tracking-tight">
                                    <div className="flex items-center gap-2"><Calendar size={18} className="text-pink-400" /> {event.date}</div>
                                    <div className="w-1.5 h-1.5 bg-white/30 rounded-full hidden md:block" />
                                    <div className="flex items-center gap-2"><Clock size={18} className="text-pink-400" /> {event.time || "6:30 PM Onwards"}</div>
                                    <div className="w-1.5 h-1.5 bg-white/30 rounded-full hidden md:block" />
                                    <div className="flex items-center gap-2"><MapPin size={18} className="text-pink-400" /> {event.venue}, {event.city}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.back()}
                        className="absolute top-8 left-8 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left: Event Information */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
                        
                        <div className="flex items-center justify-center space-x-3 border-none bg-gradient-to-r from-pink-500/10 to-purple-600/10 px-8 py-4 rounded-[32px] border border-pink-500/20 shadow-sm w-full">
                            <span className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Safe & Secure Booking</span>
                            <ShieldCheck className="text-pink-500" size={24} />
                        </div>

                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-bl-full -z-0" />
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-[#111827] uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                                    <Info className="text-pink-500" /> About the Event
                                </h3>
                                <p className="text-[16px] font-medium text-slate-600 leading-relaxed whitespace-pre-line mb-10">
                                    {event.description}
                                </p>
                                
                                <hr className="border-slate-100 mb-10" />
                                
                                <h3 className="text-2xl font-black text-[#111827] uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                                    <Warehouse className="text-pink-500" /> Venue & Comforts
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                    {event.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm shrink-0 text-xl">
                                                {feature.icon || "✓"}
                                            </div>
                                            <span className="text-[14px] font-black text-slate-900 uppercase italic tracking-tight">{feature.label || feature}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-10 pt-10 border-t border-slate-100">
                                    <h3 className="text-2xl font-black text-[#111827] uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                                        <CheckCircle className="text-pink-500" /> Things to Know
                                    </h3>
                                    <ul className="space-y-4">
                                        {event.refundPolicy.map((rule, idx) => (
                                            <li key={idx} className="flex items-start gap-4">
                                                <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-2.5"></div>
                                                <span className="text-[14px] font-medium text-slate-500 leading-relaxed">{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Premium Booking Widget */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-[120px]">
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 pb-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Starting from</div>
                                    <div className="text-3xl font-black text-slate-900 tracking-tighter italic">₹{event.price || "950"}<span className="text-sm font-bold text-slate-400 not-italic ml-1">onwards</span></div>
                                </div>
                                <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Selling Fast
                                </div>
                            </div>
                            
                            {existingBooking ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2 p-5 bg-green-50 border border-green-100 rounded-2xl">
                                        <CheckCircle2 size={20} className="text-green-500" />
                                        <span className="text-[15px] font-black text-green-700 italic uppercase tracking-tight">Ticket Booked!</span>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/bookings')}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[13px] hover:bg-black transition-all"
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
                                    className="w-full py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {event.price === 0 ? "Get Free Ticket" : "Book Now"}
                                </button>
                            )}

                            <div className="mt-8 flex flex-col items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">
                                <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Instant Confirmation</div>
                                <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-500" /> Secure Checkout</div>
                            </div>
                        </div>

                        {/* Organized By Card */}
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Organized By</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                    <Warehouse size={28} />
                                </div>
                                <div>
                                    <div className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-tight">Motta Maadi Music</div>
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loved by event-goers</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
