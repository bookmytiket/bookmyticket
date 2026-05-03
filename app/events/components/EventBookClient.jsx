"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, CheckCircle, ChevronLeft, Ticket, 
    ShieldCheck, Zap, Info, CreditCard, Users, Clock,
    ArrowRight, Star, Sparkles
} from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from '@/app/utils/feeBreakdown';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from '@/components/AuthContext';
import CalendarModal from '@/components/booking/CalendarModal';
import PackageSelector from '@/components/booking/PackageSelector';
import EventMap from './EventMap';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getCategoryForRow(categories, rIdx) {
    let sum = 0;
    for (const cat of categories) {
        const rows = Math.max(0, Math.floor(Number(cat.rows) || 0));
        if (rIdx < sum + rows) return cat;
        sum += rows;
    }
    return categories[categories.length - 1] || null;
}

function getCatColor(name) {
    const n = (name || '').toLowerCase();
    if (n === 'vip') return '#F59E0B'; // Amber
    if (n === 'gold') return '#8B5CF6'; // Violet
    if (n === 'premium') return '#3B82F6'; // Blue
    if (n === 'silver') return '#10B981'; // Emerald
    if (n === 'general') return '#6366F1'; // Indigo
    const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F43F5E'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

export default function EventBookClient({ id }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const { data: rawEvent, loading: eventLoading } = useSupabaseQuery('events', (q) => 
        q.select('*').eq('id', id).maybeSingle()
    , [id]);

    const [storageLoaded, setStorageLoaded] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);

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
            dateSlots: rawEvent.dateSlots || [],
            dynamic_config: typeof rawEvent.dynamic_config === 'string' ? JSON.parse(rawEvent.dynamic_config) : (rawEvent.dynamic_config || {})
        };
    }, [rawEvent]);

    useEffect(() => {
        if (event?.dateSlots?.length > 0 && !selectedDate) {
            setSelectedDate(new Date(event.dateSlots[0].date));
        }
    }, [event, selectedDate]);

    useEffect(() => {
        setStorageLoaded(true);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/signin?redirect=${encodeURIComponent('/events/book?id=' + id)}`);
        }
    }, [user, authLoading, id, router]);

    useEffect(() => {
        if (event?.type === 'Dynamic') {
            router.replace(`/events/detail?id=${id}`);
        }
    }, [event, id, router]);

    const { data: feeSettingsRaw } = useSupabaseQuery('fee_settings', (q) => q.limit(1).maybeSingle(), []);
    const feeSettingsSystem = feeSettingsRaw || DEFAULT_FEE_SETTINGS;
    
    const organiserId = event?.organiser_id || event?.organiserId;
    const { data: organiserData } = useSupabaseQuery('profiles', (q) => q.eq('id', organiserId).single(), [organiserId], { enabled: !!organiserId });
    
    const feeSettings = useMemo(() => {
        return resolveFeeSettings(
            feeSettingsSystem,
            organiserData,
            event?.fee_config
        );
    }, [feeSettingsSystem, organiserData, event?.fee_config]);

    const { data: bookingList } = useSupabaseQuery('bookings', (q) => q.eq('event_id', String(id)), [id]);
    
    const bookedSeats = useMemo(() => {
        if (!bookingList) return [];
        const validStatuses = ["Confirmed", "Pending", "Scanned"];
        return bookingList
            .filter(b => validStatuses.includes(b.status))
            .flatMap(b => b.selected_seats || [])
            .map(s => s.id);
    }, [bookingList]);

    const isSeatBooked = (seatId) => bookedSeats.includes(seatId);

    const isSeating = useMemo(() => {
        return event &&
            event.seatingEnabled !== false &&
            Array.isArray(event.seatCategories) &&
            event.seatCategories.length > 0 &&
            Number(event.cols) > 0;
    }, [event]);

    const totalRows = useMemo(() => {
        if (!isSeating) return 0;
        return event.seatCategories.reduce((s, c) => s + Math.max(0, Math.floor(Number(c.rows) || 0)), 0);
    }, [isSeating, event]);

    const cols = useMemo(() => Math.min(30, Math.max(0, Math.floor(Number(event?.cols) || 0))), [event]);
    const layout = event?.layoutType || 'stage';

    const toggleSeat = (seatId, cat) => {
        if (isSeatBooked(seatId)) return;
        setSelectedSeats(prev => {
            const idx = prev.findIndex(s => s.id === seatId);
            if (idx >= 0) return prev.filter(s => s.id !== seatId);
            return [...prev, { id: seatId, catName: cat.name, price: Number(cat.price) || 0, isFree: !!cat.isFree }];
        });
    };

    const totalSeatPrice = selectedSeats.reduce((s, seat) => s + (seat.isFree ? 0 : seat.price), 0);
    const ticketPrice = isSeating
        ? (selectedSeats.length > 0 ? totalSeatPrice : 0)
        : (event?.price ?? 499);
    const currentPrice = selectedPackage ? selectedPackage.price : ticketPrice;
    const baseAmount = isSeating ? totalSeatPrice : currentPrice * quantity;
    const { convenienceFee, gst, total } = getFeeBreakdown(baseAmount, feeSettings);

    if (eventLoading || !storageLoaded) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Ticket className="text-pink-500" size={30} />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-sm mb-2">Preparing Experience</p>
                        <p className="text-slate-400 text-xs font-bold">Securing your spot at {event?.title || 'the event'}...</p>
                    </div>
                </motion.div>
            </main>
        );
    }

    if (!event) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 mb-8">
                    <Info size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Event Unavailable</h1>
                <p className="text-slate-500 font-medium mb-10 max-w-sm">We couldn't locate this experience. It might have ended or moved.</p>
                <Link href="/events" className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-xl">Browse Other Events</Link>
            </main>
        );
    }

    const handleContinue = () => {
        if (isSeating && selectedSeats.length === 0) return;
        const seatParam = selectedSeats.length > 0
            ? `&seats=${encodeURIComponent(JSON.stringify(selectedSeats))}`
            : '';
        const qtyParam = !isSeating ? `&qty=${quantity}` : '';
        const packageParam = selectedPackage ? `&package=${encodeURIComponent(selectedPackage.title || selectedPackage.name)}` : '';
        const priceParam = !isSeating ? `&price=${currentPrice}` : '';
        router.push(`/events/book/checkout?id=${id}${qtyParam}${seatParam}${packageParam}${priceParam}`);
    };

    return (
        <main className="min-h-screen bg-[#FDFCFB]">
            {/* Minimal Sub-Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-[60]">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href={`/events/detail?id=${id}`} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-all group">
                        <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-slate-900 transition-colors">
                            <ChevronLeft size={16} />
                        </div>
                        <span>Back to event details</span>
                    </Link>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?u=${i + id}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="text-pink-500">12+ people</span> booking right now
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left Column: Selection Flow */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Step 1: Event Summary Card */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-bl-full -z-0" />
                            
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest mb-8 shadow-sm">
                                    <ShieldCheck size={14} /> Official Ticketing Partner
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-[0.95] mb-8">
                                    {event.title}
                                </h1>
                                
                                <div className="flex flex-wrap gap-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-pink-500 shadow-inner">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Schedule</p>
                                            <p className="text-sm font-black text-slate-900">{selectedDate ? selectedDate.toDateString() : event.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Venue</p>
                                            <p className="text-sm font-black text-slate-900">{event.location}</p>
                                        </div>
                                    </div>
                                    {event.dateSlots?.length > 0 && (
                                        <button 
                                            onClick={() => setIsCalendarOpen(true)}
                                            className="ml-auto px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-slate-900/20"
                                        >
                                            <Clock size={14} /> Change Date
                                        </button>
                                    )}
                                </div>

                                {/* Interactive Map in Summary */}
                                {event.dynamic_config?.location?.coordinates?.lat && (
                                    <div className="mt-12 pt-8 border-t border-slate-50">
                                        <EventMap 
                                            lat={event.dynamic_config.location.coordinates.lat}
                                            lng={event.dynamic_config.location.coordinates.lng}
                                            venueName={event.dynamic_config.location.venueName || event.venue}
                                            address={event.dynamic_config.location.address || event.location}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Step 2: Seating or Package Selection */}
                        <AnimatePresence mode="wait">
                            {isSeating ? (
                                <motion.div 
                                    key="seating"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-12">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Secure Your Seat</h2>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select from the interactive map below</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-pink-500 shadow-sm" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected</span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-50">
                                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sold</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Responsive Seat Map Container */}
                                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 overflow-x-auto custom-scrollbar">
                                        <div className="min-w-[600px]">
                                            {(layout === 'stage' || layout === 'rate') && (
                                                <div className="mb-16 text-center space-y-4">
                                                    <div className="h-2 w-1/2 mx-auto bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.05)]" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">STAGE AREA</p>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-4 items-center">
                                                {[...Array(totalRows)].map((_, rIdx) => {
                                                    const rowLabel = ROW_LABELS[rIdx] || `${rIdx + 1}`;
                                                    const cat = getCategoryForRow(event.seatCategories, rIdx);
                                                    const color = cat ? getCatColor(cat.name) : '#CBD5E1';
                                                    
                                                    return (
                                                        <div key={rIdx} className="flex gap-3 items-center">
                                                            <span className="w-8 text-right font-black text-[11px] text-slate-300 mr-2">{rowLabel}</span>
                                                            <div className="flex gap-2">
                                                                {[...Array(cols)].map((_, cIdx) => {
                                                                    const seatId = `${rowLabel}${cIdx + 1}`;
                                                                    const isSelected = selectedSeats.some(s => s.id === seatId);
                                                                    const isBooked = isSeatBooked(seatId);
                                                                    
                                                                    return (
                                                                        <motion.button
                                                                            key={cIdx}
                                                                            whileHover={!isBooked ? { scale: 1.2, zIndex: 10 } : {}}
                                                                            whileTap={!isBooked ? { scale: 0.9 } : {}}
                                                                            onClick={() => !isBooked && cat && toggleSeat(seatId, cat)}
                                                                            className={`
                                                                                w-7 h-8 rounded-lg flex items-center justify-center text-[8px] font-black transition-all
                                                                                ${isBooked 
                                                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none' 
                                                                                    : isSelected 
                                                                                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40 border-none' 
                                                                                        : 'bg-white border-2 hover:border-slate-900 text-slate-400'}
                                                                            `}
                                                                            style={{ borderColor: !isBooked && !isSelected ? `${color}40` : undefined }}
                                                                        >
                                                                            {cIdx + 1}
                                                                        </motion.button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <span className="w-8 text-left font-black text-[11px] text-slate-300 ml-2">{rowLabel}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Seat Pricing Key */}
                                    <div className="mt-8 flex flex-wrap gap-6 justify-center">
                                        {event.seatCategories.map(cat => (
                                            <div key={cat.name} className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCatColor(cat.name) }} />
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{cat.name}</span>
                                                <span className="text-[10px] font-bold text-pink-500">₹{cat.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="packages"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm"
                                >
                                    <PackageSelector 
                                        packages={event.ticketTypes || [
                                            { id: 'gen', title: 'Ticket', price: ticketPrice, description: 'Standard admission for the event.', features: ['Access to main area', 'General Seating'] }
                                        ]}
                                        selectedPackage={selectedPackage}
                                        onSelect={setSelectedPackage}
                                        type="event"
                                    />
                                    
                                    <AnimatePresence>
                                        {selectedPackage && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8"
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 text-center md:text-left">Tickets</p>
                                                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                                            <button 
                                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 font-black text-xl hover:scale-105 transition-all shadow-sm"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="text-xl font-black text-slate-900 w-12 text-center">{quantity}</span>
                                                            <button 
                                                                onClick={() => setQuantity(q => q + 1)}
                                                                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 font-black text-xl hover:scale-105 transition-all shadow-sm"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:block">
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Unit Price</p>
                                                        <p className="text-2xl font-black text-slate-900 tracking-tight">₹{selectedPackage.price}</p>
                                                    </div>
                                                </div>
                                                
                                                <button 
                                                    onClick={handleContinue}
                                                    className="w-full md:w-auto px-16 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3"
                                                >
                                                    Secure Booking <ArrowRight size={20} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="px-6">
                            <BookingDisclaimer type="event" />
                        </div>
                    </div>

                    {/* Right Column: Checkout Summary */}
                    <div className="lg:col-span-4 sticky top-28 space-y-6">
                        
                        {/* Summary Card */}
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
                            <div className="h-40 relative">
                                <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                                    <Star size={12} className="text-yellow-500 fill-yellow-500" /> Top Rated Experience
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Order Review</h4>
                                    
                                    <div className="space-y-4">
                                        {isSeating && selectedSeats.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedSeats.map(seat => (
                                                    <div key={seat.id} className="flex justify-between items-center group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-pink-500" />
                                                            <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Seat {seat.id}</span>
                                                        </div>
                                                        <span className="text-[13px] font-black text-slate-900">{seat.isFree ? 'FREE' : `₹${seat.price}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : !isSeating && selectedPackage ? (
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="space-y-0.5">
                                                    <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{selectedPackage.title || selectedPackage.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">× {quantity} Tickets</p>
                                                </div>
                                                <span className="text-[15px] font-black text-slate-900">₹{(currentPrice * quantity).toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                <Ticket className="mx-auto text-slate-300 mb-3" size={32} />
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No selection yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    <div className="flex justify-between items-center text-[13px] font-bold text-slate-500">
                                        <span>Subtotal</span>
                                        <span>₹{baseAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[13px] font-bold text-slate-500">
                                        <span>Fees + GST</span>
                                        <span>₹{(convenienceFee + gst).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="pt-8 border-t-[3px] border-dotted border-slate-100">
                                    <div className="flex justify-between items-end mb-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Total</p>
                                            <div className="flex items-center gap-2 text-3xl font-black text-slate-900 tracking-tighter">
                                                ₹{total.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={12} fill="currentColor" /> Best Rate
                                        </div>
                                    </div>

                                    {isSeating && (
                                        <button 
                                            onClick={handleContinue}
                                            disabled={selectedSeats.length === 0}
                                            className={`
                                                w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[13px] transition-all shadow-xl
                                                ${selectedSeats.length > 0 
                                                    ? 'bg-slate-900 text-white shadow-slate-900/20 hover:scale-[1.02] active:scale-95' 
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
                                            `}
                                        >
                                            {selectedSeats.length > 0 ? `Continue with ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}` : 'Select your seat'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-col gap-4 px-6">
                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <ShieldCheck size={16} className="text-emerald-500" /> 256-bit Secure Transaction
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <CreditCard size={16} className="text-blue-500" /> Supported: Cards, UPI, Netbanking
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CalendarModal 
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                selectedDate={selectedDate}
                onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                }}
                availableDates={event.dateSlots?.map(s => s.date) || []}
            />
        </main>
    );
}

function BookingDisclaimer({ type }) {
    return (
        <div className="space-y-4 text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
            <div className="flex gap-3">
                <Info size={14} className="shrink-0 text-slate-300" />
                <p>By proceeding with this booking, you agree to the event's terms and conditions. Tickets are non-refundable unless specified otherwise by the organizer.</p>
            </div>
            <div className="flex gap-3">
                <ShieldCheck size={14} className="shrink-0 text-slate-300" />
                <p>Ensure your participant details are accurate. Changes may not be allowed after the registration deadline.</p>
            </div>
        </div>
    );
}
