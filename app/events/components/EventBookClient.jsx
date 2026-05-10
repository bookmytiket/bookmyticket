"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import VisualSeatPicker from './VisualSeatPicker';

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
    const searchParams = useSearchParams();

    useEffect(() => {
        const catId = searchParams.get('catId');
        if (catId) {
            setSelectedCatId(catId);
        }
    }, [searchParams]);

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

    const [relationalSeats, setRelationalSeats] = useState([]);

    useEffect(() => {
        if (!id || !isSeating) return;
        
        const fetchRelationalData = async () => {
            // 1. Get Venue Layout
            const { data: layout } = await supabase.from('venue_layouts').select('id').eq('event_id', id).maybeSingle();
            if (!layout) return;

            // 2. Get Blocks & Seats
            const { data: blocksData } = await supabase.from('seat_blocks').select('id, block_name').eq('venue_layout_id', layout.id);
            if (blocksData?.length > 0) {
                const blockIds = blocksData.map(b => b.id);
                const { data: seatsData } = await supabase.from('seats').select('*').in('block_id', blockIds);
                if (seatsData) setRelationalSeats(seatsData);

                // 3. Subscribe to Realtime Updates
                const subscription = supabase
                    .channel(`seats_${id}`)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seats' }, (payload) => {
                        setRelationalSeats(current => 
                            current.map(s => s.id === payload.new.id ? payload.new : s)
                        );
                    })
                    .subscribe();

                return () => supabase.removeChannel(subscription);
            }
        };

        fetchRelationalData();
    }, [id, isSeating]);

    const bookedSeats = useMemo(() => {
        return relationalSeats.filter(s => s.status !== 'available').map(s => {
            const block = event?.blocks?.find(b => b.id === s.block_id) || { name: 'Unknown' };
            return `${block.name}-${s.row_name}-${s.seat_number}`;
        });
    }, [relationalSeats, event?.blocks]);

    const isSeatBooked = (seatId) => bookedSeats.includes(seatId);

    const isSeating = useMemo(() => {
        return event &&
            (
                (event.seatingEnabled !== false && Array.isArray(event.seatCategories) && event.seatCategories.length > 0 && Number(event.cols) > 0) ||
                (Array.isArray(event.blocks) && event.blocks.length > 0)
            );
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
            return [...prev, { 
                id: seatId, 
                catName: cat.name || cat.category_name || cat.title || 'General', 
                price: Number(cat.price) || 0, 
                isFree: !!cat.isFree 
            }];
        });
    };

    const totalSeatPrice = selectedSeats.reduce((s, seat) => s + (seat.isFree ? 0 : seat.price), 0);
    const ticketPrice = isSeating
        ? (selectedSeats.length > 0 ? totalSeatPrice : 0)
        : (event?.dynamic_config?.price || event?.price || 499);
    const currentPrice = selectedPackage ? selectedPackage.price : ticketPrice;
    const baseAmount = isSeating ? totalSeatPrice : currentPrice * quantity;
    const { convenienceFee, gst, total } = getFeeBreakdown(baseAmount, feeSettings);

    const isMarathon = event?.type === 'Marathon';
    const [bookingStep, setBookingStep] = useState(1);
    const [participantData, setParticipantData] = useState({});

    const marathonSteps = [
        { id: 1, title: "Category", icon: Ticket },
        { id: 2, title: "Identity", icon: Users },
        { id: 3, title: "Details", icon: Info },
        { id: 4, title: "Amenities", icon: Sparkles },
        { id: 5, title: "Review", icon: CheckCircle },
        { id: 6, title: "Payment", icon: CreditCard }
    ];

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
        if (isMarathon) {
            if (bookingStep < 5) {
                if (bookingStep === 1 && !selectedPackage) return;
                setBookingStep(bookingStep + 1);
                return;
            }
        }

        if (isSeating && selectedSeats.length === 0) return;
        const seatParam = selectedSeats.length > 0
            ? `&seats=${encodeURIComponent(JSON.stringify(selectedSeats))}`
            : '';
        const qtyParam = !isSeating ? `&qty=${quantity}` : '';
        const packageParam = selectedPackage ? `&package=${encodeURIComponent(selectedPackage.title || selectedPackage.name)}` : '';
        const priceParam = !isSeating ? `&price=${currentPrice}` : '';
        const participantParam = isMarathon ? `&participant=${encodeURIComponent(JSON.stringify(participantData))}` : '';
        
        router.push(`/events/book/checkout?id=${id}${qtyParam}${seatParam}${packageParam}${priceParam}${participantParam}`);
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
                    
                    {isMarathon ? (
                        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
                            {marathonSteps.map((s, idx) => (
                                <React.Fragment key={s.id}>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] transition-all ${
                                            bookingStep >= s.id ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                            <s.icon size={14} />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${bookingStep >= s.id ? 'text-slate-900' : 'text-slate-300'}`}>
                                            {s.title}
                                        </span>
                                    </div>
                                    {idx < marathonSteps.length - 1 && <div className="w-4 h-[1px] bg-slate-100" />}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
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
                    )}
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left Column: Selection Flow */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {isMarathon && (
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                                    {marathonSteps[bookingStep - 1].title} Registration
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {bookingStep} of 6</p>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* Step 1: Category Selection */}
                            {(!isMarathon || bookingStep === 1) && (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm"
                                >
                                    {isSeating && event.blocks?.length > 0 ? (
                                        <div className="space-y-8">
                                            <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Architectural Selection</h2>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Interactive Venue Interface</p>
                                            </div>
                                            <VisualSeatPicker 
                                                blocks={event.blocks}
                                                categories={event.dynamic_config?.categories || event.seat_categories || []}
                                                bookedSeats={bookedSeats}
                                                selectedSeats={selectedSeats}
                                                onToggleSeat={toggleSeat}
                                                backgroundUrl={event.seat_map_background_url}
                                            />
                                        </div>
                                    ) : (
                                        <PackageSelector 
                                            packages={event.ticketTypes || event.dynamic_config?.categories || [
                                                { id: 'gen', title: 'Ticket', price: ticketPrice, description: 'Standard admission for the event.', features: ['Access to main area', 'General Seating'] }
                                            ]}
                                            selectedPackage={selectedPackage}
                                            onSelect={(p) => {
                                                setSelectedPackage(p);
                                                if (!isMarathon) setQuantity(1);
                                            }}
                                            type={isMarathon ? "marathon" : "event"}
                                        />
                                    )}
                                    
                                    {!isMarathon && (selectedPackage || (isSeating && selectedSeats.length > 0)) && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8"
                                        >
                                            <div className="flex items-center gap-8">
                                                {!isSeating && (
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Tickets</p>
                                                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black shadow-sm">−</button>
                                                            <span className="text-xl font-black w-12 text-center">{quantity}</span>
                                                            <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black shadow-sm">+</button>
                                                        </div>
                                                    </div>
                                                )}
                                                {isSeating && (
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Selected</p>
                                                        <p className="text-xl font-black">{selectedSeats.length} Seat{selectedSeats.length !== 1 ? 's' : ''}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={handleContinue} className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl">Secure Booking <ArrowRight size={16} /></button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Marathon Step 2: Identity */}
                            {isMarathon && bookingStep === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Full Name (As on ID)</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-pink-500"
                                                placeholder="Enter full name"
                                                value={participantData.fullName || ""}
                                                onChange={e => setParticipantData({...participantData, fullName: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-pink-500"
                                                placeholder="name@email.com"
                                                value={participantData.email || ""}
                                                onChange={e => setParticipantData({...participantData, email: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Phone Number</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-pink-500"
                                                placeholder="+91 XXXXX XXXXX"
                                                value={participantData.phone || ""}
                                                onChange={e => setParticipantData({...participantData, phone: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Date of Birth</label>
                                            <input 
                                                type="date"
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-pink-500"
                                                value={participantData.dob || ""}
                                                onChange={e => setParticipantData({...participantData, dob: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Marathon Step 3: Details (Custom Fields) */}
                            {isMarathon && bookingStep === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {(event.dynamic_config?.form_fields || []).map(field => (
                                            <div key={field.id}>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                                                    {field.label} {field.required && <span className="text-pink-500">*</span>}
                                                </label>
                                                {field.type === 'select' ? (
                                                    <select 
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none"
                                                        onChange={e => setParticipantData({...participantData, [field.label]: e.target.value})}
                                                    >
                                                        <option value="">Select Option</option>
                                                        {(Array.isArray(field.options) ? field.options : (typeof field.options === 'string' ? field.options.split(',').map(s => s.trim()) : ['S', 'M', 'L', 'XL', 'XXL'])).map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                ) : (
                                                    <input 
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-pink-500"
                                                        placeholder={`Enter ${field.label}`}
                                                        onChange={e => setParticipantData({...participantData, [field.label]: e.target.value})}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        {(!event.dynamic_config?.form_fields || event.dynamic_config.form_fields.length === 0) && (
                                            <div className="col-span-2 text-center py-12">
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No additional details required</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Marathon Step 4: Amenities */}
                            {isMarathon && bookingStep === 4 && (
                                <motion.div 
                                    key="step4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm"
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {(event.dynamic_config?.benefits || [
                                            { benefit_name: "Finisher Medal", icon_key: "medal" },
                                            { benefit_name: "Technical T-Shirt", icon_key: "tshirt" },
                                            { benefit_name: "E-Certificate", icon_key: "certificate" },
                                            { benefit_name: "Post-Run Breakfast", icon_key: "breakfast" }
                                        ]).map((ben, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-pink-500 shadow-sm">
                                                    <Star size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-slate-900 text-center leading-tight">{ben.benefit_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Marathon Step 5: Review */}
                            {isMarathon && bookingStep === 5 && (
                                <motion.div 
                                    key="step5"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8"
                                >
                                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Runner Details</span>
                                            <button onClick={() => setBookingStep(2)} className="text-[10px] font-black text-pink-500 uppercase">Edit</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-4">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</p>
                                                <p className="text-xs font-black text-slate-900 uppercase">{participantData.fullName}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</p>
                                                <p className="text-xs font-black text-pink-500 uppercase">{selectedPackage?.name || selectedPackage?.title}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <p className="text-[10px] font-bold text-emerald-700 uppercase leading-tight">Everything looks good! Proceed to secure payment gateway.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons for Marathon */}
                        {isMarathon && (
                            <div className="flex justify-between items-center pt-8">
                                <button 
                                    onClick={() => bookingStep > 1 && setBookingStep(bookingStep - 1)}
                                    className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${bookingStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'}`}
                                >
                                    Previous Step
                                </button>
                                <button 
                                    onClick={handleContinue}
                                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                                >
                                    {bookingStep === 5 ? 'Confirm & Pay' : 'Next Step'} <ArrowRight size={16} />
                                </button>
                            </div>
                        )}


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
                                                w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-lg
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
