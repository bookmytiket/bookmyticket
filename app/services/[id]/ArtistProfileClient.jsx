"use client";
import React, { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    Star, MapPin, Sparkles, CheckCircle2, Clock, Users, Languages,
    ArrowLeft, Send, Loader2, ChevronLeft, ChevronRight, ChevronDown,
    Calendar, ShieldCheck, User, Mail, Phone, Share2, Heart, Info, Warehouse
} from "lucide-react";
import { triggerNotification } from "@/lib/notificationHelper";
import BookingDisclaimer from "@/components/BookingDisclaimer";
import CalendarModal from "@/components/booking/CalendarModal";
import PackageSelector from "@/components/booking/PackageSelector";

export default function ArtistProfileClient({ id: vendorId }) {
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState("portfolio");
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [formData, setFormData] = useState({ 
        name: "", 
        email: "", 
        phone: "", 
        date: "",
        address: "",
        remarks: ""
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Fetch profile and vendor
    const { data: profileResult, loading: profileLoading } = useSupabaseQuery('service_providers', (q) => 
        q.select('*').eq('id', vendorId).maybeSingle()
    , [vendorId]);

    const { data: vendorResult } = useSupabaseQuery('vendors', (q) => 
        q.select('*').eq('id', vendorId).maybeSingle()
    , [vendorId]);
    
    const fullProfile = profileResult ? { organiser: vendorResult, vendorProfile: profileResult } : null;

    // Fetch packages
    const { data: packages = [] } = useSupabaseQuery('artistPackages', (q) => 
        q.select('*').eq('vendor_id', vendorId)
    , [vendorId]);

    // Fetch reviews
    const { data: reviews = [] } = useSupabaseQuery('vendor_reviews', (q) => 
        q.select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
    , [vendorId]);

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

    const handleBooking = async (e) => {
        if (e) e.preventDefault();
        if (!user) { router.push(`/signin?redirect=/services/${vendorId}`); return; }
        if (!selectedPackage || !formData.date || !agreedToTerms) {
            triggerNotification("Please fill all details and agree to terms", "error");
            return;
        }

        setIsBooking(true);
        try {
            const { error } = await supabase.from('vendor_bookings').insert([{
                vendor_id: vendorId,
                user_id: user.id,
                service_type: fullProfile.vendorProfile.category || "Professional Service",
                booking_date: formData.date,
                total_amount: selectedPackage.price,
                customer_details: {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    remarks: formData.remarks
                },
                status: 'Pending'
            }]);

            if (error) throw error;
            setShowSuccess(true);
            triggerNotification("Booking request sent successfully!", "success");
        } catch (err) {
            triggerNotification("Failed to send booking request: " + err.message, "error");
        } finally {
            setIsBooking(false);
        }
    };

    if (profileLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]"><Loader2 className="animate-spin text-[#FF5A5F]" size={48} /></div>;
    if (!fullProfile) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfc] space-y-4"><h1 className="text-2xl font-bold text-slate-900">Artist Not Found</h1><button onClick={() => router.back()} className="text-[#FF5A5F] font-bold hover:underline">Go Back</button></div>;

    const organiser = fullProfile?.organiser || fullProfile?.vendorProfile;
    const coverPhoto = fullProfile.vendorProfile?.portfolio?.[0]?.url || "https://images.unsplash.com/photo-1596704017254-9b1210630b65?q=80&w=1200";
    const portfolio = fullProfile.vendorProfile?.portfolio || [];

    return (
        <main className="min-h-screen bg-[#fafbfc] pb-24 text-[#111827]">
            {/* Success Overlay */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-2xl   ">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="text-green-500" size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Booking Sent!</h2>
                        <p className="text-slate-600 font-medium mb-8">Your request has been sent to {organiser.business_name || organiser.name}. They will contact you shortly.</p>
                        <button 
                            onClick={() => router.push('/bookings')} 
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            View My Bookings
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-2 mt-4">
                {/* Banner with Event-style Info Bar */}
                <div className="w-full h-[220px] md:h-[360px] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl relative mb-4 border-4 border-white group">
                    <img src={coverPhoto} className="absolute inset-0 w-full h-full object-cover transition-transform  group-hover:scale-105" alt="Service Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg">
                                    {fullProfile.vendorProfile?.category || 'Professional'}
                                </span>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[12px] font-bold uppercase">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span>4.9 (24 Reviews)</span>
                                </div>
                            </div>
                            <h2 className="text-white text-[28px] md:text-[48px] font-bold uppercase tracking-tight leading-tight mt-1 drop-shadow-2xl">
                                {organiser.business_name || organiser.name}
                            </h2>
                            <div className="flex items-center gap-6 text-white/80 mt-4 font-bold uppercase text-[13px] tracking-wide">
                                <div className="flex items-center gap-2"><MapPin size={18} className="text-pink-400" /> {fullProfile.vendorProfile?.city || "PAN India"}</div>
                                <div className="w-1.5 h-1.5 bg-white/30 rounded-full hidden md:block" />
                                <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-400" /> Verified Partner</div>
                            </div>
                        </div>
                    </div>
                    <Link 
                        href="/"
                        className="absolute top-8 left-8 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all z-10"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                </div>

                {/* Info Bar below Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
                    <div className="flex flex-wrap items-center gap-8 text-[14px] font-bold text-slate-500 uppercase tracking-tight">
                        <div className="flex items-center gap-3"><Clock size={18} className="text-slate-400" /> Experience 5+ Yrs</div>
                        <div className="flex items-center gap-3"><Users size={18} className="text-slate-400" /> Professional Service</div>
                        <div className="flex items-center gap-3"><Languages size={18} className="text-slate-400" /> Multi-Lingual</div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight"><Share2 size={18} /> Share Profile</button>
                        <button className="flex items-center gap-2 text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight"><Heart size={18} /> Favorite</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Booking Form (RESTORED STYLE) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
                        
                        {/* Safe Checkout Banner */}
                        <div className="flex items-center justify-center space-x-3 border-none bg-[#fde047] px-8 md:px-10 py-1.5 rounded-2xl shadow-[0_4px_15px_-4px_rgba(253,224,71,0.2)] w-full">
                            <img src="/logo.png" alt="BookMyTicket" style={{ height: "50px", width: "auto" }} />
                            <span className="text-black/20 text-xl mx-3">|</span>
                            <span className="font-bold text-black text-[17px]">Safe Checkout</span>
                        </div>

                        <div id="booking-form" className="bg-white rounded-[40px] border border-slate-200 shadow-xl p-6 md:p-10 relative">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                 Booking Confirmation
                            </h3>

                            <form onSubmit={handleBooking} className="space-y-10">
                                {/* Personal Details Grid */}
                                <div className="space-y-6">
                                    <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Personal Details</label>
                                    
                                    {/* Name & Email Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-600 block">Full Name <span className="text-pink-500">*</span></label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="Enter your name"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:border-pink-500 transition-all placeholder:text-slate-400 shadow-sm focus:shadow-md"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-600 block">Email Address <span className="text-pink-500">*</span></label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="email" 
                                                    required
                                                    placeholder="example@gmail.com"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:border-pink-500 transition-all placeholder:text-slate-400 shadow-sm focus:shadow-md"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone & Date Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-600 block">WhatsApp Number <span className="text-pink-500">*</span></label>
                                            <div className="flex">
                                                <div className="flex items-center justify-center bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl px-4 gap-2 shrink-0">
                                                    <span className="text-[16px]">🇮🇳</span>
                                                </div>
                                                <div className="relative flex-1">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input 
                                                        type="tel" 
                                                        required
                                                        placeholder="10-digit number"
                                                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-r-xl text-[14px] font-bold text-slate-900 outline-none focus:border-pink-500 transition-all placeholder:text-slate-400 shadow-sm focus:shadow-md"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 relative">
                                            <label className="text-[13px] font-bold text-slate-600 block">Event Date <span className="text-pink-500">*</span></label>
                                            <div className="relative">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                                    className={`w-full pl-12 pr-10 py-3.5 bg-white border rounded-xl text-[14px] font-bold flex items-center justify-between text-left transition-all shadow-sm hover:shadow-md ${isDateDropdownOpen ? "border-pink-500 ring-2 ring-pink-500/10" : "border-slate-200 hover:border-pink-400"}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className={formData.date ? "text-green-500" : "text-pink-500"} size={18} />
                                                        <span className={formData.date ? "text-slate-900" : "text-slate-400"}>
                                                            {formData.date ? new Date(formData.date).toLocaleDateString('default', { day: '2-digit', month: 'short', year: 'numeric' }) : "Select Date"}
                                                        </span>
                                                    </div>
                                                    <ChevronDown size={18} className={`text-slate-400 transition-transform  ${isDateDropdownOpen ? "rotate-180" : ""}`} />
                                                </button>

                                                {/* Custom Date Dropdown Menu (OPENING ABOVE) */}
                                                {isDateDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsDateDropdownOpen(false)} />
                                                        <div className="absolute bottom-[calc(100%+12px)] right-0 left-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 z-50     min-w-[280px]">
                                                            {/* Calendar Header */}
                                                            <div className="flex items-center justify-between mb-4">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                                                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                                                                >
                                                                    <ChevronLeft size={18} />
                                                                </button>
                                                                <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-900">
                                                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                                </h4>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                                                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                                                                >
                                                                    <ChevronRight size={18} />
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-7 mb-2 text-center">
                                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                                                    <div key={day} className="text-[10px] font-black text-slate-300 uppercase">{day}</div>
                                                                ))}
                                                            </div>

                                                            <div className="grid grid-cols-7 gap-0.5">
                                                                {(() => {
                                                                    const days = [];
                                                                    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                                                                    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                                                                    const today = new Date();
                                                                    today.setHours(0,0,0,0);

                                                                    for (let i = 0; i < firstDay; i++) days.push(<div key={`pad-${i}`} />);

                                                                    for (let d = 1; d <= daysInMonth; d++) {
                                                                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                                        const isSelected = formData.date === dateStr;
                                                                        const isPast = new Date(dateStr) < today;

                                                                        days.push(
                                                                            <button
                                                                                key={d}
                                                                                type="button"
                                                                                disabled={isPast}
                                                                                onClick={() => {
                                                                                    setFormData({...formData, date: dateStr});
                                                                                    setIsDateDropdownOpen(false);
                                                                                }}
                                                                                className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${isPast ? "text-slate-200 cursor-not-allowed" : isSelected ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" : "hover:bg-pink-50 hover:text-pink-600 text-slate-600"}`}
                                                                            >
                                                                                {d}
                                                                            </button>
                                                                        );
                                                                    }
                                                                    return days;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Package Selection Area (CUSTOM PREMIUM DROPDOWN) */}
                                <div className="space-y-6 relative">
                                    <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Choose Your Package</label>
                                    
                                    {/* Custom Dropdown Trigger */}
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setIsPackageDropdownOpen(!isPackageDropdownOpen)}
                                            className={`w-full pl-14 pr-12 py-5 bg-white border-2 rounded-3xl font-bold transition-all text-[15px] flex items-center justify-between text-left shadow-sm ${isPackageDropdownOpen ? "border-pink-500 ring-4 ring-pink-500/10 shadow-lg" : "border-slate-100 hover:border-pink-400 hover:shadow-md"}`}
                                        >
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-500">
                                                <Sparkles size={20} />
                                            </div>
                                            <span className={selectedPackage ? "text-slate-900" : "text-slate-400"}>
                                                {selectedPackage ? selectedPackage.title : "Select a service package..."}
                                            </span>
                                            <ChevronDown size={20} className={`text-slate-400 transition-transform  ${isPackageDropdownOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {/* Custom Dropdown Menu */}
                                        {isPackageDropdownOpen && (
                                            <>
                                                {/* Backdrop to close dropdown */}
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setIsPackageDropdownOpen(false)}
                                                />
                                                <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white border-2 border-slate-100 rounded-[32px] shadow-2xl py-4 z-50    ">
                                                    <div className="max-h-[300px] overflow-y-auto px-2 custom-scrollbar">
                                                        {packages.length > 0 ? packages.map((pkg) => (
                                                            <div 
                                                                key={pkg.id || pkg._id}
                                                                onClick={() => {
                                                                    setSelectedPackage(pkg);
                                                                    setIsPackageDropdownOpen(false);
                                                                }}
                                                                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all mb-1 ${selectedPackage?.id === (pkg.id || pkg._id) ? "bg-pink-50 text-pink-600" : "hover:bg-slate-50 text-slate-700"}`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-black uppercase text-[13px] tracking-tight">{pkg.title}</span>
                                                                    <span className="text-[11px] font-bold text-slate-400 mt-0.5 line-clamp-1">{pkg.description || "Premium service experience"}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-[14px]">₹{pkg.price.toLocaleString()}</span>
                                                                    {selectedPackage?.id === (pkg.id || pkg._id) && <CheckCircle2 size={16} className="text-pink-500" />}
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="p-4 text-center text-slate-400 font-bold uppercase text-[11px] tracking-widest">
                                                                No packages available
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Selected Package Details Preview */}
                                    {selectedPackage && !isPackageDropdownOpen && (
                                        <div className="mt-4 p-5 bg-gradient-to-br from-pink-50 to-white border border-pink-100 rounded-3xl     shadow-sm relative overflow-hidden">
                                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-pink-500/5 rounded-full" />
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-black text-pink-600 uppercase text-[14px] tracking-tight flex items-center gap-2">
                                                        <Sparkles size={14} /> {selectedPackage.title}
                                                    </h4>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[16px] font-black text-slate-900">₹{selectedPackage.price.toLocaleString()}</span>
                                                        <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest">Best Value</span>
                                                    </div>
                                                </div>
                                                <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                                                    {selectedPackage.description || "Comprehensive service package tailored to your needs. Includes all standard features and premium support."}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-slate-100">
                                    <div className="flex items-start gap-4 cursor-pointer group" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                                        <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 mt-0.5 ${agreedToTerms ? "bg-pink-500 border-pink-500 shadow-lg shadow-pink-500/40" : "border-slate-300 group-hover:border-slate-400"}`}>
                                            {agreedToTerms && <CheckCircle2 className="text-white" size={16} />}
                                        </div>
                                        <span className="text-[13px] font-bold text-slate-500 leading-tight">
                                            I have read and agreed to the{" "}
                                            <a
                                                href="/terms"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="text-pink-500 underline underline-offset-2 hover:text-purple-600 transition-colors font-extrabold"
                                            >
                                                Service Policies and Terms &amp; Conditions
                                            </a>
                                        </span>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Tabs: Portfolio & Reviews (Moved below form on left) */}
                        <div id="tabs-section" className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 md:p-14 overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-slate-200 mb-10">
                                {[
                                    { id: 'portfolio', label: 'Portfolio', icon: <Sparkles size={18} /> },
                                    { id: 'reviews', label: 'Reviews', icon: <Star size={18} /> }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-tight text-[13px] transition-all border-b-2 ${
                                            activeTab === tab.id 
                                            ? "border-pink-500 text-pink-500" 
                                            : "border-transparent text-slate-400 hover:text-slate-600"
                                        }`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[400px]">
                                {activeTab === 'portfolio' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {portfolio.length > 0 ? portfolio.map((item, idx) => (
                                            <div key={idx} className="aspect-[4/5] rounded-[32px] overflow-hidden group cursor-pointer border-2 border-transparent hover:border-pink-500 transition-all relative shadow-lg">
                                                <img src={item.url} className="w-full h-full object-cover transition-transform  group-hover:scale-110" alt={`Portfolio ${idx}`} />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Sparkles className="text-white" size={32} />
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest">No portfolio items added yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-6">
                                        {reviews.length > 0 ? reviews.map((rev, idx) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 shadow-sm">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold uppercase shadow-md">
                                                            {rev.reviewer_name?.[0] || <User size={24} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 uppercase tracking-tight text-lg">{rev.reviewer_name || "Verified Customer"}</div>
                                                            <div className="flex gap-1 mt-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={14} className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {new Date(rev.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 font-medium leading-relaxed text-[16px]">{rev.comment}</p>
                                            </div>
                                        )) : (
                                            <div className="py-20 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest">No reviews yet. Be the first to book!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Artist Profile Summary (RESTORED STYLE) */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-8 sticky top-[120px]">
                        {/* Summary Card */}
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl p-8">
                            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden mb-8 relative">
                                <img src={coverPhoto} className="w-full h-full object-cover" alt="Profile" />
                                <div className="absolute top-4 left-4 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-pink-500 shadow-lg">
                                    Top Rated Artist
                                </div>
                            </div>
                            
                            <div className="space-y-2 mb-8">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                                    {organiser.business_name || organiser.name}
                                </h3>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                                    <MapPin size={14} className="text-pink-500" /> {fullProfile.vendorProfile?.city || "PAN India"}
                                </div>
                            </div>

                            <div className="space-y-4 mb-10 pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Clock size={18} /></div>
                                        <span className="text-[12px] font-bold text-slate-600 uppercase">Experience</span>
                                    </div>
                                    <span className="text-[12px] font-black text-slate-900">5+ Years</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Star size={18} /></div>
                                        <span className="text-[12px] font-bold text-slate-600 uppercase">Avg Rating</span>
                                    </div>
                                    <span className="text-[12px] font-black text-slate-900">4.9 / 5.0</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck size={18} /></div>
                                        <span className="text-[12px] font-bold text-slate-600 uppercase">Verified</span>
                                    </div>
                                    <span className="text-[12px] font-black text-green-500 uppercase">Yes</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-slate-100">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">About the Artist</h4>
                                <p className="text-[14px] font-medium text-slate-500 leading-relaxed line-clamp-4">
                                    {fullProfile.vendorProfile?.bio || "A dedicated professional committed to excellence. With years of experience and a passion for their craft, they bring unique creativity and skill to every project."}
                                </p>
                                <button 
                                    onClick={() => {
                                        const el = document.getElementById('tabs-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        setActiveTab('portfolio');
                                    }}
                                    className="text-pink-500 text-[12px] font-black uppercase tracking-widest hover:underline"
                                >
                                    Read more
                                </button>
                            </div>

                            {/* Book Now Button (RIGHT SIDE) */}
                            <div className="pt-10 border-t border-slate-100">
                                <button 
                                    onClick={handleBooking}
                                    disabled={isBooking || !selectedPackage || !formData.date || !agreedToTerms}
                                    className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[24px] font-black uppercase tracking-[0.15em] text-[14px] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-pink-500/40 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isBooking ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                                    {isBooking ? "Confirming..." : (selectedPackage ? `Book for ₹${selectedPackage.price.toLocaleString()}` : "Book Now")}
                                </button>
                                {!selectedPackage && <p className="text-[10px] text-slate-400 text-center mt-3 font-bold uppercase tracking-widest">Select a package to enable booking</p>}
                                {!formData.date && selectedPackage && <p className="text-[10px] text-pink-400 text-center mt-3 font-bold uppercase tracking-widest">Please pick a date on the left</p>}
                            </div>
                        </div>

                        {/* Safety & Trust Card */}
                        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><ShieldCheck size={24} className="text-pink-400" /></div>
                                    <h4 className="text-lg font-black uppercase tracking-tighter italic">Book with Trust</h4>
                                </div>
                                <p className="text-white/60 text-[13px] leading-relaxed mb-6">
                                    Your payment is held securely and only released after the service is successfully completed.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest"><CheckCircle2 size={16} className="text-green-400" /> Instant Confirmation</li>
                                    <li className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest"><CheckCircle2 size={16} className="text-green-400" /> Secure Payment</li>
                                    <li className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest"><CheckCircle2 size={16} className="text-green-400" /> 24/7 Support</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Mobile Sticky Booking Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-[90] flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Starts from</div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight italic">₹{(selectedPackage?.price || packages[0]?.price || 0).toLocaleString()}</div>
                </div>
                <button 
                    onClick={() => {
                        const el = document.getElementById('booking-form');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[24px] font-bold uppercase tracking-widest text-[12px] shadow-xl active:scale-95 transition-all"
                >
                    Book Now
                </button>
            </div>

            {/* --- SEO ENHANCEMENT SECTION --- */}
            <div className="mt-20 border-t border-slate-100 pt-20 pb-20">
                <div className="max-w-[900px] mx-auto text-slate-600 px-6">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 uppercase tracking-tight">Hiring Professional {fullProfile.vendorProfile?.category || 'Services'} from {organiser.business_name || organiser.name}</h2>
                    
                    <div className="prose prose-slate max-w-none space-y-6 text-[16px] leading-relaxed">
                        <p>
                            Are you looking to hire a professional <strong>{fullProfile.vendorProfile?.category}</strong> in <strong>{fullProfile.vendorProfile?.city || "India"}</strong>? You've come to the right place. BookMyTicket is a leading <strong>professional artist marketplace</strong>, and <strong>{organiser.business_name || organiser.name}</strong> is one of our top-rated <strong>verified service providers</strong>, known for their exceptional skill and professional approach.
                        </p>

                        <h3 className="text-xl font-bold text-slate-800 mt-10">Why Hire Professionals via BookMyTicket?</h3>
                        <p>
                            Booking professional services online can be daunting, but BookMyTicket makes it simple and safe. When you hire {organiser.business_name || organiser.name} through our <strong>artist management platform</strong>, you benefit from our <strong>Secure Payment Protection</strong>. Your money is held in escrow and only released to the service provider after the job is successfully completed.
                        </p>

                        <h3 className="text-xl font-bold text-slate-800 mt-10">About {organiser.business_name || organiser.name}</h3>
                        <p>
                            With over 5 years of experience in the industry, {organiser.business_name || organiser.name} has built a reputation for excellence. Specialising in <strong>{fullProfile.vendorProfile?.category}</strong>, they have successfully completed numerous projects across {fullProfile.vendorProfile?.city || "the country"}. 
                            {fullProfile.vendorProfile?.bio && (
                                <span className="italic"> "{fullProfile.vendorProfile.bio.slice(0, 200)}..."</span>
                            )}
                            Their portfolio showcases a diverse range of work, reflecting their versatility and commitment to client satisfaction.
                        </p>

                        <h3 className="text-xl font-bold text-slate-800 mt-10">Booking Process Explained</h3>
                        <ul className="list-disc pl-5 space-y-3">
                            <li><strong>Select a Package:</strong> Browse through the various service packages offered by {organiser.business_name || organiser.name} above. Each package is designed to cater to different needs and budgets.</li>
                            <li><strong>Pick Your Date:</strong> Use our real-time calendar to check the availability of the artist and select the date for your event or project.</li>
                            <li><strong>Submit Details:</strong> Provide your contact information and any specific requirements you might have. This helps the artist prepare better for the job.</li>
                            <li><strong>Confirmation:</strong> Once you submit the booking request, {organiser.business_name || organiser.name} will review the details and confirm the booking. You'll receive instant updates via WhatsApp and Email.</li>
                        </ul>

                        <h3 className="text-xl font-bold text-slate-800 mt-10">Frequently Asked Questions</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-slate-700">Can I cancel my booking?</h4>
                                <p>Yes, cancellations are subject to the service provider's refund policy. We recommend discussing the terms directly with {organiser.business_name || organiser.name} after the booking request is initiated.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Is my data safe?</h4>
                                <p>Absolutely. BookMyTicket uses enterprise-grade security to ensure your personal information and transaction details are always protected.</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mt-10">Trust and Quality Assurance</h3>
                        <p>
                            BookMyTicket is committed to bringing you the best talent from across India. Whether you're planning a wedding, a corporate event, or a private party, our platform connects you with verified professionals who are experts in their fields. Join thousands of satisfied customers who trust BookMyTicket for their professional service needs.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
