"use client";
import Footer from "@/components/Footer";

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
    Plus, Minus, X, DollarSign, ArrowLeft, ArrowRight, CreditCard, ChevronLeft,
    AlertTriangle, Map
} from 'lucide-react';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from '@/app/utils/feeBreakdown';
import AboutEventSection from '@/components/AboutEventSection';
import EventMap from './EventMap';
import EarlyBirdPricingCards from '@/components/EarlyBirdPricingCards';
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
            const parsed = typeof event.dynamic_config === 'string' ? JSON.parse(event.dynamic_config) : (event.dynamic_config || {});
            
            // Merge relational table data
            const amenitiesData = Array.isArray(event.event_amenities) ? event.event_amenities[0] : event.event_amenities;
            const virtualData = Array.isArray(event.virtual_event_configs) ? event.virtual_event_configs[0] : event.virtual_event_configs;
            const mediaData = Array.isArray(event.event_media) ? event.event_media[0] : event.event_media;
            const termsData = Array.isArray(event.event_terms) ? event.event_terms[0] : event.event_terms;
            
            if (amenitiesData) parsed.amenities = { ...parsed.amenities, ...amenitiesData };
            if (virtualData) parsed.virtualConfig = { ...parsed.virtualConfig, ...virtualData };
            
            // Map registration fields
            if (Array.isArray(event.registration_fields) && event.registration_fields.length > 0) {
                parsed.registrationForm = event.registration_fields.map(f => ({
                    label: f.field_label,
                    type: f.field_type,
                    required: f.is_required,
                    options: f.options
                }));
            }
            
            return parsed;
        } catch (e) {
            console.error("Failed to parse dynamic_config:", e);
            return {};
        }
    }, [event.dynamic_config]);
    
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedAgeRate, setSelectedAgeRate] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [showCouponsModal, setShowCouponsModal] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [formValues, setFormValues] = useState({});
    const [selectedKM, setSelectedKM] = useState(null);
    const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });
    const [notification, setNotification] = useState(null);
    const [marathonCategories, setMarathonCategories] = useState([]);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 200);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const baseCategories = useMemo(() => {
        if (marathonCategories.length > 0) return marathonCategories;
        if ((config?.marathonCategories || config?.marathon_categories)?.length > 0) return config.marathonCategories || config.marathon_categories;
        if (config?.seatingSections?.length > 0) return config.seatingSections.map(s => ({ ...s, category_name: s.name, price: s.basePrice }));
        if (config?.categories?.length > 0) return config.categories;
        
        // Fallback to primary event seat_categories
        if (event?.seat_categories) {
            try {
                const parsed = typeof event.seat_categories === 'string' ? JSON.parse(event.seat_categories) : event.seat_categories;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((c, i) => ({
                        id: c.id || `seat_cat_${i}`,
                        category_name: c.name || c.category_name || "General",
                        price: Number(c.price) || 0,
                        slots_total: Number(c.rows) || Number(c.slots_total) || 0
                    }));
                }
            } catch (e) {
                console.error("Failed to parse seat_categories", e);
            }
        }
        
        return [];
    }, [marathonCategories, config, event?.seat_categories]);

    const hasDistances = useMemo(() => baseCategories.some(c => c.distance_km !== undefined && c.distance_km !== null), [baseCategories]);

    // Initialize selected KM if marathon categories exist
    useEffect(() => {
        if (hasDistances && !selectedKM) {
            const kms = [...new Set(baseCategories.filter(c => c.distance_km != null).map(c => Number(c.distance_km)))].sort((a, b) => a - b);
            if (kms.length > 0) setSelectedKM(kms[0]);
        }
    }, [hasDistances, baseCategories, selectedKM]);

    // Auto-select category
    useEffect(() => {
        if (baseCategories.length > 0) {
            let filtered = baseCategories;
            if (hasDistances && selectedKM != null) {
                filtered = baseCategories.filter(c => Number(c.distance_km) === Number(selectedKM));
            }
            if (filtered.length > 0) {
                if (!selectedCategory || (hasDistances && Number(selectedCategory.distance_km) !== Number(selectedKM))) {
                    setSelectedCategory(filtered[0]);
                    setSelectedAgeRate(null);
                }
            }
        }
    }, [selectedKM, baseCategories, selectedCategory, hasDistances]);

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
        const rawRates = selectedCategory.ageRates || selectedCategory.agePricing || selectedCategory.age_rates || selectedCategory.age_pricing || selectedCategory.pricing || config.ageRates || config.agePricing || [];
        return (Array.isArray(rawRates) ? rawRates : []).map((r, i) => ({
            id: r.id || `${r.min || r.minAge || 0}-${r.max || r.maxAge || 999}-${i}`,
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

    useEffect(() => {
        const fetchEventData = async () => {
            // Fetch coupons
            const { data: couponData } = await supabase
                .from('coupons')
                .select('*')
                .eq('is_active', true);
            
            if (couponData) {
                const validCoupons = couponData.filter(c => 
                    !c.applicable_events || 
                    c.applicable_events.length === 0 || 
                    c.applicable_events.includes(event.id)
                );
                setAvailableCoupons(validCoupons);
            }

            // Fetch real-time categories for slots
            const { data: catData } = await supabase
                .from('marathon_categories')
                .select('*')
                .eq('marathon_id', event.id)
                .order('distance_km', { ascending: true });
            
            if (catData && catData.length > 0) {
                setMarathonCategories(catData);
            } else {
                // Fallback to config
                setMarathonCategories(config.marathonCategories || config.marathon_categories || []);
            }
        };
        fetchEventData();
    }, [event.id, config]);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsApplyingCoupon(true);
        setCouponError('');
        
        try {
            // Import the logic or use local check
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode)
                .eq('is_active', true)
                .maybeSingle();

            if (error || !coupon) {
                setCouponError('Invalid coupon code');
                setCouponDiscount(0);
                setAppliedCoupon(null);
                return;
            }

            // Basic validation
            if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
                setCouponError('Coupon has expired');
                return;
            }

            if (quantity < (coupon.min_tickets || 0)) {
                setCouponError(`Min ${coupon.min_tickets} tickets required`);
                return;
            }

            if (coupon.applicable_events && coupon.applicable_events.length > 0 && !coupon.applicable_events.includes(event.id)) {
                setCouponError('Not valid for this event');
                return;
            }

            // Calculate discount
            const baseAmount = (selectedCategory?.price || 0) * quantity;
            let discount = 0;
            if (coupon.type === 'percent') {
                discount = (baseAmount * coupon.value) / 100;
            } else {
                discount = Math.min(baseAmount, coupon.value);
            }

            setCouponDiscount(discount);
            setAppliedCoupon(coupon);
            setCouponError('');
        } catch (err) {
            setCouponError('Error applying coupon');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const fees = useMemo(() => {
        if (!selectedCategory) return { convenienceFee: 0, gst: 0, total: 0, originalBase: 0, bulkDiscount: 0 };
        
        let base = (calculatedPrice || 0) * quantity;
        
        // Apply Bulk Booking Discount
        let bulkDiscount = 0;
        const bPercent = Number(config.bulkDiscountPercent || 0);
        const bMin = Number(config.bulkDiscountMinTickets || 0);
        
        if (bPercent > 0 && bMin > 0 && quantity >= bMin) {
            bulkDiscount = (base * bPercent) / 100;
        }

        const afterBulk = base - bulkDiscount;
        const afterCoupon = Math.max(0, afterBulk - couponDiscount);
        const breakdown = getFeeBreakdown(afterCoupon, feeSettings);
        
        return { ...breakdown, originalBase: base, bulkDiscount };
    }, [selectedCategory, calculatedPrice, quantity, couponDiscount, feeSettings, config.bulkDiscountPercent, config.bulkDiscountMinTickets]);

    const uniqueFormFields = useMemo(() => {
        const seen = new Set();
        const rawFields = config.registrationForm || config.form_fields || [];
        return rawFields.filter(field => {
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
    }, [config.registrationForm, config.form_fields]);

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

        const packageParam = `&package=${encodeURIComponent(selectedCategory.category_name || selectedCategory.title || selectedCategory.name || '')}`;
        const regDataParam = `&regData=${encodeURIComponent(JSON.stringify(formData))}`;
        const priceParam = `&price=${calculatedPrice}`;
        router.push(`/events/book/checkout?id=${event.id}${packageParam}${regDataParam}${priceParam}&qty=${quantity}`);
    };

    return (
        <main className={`min-h-screen bg-[#fafbfc] ${outfit.className}`}>
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

            <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-8">
                {/* --- SCROLLED STICKY HEADER --- */}
                <div 
                    className={`fixed top-0 left-0 right-0 z-[100] bg-white border-b border-slate-200 shadow-sm transition-transform duration-300 flex items-center justify-between px-4 sm:px-8 py-3 ${scrolled ? 'translate-y-0' : '-translate-y-full'}`}
                >
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push("/events")}
                            className="p-2 -ml-2 text-slate-600 hover:text-pink-500 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-[600px]">
                                {event.title}
                            </h2>
                            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 mt-1">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} className="text-emerald-500" />
                                    <span>{event.date}{event.time ? `, ${event.time}` : ''}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} className="text-rose-500" />
                                    <span className="truncate max-w-[100px] sm:max-w-[200px]">{event.venue || event.location || 'TBA'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button className="px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 text-[12px] font-semibold border border-transparent hover:border-slate-200">
                            <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                </div>
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
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl group mb-8"
                >
                    <img 
                        src={event.img || DEFAULT_IMG} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={event.title} 
                        onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMG;
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 z-10">
                        <h1 className="text-4xl md:text-5xl font-[900] text-white uppercase tracking-tighter leading-none shadow-sm">
                            {event.title}
                        </h1>
                    </div>
                </motion.div>

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Event Content */}
                    <div className="lg:col-span-8 space-y-8">

                        <AboutEventSection event={event} config={config} />


                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 md:p-6 space-y-4"
                        >
                            <div className="space-y-0.5">
                                <motion.h2 
                                    className="text-2xl md:text-3xl font-[900] uppercase tracking-normal text-slate-900"
                                >
                                    Registration
                                </motion.h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Participant Details</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {uniqueFormFields.map((field, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <label className="text-[8px] font-semibold text-slate-900 uppercase tracking-tight ml-1">
                                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                                            </label>
                                            {field.type === 'select' ? (
                                                <CustomSelect 
                                                    options={Array.isArray(field.options) ? field.options : (typeof field.options === 'string' ? field.options.split(',').map(s => s.trim()) : [])}
                                                    value={formData[field.label]}
                                                    onChange={(val) => setFormData({...formData, [field.label]: val})}
                                                    placeholder="Select"
                                                />
                                            ) : (
                                                <input 
                                                    type={field.type}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-[12px] text-[11px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                                                    onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 pt-8 border-t border-slate-50">
                                    {hasDistances && (
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-2 flex-1">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Distance</h4>
                                                <div className="w-full">
                                                    <CustomSelect 
                                                        options={[...new Set(baseCategories.filter(c => c.distance_km != null).map(c => `${c.distance_km} KM`))].sort()}
                                                        value={selectedKM ? `${selectedKM} KM` : "Select Distance"}
                                                        onChange={(val) => setSelectedKM(parseInt(val))}
                                                        placeholder="Choose KM"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!hasDistances && (
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Ticket Type</h4>
                                    )}

                                    <div className="flex flex-col gap-6">
                                        <EarlyBirdPricingCards
                                            raceCategories={hasDistances && selectedKM != null ? baseCategories.filter(c => Number(c.distance_km) === Number(selectedKM)) : baseCategories}
                                            selectedCategoryId={selectedCategory?.id || selectedCategory?.category_name}
                                            onSelect={(cat) => {
                                                setSelectedCategory(cat);
                                                setSelectedAgeRate(null);
                                            }}
                                        />
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
                    <div className="lg:col-span-4 space-y-4 sticky top-8">

                        {/* Summary Widget */}
                        <div className="bg-white rounded-[1.25rem] border border-slate-100 shadow-xl p-4 space-y-3 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <motion.h3 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-sm font-[900] uppercase tracking-tight bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#ec4899] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x"
                                    >
                                        Order Summary
                                    </motion.h3>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Review & Pay</p>
                                </div>
                                <Trophy size={16} className="text-pink-100" />
                            </div>
                            
                            {selectedCategory ? (
                                <div className="space-y-6">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-1">Total Tickets</p>
                                            {config.bulkDiscountPercent > 0 && config.bulkDiscountMinTickets > 0 && (
                                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                                    Buy {config.bulkDiscountMinTickets}+ for {config.bulkDiscountPercent}% OFF
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-white text-slate-600 flex items-center justify-center font-black hover:text-pink-600 shadow-sm transition-colors">−</button>
                                            <span className="text-sm font-black w-6 text-center text-slate-900">{quantity}</span>
                                            <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-lg bg-white text-slate-600 flex items-center justify-center font-black hover:text-pink-600 shadow-sm transition-colors">+</button>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-500">Base Price (x{quantity})</span>
                                            <span className="font-black text-slate-900">₹{fees.originalBase?.toFixed(2) || ((calculatedPrice || 0) * quantity).toFixed(2)}</span>
                                        </div>
                                        {fees.bulkDiscount > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-emerald-500">Bulk Discount</span>
                                                <span className="font-black text-emerald-600">-₹{fees.bulkDiscount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-emerald-500">Coupon Discount</span>
                                                <span className="font-black text-emerald-600">-₹{couponDiscount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-[#ec4899] uppercase tracking-widest">Payable Amount</p>
                                            <div className="text-2xl font-black text-slate-900 tracking-tighter">₹{fees.total.toFixed(0)}</div>
                                        </div>
                                        <div className="text-[#ec4899] pb-0.5">
                                            <ShieldCheck size={24} />
                                        </div>
                                    </div>

                                    {/* Coupon Section */}
                                    <div className="pt-2 space-y-1 relative">
                                        <div className="flex justify-between items-center px-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Have a coupon?</p>
                                            <button 
                                                onClick={() => setShowCouponsModal(!showCouponsModal)}
                                                className="text-[8px] font-black text-[#ec4899] uppercase tracking-widest hover:underline flex items-center gap-1"
                                            >
                                                View All <ChevronDown size={10} className={`transition-transform ${showCouponsModal ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <input 
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder={appliedCoupon ? `APPLIED: ${appliedCoupon.code}` : "ENTER CODE"}
                                                className={`w-full h-10 pl-3 pr-16 bg-slate-50 border rounded-lg text-[9px] font-black tracking-widest outline-none transition-all uppercase ${
                                                    appliedCoupon ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-100 focus:border-[#ec4899]/30'
                                                }`}
                                            />
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={isApplyingCoupon}
                                                className={`absolute right-1 top-1 bottom-1 px-3 border rounded-md text-[8px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                                    appliedCoupon 
                                                    ? 'bg-emerald-500 text-white border-emerald-500' 
                                                    : 'bg-white border-slate-100 text-[#ec4899] hover:bg-[#ec4899] hover:text-white'
                                                }`}
                                            >
                                                {isApplyingCoupon ? '...' : appliedCoupon ? 'Applied' : 'Apply'}
                                            </button>
                                        </div>
                                        
                                        <AnimatePresence>
                                            {showCouponsModal && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-[60] overflow-hidden"
                                                >
                                                    <div className="max-h-56 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                        {availableCoupons.length > 0 ? (
                                                            availableCoupons.map((coupon, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        setCouponCode(coupon.code);
                                                                        setShowCouponsModal(false);
                                                                        setTimeout(() => handleApplyCoupon(), 100);
                                                                    }}
                                                                    className="w-full text-left p-3 bg-slate-50 hover:bg-pink-50 rounded-lg border border-slate-100 hover:border-pink-200 transition-all flex items-center justify-between group"
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200 group-hover:border-pink-200 transition-colors">
                                                                                {coupon.code}
                                                                            </span>
                                                                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">
                                                                                {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[9px] font-bold text-slate-500">
                                                                            {coupon.description || `Applied on total value`}
                                                                        </p>
                                                                    </div>
                                                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300 group-hover:text-pink-500 transition-colors shrink-0">
                                                                        <ArrowRight size={12} />
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No active offers</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {couponError && (
                                            <p className="text-[8px] font-bold text-rose-500 px-1">{couponError}</p>
                                        )}
                                        {appliedCoupon && !couponError && (
                                            <p className="text-[8px] font-bold text-emerald-600 px-1 flex justify-between">
                                                Coupon Applied! 
                                                <button onClick={() => {setAppliedCoupon(null); setCouponDiscount(0); setCouponCode('');}} className="underline">Remove</button>
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                        <div className="flex justify-between items-start py-1 border-b border-slate-100/50">
                                            <div className="space-y-0.5">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Selected Plan</span>
                                                <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{hasDistances ? `${selectedKM}KM - ` : ''}{selectedCategory?.category_name || selectedCategory?.title || selectedCategory?.name}</p>
                                            </div>
                                            <span className="text-[10px] font-black text-pink-500 uppercase">{quantity}x</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-slate-100/50 last:border-0">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base Price</span>
                                            <span className="text-xs font-black text-slate-900">₹{calculatedPrice}</span>
                                        </div>
                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between items-center py-1 border-b border-slate-100/50 last:border-0 text-[#ec4899]">
                                                <span className="text-[8px] font-black uppercase tracking-widest">Discount</span>
                                                <span className="text-xs font-black">- ₹{couponDiscount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center py-1 border-b border-slate-100/50 last:border-0">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Platform Fee</span>
                                            <span className="text-xs font-black text-slate-900">₹{fees.convenienceFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-slate-100/50 last:border-0">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">GST (18%)</span>
                                            <span className="text-xs font-black text-slate-900">₹{fees.gst.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 px-5 bg-slate-50 rounded-[1.25rem] border border-dashed border-slate-200">
                                    <Trophy size={32} className="mx-auto text-slate-300 mb-3 opacity-50" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Category</p>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    <ShieldCheck size={12} className="text-emerald-500" /> Secure Payment
                                </div>
                                <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    <Zap size={12} className="text-amber-500" /> Instant Confirmation
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
                                {(() => {
                                    // Normalize amenities to an array of strings
                                    let list = [];
                                    if (Array.isArray(config.amenities)) {
                                        list = config.amenities;
                                    } else if (config.amenities && typeof config.amenities === 'object') {
                                        // Map snake_case to PascalCase (e.g. t_shirt -> TShirt, first_aid -> FirstAid)
                                        const keyMap = {
                                            ambulance: 'Ambulance', first_aid: 'FirstAid', certificate: 'Certificate',
                                            medal: 'Medal', t_shirt: 'TShirt', breakfast: 'Breakfast',
                                            refreshments: 'Refreshments', accommodation: 'Accommodation',
                                            parking: 'Parking', safety: 'Safety', family: 'Family',
                                            cash_prize: 'CashPrize', trophy: 'Trophy', bib: 'Bib',
                                            selfie: 'Selfie', washroom: 'Washroom'
                                        };
                                        list = Object.entries(config.amenities)
                                            .filter(([_, val]) => val === true)
                                            .map(([key, _]) => keyMap[key] || key);
                                    } else if (Array.isArray(config.benefits)) {
                                        list = config.benefits.map(b => b.icon_key).filter(Boolean);
                                    }

                                    return list.map(id => {
                                        const Icon = AMENITY_ICONS[id] || Star;
                                        // Format the display label to be human readable
                                        const label = String(id).replace(/([A-Z])/g, ' $1').trim();
                                        return (
                                            <div key={id} className="group flex flex-col items-center gap-2 text-center">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#ec4899] group-hover:bg-[#ec4899] group-hover:text-white transition-all shadow-sm">
                                                    <Icon size={18} />
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight leading-none">{label}</span>
                                            </div>
                                        );
                                    });
                                })()}
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
                                
                                {(config.location?.startingPoint || event.starting_point || config.location?.routeMapUrl || event.route_map_image) && (
                                    <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-4 items-center justify-between">
                                        {(config.location?.startingPoint || event.starting_point) && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Starting Point</p>
                                                    <p className="text-xs font-bold text-slate-900">{config.location?.startingPoint || event.starting_point}</p>
                                                </div>
                                            </div>
                                        )}
                                        {(config.location?.routeMapUrl || event.route_map_image) && (
                                            <a 
                                                href={config.location?.routeMapUrl || event.route_map_image} 
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

            <div className="pb-24"></div>
            <Footer />
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
                <span className={`text-[11px] font-semibold ${value ? 'text-slate-900' : 'text-slate-300'}`}>
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
                        {(Array.isArray(options) ? options : []).map((opt) => (
                            <div 
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className={`px-5 py-3 text-[13px] font-semibold cursor-pointer transition-colors hover:bg-pink-50 ${value === opt ? 'text-[#ec4899] bg-pink-50/50' : 'text-slate-600 hover:text-[#ec4899]'}`}
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
