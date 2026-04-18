"use client";
import React, { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
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
    const [confirmedDetails, setConfirmedDetails] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Fetch profile and vendor in parallel to handle missing FK relationships
    const { data: profileResult, loading: profileLoading } = useSupabaseQuery('service_providers', (q) => 
        q.select('*').eq('id', vendorId).maybeSingle()
    , [vendorId]);

    const { data: vendorResult } = useSupabaseQuery('vendors', (q) => 
        q.select('*').eq('id', vendorId).maybeSingle()
    , [vendorId]);
    
    const rawData = profileResult;
    const vendorData = vendorResult;
    
    const fullProfile = rawData ? { 
        organiser: vendorData, 
        vendorProfile: rawData 
    } : null;

    // Fetch vendor reviews with profile join
    const { data: reviewsData = [] } = useSupabaseQuery('vendorReviews', (q) => q.select('*, profiles(full_name, username)').eq('vendor_id', vendorId), [vendorId]);
    const reviews = Array.isArray(reviewsData) ? reviewsData : [];
    
    // Fetch relational packages
    const { data: packages = [] } = useSupabaseQuery('artistPackages', (q) => q.eq('vendor_id', vendorId), [vendorId]);
    
    // Fetch confirmed bookings for this vendor to block them in the calendar
    const { data: confirmedBookings = [] } = useSupabaseQuery('vendorBookings', (q) => 
        q.eq('vendor_id', vendorId).neq('status', 'Cancelled').neq('status', 'Rejected')
    , [vendorId]);

    const vendorProfile = fullProfile?.vendorProfile;
    const blockedDates = vendorProfile?.advanced_settings?.blocked_dates || [];
    const confirmedDates = confirmedBookings.map(b => b.booking_date).filter(Boolean);

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

    const [createBooking] = useSupabaseMutation('vendorBookings', 'insert');
    const [submitReview] = useSupabaseMutation('vendorReviews', 'insert');

    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const handleReviewSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!user) {
            router.push(`/signin?redirect=/services/${vendorId}`);
            return;
        }
        if (!reviewForm.comment.trim()) return;

        setIsSubmittingReview(true);
        try {
            await submitReview({
                vendor_id: vendorId,
                user_id: user.id || user.email || user.identifier,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            });
            setReviewForm({ rating: 5, comment: "" });
            // Feedback provided silently through UI state update
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleBooking = async (e) => {
        if (e) e.preventDefault();

        // ── MANDATORY LOGIN CHECK ──
        if (!user) {
            router.push(`/signin?redirect=/services/${vendorId}`);
            return;
        }

        // Guard: prevent double submission
        if (isBooking || showSuccess) return;
        
        if (!selectedPackage) return;

        if (!formData.date) {
            setIsCalendarOpen(true);
            return;
        }

        if (!agreedToTerms) return;

        setIsBooking(true);
        try {
            const bookingResult = await createBooking({
                vendor_id: fullProfile.organiser.id,
                user_id: user?.id || user?.identifier || user?.email || formData.email,
                service_type: fullProfile.organiser.category || "Professional Service",
                booking_date: formData.date,
                total_amount: selectedPackage.price,
                customer_details: {
                    name: formData.name || user?.name || "Customer",
                    phone: formData.phone || user?.phone || "",
                    email: formData.email || user?.identifier || user?.email || "",
                    address: formData.address || "Multiple Locations"
                },
                remarks: formData.remarks || undefined,
                status: "Pending"
            });
            
            const bookingId = bookingResult?.id;
            
            // Store confirmed booking details and show success screen
            setConfirmedDetails({
                bookingId,
                service: fullProfile.organiser.category || "Professional Service",
                vendor: fullProfile.organiser?.business_name || fullProfile.organiser?.name || "Professional",
                date: formData.date,
                package: selectedPackage.name,
                amount: selectedPackage.price,
                customerName: formData.name || user?.name || "Customer",
                customerEmail: formData.email || user?.identifier || user?.email || "",
            });

            // ── TRIGGER BOOKING EMAIL WORKFLOW ──
            try {
                const userEmailPayload = {
                    to: formData.email || user?.email || user?.identifier,
                    subject: `Booking Confirmed: ${fullProfile.vendorProfile.business_name || "Mehendi Artist"}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 15px; padding: 20px;">
                            <h2 style="color: #FF5A5F;">Booking Confirmed!</h2>
                            <p>Hi ${formData.name || "Customer"},</p>
                            <p>Your booking with <strong>${fullProfile.vendorProfile.business_name || "our partner"}</strong> is confirmed.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p><strong>Package:</strong> ${selectedPackage.name}</p>
                            <p><strong>Date:</strong> ${formData.date}</p>
                            <p><strong>Amount:</strong> ₹${selectedPackage.price}</p>
                            <p><strong>Address:</strong> ${formData.address}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #666;">If you have any questions, please contact the artist directly or reply to this email.</p>
                            <p style="font-size: 14px; font-weight: bold;">Team BookMyTicket</p>
                        </div>
                    `
                };

                // Send Email to User
                fetch('/api/email/booking-confirmation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userEmailPayload)
                });

                // Send Email to Vendor
                fetch('/api/email/booking-confirmation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: fullProfile.organiser.email || fullProfile.vendorProfile.email,
                        subject: `New Booking Received! - BookMyTicket`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 15px; padding: 20px;">
                                <h2 style="color: #FF5A5F;">New Booking Received</h2>
                                <p>Hi ${fullProfile.vendorProfile.business_name || "Partner"},</p>
                                <p>You have received a new booking through BookMyTicket.</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p><strong>Customer:</strong> ${formData.name || "Customer"}</p>
                                <p><strong>Package:</strong> ${selectedPackage.name}</p>
                                <p><strong>Booking Date:</strong> ${formData.date}</p>
                                <p><strong>Amount:</strong> ₹${selectedPackage.price}</p>
                                <p><strong>Contact:</strong> ${formData.phone || "N/A"} (${formData.email || "N/A"})</p>
                                <p><strong>Address:</strong> ${formData.address}</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-size: 14px; font-weight: bold;">Team BookMyTicket</p>
                            </div>
                        `
                    })
                });
            } catch (e) {
                console.warn("Email workflow deferred or failed silently:", e);
            }

            setShowSuccess(true);
        } catch (error) {
            console.error("Failed to request booking:", error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setIsBooking(false);
        }
    };

    // Logic below depends on fullProfile being defined

    if (profileLoading) {
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

    const organiser = fullProfile.organiser || fullProfile.vendorProfile; // fallback
    const portfolio = fullProfile.vendorProfile?.portfolio || [];
    const pricing = packages.length > 0 ? packages.map(pkg => ({
        id: pkg.id,
        name: pkg.title,
        price: pkg.price,
        description: pkg.description,
        duration: pkg.duration,
        features: pkg.features || [],
        type: pkg.type
    })) : (fullProfile.vendorProfile?.pricing || []);
    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;    
    const categoryName = fullProfile.vendorProfile?.category || organiser.category || "";
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
            const isBooked = confirmedDates.includes(dateStr);
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

                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
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

                             {/* Reviews & Manual Feedback Section */}
                             <div className="space-y-10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[20px] font-extrabold text-[#111827] tracking-tight">Customer Reflections</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= Math.round(Number(avgRating)) ? "currentColor" : "none"} />)}
                                        </div>
                                        <span className="text-[12px] font-black text-slate-400 italic">({reviews.length} Validated)</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Submission Form */}
                                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[13px] font-black text-slate-900 uppercase italic tracking-wider">Leave a Reflection</p>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Your manual feedback helps other organizers find the best artists.</p>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            {[1,2,3,4,5].map(s => (
                                                <button 
                                                    key={s} 
                                                    onClick={() => setReviewForm({...reviewForm, rating: s})}
                                                    className={`transition-transform hover:scale-110 ${s <= reviewForm.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                                                >
                                                    <Star size={28} fill={s <= reviewForm.rating ? "currentColor" : "none"} strokeWidth={2.5} />
                                                </button>
                                            ))}
                                        </div>

                                        <textarea 
                                            value={reviewForm.comment}
                                            onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                                            placeholder="Describe your the artist's professionalism and quality..."
                                            className="w-full bg-white border border-slate-100 rounded-2xl p-5 text-[13px] font-medium text-slate-600 focus:border-[#FF5A5F] outline-none min-h-[140px] shadow-inner resize-none transition-all"
                                        />

                                        <button 
                                            onClick={handleReviewSubmit}
                                            disabled={isSubmittingReview || !reviewForm.comment.trim()}
                                            className="w-full bg-slate-900 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-pink-600 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                                        >
                                            {isSubmittingReview ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Post Public Reflection"}
                                        </button>
                                    </div>

                                    {/* Recent List */}
                                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {reviews.length > 0 ? reviews.map((r, i) => {
                                            const reviewerName = r.profiles?.full_name || r.profiles?.username || "Guest User";
                                            return (
                                                <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 hover:border-slate-200 transition-colors shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 italic text-[14px]">
                                                                {reviewerName[0].toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] font-black text-slate-900 tracking-tight lowercase">{reviewerName}</span>
                                                                <div className="flex text-yellow-400">
                                                                    {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= r.rating ? "currentColor" : "none"} />)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic">"{r.comment}"</p>
                                                {r.response && (
                                                    <div className="pt-4 mt-4 border-t border-slate-50">
                                                        <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-1 items-center flex gap-1.5 italic">
                                                            <CheckCircle2 size={10} />
                                                            Artist's Response
                                                        </p>
                                                        <p className="text-[11px] text-slate-900 font-bold leading-relaxed italic bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                                                            {r.response}
                                                        </p>
                                                    </div>
                                                )}
                                                </div>
                                            );
                                        }) : (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto flex items-center justify-center">
                                                    <Star size={24} className="text-slate-100" />
                                                </div>
                                                <p className="text-[11px] font-black text-slate-200 uppercase tracking-widest italic">Digital Void of Reflection</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                        <h3 className="text-[22px] font-black text-black tracking-tight leading-none uppercase italic">{organiser.business_name || organiser.name}</h3>
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

                {/* Success Full-Viewport Confirmation Screen */}
                {showSuccess && confirmedDetails && (
                <div className="fixed inset-0 z-[1000] bg-[#fafbfc] flex items-center justify-center">
                    <div style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        maxWidth: '900px',
                        margin: '0 auto',
                        padding: '20px',
                        gap: '20px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                    }}>
                        {/* Left Panel — Success Icon + Message */}
                        <div style={{
                            flex: '0 0 260px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            background: 'linear-gradient(145deg,#f84464 0%,#a855f7 100%)',
                            borderRadius: '24px',
                            padding: '36px 24px',
                            color: '#fff',
                            alignSelf: 'stretch',
                        }}>
                            <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <CheckCircle2 size={40} strokeWidth={2} />
                            </div>
                            <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 10px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>Booking<br/>Request Sent!</h1>
                            <p style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6, margin: '0 0 24px' }}>
                                {confirmedDetails.vendor} will review and confirm shortly.
                            </p>
                            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 16px', width: '100%', marginBottom: 8 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.75, marginBottom: 4 }}>Ref. ID</div>
                                <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 1 }}>
                                    #{typeof confirmedDetails.bookingId === 'string' ? confirmedDetails.bookingId.slice(-8).toUpperCase() : 'CONFIRMED'}
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 8 }}>
                                ⏳ Pending Review
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 10, opacity: 0.6, lineHeight: 1.5 }}>
                                📧 Confirmation sent to<br/><strong>{confirmedDetails.customerEmail}</strong>
                            </div>
                        </div>

                        {/* Right Panel — Details + Actions */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                            {/* Card */}
                            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>Booking Details</h2>
                                </div>
                                {/* 2-column grid for details */}
                                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                                    {[
                                        { label: 'Service', value: confirmedDetails.service },
                                        { label: 'Professional', value: confirmedDetails.vendor },
                                        { label: 'Package', value: confirmedDetails.package },
                                        { label: 'Date', value: confirmedDetails.date ? new Date(confirmedDetails.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD' },
                                        { label: 'Customer', value: confirmedDetails.customerName },
                                        { label: 'Status', value: 'Pending' },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Total Row */}
                                <div style={{ margin: '0 20px 16px', background: 'linear-gradient(135deg,#fdf2f8,#faf5ff)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f3e8ff' }}>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Total Amount</span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: '#f84464' }}>₹{confirmedDetails.amount}</span>
                                </div>
                            </div>

                            {/* Info note */}
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
                                <p style={{ margin: 0, fontSize: 11, color: '#166534', lineHeight: 1.6, fontWeight: 500 }}>
                                    No payment required until booking is confirmed. The professional will respond within 24 hours.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Link
                                    href="/profile?tab=my_booking"
                                    style={{
                                        flex: 1, padding: '13px 0',
                                        background: 'linear-gradient(135deg,#f84464,#a855f7)',
                                        color: '#fff', borderRadius: 14,
                                        fontWeight: 700, fontSize: 13,
                                        textDecoration: 'none', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: 6,
                                        boxShadow: '0 4px 14px rgba(248,68,100,0.3)'
                                    }}
                                >
                                    View My Bookings
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                                <Link
                                    href="/"
                                    style={{
                                        flex: '0 0 auto', padding: '13px 20px',
                                        background: '#fff', border: '1px solid #e2e8f0',
                                        color: '#475569', borderRadius: 14,
                                        fontWeight: 700, fontSize: 13, textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    Home
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Mobile fallback: vertical scroll allowed on small screens */}
                    <style>{`
                        @media (max-width: 620px) {
                            .conf-inner { flex-direction: column !important; }
                            .conf-left { flex: none !important; width: 100% !important; align-self: auto !important; padding: 24px 20px !important; }
                        }
                    `}</style>
                </div>
                )}
            </div>
        </main>
    );
}
