"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    Star, MapPin, Sparkles, CheckCircle2, Clock, 
    ArrowLeft, Send, Loader2, ChevronLeft, ChevronRight,
    Calendar as CalendarIcon, Phone, Map as MapIcon,
    Dribbble, Wind, ShoppingBag, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const format12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
};

const StaticMap = dynamic(() => import("@/components/StaticMap"), { ssr: false });

export default function TurfProfileClient({ id: turfId }) {
    const router = useRouter();
    const { user } = useAuth();

    const [turf, setTurf] = useState(undefined);
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [participantCount, setParticipantCount] = useState(1);
    const [showCalendar, setShowCalendar] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookedSlots, setBookedSlots] = useState([]);

    // Calendar state
    const today = new Date();
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [calYear, setCalYear] = useState(today.getFullYear());
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    useEffect(() => {
        if (!turfId) return;
        supabase.from('turfs').select('*').eq('id', turfId).maybeSingle()
            .then(({ data }) => setTurf(data ?? null));
        supabase.from('turf_slots').select('*').eq('turf_id', turfId)
            .then(({ data }) => setSlots(data || []));
    }, [turfId]);

    useEffect(() => {
        if (!turfId || !selectedDate) return;

        const fetchBookings = async () => {
            const { data, error } = await supabase
                .from('turf_bookings')
                .select('start_time, status')
                .eq('turf_id', turfId)
                .eq('date', selectedDate)
                .in('status', ['confirmed', 'pending', 'completed']);
            
            if (data) {
                setBookedSlots(data.map(b => b.start_time));
            } else if (error) {
                console.error("Error fetching bookings:", error);
            }
        };

        fetchBookings();

        const channel = supabase
            .channel('bookings_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'turf_bookings',
                    filter: `turf_id=eq.${turfId}`
                },
                (payload) => {
                    fetchBookings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [turfId, selectedDate]);

    useEffect(() => {
        if (slots.length > 0 && daySlots.length === 0) {
            const firstDateWithSlots = dateOptions.find(d => {
                const dow = d.getDay();
                return slots.some(s => Number(s.day_of_week) === dow);
            });
            if (firstDateWithSlots) {
                setSelectedDate(firstDateWithSlots.toISOString().split('T')[0]);
            }
        }
    }, [slots]);

    const calculateTotal = () => {
        if (!selectedSlot || !turf) return 0;
        let basePrice = selectedSlot.price_override || turf.price_per_hour || 1000;
        if (turf.pricing_type === "per_person") return (turf.price_per_person || basePrice) * participantCount;
        return basePrice;
    };

    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDayOfWeek = new Date(year, month - 1, day).getDay();
    const daySlots = slots.filter(s => Number(s.day_of_week) === currentDayOfWeek).sort((a,b) => (a.start_time || "").localeCompare(b.start_time || ""));

    const getUpcomingDates = () => {
        const dates = [];
        const t = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(t);
            d.setDate(t.getDate() + i);
            dates.push(d);
        }
        return dates;
    };
    const dateOptions = getUpcomingDates();

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBooking = async (paymentType) => {
        if (!user) {
            router.push(`/signin?redirect=/turfs/${turfId}`);
            return;
        }
        if (!selectedSlot) return alert("Please select a time slot.");
        if (bookedSlots.includes(selectedSlot.start_time)) return alert("Slot already booked!");

        setIsBooking(true);
        try {
            // Instant booking execution for demo/live flow
            const { error } = await supabase.from('turf_bookings').insert({
                turf_id: turfId,
                organiser_id: turf.organiser_id,
                user_id: user.id,
                date: selectedDate,
                start_time: selectedSlot.start_time,
                end_time: selectedSlot.end_time,
                turf_name: turf.name,
                total_amount: calculateTotal(),
                status: 'confirmed',
                payment_status: 'fully_paid',
                customer_details: {
                    name: user.name || "Verified User",
                    email: user.email || "",
                    phone: user.phone || ""
                }
            });

            if (error) {
                if (error.code === '23505') throw new Error("This slot was just booked by someone else!");
                throw error;
            }

            alert("Slot Booked Successfully! Real-time sync triggered.");
            setSelectedSlot(null);
        } catch (err) {
            console.error("Booking failed:", err);
            alert(err.message || "Failed to confirm booking.");
        } finally {
            setIsBooking(false);
        }
    };

    if (turf === undefined) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
    if (!turf) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-slate-400">Turf Not Found</div>;

    return (
        <main className="min-h-screen bg-[#f8fafc] pb-24">
            <div className="h-[40vh] relative overflow-hidden group">
                <img src={turf.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200q=80"} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={turf.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <div className="absolute top-8 left-8 flex items-center gap-4 z-50">
                     <button onClick={() => router.push('/')} className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all border border-white/20 shadow-2xl font-black text-[10px] uppercase tracking-widest"><ArrowLeft size={16} /> Back to Home</button>
                </div>
                <div className="absolute bottom-12 left-12 right-12 max-w-7xl mx-auto">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-gradient-to-r from-[#f84464] to-[#a855f7] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-[#f84464]/20">Premium Facility</span>
                            {turf.status === 'active' && <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Operational</span>}
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">{turf.name}</h1>
                        <div className="flex items-center gap-6 text-white/80">
                            <div className="flex items-center gap-2 text-sm font-bold"><MapPin size={18} className="text-[#f84464]" />{turf.location}</div>
                            <div className="flex items-center gap-2 text-sm font-bold"><Star size={18} className="text-yellow-400 fill-yellow-400" />4.9 (120 Reviews)</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-12 -mt-10 relative z-10">
                <div className="bg-slate-900 rounded-[1.5rem] p-5 lg:p-6 text-white shadow-2xl relative group mb-6 border border-white/5">
                    <div className="space-y-4 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                 <h3 className="text-xl font-black italic tracking-tight uppercase bg-gradient-to-r from-[#f84464] to-[#a855f7] bg-clip-text text-transparent">Reserve Facility</h3>
                                 <p className="text-[12px] font-medium text-white/50">Select your preferred date and slot to lock in.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Users:</span>
                                 <button onClick={() => setParticipantCount(Math.max(1, participantCount - 1))} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><ChevronLeft size={16} /></button>
                                 <div className="text-center w-10"><span className="text-xl font-black italic tracking-tighter">{participantCount}</span></div>
                                 <button onClick={() => setParticipantCount(Math.min(turf.maxCapacity || 100, participantCount + 1))} className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f84464] to-[#a855f7] flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-[#f84464]/20"><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        <div>
                             <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                 {dateOptions.map((date, idx) => {
                                     const isoString = date.toISOString().split('T')[0];
                                     const isSelected = selectedDate === isoString;
                                     return (
                                         <button key={idx} onClick={() => { setSelectedDate(isoString); setSelectedSlot(null); }} className={`flex flex-col items-center justify-center min-w-[55px] py-2 rounded-xl border transition-all ${isSelected ? 'bg-gradient-to-b from-[#f84464] to-[#a855f7] border-white/20 text-white shadow-xl scale-105' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                             <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                             <p className="text-lg font-black italic my-0.5">{date.getDate()}</p>
                                             <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>

                        <div>
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f84464] mb-4">Available Slots</p>
                             <div className="flex flex-nowrap gap-4 overflow-x-auto pb-6 pt-2 px-2 -mx-2 custom-scrollbar">
                                 {daySlots.map((slot) => {
                                     const isBooked = bookedSlots.includes(slot.start_time);
                                     const isSelected = selectedSlot?.id === slot.id;

                                     return (
                                         <button 
                                             key={slot.id} 
                                             disabled={isBooked}
                                             onClick={() => setSelectedSlot(slot)} 
                                             className={`px-8 py-4 rounded-2xl border transition-all text-center group min-w-[140px] shrink-0
                                                 ${isBooked ? 'bg-slate-800/40 border-slate-700/50 cursor-not-allowed opacity-50' 
                                                 : isSelected ? 'bg-gradient-to-br from-[#f84464] to-[#a855f7] border-white/20 shadow-2xl scale-110 z-10' 
                                                 : 'bg-white/5 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-400/50'}
                                             `}
                                         >
                                             <p className={`text-lg font-black italic ${isBooked ? 'text-slate-500 line-through' : isSelected ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-300'}`}>
                                                {format12Hour(slot.start_time)}
                                             </p>
                                             <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${isBooked ? 'text-slate-600' : 'opacity-60 text-white'}`}>
                                                {isBooked ? 'Booked' : `₹${slot.price_override || turf.price_per_hour || 1000}`}
                                             </p>
                                         </button>
                                     )
                                 })}
                                 {daySlots.length === 0 && (
                                     <div className="w-full py-10 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-[2rem] space-y-3 shrink-0">
                                         <Clock className="text-white/20" size={32} />
                                         <div className="text-center px-10">
                                             <p className="text-white/40 font-black uppercase tracking-widest text-[12px]">No sessions mapped for this day</p>
                                             <p className="text-[10px] text-white/20 font-bold uppercase tracking-tight mt-1">Try selecting another date from the carousel above</p>
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>

                        <AnimatePresence>
                            {selectedSlot && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 origin-top">
                                    <div className="flex items-center gap-8 w-full md:w-auto">
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Valuation</p>
                                            <h4 className="text-3xl font-black italic tracking-tighter text-[#f84464]">₹{calculateTotal()}</h4>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                                        <button disabled={isBooking} onClick={() => handleBooking("advance")} className="px-6 py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 disabled:opacity-50 whitespace-nowrap">
                                            {isBooking ? "Processing..." : `Partial (₹${Math.ceil(calculateTotal() / participantCount)} / User)`}
                                        </button>
                                        <button disabled={isBooking} onClick={() => handleBooking("full")} className="px-6 py-4 bg-gradient-to-r from-[#f84464] to-[#a855f7] text-white rounded-xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#f84464]/20 disabled:opacity-50 whitespace-nowrap">
                                            {isBooking ? "Executing..." : "Full Acquisition"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-8 flex flex-col gap-10">
                        <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">About the Facility</h2>
                                <p className="text-slate-500 leading-relaxed font-medium">{turf.description || "Experience top-tier sporting action at our premium facility."}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[{ name: "Floodlights", icon: Sparkles }, { name: "Drinking Water", icon: Wind }, { name: "Changing Rooms", icon: ShoppingBag }, { name: "First Aid", icon: ShieldCheck }].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 gap-3 group hover:bg-blue-50 hover:border-blue-200 transition-all">
                                        <item.icon className="text-slate-400 group-hover:text-blue-500 transition-colors" size={24} />
                                        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600 tracking-widest">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="h-64 bg-slate-100 rounded-[2rem] relative overflow-hidden group border border-slate-100 z-0">
                                 <StaticMap lat={turf.lat} lng={turf.lng} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl flex flex-col gap-6">
                             <ShieldCheck size={32} className="text-emerald-600" />
                             <div>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Digital Guarantee</p>
                                 <p className="text-sm font-medium text-slate-500 leading-relaxed mt-3">Bookings are subject to immediate verification.</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
