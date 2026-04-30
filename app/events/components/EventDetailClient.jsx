"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { 
    Calendar, MapPin, Clock, Users, Languages, Share2, Heart, 
    CheckCircle, ShieldCheck, Warehouse, Info, Sparkles, ChevronRight,
    ArrowRight, CheckCircle2, InfoIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const DEFAULT_IMG = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80";
const DEFAULT_FEATURES = [
    { icon: "🚗", label: "Ample Parking" },
    { icon: "🥤", label: "Refreshments" },
    { icon: "🛡️", label: "Secure Entry" },
    { icon: "♿", label: "Accessible" }
];
const DEFAULT_REFUND = [
    "Tickets are non-refundable unless the event is cancelled.",
    "Please carry a valid ID proof for entry.",
    "Outside food and beverages are not allowed.",
    "Follow venue guidelines for a safe experience."
];

function parseEventDate(dateStr, timeStr, event = null) {
    try {
        let dt = event?.expiry_date || event?.dynamic_config?.basicInfo?.expiryDate || dateStr;
        let t = timeStr || event?.startTime || '23:59';
        if (!dt) return null;
        dt = String(dt).trim();
        t = String(t).trim();
        if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
            const separator = dt.includes('/') ? '/' : '-';
            const parts = dt.split(separator);
            if (parts.length === 3) dt = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        let normalizedTime = t;
        if (t && t.includes(' ')) {
            let parts = t.split(' ');
            if (parts.length >= 2) {
                let [timePart, modifier] = parts;
                let timeParts = timePart.split(':');
                let hours = Number(timeParts[0]);
                let mins = Number(timeParts[1] || 0);
                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                normalizedTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            }
        }
        const eventDate = new Date(`${dt}T${normalizedTime}`);
        return isNaN(eventDate.getTime()) ? null : eventDate;
    } catch (err) { return null; }
}

export default function EventDetailClient({ id }) {
    const router = useRouter();
    const { user } = useAuth();
    const [storageLoaded, setStorageLoaded] = useState(false);

    useEffect(() => { setStorageLoaded(true); }, []);

    const { data: rawEvent, loading: eventLoading } = useSupabaseQuery('events', (q) => 
        q.select('*').eq('id', id).maybeSingle()
    , [id]);

    const { data: userBookings } = useSupabaseQuery('bookings', (q) => 
        user ? q.select('*').eq('user_id', user.id).eq('event_id', id) : q.select('*').limit(0)
    , [user, id]);

    const existingBooking = userBookings && userBookings.length > 0;

    const event = useMemo(() => {
        if (!rawEvent) return null;
        
        const location = rawEvent.location || rawEvent.venue || rawEvent.address || 'Venue';
        const city = rawEvent.city || (location && location.split(',')[0]?.trim()) || '—';
        const venue = rawEvent.venue || rawEvent.location || location;
        
        return {
            ...rawEvent,
            id: rawEvent.id,
            img: rawEvent.img || rawEvent.bannerPreview || DEFAULT_IMG,
            title: rawEvent.title || 'Event',
            date: rawEvent.date || 'TBA',
            time: rawEvent.time || '',
            location,
            venue,
            city: rawEvent.city || city,
            category: rawEvent.category || 'Event',
            ageLimit: rawEvent.ageLimit || 'All ages',
            language: rawEvent.language || 'English',
            description: rawEvent.description || 'Join us for this event. Book your tickets now.',
            features: Array.isArray(rawEvent.features) && rawEvent.features.length > 0 ? rawEvent.features : DEFAULT_FEATURES,
            refundPolicy: Array.isArray(rawEvent.refundPolicy) && rawEvent.refundPolicy.length > 0 ? rawEvent.refundPolicy : DEFAULT_REFUND,
            parking: rawEvent.parking || 'Paid Parking Available at the Venue.',
            tags: Array.isArray(rawEvent.tags) && rawEvent.tags.length > 0 ? rawEvent.tags : [rawEvent.category || 'Event'].filter(Boolean),
            dateSlots: rawEvent.dateSlots || [],
        };
    }, [rawEvent]);

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

    if (eventLoading || !storageLoaded) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Loading Event Details...</p>
                </div>
            </main>
        );
    }

    if (!event) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-6">
                    <InfoIcon size={40} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Event Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-xs">This event may have been removed or is no longer available.</p>
                <button onClick={() => router.push('/events')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Browse Events</button>
            </main>
        );
    }

    const eventDate = parseEventDate(event.rawDate || event.date, event.rawTime || event.time, event);
    const isExpired = eventDate ? eventDate < new Date() : false;

    if (isExpired) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-100">
                    <Clock size={40} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Event Expired</h1>
                <p className="text-slate-500 mb-8">This event took place on {event.date}.</p>
                <button onClick={() => router.push('/events')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Explore Other Events</button>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FAF9F6] pb-24">
            <Navbar />
            
            <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-8">
                {/* Hero Banner */}
                <div className="w-full h-[250px] md:h-[450px] rounded-[40px] overflow-hidden shadow-2xl relative mb-12 group border border-slate-200">
                    <img src={event.img} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt={event.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            <Sparkles size={14} /> Featured Experience
                        </div>
                        <h1 className="text-white text-4xl md:text-7xl font-black uppercase tracking-tight leading-[0.9] mb-6 drop-shadow-lg">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-8 text-white/80 font-bold uppercase text-[12px] tracking-[0.15em]">
                            <div className="flex items-center gap-2.5"><Calendar size={18} className="text-pink-500" /> {event.date}</div>
                            <div className="flex items-center gap-2.5"><MapPin size={18} className="text-pink-500" /> {event.venue}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Main Content */}
                    <div className="lg:col-span-8 flex flex-col gap-12">
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 md:p-16">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Info className="text-pink-500" size={28} /> About the Event
                            </h3>
                            <p className="text-[17px] font-medium text-slate-600 leading-relaxed whitespace-pre-line mb-12">
                                {event.description}
                            </p>
                            
                            <hr className="border-slate-100 mb-12" />
                            
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Warehouse className="text-pink-500" size={28} /> Venue & Amenities
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {event.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl">
                                            {feature.icon || "✓"}
                                        </div>
                                        <span className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">{feature.label || feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Booking Sidebar */}
                    <div className="lg:col-span-4 sticky top-[100px]">
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl p-10">
                            <div className="mb-10">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Ticket Price</div>
                                <div className="text-5xl font-black text-slate-900 tracking-tighter">
                                    ₹{event.price || "950"}<span className="text-sm font-bold text-slate-400 ml-1">/person</span>
                                </div>
                            </div>
                            
                            {existingBooking ? (
                                <button onClick={() => router.push('/bookings')} className="w-full py-7 bg-slate-900 text-white rounded-[32px] font-bold uppercase tracking-widest text-[13px] shadow-xl hover:scale-[1.02] transition-all">
                                    View My Tickets
                                </button>
                            ) : (
                                <button 
                                    onClick={() => {
                                        const bookUrl = `/events/book?id=${id}`;
                                        if (!user) router.push(`/signin?redirect=${encodeURIComponent(bookUrl)}`);
                                        else router.push(bookUrl);
                                    }}
                                    className="w-full py-7 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[32px] font-bold uppercase tracking-[0.3em] text-[15px] shadow-2xl shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {event.price === 0 ? "Get Free Ticket" : "Reserve Spot Now"}
                                </button>
                            )}
                            
                            <div className="mt-8 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <ShieldCheck size={16} className="text-green-500" /> Secure SSL Checkout
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <CheckCircle size={16} className="text-green-500" /> Instant E-Ticket Delivery
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PROGRAMMATIC SEO GUIDE SECTION --- */}
                <div className="mt-24 pt-24 border-t border-slate-100">
                    <div className="max-w-[900px] mx-auto text-slate-600">
                        <h2 className="text-3xl font-black text-slate-900 mb-10 uppercase tracking-tight">Your Essential Guide to {event.title} Tickets</h2>
                        
                        <div className="prose prose-slate max-w-none space-y-8 text-[17px] leading-relaxed">
                            <p>
                                Looking for <strong>online event registration</strong> for <strong>{event.title}</strong>? BookMyTicket is India's most trusted <strong>premium event booking</strong> platform, designed to help you secure your spot at the biggest events in <strong>{event.city || event.location}</strong>. Whether you're searching for <strong>music festival passes</strong>, <strong>live sports tickets</strong>, or <strong>professional workshops</strong>, we provide a seamless 60-second booking experience.
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Why Book {event.title} on BookMyTicket?</h3>
                            <p>
                                Choosing BookMyTicket for your <strong>{event.category}</strong> tickets means you benefit from our <strong>secure checkout ticketing</strong> system. We use industry-standard encryption to protect your data. Plus, our instant e-ticket system ensures your entry pass is delivered to your phone immediately after payment.
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Event Venue & Safety</h3>
                            <p>
                                {event.title} will be hosted at <strong>{event.venue}</strong>. We prioritize attendee safety by working closely with venue partners to enforce strict crowd management and emergency protocols. Enjoy <strong>{event.title}</strong> with total peace of mind.
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">About BookMyTicket</h3>
                            <p>
                                As India's fastest-growing discovery platform, we specialize in <em>Concerts, Comedy Shows, and Sports Events</em>. Our mission is to bridge the gap between people and world-class experiences. Join millions of users who trust us for their weekly entertainment and professional networking needs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </main>
    );
}
