"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    Star, MapPin, Sparkles, CheckCircle2, Clock, 
    ArrowLeft, Image as ImageIcon, Send, Loader2, ChevronLeft, ChevronRight,
    Calendar, ShieldCheck, User, Mail, Phone
} from "lucide-react";
import Link from "next/link";


export default function ArtistProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const vendorId = decodeURIComponent(params.id);

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

    const fullProfile = useQuery(api.vendors.getFullProfile, { organiserId: vendorId });
    const availability = useQuery(api.vendorCalendar.getAvailability, { vendorId: vendorId });
    const blockedDates = availability?.blockedDates || [];
    const confirmedBookings = availability?.confirmedBookings || [];

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

    const createBooking = useMutation(api.vendorBookings.create);

    const handleBooking = async (e) => {
        if (e) e.preventDefault();
        
        if (!selectedPackage) {
            alert("Please select a package first.");
            return;
        }

        if (!formData.date) {
            setIsCalendarOpen(true);
            return;
        }

        if (!agreedToTerms) {
            alert("Please agree to the terms and conditions.");
            return;
        }

        setIsBooking(true);
        try {
            await createBooking({
                vendorId: organiser.userId,
                userId: user?.identifier || user?.email || formData.email,
                serviceType: organiser.category || "Professional Service",
                bookingDate: formData.date,
                totalAmount: selectedPackage.price,
                customerDetails: {
                    name: formData.name || user?.name || "Customer",
                    phone: formData.phone || user?.phone || "",
                    email: formData.email || user?.identifier || user?.email || "",
                    address: formData.address || "Multiple Locations"
                },
                remarks: formData.remarks || undefined
            });
            
            setShowSuccess(true);
            setTimeout(() => {
                router.push(`/profile?tab=my_booking`);
            }, 3000);
        } catch (error) {
            console.error("Failed to request booking:", error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setIsBooking(false);
        }
    };

    // Logic below depends on fullProfile being defined

    if (fullProfile === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
                <Loader2 className="animate-spin text-[#FF5A5F]" size={48} />
            </div>
        );
    }

    if (!fullProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfc] space-y-4">
                <h1 className="text-2xl font-black text-slate-900">Artist Not Found</h1>
                <button onClick={() => router.back()} className="text-[#FF5A5F] font-bold hover:underline">Go Back</button>
            </div>
        );
    }

    const { organiser, vendorProfile } = fullProfile;
    const portfolio = vendorProfile?.portfolio || [];
    const pricing = vendorProfile?.pricing || [];
    const avgRating = 4.8; 
    
    const categoryName = vendorProfile?.category || organiser.category || "";
    const isUnknown = !categoryName || categoryName.toLowerCase() === "unknown";
    
    const dynamicDateLabel = "Available Date";
    const dynamicHeading = isUnknown ? "Request Booking" : `Request ${categoryName}`;
    const dynamicButtonText = "Book Now";

    
    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const days = [];
        const totalDays = daysInMonth(month, year);
        const startDay = firstDayOfMonth(month, year);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Padding for the start of the month
        for (let i = 0; i < startDay; i++) days.push(<div key={`pad-${i}`} className="h-10"></div>);

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = formData.date === dateStr;
            const isBlocked = blockedDates.includes(dateStr);
            const isBooked = confirmedBookings.some(b => b.bookingDate === dateStr);
            const isUnavailable = isBlocked || isBooked || (new Date(dateStr) < new Date(new Date().setHours(0,0,0,0)));

            days.push(
                <div 
                    key={day} 
                    onClick={() => {
                        if (!isUnavailable) {
                            setFormData({...formData, date: dateStr});
                            setIsCalendarOpen(false);
                        }
                    }}
                    className={`h-10 w-full flex items-center justify-center text-[13px] font-bold rounded-lg cursor-pointer transition-all
                        ${isUnavailable ? "text-slate-200 cursor-not-allowed" : 
                          isSelected ? "bg-[#FF5A5F] text-white shadow-md scale-105" : 
                          isToday ? "border border-[#FF5A5F] text-[#FF5A5F]" : "hover:bg-slate-50 text-slate-600"}`}
                >
                    {day}
                </div>
            );
        }

        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl relative z-[100]">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex flex-col">
                        <h4 className="font-extrabold text-[15px] text-slate-800">{monthNames[month]} {year}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Availability</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
                        <button type="button" onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={`${d}-${i}`} className="h-8 flex items-center justify-center text-[10px] font-black text-slate-300 tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        );
    };

    const coverPhoto = portfolio.length > 0 && portfolio[0].url.startsWith('http') 
        ? portfolio[0].url 
        : "https://images.unsplash.com/photo-1596704017254-9b1210630b65?q=80&w=1200";

    return (
        <main className="min-h-screen bg-[#fafbfc] pt-[40px] md:pt-[60px] pb-24 text-[#111827]">
            <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-4">
                
                {/* Header with Back Button */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors w-fit px-2"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                            <span>Back</span>
                        </button>
                        <div className="flex gap-3">
                            <button className="flex items-center justify-center border border-slate-200 p-2.5 rounded-full bg-white hover:bg-slate-50 transition-colors shadow-sm"><Send size={18} className="text-slate-500" /></button>
                            <button className="flex items-center justify-center border border-slate-200 p-2.5 rounded-full bg-white hover:bg-slate-50 transition-colors shadow-sm"><Star size={18} className="text-slate-500" /></button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Artist Bio & Service Information */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-8 md:p-10 mb-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="bg-pink-50 p-2.5 rounded-xl">
                                        <User className="text-[#FF5A5F]" size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-extrabold text-[#111827] tracking-tight">Request Booking Details</h3>
                                        <p className="text-[12px] font-medium text-slate-400 mt-0.5">Please provide your contact information</p>
                                    </div>
                                </div>
                                {user && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Verified Account</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-[#FF5A5F] transition-colors" size={18} />
                                        <input 
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            placeholder="Enter your full name"
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:border-[#FF5A5F] focus:bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Email ID</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-[#FF5A5F] transition-colors" size={18} />
                                        <input 
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            placeholder="you@example.com"
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:border-[#FF5A5F] focus:bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-[#FF5A5F] transition-colors" size={18} />
                                        <input 
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            placeholder="+91 00000 00000"
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:border-[#FF5A5F] focus:bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Available Date - MOVED TO HERE */}
                                <div className="space-y-2 relative">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Available Date</label>
                                    <div 
                                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                        className={`w-full flex items-center justify-between px-4 py-3 bg-slate-50 border rounded-xl text-[14px] font-bold text-slate-900 shadow-sm transition-all cursor-pointer group
                                            ${formData.date ? 'border-[#FF5A5F] bg-[#FF5A5F]/[0.02]' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className={formData.date ? 'text-[#FF5A5F]' : 'text-slate-300'} />
                                            <span>{formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : "Pick a date"}</span>
                                        </div>
                                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>

                                    {isCalendarOpen && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 w-full z-[120] animate-in fade-in zoom-in-95 duration-200">
                                            {renderCalendar()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-start gap-3">
                                <ShieldCheck className="text-green-500 mt-0.5" size={18} />
                                <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                                    Your information is secure. We only share details with the artist once you confirm the booking request.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-8 md:p-10">
                            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight mb-6">Service Information</h2>
                            
                            <div className="flex flex-wrap gap-4 mb-8">
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <Sparkles size={18} className="text-[#FF5A5F]" />
                                    <span className="text-[14px] font-semibold text-slate-700">{vendorProfile?.category || organiser.category} Professional</span>
                                </div>
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <Star size={18} className="text-[#FF5A5F]" />
                                    <span className="text-[14px] font-semibold text-slate-700">{avgRating} Rating</span>
                                </div>
                                {vendorProfile?.advancedSettings?.experience && (
                                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                        <Clock size={18} className="text-[#FF5A5F]" />
                                        <span className="text-[14px] font-semibold text-slate-700">{vendorProfile.advancedSettings.experience} Years Experience</span>
                                    </div>
                                )}
                            </div>
                            
                            <hr className="border-slate-100 mb-8" />
                            
                            <h3 className="text-[16px] font-extrabold text-[#111827] tracking-tight mb-4">About the Artist</h3>
                            <p className="text-[14px] font-medium text-slate-600 leading-[1.8] whitespace-pre-line mb-10">
                                {vendorProfile?.bio || "No biography provided by the artist yet."}
                            </p>

                            <hr className="border-slate-100 mb-10" />

                            {/* Portfolio Gallery Section */}
                            <h3 className="text-[18px] font-extrabold text-[#111827] tracking-tight mb-6">Portfolio Gallery</h3>
                            <div className="animate-in fade-in duration-700">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {portfolio.map((item, i) => (
                                        <div key={i} className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                            <img 
                                                src={item.url.startsWith('http') ? item.url : `https://images.unsplash.com/photo-1596704017254-9b1210630b65?q=80&w=800`} 
                                                alt="Portfolio" 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                            />
                                        </div>
                                    ))}
                                </div>
                                {portfolio.length === 0 && (
                                    <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center">
                                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                            <ImageIcon size={32} className="text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-400 text-[13px] tracking-tight">Portfolio gallery is empty.</p>
                                        <p className="text-slate-300 text-[11px] mt-1 font-medium">Work samples will appear here once uploaded.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Consolidated Booking Widget */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-[120px]">
                        
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                            {/* Widget Header Style */}
                            <div className="bg-[#fde047] px-6 py-4 border-b border-yellow-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="text-black" size={20} />
                                    <span className="font-black text-black text-[14px] uppercase tracking-wider">Safe Checkout</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/40 rounded-full border border-white/20">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-[8px] font-black text-black uppercase tracking-tighter">Live Sync</span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="mb-6 pb-4 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Booking with</span>
                                        <h3 className="text-[22px] font-black text-black tracking-tight leading-none uppercase italic">{organiser.name}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                                        <img src={coverPhoto} className="w-full h-full object-cover" alt="Profile" />
                                    </div>
                                </div>

                                <form onSubmit={handleBooking} className="space-y-5">
                                    
                                    <div className="relative">
                                        <label className="text-[11px] font-black text-black uppercase tracking-widest mb-1.5 block px-1">Choose Package</label>
                                        <div 
                                            onClick={() => setIsPackageDropdownOpen(!isPackageDropdownOpen)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm
                                                ${selectedPackage ? 'border-black bg-white ring-4 ring-black/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-black text-black tracking-tight uppercase italic leading-none">
                                                    {selectedPackage ? selectedPackage.name : 'Select a Service Tier'}
                                                </span>
                                                {selectedPackage?.type && <span className="text-[10px] font-bold text-black opacity-40 uppercase tracking-widest mt-1">{selectedPackage.type}</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {selectedPackage && <span className="text-[18px] font-black text-black">₹{selectedPackage.price}</span>}
                                                <svg className={`w-5 h-5 text-black transition-transform ${isPackageDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                        </div>

                                        {/* Dropdown Menu */}
                                        {isPackageDropdownOpen && (
                                            <div className="absolute top-[calc(100%+8px)] left-0 w-full z-[120] bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="max-h-[280px] overflow-y-auto">
                                                    {pricing.map((pkg, i) => (
                                                        <div 
                                                            key={i} 
                                                            onClick={() => { setSelectedPackage(pkg); setIsPackageDropdownOpen(false); }} 
                                                            className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b last:border-0 border-slate-50 group"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[14px] font-black text-black uppercase italic group-hover:text-pink-600 transition-colors">{pkg.name || "Standard Package"}</span>
                                                                    <span className="text-[10px] font-bold text-black opacity-30 uppercase tracking-widest">{pkg.type || "Service"}</span>
                                                                </div>
                                                                <span className="text-[16px] font-black text-black group-hover:scale-110 transition-transform">₹{pkg.price}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {pricing.length === 0 && <div className="p-6 text-center text-[12px] font-bold text-slate-400">No packages available</div>}
                                                </div>
                                            </div>
                                        )}


                                    </div>

                                    {/* Address Field */}
                                    <div>
                                        <label className="text-[11px] font-black text-black uppercase tracking-widest mb-1.5 block px-1">Event Address</label>
                                        <textarea 
                                            required
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                            placeholder="Where is the event?"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium text-slate-800 outline-none focus:border-[#FF5A5F] focus:bg-white transition-all resize-none h-16"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <label className="flex items-start space-x-3 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                required 
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-[#FF5A5F] focus:ring-[#FF5A5F] mt-0.5" 
                                            />
                                            <span className="text-[12px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">I agree to the <a href="#" className="text-blue-500 hover:underline">terms and conditions</a></span>
                                        </label>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="font-extrabold text-black text-[18px]">Total Price</span>
                                            <span className="font-black text-black text-[20px]">₹ {selectedPackage?.price || 0}</span>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={isBooking || !selectedPackage || !formData.date || !formData.address || !formData.name || !formData.email || !formData.phone || !agreedToTerms}
                                            className="w-full py-4 bg-gradient-to-r from-[#f844a4] to-[#a855f7] text-white rounded-2xl font-black text-[15px] shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isBooking ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                                <>
                                                    <span>Book Now</span>
                                                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-[11px] text-slate-400 font-bold mt-4 uppercase tracking-tighter">No payment required until confirmed</p>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm border-l-4 border-l-green-500">
                            <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                            <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                                Professional artists verified by BookMyTicket for quality and reliability.
                            </p>
                        </div>
                    </div>
                    </div>

                {/* Success Overlay */}
                {showSuccess && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 md:p-12 max-w-[450px] w-full mx-6 text-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="text-green-500" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">Booking Confirmed!</h2>
                        <p className="text-slate-500 font-medium mb-8">
                            Your request has been sent successfully. {organiser.name} will review and confirm shortly.
                        </p>
                        <div className="space-y-3">
                            <Link 
                                href="/profile?tab=my_booking"
                                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-pink-100"
                            >
                                Go to My Bookings
                                <svg size={16} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </Link>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest pt-2">Redirecting automatically...</p>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </main>
    );
}
