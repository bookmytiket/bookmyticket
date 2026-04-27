"use client";
import React, { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    Star, MapPin, Sparkles, CheckCircle2, Clock, Users, Languages,
    ArrowLeft, Send, Loader2, ChevronLeft, ChevronRight,
    Calendar, ShieldCheck, User, Mail, Phone, Share2, Heart, Info, Warehouse
} from "lucide-react";
import { triggerNotification } from "@/lib/notificationHelper";
import CalendarModal from "@/components/booking/CalendarModal";
import PackageSelector from "@/components/booking/PackageSelector";

export default function ArtistProfileClient({ id: vendorId }) {
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState("portfolio");
    const [selectedPackage, setSelectedPackage] = useState(null);
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
                    <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
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

            <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-4 mt-8">
                {/* Wide Banner Card */}
                <div className="w-full h-[280px] md:h-[480px] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl relative mb-6 border-4 border-white group">
                    <img src={coverPhoto} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Service Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
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
                            <h2 className="text-white text-[32px] md:text-[64px] font-bold uppercase tracking-tight leading-tight mt-2 drop-shadow-2xl">
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-2">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Details & Tabs */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 md:p-14 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-bl-full -z-0" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-[#111827] uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <Sparkles className="text-pink-500" size={28} /> About the Artist
                                </h3>
                                <p className="text-[17px] font-medium text-slate-600 leading-relaxed whitespace-pre-line mb-12">
                                    {fullProfile.vendorProfile?.bio || "A dedicated professional committed to excellence. With years of experience and a passion for their craft, they bring unique creativity and skill to every project."}
                                </p>
                                
                                <div className="flex items-center gap-2 border-b border-slate-200 mb-10">
                                    {[
                                        { id: 'portfolio', label: 'Portfolio', icon: <Sparkles size={18} /> },
                                        { id: 'packages', label: 'Pricing & Packages', icon: <Clock size={18} /> },
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
                                                    <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Portfolio ${idx}`} />
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

                                    {activeTab === 'packages' && (
                                        <PackageSelector 
                                            packages={packages}
                                            selectedPackage={selectedPackage}
                                            onSelect={setSelectedPackage}
                                            type="service"
                                        />
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
                    </div>

                    {/* Right Column: Booking Widget */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-8 sticky top-[120px]" id="booking-form">
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl p-10 pb-12 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900 rotate-45 translate-x-16 -translate-y-16" />
                            <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-3 relative">
                                 Secure Your Date
                            </h3>

                            <form onSubmit={handleBooking} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Personal Details</label>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input 
                                                type="text" 
                                                placeholder="Full Name"
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-3xl font-bold transition-all text-[15px] outline-none"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input 
                                                type="tel" 
                                                placeholder="WhatsApp Number"
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-3xl font-bold transition-all text-[15px] outline-none"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Event Schedule</label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsCalendarOpen(true)}
                                        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 hover:border-slate-300 rounded-3xl font-bold transition-all text-[15px] outline-none uppercase flex items-center gap-4 text-left relative group"
                                    >
                                        <Calendar className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${formData.date ? "text-green-500" : "text-pink-500"}`} size={20} />
                                        <span className={formData.date ? "text-slate-900" : "text-slate-400"}>
                                            {formData.date ? new Date(formData.date).toLocaleDateString('default', { day: '2-digit', month: 'short', year: 'numeric' }) : "Select Event Date"}
                                        </span>
                                        {formData.date && <CheckCircle2 className="ml-auto text-green-500" size={20} />}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Selected Package</label>
                                    <div 
                                        className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-between cursor-pointer hover:border-slate-400 transition-all"
                                        onClick={() => setActiveTab('packages')}
                                    >
                                        {selectedPackage ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                    <Sparkles size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-[14px] font-bold uppercase text-slate-900">{selectedPackage.title}</div>
                                                    <div className="text-[12px] font-bold text-pink-500">₹{selectedPackage.price.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[14px] font-bold uppercase text-slate-400">Choose a package first</div>
                                        )}
                                        <ChevronRight className="text-slate-400" size={24} />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-4 mb-8 cursor-pointer group" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                                        <div className={`w-7 h-7 rounded-xl border-2 transition-all flex items-center justify-center ${agreedToTerms ? "bg-pink-500 border-pink-500 shadow-lg shadow-pink-500/40" : "border-slate-300 group-hover:border-slate-400"}`}>
                                            {agreedToTerms && <CheckCircle2 className="text-white" size={16} />}
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight italic">I agree to the service policies & T&C</span>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isBooking || !selectedPackage || !agreedToTerms}
                                        className="w-full py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[32px] font-bold uppercase tracking-[0.3em] text-[15px] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-pink-500/40 active:scale-95 flex items-center justify-center gap-4"
                                    >
                                        {isBooking ? <Loader2 className="animate-spin" size={24} /> : <Send size={20} />}
                                        {isBooking ? "Confirming..." : "Book Now"}
                                    </button>
                                    <p className="text-center text-[11px] font-bold text-slate-400 uppercase mt-10 tracking-widest">Powered by BookMyTicket</p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CalendarModal 
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                selectedDate={formData.date ? new Date(formData.date) : null}
                onSelect={(date) => {
                    setFormData({ ...formData, date: date.toISOString().split('T')[0] });
                    setIsCalendarOpen(false);
                }}
            />

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
        </main>
    );
}
