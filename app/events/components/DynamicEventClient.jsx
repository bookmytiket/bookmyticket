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
    Plus, Minus, X, DollarSign, ArrowLeft, ArrowRight, CreditCard
} from 'lucide-react';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from '@/components/AuthContext';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from '@/app/utils/feeBreakdown';
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
    const config = event.dynamic_config || {};
    
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedAgeRate, setSelectedAgeRate] = useState(null);
    const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0 });

    useEffect(() => {
        if (!config.countdown?.enabled || !config.countdown?.deadline) return;
        
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const deadline = new Date(config.countdown.deadline).getTime();
            const diff = deadline - now;
            
            if (diff <= 0) {
                clearInterval(timer);
                setTimeLeft({ days: 0, hrs: 0, min: 0 });
            } else {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hrs: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    min: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                });
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [config.countdown]);

    const { data: feeSettingsRaw } = useSupabaseQuery('system_config', (q) => q.eq('key', 'fee_settings').single(), []);
    const feeSettingsSystem = (feeSettingsRaw && feeSettingsRaw.value) || DEFAULT_FEE_SETTINGS;
    
    const organiserId = event?.organiser_id || event?.organiserId;
    const { data: organiserData } = useSupabaseQuery('organisers', (q) => q.eq('id', organiserId).single(), [organiserId], { enabled: !!organiserId });
    
    const feeSettings = useMemo(() => {
        return resolveFeeSettings(
            feeSettingsSystem,
            organiserData?.fee_config,
            event?.fee_config
        );
    }, [feeSettingsSystem, organiserData?.fee_config, event?.fee_config]);

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
        const ageField = (config.registrationForm || []).find(f => 
            f.label.toLowerCase().includes('age') || 
            f.label.toLowerCase().includes('year')
        );

        if (normalizedAgeRates.length > 0) {
            if (ageField && formData[ageField.label]) {
                const age = parseInt(formData[ageField.label]);
                if (!isNaN(age)) {
                    const rate = normalizedAgeRates.find(r => age >= r.min && age <= r.max);
                    if (rate) return rate.price;
                }
            }
            // Fallback: Minimum price from age rates
            return Math.min(...normalizedAgeRates.map(r => r.price));
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
            const label = field.label.toLowerCase();
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
        if (!selectedCategory) return;
        const missingFields = uniqueFormFields.filter(f => f.required && !formData[f.label]).map(f => f.label);
        
        // If age rates exist but none selected (and no auto-calculation possible), prompt user
        if (normalizedAgeRates.length > 0 && !selectedAgeRate) {
            const ageField = uniqueFormFields.find(f => f.label.toLowerCase().includes('age'));
            if (!ageField || !formData[ageField.label]) {
                alert("Please select your Age Group or enter your age.");
                return;
            }
        }

        if (missingFields.length > 0) {
            alert(`Please fill in: ${missingFields.join(', ')}`);
            return;
        }

        const packageParam = `&package=${encodeURIComponent(selectedCategory.name)}`;
        const regDataParam = `&regData=${encodeURIComponent(JSON.stringify(formData))}`;
        const priceParam = `&price=${calculatedPrice}`;
        router.push(`/events/book/checkout?id=${event.id}${packageParam}${regDataParam}${priceParam}&qty=1`);
    };

    return (
        <main className={`min-h-screen bg-[#fafbfc] pb-24 ${outfit.className}`}>
            <div className="max-w-[1100px] mx-auto px-4 pt-10">
                
                {/* Back Button */}
                <div className="mb-6">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-all group"
                    >
                        <div className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-slate-900 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span>Back</span>
                    </button>
                </div>

                {/* HERO BANNER */}
                <div className="relative w-full h-[300px] md:h-[380px] rounded-[3rem] overflow-hidden shadow-2xl mb-8">
                    <img src={event.img || DEFAULT_IMG} className="w-full h-full object-cover" alt={event.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-10 left-10 right-10 z-10 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="px-4 py-1.5 bg-[#8b5cf6] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                {event.category || 'Special Event'}
                            </div>
                            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/20 flex items-center gap-2">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" /> 4.9 (Official)
                            </div>
                        </div>
                        
                        <h1 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.85]">
                            {event.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-white/70 text-[11px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2"><MapPin size={14} className="text-[#ec4899]" /> {event.city || "PAN INDIA"}</div>
                            <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-400" /> VERIFIED PARTNER</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left Column: Form Content */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-10">
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 md:p-10 space-y-10">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registration</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provide participant details below</p>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {uniqueFormFields.map((field, idx) => (
                                        <div key={idx} className="space-y-2.5">
                                            <label className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-tight ml-1">
                                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                                            </label>
                                            {field.type === 'select' ? (
                                                <div className="relative group">
                                                    <select 
                                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-[18px] text-[13px] font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:bg-white transition-all appearance-none"
                                                        onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                                    >
                                                        <option value="">Select Option</option>
                                                        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-transform">
                                                        <ChevronDown size={16} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <input 
                                                    type={field.type}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-[18px] text-[13px] font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                                                    onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 pt-8 border-t border-slate-50">
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Category</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(config.categories || []).map((cat, idx) => {
                                            const isSelected = selectedCategory?.id === cat.id;
                                            
                                            // Local normalization for display
                                            const rawRates = cat.ageRates || cat.agePricing || cat.age_rates || cat.age_pricing || config.ageRates || config.agePricing || [];
                                            const ageRates = (Array.isArray(rawRates) ? rawRates : []).map(r => ({
                                                min: parseInt(r.min || r.minAge || 0),
                                                max: parseInt(r.max || r.maxAge || 999),
                                                price: parseFloat(r.price || 0)
                                            }));
                                            
                                            const hasAgeRates = ageRates.length > 0;
                                            
                                            let priceDisplay = "";
                                            if (isSelected) {
                                                priceDisplay = `₹${calculatedPrice}`;
                                            } else if (hasAgeRates) {
                                                const min = Math.min(...ageRates.map(r => r.price));
                                                const max = Math.max(...ageRates.map(r => r.price));
                                                priceDisplay = min === max ? `₹${min}` : `₹${min} - ₹${max}`;
                                            } else {
                                                priceDisplay = cat.price > 0 ? `₹${cat.price}` : "Free";
                                            }

                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => {
                                                        if (cat.totalSlots > 0) {
                                                            setSelectedCategory(cat);
                                                            setSelectedAgeRate(null); // Reset age selection when category changes
                                                        }
                                                    }}
                                                    className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer relative group flex flex-col justify-between h-full ${
                                                        isSelected 
                                                        ? 'bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] border-transparent shadow-xl' 
                                                        : 'bg-slate-50 border-slate-50 hover:border-pink-500'
                                                    }`}
                                                >
                                                    {(cat.img || cat.image) && (
                                                        <div className="w-full h-24 rounded-2xl overflow-hidden mb-4">
                                                            <img src={cat.img || cat.image} className="w-full h-full object-cover" alt={cat.name} />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="space-y-1">
                                                            <h5 className={`text-base font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>{cat.name}</h5>
                                                            {hasAgeRates && (
                                                                <p className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white/90' : 'text-[#ec4899]'}`}>Age-Based Rate Only</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-xl font-black ${isSelected ? 'text-white' : 'text-[#ec4899]'}`}>
                                                                {priceDisplay}
                                                            </div>
                                                            {hasAgeRates && !isSelected && <span className={`text-[8px] font-black ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>*Based on Age</span>}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        {(cat.prizes || config.prizes || []).slice(0, 3).map((p, pIdx) => (
                                                            <div key={pIdx} className="flex justify-between text-[9px] font-black uppercase tracking-tight">
                                                                <span className={isSelected ? 'text-white/70' : 'text-slate-500'}>{p.label || p.name}</span>
                                                                <span className={isSelected ? 'text-white' : 'text-slate-900'}>{p.value || p.amount}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{cat.gender || 'All'} • {cat.totalSlots} Slots</span>
                                                        {isSelected && <CheckCircle2 size={24} className="text-white" />}
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
                                    disabled={!selectedCategory || (normalizedAgeRates.length > 0 && !selectedAgeRate)}
                                    className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] transition-all shadow-2xl flex items-center justify-center gap-4 ${
                                        (selectedCategory && (normalizedAgeRates.length === 0 || selectedAgeRate))
                                        ? 'bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white shadow-pink-300/50 hover:scale-[1.02] active:scale-95' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    Review and Book <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 md:p-10">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {(config.amenities || []).map(id => {
                                    const Icon = AMENITY_ICONS[id] || Star;
                                    return (
                                        <div key={id} className="group flex flex-col items-center gap-3 text-center">
                                            <div className="w-14 h-14 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#ec4899] group-hover:text-white transition-all shadow-sm">
                                                <Icon size={24} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{id}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Sidebar */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-8 sticky top-12">
                        {/* Summary Widget */}
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-8 space-y-8">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Order Details</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review your selection</p>
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
                                        <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                                            <span className="text-slate-500">Fees + GST</span>
                                            <span className="text-slate-900">₹{fees.convenienceFee.toFixed(2)}</span>
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
                        {config.countdown?.enabled && (
                            <div className="bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] rounded-[40px] p-10 text-center space-y-6 shadow-2xl shadow-pink-200/50">
                                <h4 className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Registration Deadline</h4>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-white leading-none">{timeLeft.days}</div>
                                        <div className="text-[9px] font-black text-white/50 mt-1 uppercase">DAYS</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/20" />
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-white leading-none">{timeLeft.hrs}</div>
                                        <div className="text-[9px] font-black text-white/50 mt-1 uppercase">HRS</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/20" />
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-white leading-none">{timeLeft.min}</div>
                                        <div className="text-[9px] font-black text-white/50 mt-1 uppercase">MIN</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}
