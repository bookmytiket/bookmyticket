"use client";
import DynamicBadge from '@/components/DynamicBadge';

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
    Play,
    CheckCircle2
} from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

/* ── Helpers ── */
function parseEventDate(dateStr, timeStr) {
    if (!dateStr) return null;
    try {
        let dt = String(dateStr).trim();
        if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
            const p = dt.split(/[-/]/);
            dt = `${p[2]}-${p[1]}-${p[0]}`;
        }
        const nd = dt.includes(' ') && !dt.includes('T') ? dt.replace(' ', 'T') : dt;
        let nt = '23:59';
        if (timeStr) {
            const t = String(timeStr).trim().toUpperCase();
            const m = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
            if (m) {
                let h = parseInt(m[1]), mn = m[2] || '00', ap = m[3];
                if (ap === 'PM' && h < 12) h += 12;
                if (ap === 'AM' && h === 12) h = 0;
                nt = `${String(h).padStart(2,'0')}:${mn}`;
            } else nt = t.includes(':') ? t : `${t}:00`;
        }
        const d = new Date(`${nd}T${nt}`);
        return isNaN(d.getTime()) ? null : d;
    } catch (_) { return null; }
}

/* ── Expired Event Page ── */
function EventExpiredPage({ event, router }) {
    return (
        <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#fff5f5 0%,#fdf2f8 50%,#f5f3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
                {/* Animated clock icon */}
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg,#fee2e2,#fecaca)', border: '3px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 32px rgba(239,68,68,0.2)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" stroke="#dc2626" strokeWidth="2" />
                        <line x1="19.07" y1="4.93" x2="16.24" y2="7.76" stroke="#dc2626" strokeWidth="2" />
                    </svg>
                </div>

                <div style={{ background: '#ef4444', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
                    ⏰ Event Expired
                </div>

                <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 12px', lineHeight: 1.2 }}>
                    {event?.title || 'This Event'}
                </h1>
                <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.7, margin: '0 0 8px' }}>
                    This event has already taken place and is no longer accepting bookings.
                </p>
                {event?.date && <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600, margin: '0 0 32px' }}>Was scheduled for <strong style={{ color: '#374151' }}>{event.date}</strong></p>}

                {/* Info chips */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
                    {['🎫 Tickets Closed', '🔒 Booking Ended', '📅 Date Passed'].map(t => (
                        <span key={t} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '100px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>{t}</span>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => router.push('/events')}
                        style={{ padding: '14px 32px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#f84464,#c026d3)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(248,68,100,0.3)' }}>
                        Browse Upcoming Events
                    </button>
                    <button onClick={() => router.back()}
                        style={{ padding: '14px 24px', borderRadius: '14px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                        Go Back
                    </button>
                </div>
            </div>
        </main>
    );
}

/* ── Deleted Event Page ── */
function EventDeletedPage({ router }) {
    return (
        <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#fafafa 0%,#f1f5f9 50%,#f5f3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
                {/* Trash icon */}
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '3px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 32px rgba(245,158,11,0.2)' }}>
                    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" /><path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                </div>

                <div style={{ background: '#f59e0b', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
                    🗑️ Removed by Organiser
                </div>

                <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 12px', lineHeight: 1.2 }}>
                    Event No Longer Available
                </h1>
                <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.7, margin: '0 0 8px' }}>
                    This event has been removed or deleted by the organiser. It is no longer available for booking.
                </p>
                <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600, margin: '0 0 32px' }}>
                    If you had a booking for this event, please contact the organiser or our support team.
                </p>

                {/* Info chips */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
                    {['🚫 Event Removed', '📞 Contact Support', '🔍 Find Alternatives'].map(t => (
                        <span key={t} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '100px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>{t}</span>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => router.push('/events')}
                        style={{ padding: '14px 32px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#f84464,#c026d3)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(248,68,100,0.3)' }}>
                        Browse Events
                    </button>
                    <Link href="/support" style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '14px 24px', borderRadius: '14px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                            Contact Support
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
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

    const { data: userBookings } = useSupabaseQuery('bookings', (q) => 
        q.eq('user_id', user?.id),
        [user?.id],
        { enabled: !!user?.id }
    );
    
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
            dateSlots: raw.dateSlots || [],
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

    /* ── Check expired (event found but date passed) ── */
    const eventDate = event ? parseEventDate(event.rawDate || event.date, event.rawTime || event.time) : null;
    const isExpired = eventDate ? eventDate < new Date() : false;

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
        // Event not found in DB → deleted by organiser
        return <EventDeletedPage router={router} />;
    }

    if (isExpired) {
        return <EventExpiredPage event={event} router={router} />;
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
                                </div>
                                <h1 className="text-white text-[32px] md:text-[64px] font-bold uppercase tracking-tight leading-tight mt-2 drop-shadow-2xl">
                                    {event.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-white/90 mt-4 font-bold uppercase text-[13px] tracking-wide">
                                    <div className="flex items-center gap-2"><Calendar size={18} className="text-pink-400" /> {event.date} | {event.time || "6:30 PM"}</div>
                                    {event.dateSlots?.length > 1 && (
                                        <>
                                            <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                                            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-300">
                                                {event.dateSlots.length} Dates Available
                                            </div>
                                        </>
                                    )}
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
                            </div>
                        </div>

                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 md:p-14 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-bl-full -z-0" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold text-[#111827] uppercase tracking-tight m-0 flex items-center gap-3">
                                        <Info className="text-pink-500" size={28} /> About the Event
                                    </h3>
                                    <DynamicBadge size="large" />
                                </div>
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
                                <div className="min-w-0">
                                    <div className="text-lg font-bold text-slate-900 uppercase tracking-tight leading-tight truncate">Motta Maadi Music</div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Loved by event-goers</div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>

                </div>

                {/* --- SEO ENHANCEMENT SECTION --- */}
                <div className="mt-20 border-t border-slate-100 pt-20">
                    <div className="max-w-[900px] mx-auto text-slate-600">
                        <h2 className="text-3xl font-bold text-slate-900 mb-8 uppercase tracking-tight">Your Complete Guide to Booking {event.title} on BookMyTicket</h2>
                        
                        <div className="prose prose-slate max-w-none space-y-6 text-[16px] leading-relaxed">
                            <p>
                                Looking for <strong>online event registration</strong> for <strong>{event.title}</strong>? You've come to the right place. BookMyTicket is India's most trusted <strong>premium event booking</strong> platform for securing your spot at the biggest events in <strong>{event.city || event.location}</strong>. Whether you're looking for <strong>music festival passes</strong>, <strong>live sports tickets</strong>, or <strong>workshop and seminar tickets</strong>, our seamless booking experience ensures you get your tickets in under 60 seconds.
                            </p>

                            <h3 className="text-xl font-bold text-slate-800 mt-10">Why Book {event.title} Tickets Online?</h3>
                            <p>
                                Booking your tickets for {event.title} online offers numerous advantages. Our <strong>secure checkout ticketing</strong> system uses state-of-the-art encryption to keep your payment details secure, and our instant e-ticket system means you'll have your entry pass on your phone immediately after purchase. BookMyTicket offers exclusive early-bird discounts and partner offers that you won't find anywhere else.
                            </p>

                            <h3 className="text-xl font-bold text-slate-800 mt-10">Event Details & What to Expect</h3>
                            <p>
                                {event.title} is scheduled to take place on <strong>{event.date}</strong> at <strong>{event.venue || event.location}</strong>. As one of the most anticipated {event.category} events of the year, it is expected to draw a significant crowd from across {event.city || "the region"}. 
                                {event.description.length < 200 && (
                                    <span> This event promises an unforgettable experience featuring top-tier talent and high-production value. Attendees can expect a well-organized environment with all necessary amenities provided at the venue.</span>
                                )}
                            </p>

                            <h3 className="text-xl font-bold text-slate-800 mt-10">How to Prepare for the Event</h3>
                            <ul className="list-disc pl-5 space-y-3">
                                <li><strong>Arrival Time:</strong> We recommend arriving at {event.venue || "the venue"} at least 30-45 minutes before the scheduled start time of {event.time || "the event"}. This allows for smooth security checks and finding your seat.</li>
                                <li><strong>Digital Tickets:</strong> Ensure your phone is fully charged. Your BookMyTicket QR code will be scanned at the entry. You can also find your ticket in the 'My Bookings' section of our app.</li>
                                <li><strong>Venue Rules:</strong> Please adhere to the venue guidelines. Most events prohibit outside food and beverages. Follow the instructions provided by the ground staff for a pleasant experience.</li>
                                <li><strong>Parking:</strong> {event.parking || "Check local parking options near the venue."} We suggest using public transport or ride-sharing services for large-scale events to avoid traffic congestion.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-slate-800 mt-10">Our Commitment to Your Safety</h3>
                            <p>
                                At BookMyTicket, your safety is our top priority. We work closely with event organisers like <strong>Motta Maadi Music</strong> and venue partners to ensure that all safety protocols are strictly followed. From crowd management to emergency medical assistance, we ensure that the infrastructure is in place for a worry-free experience. If you have any specific requirements or need assistance during the event, please reach out to the nearest staff member.
                            </p>

                            <h3 className="text-xl font-bold text-slate-800 mt-10">About BookMyTicket</h3>
                            <p>
                                BookMyTicket is India's fastest-growing event discovery and ticketing platform. We specialise in a wide range of categories including <em>Concerts, Comedy Shows, Workshops, Sports Events, and Festivals</em>. Our mission is to connect people with experiences that matter, making event discovery and booking as simple as a few taps on your screen. Join millions of happy users and start exploring the best events in your city today.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
