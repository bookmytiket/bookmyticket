"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, Video, CheckCircle2, Ticket, 
    ShieldCheck, CreditCard, ChevronLeft, Info, 
    ArrowRight, Mail, Phone, User, ExternalLink,
    Star, Sparkles, Download, Home, MessageSquare, X, Plus, Minus
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
    
    const { data: rawEvent, loading: eventLoading } = useSupabaseQuery('events', (q) => 
        q.select('*').eq('id', id).maybeSingle()
    , [id]);

    const { data: rawFeeSettings } = useSupabaseQuery('fee_settings', (q) => q.limit(1).maybeSingle(), []);

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
            // Check ticket limits
            if (qty < (c.min_tickets || 1)) return false;
            if (c.max_tickets && qty > c.max_tickets) return false;
            
            return true;
        });
    }, [availableCoupons, id, qty]);

    // Toast Timer
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
    
    // Auto-revalidate coupon on qty change
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
            {/* Custom UI Notification */}
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

            <div className="max-w-[1200px] mx-auto px-6 py-12">
                <div className="mb-12">
                    <button 
                        onClick={() => router.push(`/events/detail?id=${id}`)}
                        className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Event Registration
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left: Checkout Form */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Confirmation</h2>
                                <div className="px-4 py-2 bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    Step 2 of 2
                                </div>
                            </div>

                            <div className="space-y-10">
                                {/* Profile Info Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 text-pink-500">
                                        <User size={20} />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Attendee Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</p>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900">
                                                {user?.name || "Guest Attendee"}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</p>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 truncate">
                                                {user?.identifier || user?.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms Section */}
                                <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Terms of Attendance</h4>
                                            <p className="text-xs font-medium text-blue-700/70 leading-relaxed">Please review the event guidelines and safety protocols before proceeding.</p>
                                        </div>
                                    </div>
                                    
                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="w-6 h-6 rounded-lg border-blue-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                                            I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="underline decoration-blue-300 underline-offset-4">Event Terms & Conditions</button>
                                        </span>
                                    </label>
                                </div>

                                <button 
                                    onClick={handleConfirmPay}
                                    disabled={!termsAccepted || isProcessing}
                                    className={`
                                        w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl flex items-center justify-center gap-3
                                        ${termsAccepted && !isProcessing
                                            ? 'bg-slate-900 text-white shadow-slate-900/20 hover:scale-[1.02] active:scale-95' 
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
                                    `}
                                >
                                    {isProcessing ? (
                                        <>Preparing Tickets...</>
                                    ) : (
                                        <>{total > 0 ? "Proceed to Payment" : "Confirm My Spot"} <ArrowRight size={20} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary Sidebar */}
                    <div className="lg:col-span-5 space-y-6 sticky top-28">
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border border-slate-100">
                                        <img src={event.img} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} className="text-pink-500" /> {event.date}
                                        </div>
                                    </div>
                                </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Order Summary</h4>
                                        
                                        <div className="space-y-3">
                                            {selectedSeats.length > 0 ? (
                                                selectedSeats.map(seat => (
                                                    <div key={seat.id} className="flex justify-between items-center text-sm font-bold">
                                                        <span className="text-slate-500">Seat {seat.id} ({seat.catName})</span>
                                                        <span className="text-slate-900">₹{seat.price}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-slate-500">{selectedPackageName || "Ticket"}</span>
                                                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-fit">
                                                            <button 
                                                                onClick={() => setQty(Math.max(1, qty - 1))}
                                                                className="text-slate-400 hover:text-pink-500 transition-colors"
                                                            >
                                                                <Minus size={12} />
                                                            </button>
                                                            <span className="text-xs text-slate-900 font-black min-w-[12px] text-center">{qty}</span>
                                                            <button 
                                                                onClick={() => setQty(qty + 1)}
                                                                className="text-slate-400 hover:text-pink-500 transition-colors"
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <span className="text-slate-900">₹{baseAmount.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Coupon Section */}
                                        <div className="pt-4 border-t border-slate-50">
                                            {!appliedCoupon ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Have a Coupon?</p>
                                                        {validCoupons.length > 0 && (
                                                            <button 
                                                                onClick={() => setShowCouponsModal(true)}
                                                                className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:underline"
                                                            >
                                                                (View All)
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                            placeholder="Enter Code"
                                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none uppercase"
                                                        />
                                                        <button 
                                                            onClick={handleApplyCoupon}
                                                            disabled={isValidatingCoupon || !couponCode}
                                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all"
                                                        >
                                                            {isValidatingCoupon ? '...' : 'Apply'}
                                                        </button>
                                                    </div>
                                                    {couponError && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{couponError}</p>}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <Sparkles size={16} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{appliedCoupon.code} Applied</span>
                                                    </div>
                                                    <button onClick={removeCoupon} className="text-slate-400 hover:text-rose-500 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-slate-50">
                                            {appliedCoupon && (
                                                <div className="flex justify-between text-xs font-bold text-emerald-600">
                                                    <span>Coupon Discount</span>
                                                    <span>- ₹{discountAmount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                                <span>Platform Fee</span>
                                                <span>₹{convenienceFee.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                                <span>GST ({gstPercent}%)</span>
                                                <span>₹{gst.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                <div className="pt-8 border-t-[3px] border-dotted border-slate-100">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Amount</p>
                                            <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                                ₹{total.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="text-pink-500">
                                            <CreditCard size={32} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 space-y-4">
                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <ShieldCheck size={16} className="text-emerald-500" /> Instant Ticket Delivery
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

            {/* Available Coupons Modal */}
            <AnimatePresence>
                {showCouponsModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]"
                        >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                        Available <span className="text-pink-500">Offers</span>
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a coupon to apply</p>
                                </div>
                                <button 
                                    onClick={() => setShowCouponsModal(false)}
                                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-slate-50 transition-all text-slate-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {validCoupons.length === 0 ? (
                                    <div className="py-12 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                                            <Ticket size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No active coupons available</p>
                                    </div>
                                ) : (
                                    validCoupons.map((coupon) => (
                                        <button
                                            key={coupon.id}
                                            onClick={() => {
                                                setCouponCode(coupon.code);
                                                setShowCouponsModal(false);
                                                handleApplyCoupon(coupon.code);
                                            }}
                                            className="w-full group text-left p-6 bg-slate-50 hover:bg-pink-50 rounded-3xl border border-slate-100 hover:border-pink-200 transition-all space-y-3 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                                                <Sparkles size={40} className="text-pink-500" />
                                            </div>

                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <span className="inline-block px-3 py-1 bg-pink-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                                                        {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                                    </span>
                                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter block">{coupon.code}</h4>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-pink-500 shadow-sm group-hover:scale-110 transition-transform">
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-4 pt-2">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    <Ticket size={12} className="text-slate-300" /> Min {coupon.min_tickets} Tickets
                                                </div>
                                                {coupon.expiry_date && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                        <Calendar size={12} className="text-slate-300" /> Exp: {new Date(coupon.expiry_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100">
                                <button 
                                    onClick={() => setShowCouponsModal(false)}
                                    className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
