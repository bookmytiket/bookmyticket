"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Video, CheckCircle2, Ticket } from 'lucide-react';

import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS } from '@/app/utils/feeBreakdown';
import TicketTemplate from '@/components/TicketTemplate';
import DigitalTicket from '@/components/DigitalTicket';
import CheckoutFooterBar from '@/components/CheckoutFooterBar';
import { DEFAULT_TICKET_TERMS } from '@/app/utils/ticketTerms';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { triggerNotification } from "@/lib/notificationHelper";
import BookingDisclaimer from "@/components/BookingDisclaimer";
import TermsModal from "@/components/TermsModal";

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

function getEventById(id, convexEvents) {
    const sid = String(id);
    const fromHome = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).find(e => String(e.id) === sid);
    const fromConvex = (Array.isArray(convexEvents) ? convexEvents : []).find(e => String(e._id) === sid || String(e.id) === sid);
    const raw = fromHome || fromConvex;
    if (!raw) return null;
    return {
        ...raw,
        id: raw._id || raw.id,
        img: raw.img || raw.bannerPreview || DEFAULT_IMG,
        title: raw.title || 'Event',
        date: raw.date || 'TBA',
        time: raw.time || '',
        location: raw.location || raw.venue || raw.address || 'Venue',
    };
}

export default function CheckoutClient({ id }) {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const { data: convexEvents } = useSupabaseQuery('events', (q) => q.or('status.eq.published,status.eq.Active'), []);
    const { data: rawFeeSettings } = useSupabaseQuery('system_config', (q) => q.eq('key', 'admin_fee_settings').single(), []);
    const { data: rawTicketSettings } = useSupabaseQuery('system_config', (q) => q.eq('key', 'admin_ticket_settings').single(), []);
    const [storageLoaded, setStorageLoaded] = useState(false);
    const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);
    const [bookingDone, setBookingDone] = useState(false);
    const [lastBooking, setLastBooking] = useState(null);
    const [ticketSettings, setTicketSettings] = useState({});
    const router = useRouter();
    const bookingIdFromUrl = searchParams.get('bookingId');
    const isSuccess = searchParams.get('success') === 'true';
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const { data: existingBooking } = useSupabaseQuery('bookings', (q) => 
        q.eq('id', bookingIdFromUrl).single(),
        [bookingIdFromUrl],
        { enabled: !!bookingIdFromUrl }
    );

    useEffect(() => {
        if (rawFeeSettings !== undefined && rawTicketSettings !== undefined) {
            try {
                const parsedFees = typeof rawFeeSettings?.value === "string" ? JSON.parse(rawFeeSettings.value) : rawFeeSettings?.value;
                if (parsedFees) setFeeSettings(prev => ({ ...prev, ...parsedFees }));
            } catch (_) { }
            try {
                const parsedTicket = typeof rawTicketSettings?.value === "string" ? JSON.parse(rawTicketSettings.value) : rawTicketSettings?.value;
                if (parsedTicket) setTicketSettings(parsedTicket);
            } catch (_) { }
            setStorageLoaded(true);
        } else if (rawFeeSettings === null && rawTicketSettings === null) {
            setStorageLoaded(true);
        }
    }, [rawFeeSettings, rawTicketSettings]);

    const event = useMemo(() => getEventById(id, convexEvents), [id, convexEvents]);

    useEffect(() => {
        if (isSuccess && existingBooking && existingBooking.status === "Confirmed") {
            setLastBooking({
                id: existingBooking.id,
                eventId: existingBooking.event_id,
                eventName: existingBooking.event_name,
                amount: existingBooking.total_price,
                baseAmount: existingBooking.total_price,
                convenienceFee: 0,
                gst: 0,
                tickets: existingBooking.ticket_count,
                status: 'Confirmed',
                date: new Date(existingBooking.created_at).toISOString().split('T')[0],
                ticketType: 'General Admission',
                paymentMethod: 'Online',
                location: existingBooking.location || event?.location,
                meetingUrl: existingBooking.customer_details?.meeting_url || event?.meetingUrl,
            });
            setBookingDone(true);
        }
    }, [isSuccess, existingBooking, event]);

    const ticketPrice = event?.price ?? 499;
    const qty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10) || 1);
    const baseAmount = ticketPrice * qty;
    const { convenienceFee, gst, total } = useMemo(() => getFeeBreakdown(baseAmount, feeSettings), [baseAmount, feeSettings]);

    const handleConfirmPay = useCallback(async () => {
        if (!event || !user) return;
        try {
            const isFree = total === 0;
            const breakdown = getFeeBreakdown(baseAmount, feeSettings);
            
            const { data: booking, error } = await supabase
                .from('bookings')
                .insert([{
                    event_id: String(event.id),
                    user_id: user.id,
                    ticket_count: qty,
                    base_amount: breakdown.baseAmount,
                    platform_charge: breakdown.convenienceFee,
                    gst_amount: breakdown.gst,
                    partner_bonus: breakdown.partnerBonus,
                    platform_revenue: breakdown.platformRevenue,
                    partner_total: breakdown.partnerTotal,
                    total_price: total,
                    status: isFree ? 'Confirmed' : 'Pending',
                    scanned: false,
                    customer_details: {
                        name: user.name || "Guest User",
                        email: user.identifier || user.email || "",
                        phone: user.phone || ""
                    }
                }])
                .select()
                .single();

            if (error) throw error;

            if (isFree) {
                setLastBooking({
                    id: booking.id,
                    eventId: String(event.id),
                    eventName: event.title,
                    amount: 0,
                    baseAmount: 0,
                    convenienceFee: 0,
                    gst: 0,
                    tickets: qty,
                    status: 'Confirmed',
                    date: new Date().toISOString().split('T')[0],
                    ticketType: 'General Admission',
                    paymentMethod: 'Free',
                    location: event.location,
                    meetingUrl: event.meetingUrl,
                });
                // ── TRIGGER SMS NOTIFICATION ──
                if (user?.phone) {
                    triggerNotification({
                        phoneNumber: user.phone,
                        type: "BOOKING",
                        data: {
                            eventName: event.title,
                            date: event.date,
                            bookingId: booking.id
                        }
                    });
                }

                setBookingDone(true);
            } else {
                router.push(`/events/book/payment?bookingId=${booking.id}&id=${id}`);
            }
        } catch (error) {
            console.error("Booking failed:", error);
            alert("Unexpected error. Please try again.");
        }
    }, [id, event, user, total, qty, router]);

    // Removed auto-redirect to ensure user can download ticket on the same page
    useEffect(() => {
        if (bookingDone) {
            // No redirect - keep user on success page for ticket download
        }
    }, [bookingDone]);

    const handleSendEmail = useCallback(() => {
        if (!event) return;
        const subject = encodeURIComponent(`Your ticket for ${event.title}`);
        const body = encodeURIComponent(`Booking confirmed.\nEvent: ${event.title}\nBooking ID: ${lastBooking?.id}\n\nDownload your ticket from the link we sent, or open the attachment.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }, [event, lastBooking?.id]);

    const handleSendSms = useCallback(() => {
        if (!event) return;
        const msg = encodeURIComponent(`BookMyTicket: Your booking for "${event.title}" is confirmed. ID: ${lastBooking?.id}. Show this at the venue.`);
        window.location.href = `sms:?body=${msg}`;
    }, [event, lastBooking?.id]);

    if (!event) {
        if (!storageLoaded) return (<main style={{ paddingTop: '150px', textAlign: 'center' }}><p>Loading…</p></main>);
        return (<main style={{ paddingTop: '150px', textAlign: 'center' }}><h2>Event not found</h2><Link href="/">Back to Home</Link></main>);
    }

    if (bookingDone) {
        return (
            <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: 'var(--header-h)', paddingBottom: '60px' }}>
                <div className="container" style={{ padding: '24px 0', maxWidth: '680px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', color: '#111827' }}>Booking confirmed</h1>
                        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{event.title} — {qty} ticket{qty !== 1 ? 's' : ''}.</p>
                        <p style={{ fontSize: '14px', color: '#059669', marginTop: '12px', fontWeight: 700, borderRadius: '8px', background: '#ecfdf5', padding: '10px', display: 'inline-block' }}>
                            Booking ID: <span style={{ color: '#10b981' }}>#{lastBooking?.id?.slice(-8).toUpperCase()}</span>
                        </p>
                    </div>

                    <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <DigitalTicket 
                            booking={{
                                ...lastBooking,
                                id: lastBooking.id || lastBooking._id
                            }}
                            event={{ 
                                ...event, 
                                img: event.img, 
                                location: event.location, 
                                date: event.date, 
                                time: event.time,
                                virtual: event.virtual,
                                meetingUrl: event.meetingUrl
                            }} 
                            showDownload={true}
                        />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                        {event.virtual && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    const url = event.meetingUrl && event.meetingUrl.startsWith("http") ? event.meetingUrl : `/${event.meetingUrl}`;
                                    window.open(url, '_blank');
                                }} 
                                style={{ 
                                    padding: '12px 24px', 
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    fontWeight: 900, 
                                    cursor: 'pointer', 
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 8px 20px -6px rgba(99,102,241,0.5)'
                                }}
                            >
                                <Video size={18} /> Join Meeting Now
                            </button>
                        )}
                        <Link href="/" style={{ padding: '14px 28px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            Go to Home Now
                        </Link>
                        <button type="button" onClick={handleSendEmail} style={{ padding: '12px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Send ticket to Email</button>
                        <button type="button" onClick={handleSendSms} style={{ padding: '12px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Send SMS</button>
                    </div>

                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#fafbfc] pt-[40px] md:pt-[60px] pb-24">
            <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-4">
                
                {/* Checkout Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                    <Link 
                        href={`/events/book?id=${id}`}
                        className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        <span>Back</span>
                    </Link>
                    <div className="w-24"></div> {/* Spacer for symmetry */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Booking Details Form */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                        
                        <div className="flex items-center justify-center space-x-3 border-none bg-[#fde047] px-8 md:px-10 py-1.5 rounded-2xl shadow-[0_4px_15px_-4px_rgba(253,224,71,0.2)] w-full">
                            <img src="/logo.png" alt="BookMyTicket" style={{ height: "50px", width: "auto" }} />
                            <span className="text-black/20 text-xl mx-3">|</span>
                            <span className="font-bold text-black text-[17px]">Safe Checkout</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-6 md:p-8">
                            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight mb-6">Booking Confirmation</h2>
                            
                            <form onSubmit={(e) => { e.preventDefault(); handleConfirmPay(); }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600 block">Name <span className="text-[#FF5A5F]">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            defaultValue={user?.name || ""}
                                            placeholder="Name"
                                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600 block">Email <span className="text-[#FF5A5F]">*</span></label>
                                        <input 
                                            type="email" 
                                            required
                                            defaultValue={user?.identifier || user?.email || ""}
                                            placeholder="example@gmail.com"
                                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">The confirmation will be sent to this email</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2 relative">
                                        <label className="text-[13px] font-semibold text-slate-600 flex items-center gap-1">
                                            Mobile Number<span className="text-green-500 font-bold ml-0.5 text-[10px] items-center flex">WA</span> <span className="text-[#FF5A5F]">*</span>
                                        </label>
                                        <div className="flex">
                                            <div className="flex items-center justify-center bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-3 gap-2 shrink-0 h-[46px]">
                                                <span className="text-[16px] leading-none grayscale-[0.2]">🇮🇳</span>
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                            <input 
                                                type="tel" 
                                                required
                                                placeholder="+91"
                                                defaultValue={user?.phone || ""}
                                                className="w-full px-3 h-[46px] bg-white border border-slate-200 rounded-r-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 space-y-3.5">
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <div className="relative flex items-start">
                                            <input
                                                type="checkbox"
                                                required
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="w-[18px] h-[18px] rounded border-slate-300 text-[#FF5A5F] focus:ring-[#FF5A5F] mt-[2px]"
                                            />
                                        </div>
                                        <span className="text-[13px] font-semibold text-slate-600">
                                            I have read and agreed to the{" "}
                                            <button
                                                type="button"
                                                onClick={() => setShowTermsModal(true)}
                                                className="text-blue-500 hover:underline font-bold"
                                            >
                                                Event Guidelines and Terms &amp; Conditions
                                            </button>
                                        </span>
                                    </label>
                                </div>

                                <TermsModal
                                    isOpen={showTermsModal}
                                    onClose={() => setShowTermsModal(false)}
                                    onAccept={() => setTermsAccepted(true)}
                                    type="event"
                                />

                                <div className="pt-6">
                                    <button 
                                        type="submit"
                                        className="px-8 flex items-center justify-center min-w-[160px] py-[13px] bg-[#FF5A5F] hover:bg-[#ff4449] text-white rounded-[2rem] font-bold shadow-sm transition-all text-[14px] tracking-wide"
                                    >
                                        {total > 0 ? "Confirm & Pay" : "Confirm Booking"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <BookingDisclaimer type="event" />
                    </div>

                    {/* Right: Summary Card */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                        <div className="bg-white rounded-[1rem] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-4 md:p-5 pb-6">
                            <div className="w-full h-[140px] bg-black rounded-lg overflow-hidden mb-5 relative">
                                <img src={event.img} className="w-full h-full object-cover" alt="Cover" />
                            </div>
                            
                            <h3 className="font-bold text-[15px] text-[#111827] leading-[1.3] mb-5">{event.title} - {event.location}</h3>
                            
                            <div className="space-y-3.5 mb-8">
                                <div className="flex items-start text-[13px] font-medium text-slate-500">
                                    <MapPin size={15} className="shrink-0 mr-3 text-slate-400 mt-0.5" />
                                    <span>{event.location}</span>
                                </div>
                                <div className="flex items-center text-[13px] font-medium text-slate-500">
                                    <Calendar size={15} className="shrink-0 mr-3 text-slate-400" />
                                    <span>{event.date}{event.time && ` ,${event.time}`}</span>
                                </div>
                                <div className="flex items-center text-[13px] font-medium text-slate-500">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mr-3 text-slate-400"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M7 12h.01"/><path d="M17 12h.01"/><path d="M11 12h.01"/><path d="M12 6v12"/><path d="M12 6a2 2 0 0 1-2 2h0a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h0a2 2 0 0 1 2 2"/><path d="M12 18a2 2 0 0 0 2-2h0a2 2 0 0 1 2-2v0a2 2 0 0 1-2-2h0a2 2 0 0 0-2-2"/></svg>
                                    <span>{qty} Ticket{qty > 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <div className="flex justify-between items-center text-[12px] mb-5">
                                    <span className="font-semibold text-slate-700">Ticket Name</span>
                                    <span className="font-semibold text-slate-700">Price & Quantity</span>
                                </div>
                                
                                <div className="flex justify-between items-center mb-5">
                                    <span className="font-bold text-[#111827] text-[13px]">Standard</span>
                                    <span className="font-bold text-[#111827] text-[13px]">₹ {ticketPrice} x {qty}</span>
                                </div>
                                
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center space-x-1.5 text-blue-500/90 cursor-pointer">
                                        <span className="text-[12px] font-medium">Includes convenience fees</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                    </div>
                                    <span className="text-[12px] font-medium text-slate-400">₹ {convenienceFee.toFixed(2)}</span>
                                </div>

                                <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
                                    <span className="font-extrabold text-[#111827] text-[16px]">Total</span>
                                    <span className="font-extrabold text-[#111827] text-[16px]">₹ {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                            <div className="bg-green-500 rounded-full p-1 shrink-0 mt-0.5">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <p className="text-[12px] font-medium text-[#111827] leading-[1.6]">
                                Book with Confidence : BookMyTicket guarantees refunds, ensuring your peace of mind. <button className="text-blue-500 hover:underline">Learn More</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Dynamic Checkout Footer */}
            <CheckoutFooterBar />
            
        </main>
    );
}
