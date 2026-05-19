"use client";
import Footer from "@/components/Footer";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, Video, CheckCircle2, Ticket, 
    ShieldCheck, CreditCard, ChevronLeft, Info, 
    ArrowRight, Mail, Phone, User, ExternalLink,
    Star, Sparkles, Download, Home, MessageSquare, X, Plus, Minus, ChevronDown
} from 'lucide-react';

import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from '@/app/utils/feeBreakdown';
import DigitalTicket from '@/components/DigitalTicket';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { triggerNotification } from "@/lib/notificationHelper";
import TermsModal from "@/components/TermsModal";

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

function getEventById(id, convexEvents) {
    const sid = String(id);
    const fromHome = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).find(e => String(e.id) === sid);
    const fromConvex = (Array.isArray(convexEvents) ? convexEvents : []).find(e => String(e.id) === sid);
    const raw = fromHome || fromConvex;
    if (!raw) return null;
    return {
        ...raw,
        id: raw.id,
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
    const router = useRouter();
    const [rawEvent, setRawEvent] = useState(null);
    const [eventLoading, setEventLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setEventLoading(true);
        fetch(`/api/events/detail?id=${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch event');
                return res.json();
            })
            .then(data => {
                setRawEvent(data);
                setEventLoading(false);
            })
            .catch(err => {
                console.error('Error fetching event detail:', err);
                setEventLoading(false);
            });
    }, [id]);

    const { data: rawFeeSettings } = useSupabaseQuery('fee_settings', (q) => q.limit(1).maybeSingle(), []);
    const [siteBranding, setSiteBranding] = useState(null);

    useEffect(() => {
        fetch('/api/branding')
            .then(res => res.json())
            .then(data => { if (data && !data.error) setSiteBranding(data); });
    }, []);

    const { data: availableCoupons } = useSupabaseQuery('coupons', (q) => 
        q.select('*').eq('is_active', true).order('created_at', { ascending: false }),
        []
    );
    
    const seatsParam = searchParams.get('seats');
    const selectedSeats = useMemo(() => {
        try { return seatsParam ? JSON.parse(seatsParam) : []; } catch { return []; }
    }, [seatsParam]);

    const ticketPriceParam = searchParams.get('price');
    
    const initialQty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10) || 1);
    const [qty, setQty] = useState(initialQty);
    const selectedPackageName = searchParams.get('package');
    const regDataParam = searchParams.get('regData');
    const participantParam = searchParams.get('participant');
    const teamParam = searchParams.get('team');
    const bookingType = searchParams.get('type');

    const [storageLoaded, setStorageLoaded] = useState(false);
    const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);
    const [bookingDone, setBookingDone] = useState(false);
    const [lastBooking, setLastBooking] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [notification, setNotification] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [showCouponsModal, setShowCouponsModal] = useState(false);
    
    const event = useMemo(() => {
        if (!rawEvent) return null;
        return {
            ...rawEvent,
            id: rawEvent.id,
            img: rawEvent.img || rawEvent.bannerPreview || DEFAULT_IMG,
            title: rawEvent.title || 'Event',
            date: rawEvent.date || 'TBA',
            time: rawEvent.time || '',
            location: rawEvent.location || rawEvent.venue || rawEvent.address || 'Venue',
        };
    }, [rawEvent]);

    const ticketPrice = useMemo(() => {
        if (ticketPriceParam) return parseFloat(ticketPriceParam);
        return event?.price ?? 499;
    }, [ticketPriceParam, event?.price]);
    

    const validCoupons = useMemo(() => {
        if (!availableCoupons) return [];
        return availableCoupons.filter(c => {
            if (c.expiry_date && new Date(c.expiry_date) < new Date()) return false;
            if (c.applicable_events && c.applicable_events.length > 0) {
                if (!c.applicable_events.includes(id)) return false;
            }
            if (qty < (c.min_tickets || 1)) return false;
            if (c.max_tickets && qty > c.max_tickets) return false;
            
            return true;
        });
    }, [availableCoupons, id, qty]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);



    const bookingIdFromUrl = searchParams.get('bookingId');
    const isSuccess = searchParams.get('success') === 'true';

    const { data: existingBooking } = useSupabaseQuery('bookings', (q) => 
        q.eq('id', bookingIdFromUrl).single(),
        [bookingIdFromUrl],
        { enabled: !!bookingIdFromUrl }
    );

    useEffect(() => {
        if (rawFeeSettings) {
            setFeeSettings(prev => ({ ...prev, ...rawFeeSettings }));
            setStorageLoaded(true);
        } else if (rawFeeSettings === null) {
            setStorageLoaded(true);
        }
    }, [rawFeeSettings]);
    
    useEffect(() => {
        if (appliedCoupon) {
            if (qty < (appliedCoupon.min_tickets || 1)) {
                setAppliedCoupon(null);
                setCouponError(`Minimum ${appliedCoupon.min_tickets} tickets required for this coupon`);
                setNotification({ message: `Coupon removed: Minimum ${appliedCoupon.min_tickets} tickets required`, type: 'info' });
            } else if (appliedCoupon.max_tickets && qty > appliedCoupon.max_tickets) {
                setAppliedCoupon(null);
                setCouponError(`Maximum ${appliedCoupon.max_tickets} tickets allowed for this coupon`);
                setNotification({ message: `Coupon removed: Maximum ${appliedCoupon.max_tickets} tickets allowed`, type: 'info' });
            }
        }
    }, [qty, appliedCoupon]);

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

    const baseAmount = useMemo(() => {
        if (selectedSeats.length > 0) {
            return selectedSeats.reduce((s, seat) => s + (seat.isFree ? 0 : Number(seat.price) || 0), 0);
        }
        return ticketPrice * qty;
    }, [selectedSeats, ticketPrice, qty]);

    const { data: organiserData } = useSupabaseQuery('organisers', (q) => q.eq('id', event?.organiser_id || event?.organiserId).single(), [event?.organiser_id, event?.organiserId]);

    const resolvedFeeSettings = useMemo(() => {
        return resolveFeeSettings(
            feeSettings,
            organiserData?.fee_config,
            event?.fee_config
        );
    }, [feeSettings, organiserData?.fee_config, event?.fee_config]);

    const discountAmount = useMemo(() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'percent') {
            return (baseAmount * appliedCoupon.value) / 100;
        } else {
            return Math.min(baseAmount, appliedCoupon.value);
        }
    }, [baseAmount, appliedCoupon]);

    const { convenienceFee, gst, total, gstPercent } = useMemo(() => {
        const discountedBase = Math.max(0, baseAmount - discountAmount);
        return getFeeBreakdown(discountedBase, resolvedFeeSettings);
    }, [baseAmount, discountAmount, resolvedFeeSettings]);

    const handleApplyCoupon = async (directCode = null) => {
        const codeToUse = (typeof directCode === 'string' ? directCode : couponCode).trim().toUpperCase();
        if (!codeToUse || !user || !event) return;
        
        setIsValidatingCoupon(true);
        setCouponError('');
        
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: codeToUse,
                    userId: user.id,
                    ticketCount: qty,
                    eventId: event.id
                })
            });
            const data = await res.json();
            if (data.valid) {
                setAppliedCoupon(data.coupon);
                setNotification({ message: `Coupon ${data.coupon.code} applied successfully!`, type: 'success' });
            } else {
                setCouponError(data.message || "Invalid coupon");
                setAppliedCoupon(null);
            }
        } catch (err) {
            setCouponError("Failed to validate coupon");
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleConfirmPay = async () => {
        if (!event || !user || !termsAccepted || isProcessing) return;
        
        setIsProcessing(true);
        try {
            const isFree = total === 0;
            const breakdown = getFeeBreakdown(baseAmount, resolvedFeeSettings);
            
            let regData = {};
            if (regDataParam) {
                try { regData = JSON.parse(regDataParam); } catch { }
            }

            const { data: booking, error } = await supabase
                .from('bookings')
                .insert([{
                    event_id: String(event.id),
                    user_id: user.id,
                    ticket_count: qty,
                    base_amount: breakdown.baseAmount,
                    platform_charge: breakdown.convenienceFee,
                    gst_amount: breakdown.gst,
                    gst_percent: breakdown.gstPercent,
                    partner_bonus: breakdown.partnerBonus,
                    platform_revenue: breakdown.platformRevenue,
                    partner_total: breakdown.partnerTotal,
                    discount_amount: discountAmount,
                    coupon_id: appliedCoupon?.id || null,
                    total_price: total,
                    status: isFree ? 'Confirmed' : 'Pending',
                    scanned: false,
                    selected_seats: selectedSeats,
                    event_name: event.title,
                    location: event.location,
                    customer_details: {
                        name: user.name || "Guest User",
                        email: user.identifier || user.email || "",
                        phone: user.phone || "",
                        ...regData
                    }
                }])
                .select()
                .single();

            if (error) throw error;

            try {
                if (participantParam) {
                    const participantData = JSON.parse(participantParam);
                    await fetch('/api/runner-registration', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId:       String(event.id),
                            bookingId:     booking.id,
                            userId:        user.id,
                            identity: {
                                fullName: participantData.fullName || user.name || '',
                                email:    participantData.email || user.identifier || user.email || '',
                                phone:    participantData.phone || user.phone || '',
                                dob:      participantData.dob || '',
                            },
                            details:       participantData,
                            category:      selectedPackageName || '',
                            paymentStatus: isFree ? 'paid' : 'pending',
                        })
                    });
                }
            } catch (regErr) {
                console.warn('[runner-registration] Save failed (non-critical):', regErr);
            }

            try {
                if (teamParam) {
                    const teamData = JSON.parse(teamParam);
                    const { data: team, error: teamError } = await supabase
                        .from('tournament_teams')
                        .insert({
                            tournament_event_id: String(event.id),
                            booking_id: booking.id,
                            team_name: teamData.teamName,
                            captain_name: teamData.captainName,
                            captain_mobile: teamData.captainMobile,
                            captain_email: teamData.captainEmail || user.email || "",
                            registration_status: 'pending_approval',
                            payment_status: isFree ? 'paid' : 'pending',
                            metadata: { category: selectedPackageName, city: teamData.city }
                        })
                        .select()
                        .single();

                    if (teamError) throw teamError;

                    if (teamData.members && teamData.members.length > 0) {
                        const membersToInsert = teamData.members.map(m => ({
                            team_id: team.id,
                            member_name: m.name,
                            role: m.role,
                            jersey_number: m.jerseyNumber
                        }));
                        await supabase.from('tournament_team_members').insert(membersToInsert);
                    }
                }
            } catch (tourneyErr) {
                console.warn('[tournament-registration] Save failed (non-critical):', tourneyErr);
            }

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
                    ticketType: selectedPackageName || 'General Admission',
                    paymentMethod: 'Free',
                    location: event.location,
                    meetingUrl: event.meetingUrl,
                });
                
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
            const errorMsg = error.message || "Booking failed. Please check your connection and try again.";
            setNotification({ message: errorMsg, type: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (eventLoading || !storageLoaded) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Validating Checkout...</p>
                </div>
            </main>
        );
    }

    if (!event && !eventLoading) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                        <Info size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Event Not Found</h2>
                    <p className="text-slate-500 font-medium">The event you are looking for might have been removed or is no longer available.</p>
                    <button 
                        onClick={() => router.push('/events')}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
                    >
                        Browse Other Events
                    </button>
                </div>
            </main>
        );
    }

    if (bookingDone) {
        return (
            <main className="min-h-screen bg-[#FDFCFB]">
                <div className="max-w-[800px] mx-auto px-6 py-20 text-center">
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-emerald-500/20"
                    >
                        <CheckCircle2 size={48} />
                    </motion.div>
                    
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Booking Confirmed!</h1>
                        <p className="text-slate-500 font-medium text-lg mb-12">You're all set for <span className="text-slate-900 font-bold">{event.title}</span>. Your ticket is ready below.</p>
                        
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-sm font-black uppercase tracking-widest mb-12">
                            Order ID: #{lastBooking?.id?.slice(-8).toUpperCase()}
                        </div>

                        <div className="max-w-[500px] mx-auto mb-16 transform hover:scale-[1.02] transition-transform">
                            <DigitalTicket 
                                booking={{
                                    ...lastBooking,
                                    id: lastBooking.id
                                }}
                                event={{ 
                                    ...event, 
                                    img: event.img,
                                    virtual: event.virtual,
                                    meetingUrl: event.meetingUrl
                                }} 
                                showDownload={true}
                                branding={siteBranding}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Link href="/" className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    <Home size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Go Home</span>
                            </Link>
                            <button onClick={() => window.print()} className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                    <Download size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Print Ticket</span>
                            </button>
                            <Link href="/support" className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <MessageSquare size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Need Help?</span>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFCFB]">
            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 30, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className="fixed top-0 left-1/2 z-[100] w-full max-w-md px-4"
                    >
                        <div className="bg-white/80 backdrop-blur-xl border border-rose-100 shadow-[0_20px_50px_rgba(236,72,153,0.15)] p-5 rounded-[2rem] flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] flex items-center justify-center text-white shrink-0 shadow-lg">
                                <Info size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-[#ec4899] uppercase tracking-widest mb-1">Attention Required</p>
                                <p className="text-sm font-black text-slate-900 leading-tight">{notification.message}</p>
                            </div>
                            <button onClick={() => setNotification(null)} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full px-4 md:px-12 py-2 space-y-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => router.push(`/events/detail?id=${id}`)}
                            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft size={16} /> Back to Event Registration
                        </button>
                        <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Step 1 of 2
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
                        <div className="flex flex-col gap-0">
                            <div className="w-full relative shrink-0 overflow-hidden bg-slate-900">
                                <div className="h-64 lg:h-full lg:min-h-[600px] relative">
                                    <img src={event.img} alt="" className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r" />
                                    <div className="absolute bottom-12 left-12 right-12">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-tight mb-3 drop-shadow-xl">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">
                                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                <Calendar size={14} className="text-pink-400" />
                                            </div>
                                            {event.date}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-4 md:p-6 lg:p-8 bg-white flex flex-col items-center justify-center">
                                <div className="max-w-[550px] w-full space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="space-y-1">
                                                <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Ticket Details</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your selection</p>
                                            </div>
                                            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-4 py-2 rounded-full border border-pink-100/50">Secure Checkout</span>
                                        </div>

                                        {selectedSeats.length > 0 ? (
                                            <div className="flex flex-wrap gap-4">
                                                {selectedSeats.map(seat => (
                                                    <div key={seat.id} className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                                                        <span className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Seat {seat.id}</span>
                                                        <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                                        <span className="text-[14px] font-black text-pink-500">₹{seat.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 p-3 md:p-4 rounded-[1.5rem] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between shadow-inner gap-3 sm:gap-0">
                                                <div className="space-y-1.5 text-center sm:text-left">
                                                    <span className="text-[14px] md:text-[16px] font-black text-slate-900 uppercase tracking-tight leading-none block break-words">{selectedPackageName || "Ticket"}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Category</span>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 w-full sm:w-auto">
                                                    <div className="flex items-center gap-2 md:gap-4 bg-white border border-slate-200 rounded-xl px-2 md:px-4 py-2 shadow-sm shrink-0">
                                                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors bg-slate-50 rounded-lg"><Minus size={12} /></button>
                                                        <span className="text-sm text-slate-900 font-black min-w-[20px] text-center">{qty}</span>
                                                        <button onClick={() => setQty(qty + 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors bg-slate-50 rounded-lg"><Plus size={12} /></button>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[16px] md:text-xl font-black text-slate-900 tracking-tighter">₹{baseAmount.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {!appliedCoupon ? (
                                            <div className="space-y-3 relative">
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        placeholder="Coupon Code"
                                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none uppercase focus:ring-1 focus:ring-pink-500 transition-all w-full min-w-0"
                                                    />
                                                    <button 
                                                        onClick={handleApplyCoupon}
                                                        disabled={isValidatingCoupon || !couponCode}
                                                        className="px-4 md:px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shrink-0"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                                {validCoupons.length > 0 && (
                                                    <button 
                                                        onClick={() => setShowCouponsModal(!showCouponsModal)}
                                                        className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:underline w-full text-left pl-1 flex items-center gap-1"
                                                    >
                                                        View All Offers <ChevronDown size={12} className={`transition-transform ${showCouponsModal ? 'rotate-180' : ''}`} />
                                                    </button>
                                                )}
                                                
                                                <AnimatePresence>
                                                    {showCouponsModal && validCoupons.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -5 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                                                        >
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                                                {validCoupons.map((coupon) => (
                                                                    <button
                                                                        key={coupon.id}
                                                                        onClick={() => {
                                                                            setCouponCode(coupon.code);
                                                                            setShowCouponsModal(false);
                                                                            handleApplyCoupon(coupon.code);
                                                                        }}
                                                                        className="w-full text-left p-3 bg-slate-50 hover:bg-pink-50 rounded-xl border border-slate-100 hover:border-pink-200 transition-all flex items-center justify-between group"
                                                                    >
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-slate-200 group-hover:border-pink-200 transition-colors">
                                                                                    {coupon.code}
                                                                                </span>
                                                                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                                                                    Active
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] font-bold text-slate-500">
                                                                                Save ₹{coupon.value} on total value
                                                                            </p>
                                                                        </div>
                                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300 group-hover:text-pink-500 transition-colors shrink-0">
                                                                            <ArrowRight size={14} />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 border-dashed">
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <Sparkles size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{appliedCoupon.code} Applied</span>
                                                </div>
                                                <button onClick={removeCoupon} className="text-slate-400 hover:text-rose-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-100">
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Sub Total</span>
                                            <span className="text-slate-900">₹{baseAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Platform Fee</span>
                                            <span className="text-slate-900">₹{convenienceFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>GST ({gstPercent}%)</span>
                                            <span className="text-slate-900">₹{gst.toFixed(2)}</span>
                                        </div>
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-[10px] font-black text-emerald-500 uppercase tracking-widest pt-4 border-t border-slate-50">
                                                <span>Discount Applied</span>
                                                <span>- ₹{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 pt-3 border-t-[3px] border-dotted border-slate-100">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Total Amount</p>
                                                <div className="text-3xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold opacity-20 tracking-normal mr-2">₹</span>{total.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-inner border border-pink-100/50">
                                                <CreditCard size={32} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={termsAccepted}
                                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                                    className="w-5 h-5 rounded border-slate-200 text-pink-500 focus:ring-pink-500 transition-all cursor-pointer"
                                                />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-tight">
                                                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-slate-900 underline underline-offset-4 font-black hover:text-pink-500 transition-colors">Event Terms & Conditions</button>
                                                </span>
                                            </label>
                                        </div>

                                        <button 
                                            onClick={handleConfirmPay}
                                            disabled={!termsAccepted || isProcessing}
                                            className={`
                                                w-full py-4 rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[13px] transition-all shadow-2xl flex items-center justify-center gap-4
                                                ${termsAccepted && !isProcessing
                                                    ? 'bg-slate-900 text-white shadow-slate-900/40 hover:scale-[1.02] active:scale-98 hover:shadow-slate-900/60' 
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
                                            `}
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </div>
                                            ) : (
                                                <>Proceed to Payment <ArrowRight size={20} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Confirmation</h2>
                            <div className="px-4 py-2 bg-amber-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-400/20">
                                Step 2 of 2
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-[11px] font-black text-pink-500 uppercase tracking-widest">
                                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                                    <User size={16} />
                                </div>
                                Attendee Details
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                                    <input 
                                        type="text"
                                        value={user?.name || ""}
                                        readOnly
                                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                                    <input 
                                        type="email"
                                        value={user?.identifier || user?.email || ""}
                                        readOnly
                                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4">
                        <div className="flex-1" />
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" /> Instant Delivery
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <CreditCard size={14} className="text-blue-500" /> SSL Secured
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                onAccept={() => setTermsAccepted(true)}
                type="event"
            />


            <Footer />
        </main>
    );
}
