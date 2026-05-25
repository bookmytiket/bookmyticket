"use client";

import React from "react";
import Link from "next/link";
import { 
    Ticket, 
    Heart, 
    Lock, 
    LogOut, 
    Sparkles, 
    ChevronRight, 
    MapPin, 
    Calendar,
    Smartphone,
    UserCheck,
    CreditCard
} from "lucide-react";
import JoinNowButton from "./JoinNowButton";
import TicketCard from "./TicketCard";

export default function MobileDashboard({ 
    user, 
    bookings, 
    activeTab, 
    setActiveTab, 
    bookingFilter, 
    setBookingFilter, 
    setViewTicketModal, 
    setViewInvoiceModal, 
    wishlistEvents, 
    logout, 
    router,
    t 
}) {
    const bookedTickets = bookings.filter(b => ["Confirmed", "Paid", "Scanned"].includes(b.status));
    const cancelledTickets = bookings.filter(b => ["Cancelled", "Rejected"].includes(b.status));
    const paidTickets = bookings.filter(b => ["Paid", "Scanned", "Confirmed"].includes(b.status));

    const displayBookings = bookingFilter === "booked" ? bookedTickets :
                            bookingFilter === "cancelled" ? cancelledTickets : paidTickets;

    return (
        <div className="w-full font-sans text-[#1e293b] md:hidden px-4 py-6 space-y-8">
            {/* Top Identity Header Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-pink-500/10 blur-xl pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 text-white font-black text-xl flex items-center justify-center border-2 border-white/20 shadow-inner">
                        {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest leading-none mb-1">MEMBER LEVEL ACCESS</p>
                        <h2 className="text-lg font-black uppercase tracking-tight italic">{user.name || "Attendee User"}</h2>
                        <p className="text-[10px] text-white/50 truncate max-w-[180px] mt-0.5">{user.email || user.identifier}</p>
                    </div>
                </div>
            </div>

            {/* Mobile Nav Horizontal Pill Segmented Controls */}
            <div className="flex gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
                {[
                    { id: "my_booking", label: "Bookings", icon: Ticket },
                    { id: "wishlist", label: "Wishlist", icon: Heart },
                    { id: "change_password", label: "Security", icon: Lock }
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                                isActive 
                                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                                    : "bg-white border-slate-100 text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Tabs Container */}
            <div className="space-y-6">
                {activeTab === "my_booking" && (
                    <div className="space-y-6">
                        {/* Segmented control for bookings filters */}
                        <div className="bg-slate-100 p-1 rounded-2xl grid grid-cols-3 gap-1 border border-slate-200/50">
                            {[
                                { id: "booked", label: "Booked" },
                                { id: "cancelled", label: "Cancelled" },
                                { id: "payments", label: "Payments" }
                            ].map((f) => {
                                const isSel = bookingFilter === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setBookingFilter(f.id)}
                                        className={`py-3.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer ${
                                            isSel 
                                                ? "bg-white text-slate-950 shadow-sm font-black" 
                                                : "bg-transparent text-slate-500"
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Stacking bookings list - NO horizontal compression! */}
                        <div className="space-y-4">
                            {displayBookings.map((booking, idx) => {
                                const shortId = (booking._id || booking.id || "000000").slice(-8).toUpperCase();
                                return (
                                    <div 
                                        key={idx}
                                        className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative"
                                    >
                                        {/* Status & Title Row */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3 items-center">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                                                    booking.isVendorBooking 
                                                        ? "bg-yellow-50 text-yellow-600 border border-yellow-100" 
                                                        : "bg-slate-50 text-pink-500 border border-slate-100"
                                                }`}>
                                                    {booking.isVendorBooking ? <Sparkles size={16} /> : <Ticket size={20} />}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase italic tracking-tight text-slate-900 max-w-[160px] truncate">
                                                        {booking.eventName}
                                                    </h4>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        ID: #{shortId} • {booking.isVendorBooking ? "Session" : `${booking.ticketCount} Seat(s)`}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                booking.status === "Cancelled" || booking.status === "Rejected"
                                                    ? "bg-red-50 text-red-500 border-red-100"
                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        {/* Event Meta Stack */}
                                        <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 text-[10px] font-bold text-slate-500 space-y-1.5">
                                            <div className="flex gap-2 items-center truncate">
                                                <Calendar size={12} className="text-slate-400" />
                                                <span>Date: {booking.eventDate || booking.bookingDate || "TBA"} • {booking.eventTime || "TBA"}</span>
                                            </div>
                                            <div className="flex gap-2 items-center truncate">
                                                <MapPin size={12} className="text-slate-400" />
                                                <span>Venue: {booking.eventLocation || "TBA"}</span>
                                            </div>
                                        </div>

                                        {/* Staggered Touch-Friendly Buttons (Touch Target >= 44px) */}
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                            <div className="text-left">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Price</p>
                                                <p className="text-xs font-black text-slate-900">₹{booking.totalPrice}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewTicketModal(booking)}
                                                    className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm"
                                                >
                                                    {booking.isVendorBooking ? "Details" : "View Ticket"}
                                                </button>
                                                <button
                                                    onClick={() => setViewInvoiceModal(booking)}
                                                    className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-[9px] font-black uppercase tracking-widest flex items-center justify-center"
                                                >
                                                    Invoice
                                                </button>
                                                {!booking.isVendorBooking && (
                                                    <button 
                                                        onClick={async (e) => {
                                                            e.target.innerText = "Wait..";
                                                            try {
                                                                await fetch(`/api/v1/tickets/${booking.id || booking._id}/resend`, { method: 'POST' });
                                                                e.target.innerText = "Sent!";
                                                                setTimeout(() => e.target.innerText = "Resend", 2000);
                                                            } catch (err) {
                                                                e.target.innerText = "Error";
                                                                setTimeout(() => e.target.innerText = "Resend", 2000);
                                                            }
                                                        }}
                                                        className="h-11 px-4 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-purple-100"
                                                    >
                                                        Resend
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Zoom-Safe Virtual meeting helper */}
                                        {(booking.meetingUrl || booking.isVirtual) && (
                                            <div className="pt-2">
                                                <JoinNowButton eventId={booking.eventId} className="w-full h-11 !text-[9px]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {displayBookings.length === 0 && (
                                <div className="text-center py-16 px-4 bg-white border border-slate-100 rounded-3xl border-dashed">
                                    <div className="text-3xl mb-3">🎟️</div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">No Bookings Found</p>
                                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                                        You have no items registered inside this filter category.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "wishlist" && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Wishlisted Events</h3>
                        {wishlistEvents.length > 0 ? (
                            <div className="grid gap-4">
                                {wishlistEvents.map(event => (
                                    <TicketCard key={event.id} event={event} router={router} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-4 bg-white border border-slate-100 rounded-3xl border-dashed">
                                <Heart size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Wishlist is Empty</p>
                                <p className="text-[10px] text-slate-400 mt-1">Bookmark events to save them here.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "change_password" && (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight italic">Security Controls</h3>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Update password to keep your dashboard secure.</p>
                        
                        <div className="space-y-3">
                            <input 
                                type="password" 
                                placeholder="Current Password" 
                                className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200/50 px-4 text-xs font-semibold outline-none focus:border-slate-400"
                            />
                            <input 
                                type="password" 
                                placeholder="New Password" 
                                className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200/50 px-4 text-xs font-semibold outline-none focus:border-slate-400"
                            />
                            <input 
                                type="password" 
                                placeholder="Confirm Password" 
                                className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200/50 px-4 text-xs font-semibold outline-none focus:border-slate-400"
                            />
                            <button className="w-full h-12 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm">
                                Save New Keys
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Option */}
            <button 
                onClick={logout}
                className="w-full h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                <LogOut size={14} /> Sign Out Account
            </button>
        </div>
    );
}
