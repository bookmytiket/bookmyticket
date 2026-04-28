"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
    Calendar, MapPin, Clock, Users, Languages, ShieldCheck, 
    CheckCircle, Warehouse, Info, ChevronDown, Star, Share2, 
    Heart, Video, Lock, ExternalLink, Play, CheckCircle2, 
    Sparkles, Phone, Mail, MessageCircle, Timer, Award, 
    HeartPulse, Coffee, Utensils, Home, Car, Shirt, Camera, 
    Target, Trophy, Activity, FileText, Zap, Smile, ChevronRight,
    Plus, Minus, X
} from 'lucide-react';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

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

const DollarSign = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

export default function DynamicEventClient({ event }) {
    const { user } = useAuth();
    const router = useRouter();
    const config = event.dynamic_config || {};
    
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({});
    const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0 });

    // Countdown logic
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

    const handleBooking = async () => {
        if (!selectedCategory) {
            alert("Please select a category first.");
            return;
        }
        // Booking logic would go here
        console.log("Booking Category:", selectedCategory);
        console.log("Registration Data:", formData);
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] pb-24 font-['Figtree']">
            {/* Main Content Layout */}
            <div className="max-w-[1300px] mx-auto px-4 md:px-8 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left Column: Event Content */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* Event Header Card */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 md:p-14 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ec4899]/5 rounded-bl-full -z-0" />
                            
                            <div className="relative z-10 space-y-6">
                                <h1 className="text-[32px] md:text-[54px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                                    {event.title}
                                </h1>
                                
                                <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold uppercase text-[12px] tracking-widest">
                                    <div className="flex items-center gap-2"><Calendar size={18} className="text-[#ec4899]" /> {event.startDate}</div>
                                    <div className="flex items-center gap-2"><Clock size={18} className="text-[#ec4899]" /> {event.startTime || "6:00 AM"}</div>
                                    <div className="flex items-center gap-2"><MapPin size={18} className="text-[#ec4899]" /> {config.location?.venueName || "Venue TBA"}</div>
                                </div>
                                
                                <div className="flex items-center gap-4 pt-4">
                                    <div className="px-5 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg">
                                        {event.category || 'Special Event'}
                                    </div>
                                    {config.basicInfo?.eligibility && (
                                        <div className="px-5 py-2 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-blue-100">
                                            {config.basicInfo.eligibility}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="pt-8 border-t border-slate-50">
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-4">Event Information:</h3>
                                    <p className="text-[16px] font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                                        {event.description}
                                    </p>
                                </div>
                                
                                {config.communication?.whatsappLink && (
                                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-3">
                                        <div className="flex items-center gap-3 text-emerald-700 font-black uppercase text-[12px] tracking-widest">
                                            <MessageCircle size={20} /> Join WhatsApp Channel
                                        </div>
                                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight leading-relaxed italic">
                                            Your mobile number will not be visible to others for safety reasons. All updates will be shared here.
                                        </p>
                                        <a href={config.communication.whatsappLink} target="_blank" className="inline-block text-blue-600 font-bold text-[13px] hover:underline break-all">
                                            {config.communication.whatsappLink}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ticket Categories Section */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight px-4 flex items-center gap-3">
                                <Trophy className="text-[#ec4899]" size={28} /> Select Category
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(config.categories || []).map((cat, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => cat.totalSlots > 0 && setSelectedCategory(cat)}
                                        className={`p-8 rounded-[3rem] border transition-all cursor-pointer relative overflow-hidden group ${
                                            selectedCategory?.id === cat.id 
                                            ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' 
                                            : 'bg-white border-slate-100 hover:border-[#ec4899] shadow-sm'
                                        } ${(cat.totalSlots === 0 || cat.status === 'Sold Out') ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                                    >
                                        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className={`text-xl font-black uppercase tracking-tight ${selectedCategory?.id === cat.id ? 'text-white' : 'text-slate-900'}`}>
                                                        {cat.name}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedCategory?.id === cat.id ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {cat.gender} Only
                                                        </div>
                                                        {cat.status === 'Fast Filling' && (
                                                            <div className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-md  border border-amber-200">
                                                                Fast Filling
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`text-2xl font-black ${selectedCategory?.id === cat.id ? 'text-white' : 'text-[#ec4899]'}`}>
                                                    ₹{cat.price}
                                                </div>
                                            </div>
                                            
                                            {cat.prizes && cat.prizes.length > 0 && (
                                                <div className="space-y-2 mt-4">
                                                    {cat.prizes.map((p, pIdx) => (
                                                        <div key={pIdx} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                            <span className={selectedCategory?.id === cat.id ? 'text-slate-400' : 'text-slate-500'}>{p.label}:</span>
                                                            <span className={selectedCategory?.id === cat.id ? 'text-white' : 'text-slate-900'}>{p.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {cat.agePricing && cat.agePricing.length > 0 && (
                                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100/10">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Age-Based Pricing</div>
                                                    {cat.agePricing.map((ap, apIdx) => (
                                                        <div key={apIdx} className="flex justify-between items-center text-[11px] font-bold">
                                                            <span className={selectedCategory?.id === cat.id ? 'text-slate-400' : 'text-slate-500'}>{ap.minAge}-{ap.maxAge} Years</span>
                                                            <span className={selectedCategory?.id === cat.id ? 'text-white' : 'text-[#ec4899]'}>₹{ap.price}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {cat.prize && !cat.prizes && (
                                                <div className={`text-[11px] font-bold italic leading-relaxed whitespace-pre-line ${selectedCategory?.id === cat.id ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {cat.prize}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/10">
                                                <div className={`text-[9px] font-bold uppercase tracking-widest ${selectedCategory?.id === cat.id ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    Slots: {cat.totalSlots}
                                                </div>
                                                {(cat.totalSlots === 0 || cat.status === 'Sold Out') && (
                                                    <div className="px-3 py-1 bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-red-200">Sold Out</div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {selectedCategory?.id === cat.id && (
                                            <div className="absolute top-4 right-4 text-white">
                                                <CheckCircle size={20} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Amenities Grid */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 md:p-14">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-3">
                                <Sparkles className="text-[#ec4899]" size={24} /> Amenities & Benefits
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {(config.amenities || []).map(id => {
                                    const Icon = AMENITY_ICONS[id] || Star;
                                    return (
                                        <div key={id} className="flex items-center gap-3 group">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#ec4899] group-hover:text-white transition-all">
                                                <Icon size={18} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{id}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Map Section */}
                        {config.location?.coordinates && (
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 md:p-14">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <MapPin className="text-[#ec4899]" size={24} /> Location
                                </h3>
                                <p className="text-[13px] font-bold text-slate-500 uppercase tracking-tight mb-8 italic">
                                    {config.location.address}
                                </p>
                                <div className="h-[300px] rounded-[2.5rem] overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    {/* Map Component would render here using config.location.coordinates */}
                                    Map View: {config.location.coordinates.lat}, {config.location.coordinates.lng}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Sticky Registration & Countdown */}
                    <div className="lg:col-span-4 space-y-8 sticky top-24">
                        
                        {/* Countdown Widget */}
                        {config.countdown?.enabled && (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-center space-y-6">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Booking Ends In</h4>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-full border-2 border-emerald-500 flex items-center justify-center text-lg font-black text-emerald-600">{timeLeft.days}</div>
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Days</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-full border-2 border-amber-500 flex items-center justify-center text-lg font-black text-amber-600">{timeLeft.hrs}</div>
                                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-2">Hrs</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-full border-2 border-rose-500 flex items-center justify-center text-lg font-black text-rose-600">{timeLeft.min}</div>
                                        <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mt-2">Min</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Registration Form Widget */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-10 space-y-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Participant Details</h3>
                            
                            <div className="space-y-6">
                                {(config.registrationForm || []).map((field, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                                        </label>
                                        {field.type === 'select' ? (
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ec4899]/10"
                                                onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                            >
                                                <option value="">Choose One</option>
                                                {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : field.type === 'file' ? (
                                            <input 
                                                type="file"
                                                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-bold uppercase"
                                                onChange={e => setFormData({...formData, [field.label]: e.target.files[0]})}
                                            />
                                        ) : (
                                            <input 
                                                type={field.type}
                                                placeholder={field.label}
                                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ec4899]/10"
                                                onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Price Summary */}
                            {selectedCategory && (
                                <div className="pt-6 border-t border-slate-50 space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Price Details</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>{selectedCategory.name} Ticket</span>
                                            <span>₹{selectedCategory.price}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Service & Gateway Charges</span>
                                            <span>₹{event.platformFee || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-50">
                                            <span>Total</span>
                                            <span>₹{selectedCategory.price + (event.platformFee || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleBooking}
                                disabled={!selectedCategory}
                                className={`w-full py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl transition-all ${
                                    selectedCategory 
                                    ? 'bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white shadow-pink-200 hover:scale-[1.02] active:scale-95' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                Book Now
                            </button>
                            
                            <div className="flex flex-col items-center gap-3 pt-4 italic">
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                    <ShieldCheck size={14} className="text-emerald-500" /> Secure Encryption Active
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                    <Zap size={14} className="text-amber-500" /> Instant Confirmation
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
