"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowLeft, Info, CheckCircle2, DollarSign, Users, Target, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ 
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap'
});

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

export default function FacilityEventClient({ event }) {
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

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Generate dates (Next 14 Days)
    const dates = useMemo(() => {
        const arr = [];
        const openDays = config.schedule?.openDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        let d = new Date();
        for (let i = 0; i < 14; i++) {
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            if (openDays.includes(dayName)) {
                arr.push(new Date(d));
            }
            d.setDate(d.getDate() + 1);
        }
        return arr;
    }, [config.schedule]);

    useEffect(() => {
        if (dates.length > 0 && !selectedDate) {
            setSelectedDate(dates[0]);
        }
    }, [dates]);

    // Generate time slots for selected date
    const timeSlots = useMemo(() => {
        if (!selectedDate || !config.schedule) return [];
        const { openTime, closeTime, slotDurationMinutes } = config.schedule;
        
        let slots = [];
        const [openH, openM] = (openTime || "10:00").split(':').map(Number);
        const [closeH, closeM] = (closeTime || "22:00").split(':').map(Number);
        
        let current = new Date(selectedDate);
        current.setHours(openH, openM, 0, 0);
        
        const end = new Date(selectedDate);
        end.setHours(closeH, closeM, 0, 0);
        
        const duration = slotDurationMinutes || 15;
        
        // Filter past times if it's today
        const now = new Date();
        const isToday = current.toDateString() === now.toDateString();

        while (current < end) {
            if (!isToday || current > now) {
                slots.push({
                    timeString: current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: new Date(current)
                });
            }
            current.setMinutes(current.getMinutes() + duration);
        }
        return slots;
    }, [selectedDate, config.schedule]);

    const isWeekend = selectedDate ? [0, 6].includes(selectedDate.getDay()) : false;

    // Filter packages based on Weekend/Weekday logic
    const availablePackages = useMemo(() => {
        const pkgs = config.packages || [];
        return pkgs.filter(p => !p.isWeekendMode || (p.isWeekendMode && isWeekend));
    }, [config.packages, isWeekend]);

    const groupedPackages = useMemo(() => {
        const grouped = {};
        availablePackages.forEach(p => {
            const groupName = p.group || 'OTHER PACKAGES';
            if(!grouped[groupName]) grouped[groupName] = [];
            grouped[groupName].push(p);
        });
        return grouped;
    }, [availablePackages]);

    const handleBooking = () => {
        if(!selectedDate || !selectedTimeSlot || !selectedPackage) return;
        
        // Construct registration data
        const dateStr = selectedDate.toLocaleDateString();
        const formData = {
            "Booking Date": dateStr,
            "Time Slot": selectedTimeSlot.timeString,
            "Package": selectedPackage.name
        };

        const packageParam = `&package=${encodeURIComponent(selectedPackage.name)}`;
        const regDataParam = `&regData=${encodeURIComponent(JSON.stringify(formData))}`;
        const priceParam = `&price=${selectedPackage.price}`;
        router.push(`/events/book/checkout?id=${event.id}${packageParam}${regDataParam}${priceParam}&qty=${quantity}`);
    };

    return (
        <main className={`min-h-screen bg-[#fafbfc] ${outfit.className}`}>
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-8 pb-20">
                
                {/* Back Button */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => router.push('/events')}
                        className="group flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <ArrowLeft size={14} />
                        </div>
                        Back to Attractions
                    </button>
                    <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-[900] uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-500/20">
                        {config.facility_type || 'Facility'}
                    </div>
                </div>

                {/* HERO BANNER */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative h-[300px] md:h-[450px] rounded-[3rem] overflow-hidden shadow-2xl group mb-10"
                >
                    <img 
                        src={event.img || DEFAULT_IMG} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={event.title} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 z-10">
                        <h1 className="text-4xl md:text-5xl font-[900] text-white uppercase tracking-tighter leading-none mb-4">
                            {event.title}
                        </h1>
                        <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                            <MapPin size={16} className="text-blue-400" /> 
                            {event.venue || event.location || config.location?.city || 'TBA'}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* LEFT COLUMN - Booking Selection */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* STEP 1: DATE SELECTION */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-10 space-y-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">1</div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Date</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Choose from available operating days</p>
                                </div>
                            </div>

                            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                                {dates.map((d, i) => {
                                    const isSelected = selectedDate && selectedDate.toDateString() === d.toDateString();
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => {
                                                setSelectedDate(d);
                                                setSelectedTimeSlot(null);
                                            }}
                                            className={`shrink-0 w-24 h-28 rounded-[1.5rem] flex flex-col items-center justify-center border-2 transition-all ${
                                                isSelected 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' 
                                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-300'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {d.toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-3xl font-black leading-none mb-1">{d.getDate()}</span>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                                {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* STEP 2: TIME SLOT SELECTION */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-10 space-y-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">2</div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Time Slot</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Arrival time for your session</p>
                                </div>
                            </div>

                            {timeSlots.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {timeSlots.map((slot, i) => {
                                        const isSelected = selectedTimeSlot?.timeString === slot.timeString;
                                        return (
                                            <button 
                                                key={i}
                                                onClick={() => setSelectedTimeSlot(slot)}
                                                className={`py-3 rounded-xl border-2 text-sm font-black transition-all ${
                                                    isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                                                }`}
                                            >
                                                {slot.timeString}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm font-bold text-slate-400">No time slots available for this date.</p>
                                </div>
                            )}
                        </div>

                        {/* STEP 3: PACKAGE SELECTION */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-10 space-y-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">3</div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Package</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Choose your session type</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {Object.entries(groupedPackages).map(([groupName, pkgs]) => (
                                    <div key={groupName} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{groupName}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {pkgs.map(pkg => {
                                                const isSelected = selectedPackage?.id === pkg.id;
                                                return (
                                                    <button 
                                                        key={pkg.id}
                                                        onClick={() => setSelectedPackage(pkg)}
                                                        className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                                                            isSelected 
                                                            ? 'bg-orange-50 border-orange-500 shadow-lg' 
                                                            : 'bg-white border-slate-100 hover:border-orange-300'
                                                        }`}
                                                    >
                                                        {isSelected && <div className="absolute top-0 right-0 p-2 bg-orange-500 text-white rounded-bl-xl"><CheckCircle2 size={16} /></div>}
                                                        <div className="flex flex-col h-full justify-between gap-3">
                                                            <div>
                                                                <h5 className={`text-sm font-black uppercase mb-1 ${isSelected ? 'text-orange-600' : 'text-slate-900'}`}>{pkg.name}</h5>
                                                                {pkg.isWeekendMode && <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-black uppercase rounded">Weekend</span>}
                                                            </div>
                                                            <div className={`text-xl font-black ${isSelected ? 'text-orange-600' : 'text-slate-600'}`}>
                                                                ₹{pkg.price}/-
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Summary */}
                    <div className="lg:col-span-4 space-y-6 sticky top-8">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 space-y-6">
                            <h3 className="text-sm font-[900] uppercase tracking-tight text-slate-900 border-b border-slate-100 pb-4">
                                Booking Summary
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-blue-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                        <p className="text-xs font-bold text-slate-900">{selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '---'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-blue-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                                        <p className="text-xs font-bold text-slate-900">{selectedTimeSlot ? selectedTimeSlot.timeString : '---'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Target size={18} className="text-blue-500" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Package</p>
                                        <p className="text-xs font-bold text-slate-900">{selectedPackage ? selectedPackage.name : '---'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</p>
                                    <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 bg-white rounded-lg text-slate-600 font-black hover:text-blue-600 shadow-sm">−</button>
                                        <span className="text-sm font-black w-6 text-center text-slate-900">{quantity}</span>
                                        <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 bg-white rounded-lg text-slate-600 font-black hover:text-blue-600 shadow-sm">+</button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-[12px] font-black text-slate-500 uppercase">Total Amount</span>
                                    <span className="text-3xl font-black text-blue-600">
                                        ₹{(selectedPackage ? selectedPackage.price * quantity : 0).toLocaleString()}
                                    </span>
                                </div>

                                <button 
                                    onClick={handleBooking}
                                    disabled={!selectedDate || !selectedTimeSlot || !selectedPackage}
                                    className={`w-full py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl flex items-center justify-center gap-3 ${
                                        (selectedDate && selectedTimeSlot && selectedPackage)
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:scale-[1.02]' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    Proceed to Pay <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
