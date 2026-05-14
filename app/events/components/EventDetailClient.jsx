"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { 
    Calendar, MapPin, Clock, Users, Languages, Share2, Heart, 
    CheckCircle, ShieldCheck, Warehouse, Info, Sparkles, ChevronRight,
    ArrowRight, CheckCircle2, InfoIcon, ArrowLeft, Phone, MessageCircle, ChevronDown, HelpCircle,
    Trophy
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import Footer from '@/components/Footer';
import EventMap from './EventMap';
import { getFeeBreakdown, resolveFeeSettings, DEFAULT_FEE_SETTINGS } from '@/app/utils/feeBreakdown';
import TournamentRegistration from '@/app/organiser/components/TournamentRegistration';
import ReviewsSection from '@/components/ReviewsSection';
import WishlistButton from '@/components/WishlistButton';

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

function parseEventDate(dateStr, timeStr) {
    try {
        let dt = dateStr;
        let t = timeStr || '23:59';
        if (!dt) return null;
        dt = String(dt).trim();
        t = String(t).trim();
        if (dt.includes(' ') && !dt.includes('T')) {
            const parts = dt.split(' ');
            dt = parts[0];
            if (!t || t === '23:59') t = parts[1] || '23:59';
        }
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
    const [showTournamentReg, setShowTournamentReg] = useState(false);
    useEffect(() => { setStorageLoaded(true); }, []);

    const { data: rawEvent, loading: eventLoading } = useSupabaseQuery('events', (q) => 
        q.select('*').eq('id', id).maybeSingle()
    , [id]);

    const { data: userBookings } = useSupabaseQuery('bookings', (q) => 
        user ? q.select('*').eq('user_id', user.id).eq('event_id', id) : q.select('*').limit(0)
    , [user, id]);

    const confirmedBooking = userBookings?.find(b => 
        b.status === 'Confirmed' || b.payment_status === 'paid' || b.payment_status === 'SUCCESS'
    );
    const existingBooking = !!confirmedBooking;
    
    // Fetch Marathon/Tournament Specifics
    const isMarathon = rawEvent?.type === 'Marathon';
    const isTournament = rawEvent?.type === 'Tournament' || rawEvent?.type === 'Tournament Event';
    
    const { data: tournamentDetails } = useSupabaseQuery('tournament_events', (q) => 
        q.select('*').eq('id', id).maybeSingle()
    , [id], { enabled: isTournament });

    const { data: registeredTeams } = useSupabaseQuery('tournament_teams', (q) => 
        q.select('*').eq('tournament_event_id', tournamentDetails?.id || id)
    , [tournamentDetails?.id, id], { enabled: isTournament, refreshOn: ['tournament_teams'] });

    const event = useMemo(() => {
        if (!rawEvent) return null;
        const dynLoc = rawEvent.dynamic_config?.location;
        const location = dynLoc?.address || rawEvent.location || rawEvent.venue || rawEvent.address || 'Venue';
        const city = rawEvent.city || dynLoc?.city || (location && location.split(',')[0]?.trim()) || '—';
        const venue = dynLoc?.venueName || rawEvent.venue || rawEvent.location || location;
        
        return {
            ...rawEvent,
            id: rawEvent.id,
            img: rawEvent.img || rawEvent.bannerPreview || DEFAULT_IMG,
            title: rawEvent.title || 'Event',
            date: rawEvent.date || 'TBA',
            time: rawEvent.time || '',
            location,
            venue,
            city,
            price: rawEvent.price ?? 0,
            category: rawEvent.category || 'Event',
            amenities: rawEvent.dynamic_config?.amenities || DEFAULT_FEATURES,
            isFree: Number(rawEvent.price) === 0,
            description: rawEvent.description || 'Join us for this event. Book your tickets now.',
            features: (rawEvent.dynamic_config?.amenities?.length > 0 ? rawEvent.dynamic_config.amenities : null) || (rawEvent.dynamic_config?.features?.length > 0 ? rawEvent.dynamic_config.features : null) || (Array.isArray(rawEvent.features) && rawEvent.features.length > 0 ? rawEvent.features : DEFAULT_FEATURES),
            refundPolicy: Array.isArray(rawEvent.refundPolicy) && rawEvent.refundPolicy.length > 0 ? rawEvent.refundPolicy : DEFAULT_REFUND,
            parking: rawEvent.parking || 'Paid Parking Available at the Venue.',
            tags: Array.isArray(rawEvent.tags) && rawEvent.tags.length > 0 ? rawEvent.tags : [rawEvent.category || 'Event'].filter(Boolean),
            dateSlots: rawEvent.dateSlots || [],
            dynamic_config: typeof rawEvent.dynamic_config === 'string' ? JSON.parse(rawEvent.dynamic_config) : (rawEvent.dynamic_config || {})
        };
    }, [rawEvent]);

    const eventDate = parseEventDate(event?.date, event?.time);
    const isExpired = eventDate ? eventDate < new Date() : false;

    useEffect(() => {
        if (!event || typeof window === 'undefined' || isExpired) return;
        try {
            const key = 'recently_viewed_events';
            const raw = localStorage.getItem(key);
            const list = raw ? JSON.parse(raw) : [];
            const item = { id: event.id, title: event.title, img: event.img, date: event.date, location: event.location, type: event.type || 'Paid' };
            const filtered = list.filter((e) => String(e.id) !== String(event.id));
            const next = [item, ...filtered].slice(0, 12);
            localStorage.setItem(key, JSON.stringify(next));
        } catch (_) { }
    }, [event, isExpired]);

    const [selectedCatId, setSelectedCatId] = useState(null);
    const [marathonCategories, setMarathonCategories] = useState([]);

    const { data: marathonData } = useSupabaseQuery('marathon_categories', (q) => 
        q.select('*').eq('marathon_id', id).order('distance_km', { ascending: true })
    , [id], { enabled: isMarathon });

    useEffect(() => {
        if (marathonData) {
            setMarathonCategories(marathonData);
        } else if (isMarathon && event?.dynamic_config?.marathonCategories) {
            setMarathonCategories(event.dynamic_config.marathonCategories);
        }
    }, [marathonData, isMarathon, event?.dynamic_config]);

    const parsedConfig = useMemo(() => {
        if (!event?.dynamic_config) return {};
        try {
            return typeof event.dynamic_config === 'string' 
                ? JSON.parse(event.dynamic_config) 
                : event.dynamic_config;
        } catch (e) {
            console.error("Config parse error:", e);
            return {};
        }
    }, [event?.dynamic_config]);

    const categories = useMemo(() => {
        if (isMarathon && marathonCategories?.length > 0) {
            return marathonCategories.map(c => ({
                id: c.id,
                name: `${c.category_name} (${c.distance_km}KM) - ${c.age_group}`,
                price: c.price,
                distance: c.distance_km,
                ageGroup: c.age_group
            }));
        }
        if (isTournament) {
            // Priority 1: tournamentDetails from re-fetch
            // Priority 2: sports_details from already-loaded rawEvent (Prevents race condition flicker)
            const fee = Number(tournamentDetails?.registration_fee || event?.dynamic_config?.sports_details?.registration_fee || event?.price || 0);
            return [{
                id: tournamentDetails?.id || event?.id,
                name: "Team Registration",
                price: fee
            }];
        }
        return parsedConfig?.categories || [];
    }, [isMarathon, marathonCategories, isTournament, tournamentDetails, event, parsedConfig?.categories]);
    const selectedCat = useMemo(() => {
        if (categories.length === 0) return null;
        return categories.find(c => c.id === selectedCatId) || categories[0];
    }, [categories, selectedCatId]);

    const { data: feeSettingsRaw } = useSupabaseQuery('fee_settings', (q) => q.limit(1).maybeSingle(), []);
    const feeSettingsSystem = feeSettingsRaw || DEFAULT_FEE_SETTINGS;
    const organiserId = event?.organiser_id || event?.organiserId;
    const { data: organiserData } = useSupabaseQuery('profiles', (q) => q.eq('id', organiserId).single(), [organiserId], { enabled: !!organiserId });

    const feeSettings = useMemo(() => {
        return resolveFeeSettings(feeSettingsSystem, organiserData, event?.fee_config);
    }, [feeSettingsSystem, organiserData, event?.fee_config]);

    const displayPrice = selectedCat ? selectedCat.price : (parsedConfig?.price || event?.price || 0);
    
    const fees = useMemo(() => {
        return getFeeBreakdown(displayPrice, feeSettings);
    }, [displayPrice, feeSettings]);

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

    return (
        <main className="min-h-screen bg-slate-50/50">
            {/* --- FLOATING BACK BUTTON --- */}
            <div className="fixed top-6 left-6 z-[100] pointer-events-none">
                <button 
                    onClick={() => router.push("/")}
                    className="pointer-events-auto p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/20 text-slate-600 hover:text-pink-500 hover:scale-110 transition-all group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Header */}
                <div className="w-full py-8 md:py-12 rounded-[32px] overflow-hidden shadow-xl relative mb-6 bg-slate-900 border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-600/10 to-transparent opacity-50" />
                    <div className="relative z-10 px-8 md:px-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <Sparkles size={14} /> Featured Experience
                        </div>
                        <h1 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight leading-[0.9] mb-6 max-w-4xl">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-10 text-white/60 font-bold uppercase text-[12px] tracking-[0.15em]">
                            <div className="flex items-center gap-3">
                                <Calendar size={20} className="text-pink-500" /> 
                                {event.date}{event.end_date && event.end_date !== event.date ? ` - ${event.end_date}` : ''}
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock size={20} className="text-pink-500" /> 
                                {event.time}{event.end_time ? ` - ${event.end_time}` : ''}
                            </div>
                            <div className="flex items-center gap-3"><MapPin size={20} className="text-pink-500" /> {event.venue}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Main Content */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-10">
                            {isTournament && tournamentDetails && (
                                <div className="mb-12 space-y-8">
                                    <div className="p-8 bg-slate-900 rounded-[3rem] text-white border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                        
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-pink-400">
                                                    <Trophy size={32} />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Tournament Details</h2>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tournamentDetails.sport_type} Competition</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Format</p>
                                                    <p className="text-sm font-black text-white uppercase">{tournamentDetails.tournament_format}</p>
                                                </div>
                                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Size</p>
                                                    <p className="text-sm font-black text-white">{tournamentDetails.min_team_size}-{tournamentDetails.max_team_size} Players</p>
                                                </div>
                                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Registered</p>
                                                    <p className="text-sm font-black text-pink-400">{registeredTeams?.length || 0} Teams</p>
                                                </div>
                                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Prize Pool</p>
                                                    <p className="text-sm font-black text-emerald-400">₹{tournamentDetails.metadata?.prizePool || "TBA"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {registeredTeams?.length > 0 && (
                                        <div className="space-y-6">
                                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                                <Users size={24} className="text-pink-500" /> Registered Teams
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {registeredTeams.map(team => (
                                                    <div key={team.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-5 hover:border-pink-200 transition-all group">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                                            {team.team_logo_url ? <img src={team.team_logo_url} className="w-full h-full object-cover" /> : <Users size={24} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-black text-slate-900 uppercase truncate">{team.team_name}</h3>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Captain: {team.captain_name}</p>
                                                        </div>
                                                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase">Confirmed</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="h-px bg-slate-100 w-full" />
                                </div>
                            )}

                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-3">
                                <Info className="text-pink-500" size={24} /> About the Event
                            </h2>
                            <p className="text-[15px] font-medium text-slate-600 leading-relaxed whitespace-pre-line mb-8">
                                {event.description}
                            </p>
                            
                            <hr className="border-slate-100 mb-8" />
                            
                            {(parsedConfig?.location?.coordinates?.lat || event.latitude) && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tight">
                                        <MapPin className="text-pink-500" size={24} /> Venue Location
                                    </h2>
                                    <EventMap 
                                        lat={parsedConfig?.location?.coordinates?.lat || event.latitude}
                                        lng={parsedConfig?.location?.coordinates?.lng || event.longitude}
                                        venueName={parsedConfig?.location?.venueName || event.venue}
                                        address={parsedConfig?.location?.address || event.address}
                                    />
                                </div>
                            )}

                            <hr className="border-slate-100 my-8" />
                            
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-3">
                                <Warehouse className="text-pink-500" size={24} /> Venue & Amenities
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {event.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl">
                                            {feature.icon || "✓"}
                                        </div>
                                        <span className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">{feature.label || feature}</span>
                                    </div>
                                ))}
                            </div>

                            {parsedConfig?.faqs?.length > 0 && (
                                <div className="mt-12">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                                        <HelpCircle className="text-pink-500" size={24} /> Frequently Asked Questions
                                    </h2>
                                    <div className="space-y-4">
                                        {parsedConfig.faqs.map((faq, idx) => (
                                            <details key={idx} className="group p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all cursor-pointer">
                                                <summary className="flex items-center justify-between font-bold text-slate-800 uppercase tracking-wider text-[12px] list-none">
                                                    {faq.question}
                                                    <ChevronDown className="group-open:rotate-180 transition-transform text-pink-500" size={18} />
                                                </summary>
                                                <p className="mt-4 text-[13px] font-medium text-slate-600 leading-relaxed normal-case tracking-normal">
                                                    {faq.answer}
                                                </p>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedConfig?.terms && (
                                <div className="mt-12 p-8 bg-amber-50/50 rounded-[32px] border border-amber-100/50">
                                    <h2 className="text-lg font-black text-amber-900 uppercase tracking-tight mb-4 flex items-center gap-3">
                                        <ShieldCheck className="text-amber-500" size={22} /> Event Rules & Terms
                                    </h2>
                                    <div className="text-[12px] font-semibold text-amber-800/80 leading-relaxed whitespace-pre-wrap uppercase tracking-wider">
                                        {parsedConfig.terms}
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 p-8 bg-slate-900 rounded-[32px] text-white">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Organised By</h2>
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black">
                                        {(parsedConfig?.organiser_name || event.organiser || "O")[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">{parsedConfig?.organiser_name || event.organiser || "Ticket9 Partner"}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            {parsedConfig?.communication?.supportNumber && (
                                                <a href={`tel:${parsedConfig.communication.supportNumber}`} className="flex items-center gap-2 text-[10px] font-bold text-pink-400 uppercase tracking-widest hover:text-pink-300">
                                                    <Phone size={12} /> Support
                                                </a>
                                            )}
                                            {parsedConfig?.communication?.whatsappLink && (
                                                <a href={parsedConfig.communication.whatsappLink} target="_blank" className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300">
                                                    <MessageCircle size={12} /> WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-10 mt-6">
                            <ReviewsSection eventId={id} />
                        </div>
                    </div>

                    {/* Booking Sidebar */}
                    <div className="lg:col-span-4 sticky top-[20px]">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-6">
                            {existingBooking ? (
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Your Booking</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">Confirmed</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/profile?tab=my_booking')} 
                                        className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-bold uppercase tracking-widest text-[13px] shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        View My Tickets
                                    </button>
                                    <button 
                                        onClick={() => confirmedBooking ? window.location.reload() : null} // This is a trick to bypass existingBooking if user clicks "Book Again"
                                        className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-pink-500 transition-colors"
                                        style={{ display: 'none' }} // We'll show it below in a cleaner way
                                    >
                                        Register Another
                                    </button>
                                    <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase text-center italic">Want to register another {isTournament ? 'team' : 'ticket'}?</p>
                                        <button 
                                            onClick={() => {
                                                // Temporarily hide existing booking to allow new registration
                                                const url = `/events/book?id=${id}${isTournament ? '' : ''}`;
                                                router.push(url);
                                            }}
                                            className="text-[11px] font-black text-pink-500 uppercase tracking-widest hover:underline text-center"
                                        >
                                            Click here to Register Again
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ticket Price</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                                ₹{displayPrice}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                /{isTournament ? 'team' : 'person'}
                                            </span>
                                        </div>
                                    </div>

                                    {categories.length > 1 && (
                                        <div className="space-y-3 py-4 border-t border-slate-50">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Category</p>
                                            <div className="space-y-2">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setSelectedCatId(cat.id)}
                                                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                                                            (selectedCatId === cat.id || (!selectedCatId && cat === categories[0]))
                                                                ? 'border-pink-500 bg-pink-50/50'
                                                                : 'border-slate-100 bg-slate-50 hover:border-pink-200'
                                                        }`}
                                                    >
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{cat.name}</p>
                                                            <p className="text-[10px] font-bold text-pink-500 mt-0.5">₹{cat.price}</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                                            (selectedCatId === cat.id || (!selectedCatId && cat === categories[0]))
                                                                ? 'bg-pink-500 border-pink-500 text-white'
                                                                : 'bg-white border-slate-200 group-hover:border-pink-300'
                                                        }`}>
                                                            {(selectedCatId === cat.id || (!selectedCatId && cat === categories[0])) && <CheckCircle size={12} />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isExpired ? (
                                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                            <ShieldCheck size={16} className="text-rose-500" />
                                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Closed</p>
                                        </div>
                                    ) : isTournament ? (
                                        <div className="space-y-4">
                                            <button 
                                                onClick={() => router.push('/events/book?id=' + id)}
                                                className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Register Team
                                            </button>
                                            {event.dynamic_config?.audienceFreeAccess && (
                                                <button 
                                                    onClick={() => router.push(`/events/book?id=${id}&type=audience_free`)}
                                                    className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all"
                                                >
                                                    Get Free Visitor Pass
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                const bookUrl = `/events/book?id=${id}${selectedCatId ? `&catId=${selectedCatId}` : ''}`;
                                                if (!user) router.push(`/signin?redirect=${encodeURIComponent(bookUrl)}`);
                                                else router.push(bookUrl);
                                            }}
                                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[24px] font-bold uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            {event.isFree ? "Register for Free" : (isMarathon ? "Register Now" : "Reserve Spot Now")}
                                        </button>
                                    )}
                                </>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <button 
                                    onClick={() => {
                                        const lat = parsedConfig?.location?.coordinates?.lat || event.latitude;
                                        const lng = parsedConfig?.location?.coordinates?.lng || event.longitude;
                                        if (lat && lng) window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                                    }}
                                    className="w-full py-4 rounded-[28px] border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                                >
                                    <MapPin size={14} className="text-[#f84464]" /> View on Maps
                                </button>
                            </div>
                            
                            <div className="mt-8 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <ShieldCheck size={16} className="text-green-500" /> Secure Checkout
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <CheckCircle size={16} className="text-green-500" /> Instant Delivery
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />

            {showTournamentReg && (
                <TournamentRegistration 
                    event={event} 
                    onClose={() => setShowTournamentReg(false)} 
                />
            )}
        </main>
    );
}
