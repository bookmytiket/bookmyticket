"use client";
import React, { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    Star, MapPin, Sparkles, CheckCircle2, Clock, 
    ArrowLeft, Send, Loader2, ChevronLeft, ChevronRight,
    Calendar, ShieldCheck, User, Mail, Phone
} from "lucide-react";
import { triggerNotification } from "@/lib/notificationHelper";

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
    const [viewDate, setViewDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
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
    if (!fullProfile) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfc] space-y-4"><h1 className="text-2xl font-black text-slate-900">Artist Not Found</h1><button onClick={() => router.back()} className="text-[#FF5A5F] font-bold hover:underline">Go Back</button></div>;

    const organiser = fullProfile.organiser || fullProfile.vendorProfile;
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
                        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">Booking Sent!</h2>
                        <p className="text-slate-600 font-medium mb-8">Your request has been sent to {organiser.business_name || organiser.name}. They will contact you shortly.</p>
                        <button 
                            onClick={() => router.push('/bookings')} 
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            View My Bookings
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full h-[350px] md:h-[480px] relative overflow-hidden">
                <img src={coverPhoto} className="absolute inset-0 w-full h-full object-cover scale-105" alt="Service Cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fafbfc] via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                    <div className="max-w-[1200px] mx-auto w-full">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-[#FF5A5F] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-pink-500/30">
                                    {fullProfile.vendorProfile?.category || 'Professional'}
                                </span>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[12px] font-black uppercase italic">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span>4.9 (24 Reviews)</span>
                                </div>
                            </div>
                            <h1 className="text-slate-900 md:text-white text-[40px] md:text-[72px] font-black uppercase italic tracking-tighter leading-[0.9] mt-2 drop-shadow-2xl">
                                {organiser.business_name || organiser.name}
                            </h1>
                            <div className="flex items-center gap-4 text-slate-600 md:text-white/80 mt-2">
                                <div className="flex items-center gap-1.5 font-bold uppercase italic text-[13px] tracking-tight">
                                    <MapPin size={16} /> {fullProfile.vendorProfile?.city || "PAN India"}
                                </div>
                                <div className="w-1.5 h-1.5 bg-slate-400 md:bg-white/40 rounded-full" />
                                <div className="flex items-center gap-1.5 font-bold uppercase italic text-[13px] tracking-tight">
                                    <ShieldCheck size={16} className="text-green-500 md:text-green-400" /> Verified Artist
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => router.back()}
                    className="absolute top-8 left-8 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all z-10"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
                {/* Left Column: Details & Tabs */}
                <div className="space-y-10">
                    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                            <Sparkles className="text-[#FF5A5F]" /> About the Artist
                        </h2>
                        <p className="text-slate-600 font-medium leading-relaxed text-[17px]">
                            {fullProfile.vendorProfile?.bio || "A dedicated professional committed to excellence. With years of experience and a passion for their craft, they bring unique creativity and skill to every project."}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-200">
                            {[
                                { id: 'portfolio', label: 'Portfolio', icon: <Sparkles size={18} /> },
                                { id: 'packages', label: 'Pricing & Packages', icon: <Clock size={18} /> },
                                { id: 'reviews', label: 'Reviews', icon: <Star size={18} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-black uppercase italic tracking-tight text-[14px] transition-all border-b-2 ${
                                        activeTab === tab.id 
                                        ? "border-[#FF5A5F] text-[#FF5A5F]" 
                                        : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[400px]">
                            {activeTab === 'portfolio' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {portfolio.length > 0 ? portfolio.map((item, idx) => (
                                        <div key={idx} className="aspect-[4/5] rounded-[24px] overflow-hidden group cursor-pointer border-2 border-transparent hover:border-[#FF5A5F] transition-all relative">
                                            <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Portfolio ${idx}`} />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Sparkles className="text-white" size={32} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold uppercase italic">No portfolio items added yet</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'packages' && (
                                <div className="space-y-4">
                                    {packages.length > 0 ? packages.map((pkg, idx) => (
                                        <div 
                                            key={pkg.id} 
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={`p-6 rounded-[28px] border-2 transition-all cursor-pointer relative overflow-hidden group ${
                                                selectedPackage?.id === pkg.id 
                                                ? "border-[#FF5A5F] bg-pink-50" 
                                                : "border-slate-100 bg-white hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{pkg.title}</h3>
                                                    <p className="text-[#FF5A5F] font-black text-[13px] uppercase italic mt-1 flex items-center gap-1.5">
                                                        <Clock size={14} /> {pkg.duration || "Full Service"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-slate-900 tracking-tighter italic">₹{pkg.price.toLocaleString()}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase italic">Starts from</div>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 font-medium mb-6 leading-relaxed">{pkg.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {pkg.features?.map((feat, fIdx) => (
                                                    <span key={fIdx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                                        <CheckCircle2 size={12} className="text-green-500" /> {feat}
                                                    </span>
                                                ))}
                                            </div>
                                            {selectedPackage?.id === pkg.id && (
                                                <div className="absolute top-0 right-0 w-12 h-12 bg-[#FF5A5F] flex items-center justify-center rounded-bl-[20px]">
                                                    <CheckCircle2 className="text-white" size={20} />
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold uppercase italic">Contact artist for custom pricing</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    {reviews.length > 0 ? reviews.map((rev, idx) => (
                                        <div key={idx} className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black uppercase italic">
                                                        {rev.reviewer_name?.[0] || <User size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 uppercase italic tracking-tighter text-sm">{rev.reviewer_name || "Verified Customer"}</div>
                                                        <div className="flex gap-0.5 mt-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={12} className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">
                                                    {new Date(rev.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 font-medium leading-relaxed">{rev.comment}</p>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold uppercase italic">No reviews yet. Be the first to book!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking Widget */}
                <div className="relative">
                    <div className="sticky top-24 bg-white border-2 border-slate-900 rounded-[40px] p-8 shadow-[12px_12px_0_rgba(15,23,42,1)] overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-900 rotate-45 translate-x-12 -translate-y-12" />
                        
                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-8 flex items-center gap-3 relative">
                             Secure Your Date
                        </h3>

                        <form onSubmit={handleBooking} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase italic tracking-widest text-slate-400 ml-1">Personal Details</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Full Name"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl font-bold transition-all text-sm outline-none"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="tel" 
                                            placeholder="WhatsApp Number"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl font-bold transition-all text-sm outline-none"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase italic tracking-widest text-slate-400 ml-1">Event Schedule</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF5A5F]" size={18} />
                                    <input 
                                        type="date" 
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl font-black transition-all text-sm outline-none uppercase"
                                        value={formData.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase italic tracking-widest text-slate-400 ml-1">Selected Package</label>
                                <div 
                                    className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-400 transition-all"
                                    onClick={() => setActiveTab('packages')}
                                >
                                    {selectedPackage ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#FF5A5F] rounded-xl flex items-center justify-center text-white">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-black uppercase italic text-slate-900">{selectedPackage.title}</div>
                                                <div className="text-[11px] font-bold text-[#FF5A5F]">₹{selectedPackage.price.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-[13px] font-black uppercase italic text-slate-400">Choose a package first</div>
                                    )}
                                    <ChevronRight className="text-slate-400" size={18} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3 mb-6 cursor-pointer group" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${agreedToTerms ? "bg-[#FF5A5F] border-[#FF5A5F]" : "border-slate-300"}`}>
                                        {agreedToTerms && <CheckCircle2 className="text-white" size={14} />}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">I agree to the service policies & T&C</span>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isBooking || !selectedPackage || !agreedToTerms}
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 flex items-center justify-center gap-3"
                                >
                                    {isBooking ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                                    {isBooking ? "Confirming..." : "Send Booking Request"}
                                </button>
                                <p className="text-center text-[10px] font-black text-slate-400 uppercase italic mt-8 tracking-widest">Powered by BookMyTicket</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
