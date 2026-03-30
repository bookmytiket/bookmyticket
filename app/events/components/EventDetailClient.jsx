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
    Heart
} from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import { Video, Lock, ExternalLink, Play, CheckCircle2 } from 'lucide-react';

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
    const convexEvents = useQuery(api.events.getActiveEvents);
    const [storageLoaded, setStorageLoaded] = useState(false);

    // Fetch user bookings to check if they've already booked this event
    const userBookings = useQuery(api.bookings.getByUser, user?.identifier ? { userId: user.identifier } : "skip");
    
    // Check if this specific event is already booked by the user
    const existingBooking = useMemo(() => {
        if (!userBookings || !id) return null;
        return userBookings.find(b => String(b.eventId) === String(id));
    }, [userBookings, id]);

    useEffect(() => {
        setStorageLoaded(true);
    }, []);

    const event = useMemo(() => {
        if (!convexEvents) return null;
        const sid = String(id);
        const fromHome = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).find(e => String(e.id) === sid);
        const fromConvex = convexEvents.find(e => String(e._id) === sid || String(e.id) === sid);
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
            <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-4">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
                    <Link 
                        href="/"
                        className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        <span>Back</span>
                    </Link>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center border border-slate-200 p-2.5 rounded-full bg-white hover:bg-slate-50 transition-colors shadow-sm"><Heart size={18} className="text-slate-500" /></button>
                        <button className="flex items-center justify-center border border-slate-200 p-2.5 rounded-full bg-white hover:bg-slate-50 transition-colors shadow-sm"><Share2 size={18} className="text-slate-500" /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Event Information */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                        
                        <div className="flex items-center justify-center space-x-3 border-none bg-[#fde047] px-8 md:px-10 py-2 rounded-2xl shadow-[0_4px_20px_-4px_rgba(253,224,71,0.3)] w-full">
                            <img src="/logo.png" alt="BookMyTicket" style={{ height: "68px", width: "auto" }} />
                            <span className="text-black/20 text-xl mx-3">|</span>
                            <span className="font-bold text-black text-[17px]">Safe Checkout</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-8 md:p-10">
                            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight mb-6">Event Information</h2>
                            
                            <div className="flex flex-wrap gap-4 mb-8">
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <Users size={18} className="text-[#FF5A5F]" />
                                    <span className="text-[14px] font-semibold text-slate-700">{event.ageLimit}</span>
                                </div>
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <Languages size={18} className="text-[#FF5A5F]" />
                                    <span className="text-[14px] font-semibold text-slate-700">{event.language}</span>
                                </div>
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <Clock size={18} className="text-[#FF5A5F]" />
                                    <span className="text-[14px] font-semibold text-slate-700">{event.time}</span>
                                </div>
                            </div>
                            
                            <hr className="border-slate-100 mb-8" />
                            
                            <h3 className="text-[16px] font-extrabold text-[#111827] tracking-tight mb-4">About the Event</h3>
                            <p className="text-[14px] font-medium text-slate-600 leading-[1.8] whitespace-pre-line mb-8">
                                {event.description}
                            </p>
                            
                            <hr className="border-slate-100 mb-8" />
                            
                            <h3 className="text-[16px] font-extrabold text-[#111827] tracking-tight mb-4">Venue & Features</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {event.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-200 shrink-0 text-[14px]">
                                            {feature.icon || "✓"}
                                        </div>
                                        <span className="text-[13px] font-medium text-slate-600 mt-1.5">{feature.label || feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h3 className="text-[16px] font-extrabold text-[#111827] tracking-tight mb-4">Terms & Refund Policy</h3>
                                <ul className="space-y-3">
                                    {event.refundPolicy.map((rule, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-2"></div>
                                            <span className="text-[13px] font-medium text-slate-500 leading-relaxed">{rule}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary Card */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-[120px]">
                        <div className="bg-white rounded-[1rem] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-5 md:p-6 pb-7">
                            <div className="w-full h-[180px] bg-black rounded-lg overflow-hidden mb-5 relative">
                                <img src={event.img} className="w-full h-full object-cover" alt="Cover" onError={(e) => { e.currentTarget.src = DEFAULT_IMG; }} />
                                <div className="absolute top-3 left-3 bg-[#FF5A5F] text-white px-3 py-1 rounded-[100px] text-[10px] font-bold tracking-wide uppercase shadow-sm">
                                    {event.category}
                                </div>
                            </div>
                            
                            <h3 className="font-extrabold text-[18px] text-[#111827] leading-[1.3] mb-5 tracking-tight">{event.title}</h3>
                            
                            <div className="space-y-3.5 mb-8">
                                <div className="flex items-start text-[13px] font-medium text-slate-500">
                                    <MapPin size={16} className="shrink-0 mr-3 text-slate-400 mt-0.5" />
                                    <div>
                                        <span className="block font-bold text-[#111827] mb-0.5">{event.venue}</span>
                                        <span className="text-[12px]">{event.city}</span>
                                    </div>
                                </div>
                                <div className="flex items-start text-[13px] font-medium text-slate-500">
                                    <Calendar size={16} className="shrink-0 mr-3 text-slate-400 mt-0.5" />
                                    <div>
                                        <span className="block font-bold text-[#111827] mb-0.5">{event.date}</span>
                                        <span className="text-[12px]">{event.time}</span>
                                    </div>
                                </div>
                                {event.virtual && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl mt-4">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest italic">Live Meeting Link Included</span>
                                    </div>
                                )}
                            </div>

                            {existingBooking ? (
                                <div className="space-y-3">
                                    {event.virtual ? (
                                        <>
                                            {(event.price === 0 || existingBooking.status === "Confirmed") ? (
                                                <button
                                                    onClick={() => {
                                                        const url = event.meetingUrl && event.meetingUrl.startsWith("http") ? event.meetingUrl : `/${event.meetingUrl}`;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="w-full flex items-center justify-center space-x-2 py-[14px] text-white rounded-[1rem] font-black shadow-lg transition-all text-[15px] tracking-wide hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 8px 20px -6px rgba(99,102,241,0.5)' }}
                                                >
                                                    <Video size={18} />
                                                    <span>Join Meeting Now</span>
                                                </button>
                                            ) : (
                                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                                                    <Lock size={20} className="mx-auto mb-2 text-slate-400" />
                                                    <p className="text-[12px] font-bold text-slate-600">Meeting link reveals after successful payment</p>
                                                    <div className="mt-2 text-[10px] uppercase font-black text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded-full">Payment Pending</div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-100 rounded-2xl">
                                            <CheckCircle2 size={18} className="text-green-500" />
                                            <span className="text-[14px] font-black text-green-700 italic uppercase">Ticket Booked!</span>
                                        </div>
                                    )}
                                    <p className="text-center text-[11px] font-bold text-slate-400">You already have a booking for this event.</p>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const bookUrl = `/events/book?id=${id}`;
                                        if (!user) router.push(`/signin?redirect=${encodeURIComponent(bookUrl)}`);
                                        else router.push(bookUrl);
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 py-[14px] text-white rounded-[1rem] font-bold shadow-sm transition-all text-[15px] tracking-wide hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #f844a4 0%, #a855f7 100%)' }}
                                >
                                    <span>{event.price === 0 ? "Get Free Ticket" : "Book Now"}</span>
                                </button>
                            )}
                        </div>

                    </div>

                </div>
            </div>
        </main>
    );
}
