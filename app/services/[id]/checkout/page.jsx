"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PRESET_PLANS = [
    { name: "Basic Plan", price: 5000, type: "Entry Level" },
    { name: "Standard Plan", price: 15000, type: "Most Popular" },
    { name: "Premium Plan", price: 35000, type: "Comprehensive" }
];

export default function ServiceCheckoutPage() {
    const params = useParams();
    const id = params.id;
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const pkgName = searchParams.get('pkg');
    
    // Fetch full artist profile (organiser + vendor details)
    const fullProfile = useQuery(api.vendors.getFullProfile, { organiserId: decodeURIComponent(id) });
    const availability = useQuery(api.vendorCalendar.getAvailability, { vendorId: decodeURIComponent(id) });
    
    const organiser = fullProfile?.organiser;
    const vendorProfile = fullProfile?.vendorProfile;
    
    const blockedDates = availability?.blockedDates || [];
    const confirmedBookings = availability?.confirmedBookings || [];

    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [isPkgDropdownOpen, setIsPkgDropdownOpen] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [showSuccess, setShowSuccess] = useState(false);
    const [confirmedDetails, setConfirmedDetails] = useState(null);
    
    const [bookingData, setBookingData] = useState({
        date: "",
        time: "",
        remarks: "",
        address: "",
        name: "",
        email: "",
        phone: ""
    });

    useEffect(() => {
        const urlName = searchParams.get('name');
        const urlEmail = searchParams.get('email');
        const urlPhone = searchParams.get('phone');
        const urlDate = searchParams.get('date');

        setBookingData(prev => ({
            ...prev,
            name: urlName || user?.name || prev.name,
            email: urlEmail || user?.identifier || user?.email || prev.email,
            phone: urlPhone || user?.phone || prev.phone,
            date: urlDate || prev.date
        }));
    }, [user, searchParams]);

    // Resolve package details once data loads
    useEffect(() => {
        const customPackages = vendorProfile?.pricing || [];
        const allPackages = customPackages.length > 0 ? customPackages : PRESET_PLANS;
        
        if (pkgName) {
            const found = allPackages.find(p => p.name === pkgName);
            if (found) {
                setSelectedPackage(found);
                return;
            }
        }
        
        // Smart Auto-Select: Pick first package if none selected and packages are available
        if (!selectedPackage && allPackages.length > 0) {
            setSelectedPackage(allPackages[0]);
        }
    }, [pkgName, vendorProfile, selectedPackage]);

    const createBooking = useMutation(api.vendorBookings.create);

    const handleBooking = async (e) => {
        e.preventDefault();
        // Guard: prevent double submission or re-trigger on success
        if (isBooking || showSuccess) return;
        if (!user || !organiser || !selectedPackage) return;

        setIsBooking(true);
        try {
            const bookingId = await createBooking({
                vendorId: organiser.userId,
                userId: user.identifier || user.email,
                serviceType: organiser.category || "Professional Service",
                bookingDate: bookingData.date,
                bookingTime: bookingData.time || undefined,
                totalAmount: selectedPackage.price,
                customerDetails: {
                    name: bookingData.name,
                    phone: bookingData.phone,
                    email: bookingData.email,
                    address: bookingData.address
                },
                remarks: bookingData.remarks || undefined
            });
            
            // Store confirmed details — NO setTimeout redirect (prevents page reload race)
            setConfirmedDetails({
                bookingId,
                service: organiser.category || "Professional Service",
                vendor: organiser.name,
                date: bookingData.date,
                time: bookingData.time,
                package: selectedPackage.name,
                amount: selectedPackage.price,
                customerName: bookingData.name,
                customerEmail: bookingData.email,
                address: bookingData.address,
            });
            setShowSuccess(true);
        } catch (error) {
            console.error("Failed to request booking:", error);
            alert("Failed to submit booking request. Please try again.");
        } finally {
            setIsBooking(false);
        }
    };

    if (fullProfile === undefined) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen pt-32 flex justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-500" /></div>
            </>
        )
    }

    if (!organiser) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen pt-32 text-center bg-slate-50">Artist not found.</div>
            </>
        )
    }

    const coverPhoto = vendorProfile?.profileSettings?.coverPhotoUrl 
        || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200";

    const price = selectedPackage?.price || 0;

    const categoryName = organiser?.category || "";
    const isUnknown = !categoryName || categoryName.toLowerCase() === "unknown";
    const dynamicHeading = isUnknown ? "Booking Confirmation" : `Confirm ${categoryName}`;
    const dynamicButtonText = "Book Now";

    const isDateUnavailable = bookingData.date && (
        blockedDates.includes(bookingData.date) || 
        confirmedBookings.some(b => b.bookingDate === bookingData.date)
    );

    const dynamicDateLabel = "Available Date";

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const days = [];
        const totalDays = daysInMonth(month, year);
        const startDay = firstDayOfMonth(month, year);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        for (let i = 0; i < startDay; i++) days.push(<div key={`pad-${i}`} className="h-10"></div>);

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = bookingData.date === dateStr;
            const isBlocked = blockedDates.includes(dateStr);
            const isBooked = confirmedBookings.some(b => b.bookingDate === dateStr);
            const isUnavailable = isBlocked || isBooked || (new Date(dateStr) < new Date(new Date().setHours(0,0,0,0)));

            days.push(
                <div 
                    key={day} 
                    onClick={() => {
                        if (!isUnavailable) {
                            setBookingData({...bookingData, date: dateStr});
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
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl z-[100] w-[300px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex flex-col">
                        <h4 className="font-extrabold text-[15px] text-slate-800">{monthNames[month]} {year}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Real-time Availability</span>
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

    return (
        <main className="min-h-screen bg-[#fafbfc] pt-[40px] md:pt-[60px] pb-24">
            <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-4">
                    
                    {/* Checkout Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
                        <Link 
                            href={`/services/${id}`}
                            className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            <span>Back</span>
                        </Link>
                        <div className="w-24"></div> {/* Spacer for symmetry */}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left: Booking Details Form */}
                        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                            
                            <Link href="/" className="flex items-center justify-center space-x-3 border-none bg-[#fde047] px-8 md:px-10 py-2 rounded-2xl shadow-[0_4px_20px_-4px_rgba(253,224,71,0.3)] w-full hover:opacity-95 transition-all">
                                <img src="/logo.png" alt="BookMyTicket" style={{ height: "68px", width: "auto" }} />
                                <span className="text-black/20 text-xl mx-3">|</span>
                                <span className="font-bold text-black text-[17px]">Safe Checkout</span>
                            </Link>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-8 md:p-10">
                                <h2 className="text-[22px] font-extrabold text-[#111827] tracking-tight mb-8">{dynamicHeading}</h2>

                                
                                <form onSubmit={handleBooking} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-semibold text-slate-600 block">Name <span className="text-[#FF5A5F]">*</span></label>
                                            <input 
                                                type="text" 
                                                required
                                                value={bookingData.name}
                                                onChange={e => setBookingData({...bookingData, name: e.target.value})}
                                                placeholder="Name"
                                                className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-semibold text-slate-600 block">Email <span className="text-[#FF5A5F]">*</span></label>
                                            <input 
                                                type="email" 
                                                required
                                                value={bookingData.email}
                                                onChange={e => setBookingData({...bookingData, email: e.target.value})}
                                                placeholder="example@gmail.com"
                                                className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">The confirmation will be sent to this email</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2 relative">
                                            <label className="text-[13px] font-semibold text-slate-600 flex items-center gap-1">
                                                Mobile Number<span className="text-green-500 font-bold ml-0.5 text-[10px] items-center flex">WA</span> <span className="text-[#FF5A5F]">*</span>
                                            </label>
                                            <div className="flex">
                                                <div className="flex items-center justify-center bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-3 gap-2 shrink-0 h-[46px]">
                                                    <span className="text-[16px] leading-none grayscale-[0.2]">🇮🇳</span>
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    required
                                                    placeholder="+91"
                                                    value={bookingData.phone}
                                                    onChange={e => setBookingData({...bookingData, phone: e.target.value})}
                                                    className="w-full px-3 h-[46px] bg-white border border-slate-200 rounded-r-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 relative">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[13px] font-semibold text-slate-600 block">{dynamicDateLabel} <span className="text-[#FF5A5F]">*</span></label>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100 shrink-0">
                                                    <span className="flex h-1 w-1 rounded-full bg-green-500 animate-pulse"></span>
                                                    <span className="text-[8px] font-black text-green-700 uppercase tracking-tighter">Live Sync</span>
                                                </div>
                                            </div>
                                            
                                            <div 
                                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                                className={`w-full flex items-center justify-between px-3 bg-white border rounded-lg text-[14px] font-medium transition-all h-[46px] cursor-pointer
                                                    ${isCalendarOpen ? 'border-[#FF5A5F] ring-2 ring-pink-50' : (isDateUnavailable ? 'border-red-500 bg-red-50/20' : 'border-slate-200 hover:border-slate-300')}
                                                    ${bookingData.date ? 'text-slate-900' : 'text-slate-400'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={16} className={bookingData.date ? "text-[#FF5A5F]" : "text-slate-400"} />
                                                    <span>{bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-GB') : "Choose Date"}</span>
                                                </div>
                                                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </div>

                                            {isCalendarOpen && renderCalendar()}

                                            {isDateUnavailable && (
                                                <p className="text-red-500 text-[11px] font-bold mt-1 animate-in fade-in slide-in-from-top-1">⚠️ This date is already booked or blocked by the artist.</p>
                                            )}
                                        </div>
                                    </div>

                                    
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600 block">Event Address <span className="text-[#FF5A5F]">*</span></label>
                                        <textarea 
                                            required
                                            value={bookingData.address}
                                            onChange={e => setBookingData({...bookingData, address: e.target.value})}
                                            placeholder="Full address of the venue..."
                                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400 resize-none h-20"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600 block">Additional Details</label>
                                        <textarea 
                                            value={bookingData.remarks}
                                            onChange={e => setBookingData({...bookingData, remarks: e.target.value})}
                                            placeholder="Any special requests or instructions..."
                                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-900 outline-none focus:border-[#FF5A5F] transition-all placeholder:text-slate-400 resize-none h-20"
                                        />
                                    </div>

                                    <div className="pt-6 space-y-3.5">
                                        <label className="flex items-start space-x-3 cursor-pointer">
                                            <div className="relative flex items-start">
                                                <input type="checkbox" className="w-[18px] h-[18px] rounded border-slate-300 text-[#FF5A5F] focus:ring-[#FF5A5F] mt-[2px]" />
                                            </div>
                                            <span className="text-[13px] font-semibold text-slate-600">Create an account to manage booking</span>
                                        </label>
                                        <label className="flex items-start space-x-3 cursor-pointer">
                                            <div className="relative flex items-start">
                                                <input 
                                                    type="checkbox" 
                                                    required 
                                                    checked={agreedToTerms}
                                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                    className="w-[18px] h-[18px] rounded border-slate-300 text-[#FF5A5F] focus:ring-[#FF5A5F] mt-[2px]" 
                                                />
                                            </div>
                                            <span className="text-[13px] font-semibold text-slate-600">I have read and agreed to the website <a href="#" className="text-blue-500 hover:underline">terms and conditions</a></span>
                                        </label>
                                    </div>

                                    <div className="pt-6">
                                        {!selectedPackage && agreedToTerms && (
                                            <p className="text-[#FF5A5F] text-[11px] font-bold mb-3 animate-pulse">⚠️ Please select a package from the summary card on the right first.</p>
                                        )}
                                        {selectedPackage && !bookingData.date && agreedToTerms && (
                                            <p className="text-[#FF5A5F] text-[11px] font-bold mb-3 animate-pulse">⚠️ Please choose a booking date.</p>
                                        )}
                                        <button 
                                            type="submit"
                                            disabled={isBooking || !selectedPackage || !bookingData.date || !bookingData.address || !agreedToTerms || isDateUnavailable}
                                            className="px-8 flex items-center justify-center min-w-[200px] py-[13px] bg-gradient-to-r from-[#f844a4] to-[#a855f7] hover:opacity-90 text-white rounded-[2rem] font-bold shadow-lg shadow-pink-200 transition-all text-[14px] tracking-wide disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            {isBooking ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                                <div className="flex items-center gap-2">
                                                    <span>{dynamicButtonText}</span>
                                                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                                </div>
                                            )}
                                        </button>
                                        <p className="mt-4 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">No payment required until confirmed</p>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Right: Summary Card */}
                        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                            <div className="bg-white rounded-[1rem] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-5 md:p-6 pb-7">
                                <div className="w-full h-[180px] bg-black rounded-lg overflow-hidden mb-6 relative">
                                    <img src={coverPhoto} className="w-full h-full object-cover opacity-80" alt="Cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                        <span className="text-white font-black text-lg">{organiser.name}</span>
                                    </div>
                                </div>
                                
                                <div className="relative mb-5">
                                    <div 
                                        onClick={() => setIsPkgDropdownOpen(!isPkgDropdownOpen)}
                                        className="w-full h-fit flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Package</span>
                                            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPkgDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                        <h3 className="font-bold text-[15px] text-[#111827] leading-[1.3] truncate">
                                            {selectedPackage ? selectedPackage.name : "Select a Package"}
                                        </h3>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50">
                                            <span className="text-[12px] font-semibold text-slate-500">Package Type</span>
                                            <span className="text-[13px] font-bold text-pink-500">{selectedPackage?.type || "Standard"}</span>
                                        </div>
                                    </div>

                                    {isPkgDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="max-h-[240px] overflow-y-auto py-2">
                                                {(vendorProfile?.pricing?.length > 0 ? vendorProfile.pricing : PRESET_PLANS).map((pkg, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => {
                                                            setSelectedPackage(pkg);
                                                            setIsPkgDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b last:border-0 border-slate-50 flex justify-between items-center
                                                            ${selectedPackage?.name === pkg.name ? 'bg-pink-50/50' : ''}`}
                                                    >
                                                        <div>
                                                            <div className="text-[13px] font-bold text-slate-900">{pkg.name}</div>
                                                            <div className="text-[11px] text-slate-500">{pkg.type || "Service"}</div>
                                                        </div>
                                                        <div className="text-[13px] font-black text-pink-500">₹ {pkg.price}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3.5 mb-8 px-1">
                                    <div className="flex items-start text-[13px] font-medium text-slate-500">
                                        <MapPin size={15} className="shrink-0 mr-3 text-slate-400 mt-0.5" />
                                        <span className="truncate">{bookingData.address || vendorProfile?.advancedSettings?.serviceLocations || "Multiple Locations"}</span>
                                    </div>
                                    <div className="flex items-center text-[13px] font-medium text-slate-500">
                                        <Calendar size={15} className="shrink-0 mr-3 text-slate-400" />
                                        <span>{bookingData.date ? bookingData.date : "Date to be specified"} {bookingData.time && ` ,${bookingData.time}`}</span>
                                    </div>
                                </div>
                                
                                <div className="border-t border-slate-100 pt-5">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center space-x-1.5 text-blue-500/90 cursor-pointer">
                                            <span className="text-[12px] font-medium">Includes convenience fees</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                        </div>
                                        <span className="text-[12px] font-medium text-slate-400">₹ 0.00</span>
                                    </div>

                                    <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
                                        <span className="font-extrabold text-[#111827] text-[16px]">Total</span>
                                        <span className="font-extrabold text-[#111827] text-[16px]">₹ {price}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                                <div className="bg-green-500 rounded-full p-1 shrink-0 mt-0.5">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                                <p className="text-[12px] font-medium text-[#111827] leading-[1.6]">
                                    Book with Confidence : BookMyTicket guarantees your security, ensuring your peace of mind. <button className="text-blue-500 hover:underline">Learn More</button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Success Full-Viewport Confirmation Screen */}
            {showSuccess && confirmedDetails && (
                <div className="fixed inset-0 z-[1000] bg-[#fafbfc] flex items-center justify-center">
                    <div style={{
                        display: 'flex', width: '100%', height: '100%',
                        maxWidth: '940px', margin: '0 auto', padding: '20px',
                        gap: '20px', alignItems: 'center', justifyContent: 'center',
                        boxSizing: 'border-box',
                    }}>
                        {/* Left Panel */}
                        <div style={{
                            flex: '0 0 260px', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                            background: 'linear-gradient(145deg,#f84464 0%,#a855f7 100%)',
                            borderRadius: '24px', padding: '36px 24px', color: '#fff', alignSelf: 'stretch',
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

                        {/* Right Panel */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Booking Details</h2>
                                </div>
                                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                                    {[
                                        { label: 'Service', value: confirmedDetails.service },
                                        { label: 'Professional', value: confirmedDetails.vendor },
                                        { label: 'Package', value: confirmedDetails.package },
                                        { label: 'Date', value: confirmedDetails.date ? new Date(confirmedDetails.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + (confirmedDetails.time ? ' · ' + confirmedDetails.time : '') : 'TBD' },
                                        { label: 'Customer', value: confirmedDetails.customerName },
                                        { label: 'Status', value: 'Pending Review' },
                                        ...(confirmedDetails.address ? [{ label: 'Venue', value: confirmedDetails.address }] : []),
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ margin: '0 20px 16px', background: 'linear-gradient(135deg,#fdf2f8,#faf5ff)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f3e8ff' }}>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Total Amount</span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: '#f84464' }}>₹{confirmedDetails.amount}</span>
                                </div>
                            </div>

                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
                                <p style={{ margin: 0, fontSize: 11, color: '#166534', lineHeight: 1.6, fontWeight: 500 }}>
                                    No payment required until booking is confirmed. The professional will respond within 24 hours.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <Link
                                    href="/profile?tab=my_booking"
                                    style={{
                                        flex: 1, padding: '13px 0',
                                        background: 'linear-gradient(135deg,#f84464,#a855f7)',
                                        color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 13,
                                        textDecoration: 'none', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: 6,
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
                                        color: '#475569', borderRadius: 14, fontWeight: 700,
                                        fontSize: 13, textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
