"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, Clock, Users, Languages, ShieldCheck, 
    CheckCircle, Warehouse, Info, ChevronDown, Star, Share2, 
    Heart, Video, Lock, ExternalLink, Play, CheckCircle2, 
    Sparkles, Phone, Mail, MessageCircle, Timer, Award, 
    HeartPulse, Coffee, Utensils, Home, Car, Shirt, Camera, 
    Target, Trophy, Activity, FileText, Zap, Smile, ChevronRight,
    Plus, Minus, X, DollarSign, ArrowLeft, ArrowRight, CreditCard,
    AlertTriangle, Map
} from 'lucide-react';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from '@/components/AuthContext';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from '@/app/utils/feeBreakdown';
import EventMap from './EventMap';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ 
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap'
});

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

const AMENITY_ICONS = {
    Ambulance: Activity,
    FirstAid: HeartPulse,
    Certificate: FileText,
    Medal: Award,
    TShirt: Shirt,
    Breakfast: Coffee,
    Refreshments: Utensils,
    Accommodation: Home,
    Parking: Car,
    Safety: ShieldCheck,
    Family: Smile,
    CashPrize: DollarSign,
    Trophy: Trophy,
    Bib: Target,
    Selfie: Camera,
    Washroom: CheckCircle2
};

export default function DynamicEventClient({ event }) {
    const { user } = useAuth();
    const router = useRouter();
    const config = useMemo(() => {
        if (!event.dynamic_config) return {};
        try {
            return typeof event.dynamic_config === 'string' ? JSON.parse(event.dynamic_config) : event.dynamic_config;
        } catch (e) {
            console.error("Failed to parse dynamic_config:", e);
            return {};
        }
    }, [event.dynamic_config]);
    
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedAgeRate, setSelectedAgeRate] = useState(null);
    const [selectedKM, setSelectedKM] = useState(null);
    const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });
    const [notification, setNotification] = useState(null);

    // Initialize selected KM if marathon categories exist
    useEffect(() => {
        if (config?.marathonCategories?.length > 0 && !selectedKM) {
            const kms = [...new Set(config.marathonCategories.map(c => c.distance_km))].sort((a, b) => a - b);
            if (kms.length > 0) setSelectedKM(kms[0]);
        }
    }, [config?.marathonCategories, selectedKM]);

    // Handle timer
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const registrationDeadline = useMemo(() => {
        if (config.registrationEnd) return new Date(config.registrationEnd).getTime();
        if (config.countdown?.deadline) return new Date(config.countdown.deadline).getTime();
        if (event.expiry_date) return new Date(event.expiry_date).getTime();
        // Fallback to event date if no specific registration end is set
        if (event.date) {
            const d = new Date(event.date);
            d.setHours(23, 59, 59);
            return d.getTime();
        }
        return null;
    }, [config.registrationEnd, config.countdown?.deadline, event.expiry_date, event.date]);

    const isRegistrationClosed = useMemo(() => {
        if (!registrationDeadline) return false;
        return new Date().getTime() > registrationDeadline;
    }, [registrationDeadline]);

    // Handle timer
    useEffect(() => {
        if (!registrationDeadline || isRegistrationClosed) return;
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = registrationDeadline - now;
            
            if (diff <= 0) {
                setTimeLeft({ days: 0, hrs: 0, min: 0, sec: 0 });
            } else {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hrs: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    min: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                    sec: Math.floor((diff % (1000 * 60)) / 1000)
                });
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [registrationDeadline, isRegistrationClosed]);

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

    // Robust age rate normalization
    const normalizedAgeRates = useMemo(() => {
        if (!selectedCategory) return [];
        const rawRates = selectedCategory.ageRates || selectedCategory.agePricing || selectedCategory.age_rates || selectedCategory.age_pricing || config.ageRates || config.agePricing || [];
        return (Array.isArray(rawRates) ? rawRates : []).map(r => ({
            id: `${r.min || r.minAge}-${r.max || r.maxAge}`,
            min: parseInt(r.min || r.minAge || 0),
            max: parseInt(r.max || r.maxAge || 999),
            price: parseFloat(r.price || 0)
        }));
    }, [selectedCategory, config.ageRates, config.agePricing]);

    const calculatedPrice = useMemo(() => {
        if (!selectedCategory) return 0;
        
        // Priority 1: User explicitly selected an age group
        if (selectedAgeRate) return selectedAgeRate.price;

        // Priority 2: Automatically calculate based on 'Age' field if it exists
        const ageField = (config.registrationForm || []).find(f => {
            if (!f || !f.label) return false;
            const l = String(f.label).toLowerCase();
            return l.includes('age') || l.includes('year');
        });

        if (normalizedAgeRates.length > 0) {
            if (ageField && ageField.label && formData[ageField.label]) {
                const age = parseInt(formData[ageField.label]);
                if (!isNaN(age)) {
                    const rate = normalizedAgeRates.find(r => age >= r.min && age <= r.max);
                    if (rate) return rate.price;
                }
            }
            // Fallback: Minimum price from age rates
            const validPrices = normalizedAgeRates.map(r => r.price).filter(p => !isNaN(p));
            return validPrices.length > 0 ? Math.min(...validPrices) : 0;
        }
        
        return selectedCategory.price || 0;
    }, [selectedCategory, formData, config.registrationForm, normalizedAgeRates, selectedAgeRate]);

    const fees = useMemo(() => {
        if (!selectedCategory) return { convenienceFee: 0, gst: 0, total: 0 };
        return getFeeBreakdown(calculatedPrice, feeSettings);
    }, [selectedCategory, calculatedPrice, feeSettings]);

    const uniqueFormFields = useMemo(() => {
        const seen = new Set();
        return (config.registrationForm || []).filter(field => {
            if (!field || !field.label) return false;
            const label = String(field.label).toLowerCase();
            let key = label;
            if (label.includes('email')) key = 'email';
            if (label.includes('phone') || label.includes('mobile') || label.includes('whatsapp')) key = 'phone';
            if (label.includes('name')) key = 'name';
            
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [config.registrationForm]);

    const handleBooking = async () => {
        if (!selectedCategory) {
            setNotification({ message: "Please select a category first", type: "error" });
            return;
        }
        const missingFields = uniqueFormFields.filter(f => f.required && !formData[f.label]).map(f => f.label);
        
        // If age rates exist but none selected (and no auto-calculation possible), prompt user
        if (normalizedAgeRates.length > 0 && !selectedAgeRate) {
            const ageField = uniqueFormFields.find(f => f.label.toLowerCase().includes('age'));
            if (!ageField || !formData[ageField.label]) {
                setNotification({ message: "Please select your Age Group range", type: "error" });
                return;
            }
        }

        if (missingFields.length > 0) {
            setNotification({ message: `Required: ${missingFields.join(', ')}`, type: "error" });
            return;
        }

        const packageParam = `&package=${encodeURIComponent(selectedCategory.name)}`;
        const regDataParam = `&regData=${encodeURIComponent(JSON.stringify(formData))}`;
        const priceParam = `&price=${calculatedPrice}`;
        router.push(`/events/book/checkout?id=${event.id}${packageParam}${regDataParam}${priceParam}&qty=1`);
    };

    return (
        <main className={`min-h-screen bg-[#fafbfc] pb-24 ${outfit.className}`}>
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

            <div className="max-w-[850px] mx-auto px-4 pt-2">
                
                {/* Back Button & Category Badge */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <button 
                        onClick={() => router.push('/events')}
                        className="group flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <ArrowLeft size={14} />
                        </div>
                        Back to Events
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white text-[10px] font-[900] uppercase tracking-[0.2em] rounded-full shadow-lg shadow-pink-500/20">
                            Sports
                        </div>
                        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Trophy size={14} className="text-amber-500" /> Marathon Event
                        </div>
                    </div>
                </div>

                {/* HERO BANNER */}
                <div className="relative w-full h-[200px] md:h-[260px] rounded-[2.5rem] overflow-hidden shadow-lg mb-6">
                    <img src={event.img || DEFAULT_IMG} className="w-full h-full object-cover" alt={event.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 z-10">
                        <h1 className="text-2xl md:text-3xl font-[900] text-white uppercase tracking-tighter leading-none shadow-sm">
                            {event.title}
                        </h1>
                    </div>
                </div>
                
                {/* SCHEDULE & VENUE QUICK INFO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-[#ec4899] shadow-inner">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                            <p className="text-sm font-black text-slate-900 uppercase">
                                {event.date}{event.end_date && event.end_date !== event.date ? ` - ${event.end_date}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                            <p className="text-sm font-black text-slate-900 uppercase">
                                {event.time}{event.end_time ? ` - ${event.end_time}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                            <MapPin size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Venue</p>
                            <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">
                                {event.venue || event.location || 'TBA'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Form Content */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        <motion.div 
                            initial={{ clipPath: 'inset(0 100% 0 0)' }}
                            animate={{ clipPath: 'inset(0 0% 0 0)' }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 md:p-6 space-y-4 relative overflow-hidden"
                        >
                            {/* Animated Background Shimmer for Masking effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

                            <div className="space-y-0.5">
                                <motion.h2 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-xl md:text-2xl font-[900] uppercase tracking-tighter bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#ec4899] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x"
                                >
                                    Registration
                                </motion.h2>
                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.2em]">Participant Details</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {uniqueFormFields.map((field, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-900 uppercase tracking-tight ml-1">
                                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                                            </label>
                                            {field.type === 'select' ? (
                                                <div className="relative group">
                                                    <CustomSelect 
                                                        options={field.options || []}
                                                        value={formData[field.label]}
                                                        onChange={(val) => setFormData({...formData, [field.label]: val})}
                                                        placeholder={`Select`}
                                                    />
                                                </div>
                                            ) : (
                                                <input 
                                                    type={field.type}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-[12px] text-[11px] font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                                                    onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 pt-8 border-t border-slate-50">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Category</h4>
                                        {config.marathonCategories?.length > 0 && (
                                            <div className="flex gap-2">
                                                {[...new Set(config.marathonCategories.map(c => c.distance_km))].sort((a,b) => a-b).map(km => (
                                                    <button 
                                                        key={km}
                                                        onClick={() => setSelectedKM(km)}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                            selectedKM === km 
                                                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-900 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        {km} KM
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(config.marathonCategories?.length > 0 
                                            ? config.marathonCategories.filter(c => !selectedKM || c.distance_km === selectedKM)
                                            : (config.categories || [])
                                        ).map((cat, idx) => {
                                            const isSelected = selectedCategory?.id === cat.id;
                                            const priceDisplay = cat.price > 0 ? `₹${cat.price}` : "Free";
                                            
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => {
                                                        if (cat.slots > 0 || cat.totalSlots > 0) {
                                                            setSelectedCategory(cat);
                                                            setSelectedAgeRate(null);
                                                        }
                                                    }}
                                                    className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer relative group flex flex-col justify-between h-full ${
                                                        isSelected 
                                                        ? 'bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] border-transparent shadow-xl' 
                                                        : 'bg-slate-50 border-slate-50 hover:border-pink-500'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="space-y-1">
                                                            <div className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                                                {cat.distance_km ? `${cat.distance_km}KM DISTANCE` : 'Category'}
                                                            </div>
                                                            <h5 className={`text-base font-bold uppercase tracking-normal ${isSelected ? 'text-white' : 'text-slate-900'}`}>{cat.title || cat.name}</h5>
                                                            {cat.min_age !== undefined && (
                                                                <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                                                    Age: {cat.min_age} - {cat.max_age} Years
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-xl font-bold tracking-tight ${isSelected ? 'text-[#fde047]' : 'text-[#ec4899]'}`}>
                                                                {priceDisplay}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
                                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                                                            {cat.slots || cat.totalSlots} Slots Available
                                                        </span>
                                                        {isSelected && <CheckCircle2 size={24} className="text-[#fde047]" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CUSTOM DROPDOWN STYLE FOR AGE GROUP */}
                                {selectedCategory && normalizedAgeRates.length > 0 && (
                                    <div className="space-y-6 pt-8 border-t border-slate-50">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Age Group</h4>
                                            <p className="text-[8px] font-black text-[#8b5cf6] uppercase tracking-widest">Choose the range that applies to you</p>
                                        </div>
                                        
                                        <div className="relative">
                                            <div 
                                                onClick={() => setIsAgeDropdownOpen(!isAgeDropdownOpen)}
                                                className={`w-full bg-slate-50 border-2 p-5 rounded-3xl flex items-center justify-between cursor-pointer transition-all ${
                                                    selectedAgeRate ? 'border-[#ec4899]' : 'border-slate-100 hover:border-pink-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedAgeRate ? 'bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] text-white' : 'bg-white text-slate-400'}`}>
                                                        <Users size={22} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-widest">Selected Group</div>
                                                        <div className="text-base font-black text-slate-900 tracking-tight">
                                                            {selectedAgeRate ? `${selectedAgeRate.min}-${selectedAgeRate.max} Years (₹${selectedAgeRate.price})` : "Click to select Age Range"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronDown size={20} className={`text-[#ec4899] transition-transform duration-300 ${isAgeDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>

                                            <AnimatePresence>
                                                {isAgeDropdownOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute z-50 w-full mt-3 bg-white/95 backdrop-blur-xl border border-[#ec4899]/20 shadow-2xl rounded-[2.5rem] overflow-hidden"
                                                    >
                                                        {normalizedAgeRates.map((rate) => (
                                                            <div 
                                                                key={rate.id}
                                                                onClick={() => {
                                                                    setSelectedAgeRate(rate);
                                                                    setIsAgeDropdownOpen(false);
                                                                }}
                                                                className={`px-8 py-5 flex items-center justify-between cursor-pointer transition-all hover:bg-pink-50 group ${
                                                                    selectedAgeRate?.id === rate.id ? 'bg-pink-50' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${selectedAgeRate?.id === rate.id ? 'bg-[#ec4899] scale-125' : 'bg-slate-200 group-hover:bg-pink-300'}`} />
                                                                    <span className={`text-sm font-black transition-all ${selectedAgeRate?.id === rate.id ? 'text-[#ec4899]' : 'text-slate-700'}`}>
                                                                        {rate.min}-{rate.max} Years
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-base font-black ${selectedAgeRate?.id === rate.id ? 'text-[#ec4899]' : 'text-slate-900'}`}>₹{rate.price}</div>
                                                                    {selectedAgeRate?.id === rate.id && <span className="text-[8px] font-black text-[#ec4899] uppercase tracking-widest">Active</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={handleBooking}
                                    disabled={isRegistrationClosed || !selectedCategory || (normalizedAgeRates.length > 0 && !selectedAgeRate)}
                                    className={`w-full py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl flex items-center justify-center gap-3 ${
                                        isRegistrationClosed
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : (selectedCategory && (normalizedAgeRates.length === 0 || selectedAgeRate))
                                        ? 'bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-[#fde047] shadow-pink-300/50 hover:scale-[1.02] active:scale-95' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    {isRegistrationClosed ? (
                                        <>Registration Closed <Lock size={18} /></>
                                    ) : (
                                        <>Review and Book <ArrowRight size={18} /></>
                                    )}
                                </button>

                                {/* Compact Registration Disclaimer */}
                                <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                                    <div className="flex gap-3 text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                                        <ShieldCheck size={14} className="shrink-0 text-[#8b5cf6]" />
                                        <p>By registering, you agree to official terms. All participant data is processed securely.</p>
                                    </div>
                                    <div className="flex gap-3 text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                                        <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                                        <p className="text-rose-500/80">This Ticketing Portal is a facilitator only and is not responsible for event cancellations, postponements, or organizer-side logistical changes.</p>
                                    </div>
                                    <div className="flex gap-3 text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                                        <Info size={14} className="shrink-0 text-amber-500" />
                                        <p>Tickets are non-transferable. Please ensure all participant details are correct before proceeding.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </div>

                    {/* Right Column Sidebar */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-8 sticky top-12">
                        {/* Summary Widget */}
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-8 space-y-8">
                            <div className="space-y-1">
                                <motion.h3 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-lg font-[900] uppercase tracking-tighter bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#ec4899] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x"
                                >
                                    Order Details
                                </motion.h3>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Review</p>
                            </div>

                            {selectedCategory ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-[#ec4899] uppercase tracking-widest">Payable Amount</p>
                                            <div className="text-4xl font-black text-slate-900 tracking-tighter">₹{fees.total.toFixed(2)}</div>
                                        </div>
                                        <div className="text-[#ec4899] pb-1">
                                            <ShieldCheck size={32} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-5">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                                            <span className="text-slate-500">{selectedCategory.name}</span>
                                            <span className="text-slate-900">₹{calculatedPrice}</span>
                                        </div>
                                        {selectedAgeRate && (
                                            <div className="flex justify-between text-[10px] font-black text-[#ec4899] uppercase tracking-widest">
                                                <span>Age Group: {selectedAgeRate.min}-{selectedAgeRate.max}</span>
                                                <span>Active</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                            <span className="text-slate-500">Platform Fee</span>
                                            <span className="text-slate-900">₹{fees.convenienceFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                            <span className="text-slate-500">GST ({fees.gstPercent}%)</span>
                                            <span className="text-slate-900">₹{fees.gst.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 px-6 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                                    <Trophy size={40} className="mx-auto text-slate-300 mb-4 opacity-50" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Selection</p>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-3 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <CreditCard size={14} className="text-blue-500" /> Secure Payment
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <Zap size={14} className="text-amber-500" /> Instant Confirmation
                                </div>
                            </div>
                        </div>

                        {/* Countdown Sidebar */}
                        {registrationDeadline && (
                            <div className={`rounded-[40px] p-8 text-center space-y-6 shadow-2xl transition-all ${
                                isRegistrationClosed 
                                ? 'bg-slate-900 shadow-slate-200' 
                                : 'bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] shadow-pink-200/50'
                            }`}>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                                    <Timer size={16} className={isRegistrationClosed ? 'text-slate-400' : 'text-[#fde047] animate-pulse'} />
                                    <h4 className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">
                                        {isRegistrationClosed ? "REGISTRATION CLOSED" : "REGISTRATION DEADLINE"}
                                    </h4>
                                </div>

                                {!isRegistrationClosed ? (
                                    <div className="flex items-center justify-between gap-1 px-2">
                                        {[
                                            { val: timeLeft.days, label: 'DAYS' },
                                            { val: timeLeft.hrs, label: 'HRS' },
                                            { val: timeLeft.min, label: 'MIN' },
                                            { val: timeLeft.sec, label: 'SEC' }
                                        ].map((unit, idx) => (
                                            <React.Fragment key={idx}>
                                                <div className="flex flex-col items-center flex-1">
                                                    <div className="text-2xl md:text-3xl font-black text-[#fde047] leading-none drop-shadow-sm">
                                                        {String(unit.val).padStart(2, '0')}
                                                    </div>
                                                    <div className="text-[7px] font-black text-white/60 mt-2 uppercase tracking-tighter whitespace-nowrap">{unit.label}</div>
                                                </div>
                                                {idx < 3 && <div className="text-xl font-black text-white/20 pb-4">:</div>}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-3xl font-black text-white/40 uppercase tracking-tighter">Registration Closed</div>
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Entry Limit or Deadline Reached</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Amenities Moved to Sidebar */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 text-center">Available Amenities</h3>
                            <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                                {(config.amenities || []).map(id => {
                                    const Icon = AMENITY_ICONS[id] || Star;
                                    return (
                                        <div key={id} className="group flex flex-col items-center gap-2 text-center">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#ec4899] group-hover:bg-[#ec4899] group-hover:text-white transition-all shadow-sm">
                                                <Icon size={18} />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight leading-none">{id}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Event Map Section */}
                        {(config.location?.coordinates?.lat || event.latitude) && (config.location?.coordinates?.lng || event.longitude) && (
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4">
                                <EventMap 
                                    lat={config.location?.coordinates?.lat || event.latitude}
                                    lng={config.location?.coordinates?.lng || event.longitude}
                                    venueName={config.location?.venueName || event.venue}
                                    address={config.location?.address || event.location || event.address}
                                />
                                
                                {(config.location.startingPoint || config.location.routeMapUrl) && (
                                    <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-4 items-center justify-between">
                                        {config.location.startingPoint && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Starting Point</p>
                                                    <p className="text-xs font-bold text-slate-900">{config.location.startingPoint}</p>
                                                </div>
                                            </div>
                                        )}
                                        {config.location.routeMapUrl && (
                                            <a 
                                                href={config.location.routeMapUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Map size={14} /> View Route Map
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}

function CustomSelect({ options, value, onChange, placeholder }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 border border-slate-100 p-2.5 rounded-[12px] flex items-center justify-between cursor-pointer transition-all hover:bg-white hover:border-pink-200 ${isOpen ? 'ring-2 ring-pink-500/10 border-pink-300' : ''}`}
            >
                <span className={`text-[11px] font-black ${value ? 'text-slate-900' : 'text-slate-300'}`}>
                    {value || placeholder}
                </span>
                <ChevronDown size={12} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-pink-500' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-[100] w-full mt-2 bg-white/95 backdrop-blur-xl border border-rose-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                    >
                        {options.map((opt) => (
                            <div 
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className={`px-5 py-3 text-[13px] font-black cursor-pointer transition-colors hover:bg-pink-50 ${value === opt ? 'text-[#ec4899] bg-pink-50/50' : 'text-slate-600 hover:text-[#ec4899]'}`}
                            >
                                {opt}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
