"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    Star, MapPin, Sparkles, CheckCircle2, Clock, 
    ArrowLeft, Send, Loader2, ChevronLeft, ChevronRight,
    Calendar as CalendarIcon, Info, Phone, Map as MapIcon,
    Dribbble, Wind, ShoppingBag, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const StaticMap = dynamic(() => import("@/components/StaticMap"), { ssr: false });

export default function TurfProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const turfId = params.id;

    const [turf, setTurf] = useState(undefined);
    const [slots, setSlots] = useState([]);

    useEffect(() => {
        if (!turfId) return;
        supabase.from('turfs').select('*').eq('id', turfId).maybeSingle()
            .then(({ data }) => setTurf(data ?? null));
        supabase.from('turf_slots').select('*').eq('turf_id', turfId)
            .then(({ data }) => setSlots(data || []));
    }, [turfId]);

    const reserveSlot = async (payload) => {
        const { data, error } = await supabase.from('turf_bookings').insert({
            turf_id: payload.turfId, user_id: payload.userId, date: payload.date,
            slot_id: payload.slotId, participant_count: payload.participantCount,
            payment_type: payload.paymentType,
            customer_name: payload.customerDetails?.name,
            customer_email: payload.customerDetails?.email,
            customer_phone: payload.customerDetails?.phone,
            booking_status: 'pending', total_amount: calculateTotal(),
        }).select('id').single();
        if (error) throw error;
        return data.id;
    };
    const cancelBooking = async ({ bookingId }) => {
        await supabase.from('turf_bookings').update({ booking_status: 'cancelled' }).eq('id', bookingId);
    };
    const confirmPayment = async ({ bookingId, paymentIntentId, paymentStatus }) => {
        await supabase.from('turf_bookings').update({ payment_status: paymentStatus, payment_intent_id: paymentIntentId, booking_status: 'confirmed' }).eq('id', bookingId);
    };
    const [isBooking, setIsBooking] = useState(false);

    // Calculate dynamic price
    const calculateTotal = () => {
        if (!selectedSlot || !turf) return 0;
        
        let basePrice = selectedSlot.priceOverride || turf.pricePerHour;
        
        if (turf.pricingType === "per_person") {
            return (turf.pricePerPerson || basePrice) * participantCount;
        } else if (turf.pricingType === "tiered" && turf.pricingTiers) {
            const tier = turf.pricingTiers.find(t => participantCount >= t.min && participantCount <= t.max);
            if (tier) return tier.price;
            
            const sortedTiers = [...turf.pricingTiers].sort((a, b) => b.max - a.max);
            if (participantCount > sortedTiers[0].max) return sortedTiers[0].price;
        }
        
        return basePrice;
    };

    const currentDayOfWeek = new Date(selectedDate).getDay();
    const daySlots = slots.filter(s => s.dayOfWeek === currentDayOfWeek).sort((a,b) => a.startTime.localeCompare(b.startTime));

    // Generate dates for the weekly picker (7 days ahead - Sunday to Saturday format roughly)
    const getUpcomingDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
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

        setIsBooking(true);
        try {
            const res = await loadRazorpay();
            if (!res) {
                alert("Razorpay SDK failed to load. Are you online?");
                setIsBooking(false);
                return;
            }

            const bookingId = await reserveSlot({
                turfId: turf._id,
                userId: user.id,
                date: selectedDate,
                slotId: selectedSlot._id,
                participantCount,
                paymentType,
                customerDetails: {
                    name: user.name || "Customer",
                    email: user.email || "",
                    phone: user.phone || ""
                }
            });

            const totalAmount = calculateTotal();
            const partialAmount = Math.ceil(totalAmount / participantCount);
            const amountToPay = paymentType === "advance" ? partialAmount : totalAmount;

            const options = {
                key: "rzp_test_YourKeyHeremock",
                amount: amountToPay * 100, // in paise
                currency: "INR",
                name: "BookMyTicket",
                description: `Payment for ${turf.name}`,
                handler: async function (response) {
                    try {
                        await confirmPayment({
                            bookingId,
                            paymentIntentId: response.razorpay_payment_id,
                            paymentStatus: paymentType === "advance" ? "advance_paid" : "fully_paid"
                        });
                        router.push(`/profile?tab=my_booking`);
                    } catch (err) {
                        alert("Verification Failed: " + err.message);
                    }
                },
                prefill: {
                    name: user.name || "Customer",
                    email: user.email || user.identifier || "",
                    contact: user.phone || ""
                },
                theme: { color: "#2563eb" },
                modal: {
                    ondismiss: async function() {
                        try {
                            await cancelBooking({ bookingId, reason: "Payment window closed by user" });
                        } catch (e) {
                            console.error(e);
                        }
                        setIsBooking(false);
                    }
                }
            };
            
            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', async function (response) {
                try {
                     await cancelBooking({ bookingId, reason: "Payment failed" });
                } catch(e) {}
                alert("Payment Failed: " + response.error.description);
                setIsBooking(false);
            });
            paymentObject.open();

        } catch (err) {
            alert(err.message);
            setIsBooking(false);
        }
    };
    
    // ... skipping until return ... (I'll need to replace the whole return block or specific sections)
    // Actually I should be careful with the ellipsis "..." it's better to provide the whole block or clear markers.

    if (turf === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (!turf) {
        return <div className="min-h-screen flex items-center justify-center font-black uppercase text-slate-400">Turf Not Found</div>;
    }

    return (
        <main className="min-h-screen bg-[#f8fafc] pb-24">
            {/* Elegant Header Background */}
            <div className="h-[40vh] relative overflow-hidden group">
                <img 
                    src={turf.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200q=80"} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    alt={turf.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <div className="absolute top-8 left-8 flex items-center gap-4 z-50">
                     <button 
                        onClick={() => router.push('/')}
                        className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all border border-white/20 shadow-2xl font-black text-[10px] uppercase tracking-widest"
                     >
                        <ArrowLeft size={16} /> Back to Home
                     </button>
                </div>

                <div className="absolute bottom-12 left-12 right-12 max-w-7xl mx-auto">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Premium Facility</span>
                            {turf.status === 'active' && (
                                <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Operational</span>
                            )}
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">{turf.name}</h1>
                        <div className="flex items-center gap-6 text-white/80">
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <MapPin size={18} className="text-blue-400" />
                                {turf.location}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                                4.9 (120 Reviews)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-12 -mt-10 relative z-10">
                {/* Horizontal Booking Box */}
                <div className="bg-slate-900 rounded-[1.5rem] p-5 lg:p-6 text-white shadow-2xl relative group mb-6">
                    <div className="space-y-4 relative z-10">
                        {/* Header: Participants & Title */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                 <h3 className="text-xl font-black italic tracking-tight uppercase">Reserve Facility</h3>
                                 <p className="text-[12px] font-medium text-white/50">Select your preferred date and slot to lock in.</p>
                            </div>
                            
                            {/* Participants */}
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Users:</span>
                                 <button 
                                    onClick={() => setParticipantCount(Math.max(1, participantCount - 1))}
                                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                                 >
                                    <ChevronLeft size={16} />
                                 </button>
                                 <div className="text-center w-10">
                                     <span className="text-xl font-black italic tracking-tighter">{participantCount}</span>
                                 </div>
                                 <button 
                                    onClick={() => setParticipantCount(Math.min(turf.maxCapacity || 100, participantCount + 1))}
                                    className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                                 >
                                    <ChevronRight size={16} />
                                 </button>
                                 {turf.maxCapacity && <span className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2 border-l border-white/10">Max: {turf.maxCapacity}</span>}
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div>
                             <div className="flex items-center justify-between mb-3">
                                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Select Date</p>
                                 <div className="relative">
                                     <button 
                                         onClick={() => setShowCalendar(!showCalendar)}
                                         className="flex items-center gap-2 bg-slate-800 text-white/90 text-sm font-bold border border-white/10 px-4 py-2 rounded-xl shadow-lg hover:bg-slate-700 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                                     >
                                         <CalendarIcon size={14} className="text-blue-400" />
                                         {selectedDate ? selectedDate.split('-').reverse().join('/') : "DD/MM/YYYY"}
                                     </button>

                                     <AnimatePresence>
                                         {showCalendar && (
                                             <motion.div 
                                                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                 className="absolute right-0 top-full mt-2 bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] p-6 w-[300px] z-50 border border-slate-100"
                                             >
                                                 <div className="flex items-center justify-between mb-6">
                                                     <div className="space-y-1">
                                                         <h4 className="text-base font-black text-slate-900 tracking-tight">{monthNames[calMonth]} {calYear}</h4>
                                                         <div className="flex items-center gap-1.5">
                                                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                                             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Real-Time Availability</span>
                                                         </div>
                                                     </div>
                                                     <div className="flex gap-1">
                                                         <button 
                                                             onClick={() => {
                                                                 if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); }
                                                                 else { setCalMonth(m => m-1); }
                                                             }}
                                                             className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                                         >
                                                             <ChevronLeft size={18} />
                                                         </button>
                                                         <button 
                                                             onClick={() => {
                                                                 if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); }
                                                                 else { setCalMonth(m => m+1); }
                                                             }}
                                                             className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                                         >
                                                             <ChevronRight size={18} />
                                                         </button>
                                                     </div>
                                                 </div>

                                                 <div className="grid grid-cols-7 gap-1 mb-4">
                                                     {weekDays.map((day, idx) => (
                                                         <div key={idx} className="text-center text-[10px] font-black text-slate-300">{day}</div>
                                                     ))}
                                                 </div>

                                                 <div className="grid grid-cols-7 gap-1">
                                                     {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, idx) => (
                                                         <div key={`empty-${idx}`} />
                                                     ))}
                                                     {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, idx) => {
                                                         const day = idx + 1;
                                                         // We need correct local TZ dates to compare ISO strings 
                                                         const dateObj = new Date(calYear, calMonth, day, 12, 0, 0);
                                                         const dateString = dateObj.toISOString().split('T')[0];
                                                         
                                                         const todayZero = new Date();
                                                         todayZero.setHours(0,0,0,0);
                                                         const compareObj = new Date(calYear, calMonth, day);
                                                         const isPast = compareObj < todayZero;
                                                         
                                                         const isSelected = selectedDate === dateString;
                                                         
                                                         return (
                                                             <button
                                                                 key={day}
                                                                 disabled={isPast}
                                                                 onClick={() => {
                                                                     setSelectedDate(dateString);
                                                                     setSelectedSlot(null);
                                                                     setShowCalendar(false);
                                                                 }}
                                                                 className={`aspect-square w-full rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
                                                                     isSelected 
                                                                         ? 'border-2 border-red-500 text-red-500 shadow-xl shadow-red-500/10 scale-110 z-10 bg-white' 
                                                                         : isPast 
                                                                             ? 'text-slate-200 cursor-not-allowed opacity-50' 
                                                                             : 'text-slate-700 hover:bg-slate-50 hover:scale-105'
                                                                 }`}
                                                             >
                                                                 {day}
                                                             </button>
                                                         );
                                                     })}
                                                 </div>
                                             </motion.div>
                                         )}
                                     </AnimatePresence>
                                 </div>
                             </div>
                             <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                 {dateOptions.map((date, idx) => {
                                     const isoString = date.toISOString().split('T')[0];
                                     const isSelected = selectedDate === isoString;
                                     const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                     const dayNum = date.getDate();
                                     const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                                     
                                     return (
                                         <button 
                                             key={idx}
                                             onClick={() => {
                                                 setSelectedDate(isoString);
                                                 setSelectedSlot(null);
                                             }}
                                             className={`flex flex-col items-center justify-center min-w-[55px] py-2 rounded-xl border transition-all ${
                                                 isSelected 
                                                     ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-105' 
                                                     : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                             }`}
                                         >
                                             <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{dayName}</p>
                                             <p className="text-lg font-black italic my-0.5">{dayNum}</p>
                                             <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">{monthName}</p>
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>

                        {/* Slots Selection */}
                        <div>
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-4">Available Slots</p>
                             <div className="flex flex-wrap gap-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                                 {daySlots.map((slot) => (
                                     <button 
                                         key={slot._id}
                                         onClick={() => setSelectedSlot(slot)}
                                         className={`px-5 py-2.5 rounded-xl border transition-all text-center group flex-1 md:flex-none min-w-[90px] ${
                                             selectedSlot?._id === slot._id 
                                                 ? 'bg-blue-600 border-blue-500 shadow-xl scale-105' 
                                                 : 'bg-white/5 border-white/10 hover:bg-white/10'
                                         }`}
                                     >
                                         <p className="text-sm font-black">{slot.startTime}</p>
                                         <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">₹{slot.priceOverride || turf.pricePerHour}</p>
                                     </button>
                                 ))}
                                 {daySlots.length === 0 && (
                                     <div className="w-full py-6 text-left text-white/40 font-black uppercase tracking-widest text-[12px]">
                                         No slots mapped for this day
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* Summary & Checkout */}
                        <AnimatePresence>
                            {selectedSlot && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 origin-top"
                                >
                                    <div className="flex items-center gap-8 w-full md:w-auto">
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Valuation</p>
                                            <h4 className="text-3xl font-black italic tracking-tighter text-blue-400">₹{calculateTotal()}</h4>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pricing Model</p>
                                            <h4 className="text-sm font-bold italic text-white/90 uppercase tracking-tighter">
                                                {turf.pricingType === 'per_person' ? `₹${turf.pricePerPerson || turf.pricePerHour}/user` : turf.pricingType === 'tiered' ? 'Tiered Pricing' : 'Flat Hourly'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                                        <button 
                                            disabled={isBooking}
                                            onClick={() => handleBooking("advance")}
                                            className="px-6 py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {isBooking ? "Processing..." : `Partial (₹${Math.ceil(calculateTotal() / participantCount)} / User)`}
                                        </button>
                                        <button 
                                            disabled={isBooking}
                                            onClick={() => handleBooking("full")}
                                            className="px-6 py-4 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {isBooking ? "Executing..." : "Full Acquisition"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Background Decoration */}
                    <div className="absolute inset-0 overflow-hidden rounded-[1.5rem] pointer-events-none">
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000">
                             <Dribbble size={400} className="-mr-20 -mt-20" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Panel: Description & Amenities */}
                    <div className="lg:col-span-8 flex flex-col gap-10">
                        <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">About the Facility</h2>
                                <p className="text-slate-500 leading-relaxed font-medium">
                                    {turf.description || "Experience top-tier sporting action at our premium facility. Designed for performance and comfort, our turf offers the perfect environment for both competitive matches and casual training sessions."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { name: "Floodlights", icon: Sparkles },
                                    { name: "Drinking Water", icon: Wind },
                                    { name: "Changing Rooms", icon: ShoppingBag },
                                    { name: "First Aid", icon: ShieldCheck }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 gap-3 group hover:bg-blue-50 hover:border-blue-200 transition-all">
                                        <item.icon className="text-slate-400 group-hover:text-blue-500 transition-colors" size={24} />
                                        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600 tracking-widest">{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6 pt-10 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-slate-900 uppercase italic">Facility Location</h3>
                                    {turf.lat && turf.lng && (
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${turf.lat},${turf.lng}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                            Open in Google Maps
                                        </a>
                                    )}
                                </div>
                                <div className="h-64 bg-slate-100 rounded-[2rem] relative overflow-hidden group border border-slate-100 z-0">
                                     <StaticMap lat={turf.lat} lng={turf.lng} />
                                     <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl z-[1000] pointer-events-none">
                                         <p className="text-sm font-bold text-slate-900">{turf.address || turf.location || "Location not precisely mapped"}</p>
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Geo-Location Active</p>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Panel: Digital Guarantee */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl flex flex-col gap-6">
                             <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                 <ShieldCheck size={32} />
                             </div>
                             <div>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Digital Guarantee</p>
                                 <p className="text-sm font-medium text-slate-500 leading-relaxed mt-3">
                                    Bookings are subject to immediate verification. Advance payments are non-refundable within 24 hours of the match.
                                 </p>
                             </div>
                        </div>
                        <div className="p-8 bg-slate-900 rounded-[2rem] text-white shadow-xl flex flex-col gap-6">
                             <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center">
                                 <Phone size={32} />
                             </div>
                             <div>
                                 <p className="text-sm font-black text-blue-400 uppercase tracking-widest">Support Priority</p>
                                 <p className="text-sm font-medium text-slate-400 leading-relaxed mt-3">
                                    Need help with your booking? Contact our 24/7 concierge explicitly for premium facility reservations.
                                 </p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
