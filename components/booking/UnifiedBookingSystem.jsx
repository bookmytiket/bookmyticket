"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
    Calendar as CalendarIcon, Ticket, Clock, 
    ArrowRight, CheckCircle2, Loader2, Info,
    ChevronRight, MapPin, User, Phone, Mail,
    ShieldCheck, Sparkles
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import CalendarModal from "./CalendarModal";

export default function UnifiedBookingSystem({ 
    type = 'service', // 'service' | 'event'
    entityId,
    initialData = null 
}) {
    const { user } = useAuth();
    const router = useRouter();

    // -- STATE --
    const [step, setStep] = useState(1); // 1: Date, 2: Package, 3: Slot, 4: Confirm
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || user?.identifier || "",
        phone: user?.phone || "",
        remarks: ""
    });
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // -- DATA FETCHING --
    
    // 1. Entity Data (Event or Service)
    const { data: entity, loading: entityLoading } = useSupabaseQuery(
        type === 'event' ? 'events' : 'service_providers',
        (q) => q.select('*, vendors(*)').eq('id', entityId).single(),
        [entityId, type]
    );

    // 2. Packages/Tickets
    const { data: packages = [] } = useSupabaseQuery(
        type === 'event' ? 'events' : 'artistPackages', // Events usually have ticketTypes in the event object itself, but let's assume a table or property
        (q) => type === 'service' ? q.select('*').eq('vendor_id', entityId) : q.select('id, ticket_types').eq('id', entityId),
        [entityId, type]
    );

    // 3. Availability & Slots
    const { data: slots = [], loading: slotsLoading } = useSupabaseQuery(
        type === 'service' ? 'pool_slots' : 'event_slots', // This depends on the category, let's generalize or check entity category
        (q) => {
            if (type === 'service') {
                // Simplified: check for service-specific slots or generic
                return q.select('*').eq('vendor_id', entityId);
            }
            return q.select('*').eq('event_id', entityId);
        },
        [entityId, type, selectedDate]
    );

    // -- LOGIC --

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.identifier || user.email || prev.email,
                phone: user.phone || prev.phone
            }));
        }
    }, [user]);

    const handleConfirmBooking = async () => {
        if (!user) {
            router.push(`/signin?redirect=/services/${entityId}`);
            return;
        }

        setIsBooking(true);
        try {
            const table = type === 'event' ? 'bookings' : 'vendor_bookings';
            const payload = {
                user_id: user.id,
                status: 'Pending',
                total_amount: selectedPackage?.price || 0,
                booking_date: selectedDate?.toISOString().split('T')[0],
                [type === 'event' ? 'event_id' : 'vendor_id']: entityId,
                customer_details: {
                    ...formData,
                    package: selectedPackage?.title || selectedPackage?.name,
                    slot: selectedSlot?.start_time
                }
            };

            const { error } = await supabase.from(table).insert([payload]);
            if (error) throw error;
            
            setBookingSuccess(true);
        } catch (err) {
            alert("Booking failed: " + err.message);
        } finally {
            setIsBooking(true);
        }
    };

    if (entityLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    const currentEntity = entity || initialData;
    if (!currentEntity) return <div className="p-12 text-center font-black uppercase italic">Entity not found</div>;

    return (
        <div className="w-full max-w-[1200px] mx-auto">
            {/* Success State */}
            {bookingSuccess && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[40px] p-12 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="text-green-500" size={48} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">Confirmed!</h2>
                        <p className="text-slate-600 font-medium mb-10 leading-relaxed">Your booking request has been received. Check your email for updates.</p>
                        <button 
                            onClick={() => router.push('/bookings')}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            View My Bookings
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12">
                {/* LEFT: Info & Steps */}
                <div className="space-y-10">
                    {/* Header Info */}
                    <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[80px] -z-10 group-hover:bg-orange-500/10 transition-all duration-700" />
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl shadow-orange-500/20 flex-shrink-0">
                                <img 
                                    src={currentEntity.images?.[0] || currentEntity.portfolio?.[0]?.url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400"} 
                                    className="w-full h-full object-cover" 
                                    alt="Entity" 
                                />
                            </div>
                            <div className="flex-1">
                                <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-2 inline-block">
                                    {type === 'event' ? 'Live Event' : (currentEntity.category || 'Professional Service')}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-3">
                                    {currentEntity.title || currentEntity.business_name || currentEntity.name}
                                </h1>
                                <div className="flex items-center gap-4 text-slate-400 text-sm font-bold uppercase italic tracking-tight">
                                    <div className="flex items-center gap-1.5"><MapPin size={16} className="text-orange-500" /> {currentEntity.city || currentEntity.location || "Online"}</div>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <div className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-500" /> Verified</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STEPS */}
                    <div className="space-y-6">
                        {/* Step 1: Date & Time */}
                        <div className={`bg-white rounded-[40px] p-8 border-2 transition-all ${step === 1 ? "border-orange-500 shadow-lg shadow-orange-500/5" : "border-slate-100 opacity-60"}`}>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xl ${step === 1 ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"}`}>01</div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Choose Date & Slot</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time dynamic availability</p>
                                    </div>
                                </div>
                                {selectedDate && (
                                    <button 
                                        onClick={() => setIsCalendarOpen(true)}
                                        className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase italic text-orange-500 hover:bg-orange-50 transition-all"
                                    >
                                        Change Date
                                    </button>
                                )}
                            </div>

                            {!selectedDate ? (
                                <button 
                                    onClick={() => setIsCalendarOpen(true)}
                                    className="w-full py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-orange-500 hover:bg-orange-50/30 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-orange-500 transition-all shadow-inner">
                                        <CalendarIcon size={32} />
                                    </div>
                                    <span className="text-sm font-black uppercase italic tracking-tighter text-slate-400 group-hover:text-slate-900">Select Event Date</span>
                                </button>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center gap-6 p-6 bg-orange-50 rounded-[32px] border border-orange-100">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-[10px] font-black uppercase text-orange-500">{selectedDate.toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-2xl font-black text-slate-900 leading-none">{selectedDate.getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{selectedDate.toLocaleString('default', { weekday: 'long' })}</div>
                                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Selected Schedule</div>
                                        </div>
                                    </div>

                                    {/* Slots Grid */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Available Time Slots</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {slotsLoading ? (
                                                <div className="col-span-full py-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>
                                            ) : slots.length > 0 ? slots.map(slot => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`p-4 rounded-2xl border-2 font-black text-sm uppercase italic transition-all ${
                                                        selectedSlot?.id === slot.id 
                                                        ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                                                        : "border-slate-100 bg-white hover:border-slate-300 text-slate-600"
                                                    }`}
                                                >
                                                    {slot.start_time.substring(0, 5)}
                                                </button>
                                            )) : (
                                                <div className="col-span-full py-8 px-6 bg-slate-50 rounded-2xl text-center">
                                                    <p className="text-[11px] font-black uppercase italic text-slate-400">No specific slots available. Booking for full day.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {step === 1 && (
                                        <button 
                                            onClick={() => setStep(2)}
                                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-widest text-sm hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            Continue to Packages <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Package Selection */}
                        <div className={`bg-white rounded-[40px] p-8 border-2 transition-all ${step === 2 ? "border-orange-500 shadow-lg shadow-orange-500/5" : "border-slate-100 opacity-60"}`}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xl ${step === 2 ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"}`}>02</div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Select Service Tier</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose the perfect experience</p>
                                </div>
                            </div>

                            {step >= 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    {packages.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {packages.map(pkg => (
                                                <div 
                                                    key={pkg.id}
                                                    onClick={() => setSelectedPackage(pkg)}
                                                    className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer relative group ${
                                                        selectedPackage?.id === pkg.id 
                                                        ? "border-orange-500 bg-orange-50 shadow-md" 
                                                        : "border-slate-100 bg-white hover:border-slate-300"
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">{pkg.title || pkg.name}</h4>
                                                        <div className="text-right">
                                                            <div className="text-xl font-black text-slate-900">₹{pkg.price.toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-4 line-clamp-2">{pkg.description}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(pkg.features || []).slice(0, 2).map((feat, fi) => (
                                                            <span key={fi} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                                                                <CheckCircle2 size={10} className="text-green-500" /> {feat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {selectedPackage?.id === pkg.id && (
                                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                                                            <CheckCircle2 size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-slate-50 rounded-3xl text-center border-2 border-dashed border-slate-200">
                                            <p className="text-[11px] font-black uppercase italic text-slate-400">Loading dynamic packages...</p>
                                        </div>
                                    )}

                                    {step === 2 && selectedPackage && (
                                        <button 
                                            onClick={() => setStep(3)}
                                            className="w-full mt-4 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-widest text-sm hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            Confirm Details <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Confirmation Form */}
                        <div className={`bg-white rounded-[40px] p-8 border-2 transition-all ${step === 3 ? "border-orange-500 shadow-lg shadow-orange-500/5" : "border-slate-100 opacity-60"}`}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xl ${step === 3 ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"}`}>03</div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Your Information</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finalize your booking</p>
                                </div>
                            </div>

                            {step >= 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="Full Name"
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl font-bold outline-none transition-all text-sm"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="tel" 
                                                placeholder="Phone Number"
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl font-bold outline-none transition-all text-sm"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="email" 
                                            placeholder="Email Address"
                                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl font-bold outline-none transition-all text-sm"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <textarea 
                                        placeholder="Special requests or notes (optional)"
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl font-bold outline-none transition-all text-sm min-h-[120px] resize-none"
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Booking Summary Widget */}
                <div className="relative">
                    <div className="sticky top-24 bg-white rounded-[48px] border-2 border-slate-900 p-8 shadow-[16px_16px_0_rgba(15,23,42,1)] overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900 rotate-45 translate-x-16 -translate-y-16" />
                        
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-10 flex items-center gap-3">
                                <ShieldCheck className="text-green-500" /> Booking Summary
                            </h3>

                            <div className="space-y-8">
                                {/* Selected Info Rows */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 group">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedDate ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-slate-100 text-slate-300"}`}>
                                            <CalendarIcon size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event Date</div>
                                            <div className="text-sm font-black uppercase italic text-slate-900">{selectedDate ? selectedDate.toLocaleDateString('default', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Selected"}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedPackage ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-300"}`}>
                                            <Ticket size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Package Type</div>
                                            <div className="text-sm font-black uppercase italic text-slate-900">{selectedPackage ? (selectedPackage.title || selectedPackage.name) : "Not Selected"}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedSlot ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 text-slate-300"}`}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Slot</div>
                                            <div className="text-sm font-black uppercase italic text-slate-900">{selectedSlot ? selectedSlot.start_time.substring(0, 5) : "Full Day"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="pt-8 border-t-2 border-dashed border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center text-slate-400 font-black uppercase italic text-[11px] tracking-widest">
                                        <span>Base Price</span>
                                        <span className="text-slate-900 text-sm">₹{(selectedPackage?.price || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400 font-black uppercase italic text-[11px] tracking-widest">
                                        <span>Service Fee (18% GST)</span>
                                        <span className="text-slate-900 text-sm">₹{((selectedPackage?.price || 0) * 0.18).toFixed(0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 flex justify-between items-center">
                                        <span className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Total Payable</span>
                                        <span className="text-3xl font-black text-orange-500 tracking-tighter italic">₹{((selectedPackage?.price || 0) * 1.18).toFixed(0).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="pt-4">
                                    <button 
                                        onClick={handleConfirmBooking}
                                        disabled={!selectedDate || !selectedPackage || isBooking}
                                        className={`w-full py-6 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-[0_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 flex items-center justify-center gap-3 ${(!selectedDate || !selectedPackage || isBooking) ? "opacity-40 grayscale cursor-not-allowed" : "hover:bg-slate-800"}`}
                                    >
                                        {isBooking ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                                        {isBooking ? "Processing..." : "Secure My Booking"}
                                    </button>
                                    <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-8 italic">Secure Transaction powered by BookMyTicket</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Mobile Floating Bar (Optional, for Mobile UX) */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-50 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase">Total Amount</div>
                            <div className="text-xl font-black text-slate-900 tracking-tighter italic">₹{((selectedPackage?.price || 0) * 1.18).toFixed(0).toLocaleString()}</div>
                        </div>
                        <button 
                            onClick={() => {
                                if (step < 3) setStep(step + 1);
                                else handleConfirmBooking();
                            }}
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all"
                        >
                            {step < 3 ? "Continue" : "Book Now"}
                        </button>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <CalendarModal 
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                selectedDate={selectedDate}
                onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                    if (step === 1) setStep(1); // Keep on step 1 to select slot
                }}
                blockedDates={[]} // Fetch from entity availability
            />
        </div>
    );
}
