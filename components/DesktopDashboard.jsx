"use client";

import React from "react";
import Link from "next/link";
import { Ticket, Heart, Lock, LogOut, Sparkles, LayoutDashboard, ArrowLeft } from "lucide-react";
import JoinNowButton from "./JoinNowButton";
import TicketCard from "./TicketCard";

export default function DesktopDashboard({
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

    const renderTabContent = () => {
        switch (activeTab) {
            case "my_booking":
                return (
                    <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Personal Experiences</h3>
                                <p className="text-sm text-slate-500 font-medium">Track your ticket bookings, sessions, and payments.</p>
                            </div>
                            <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", gap: "4px" }}>
                                {[
                                    { id: "booked", label: "Booked Tickets" },
                                    { id: "cancelled", label: "Cancelled Tickets" },
                                    { id: "payments", label: "Payments" }
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setBookingFilter(f.id)}
                                        style={{
                                            padding: "8px 16px",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: bookingFilter === f.id ? "#fff" : "transparent",
                                            color: bookingFilter === f.id ? "#000" : t.textSub,
                                            boxShadow: bookingFilter === f.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                                            cursor: "pointer",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {displayBookings.length > 0 ? (
                            <div style={{ display: "grid", gap: "16px" }}>
                                {displayBookings.map((booking, i) => (
                                    <div key={i} className="booking-card">
                                        <div className="booking-info">
                                            {booking.isVendorBooking ? (
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center text-pink-500 border border-yellow-200 shadow-inner">
                                                    <Sparkles size={18} strokeWidth={2.5} />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-pink-500 border border-slate-100 shadow-inner">
                                                    <Ticket size={24} strokeWidth={1.5} />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-black text-slate-900 tracking-tight group-hover:text-pink-600 transition-colors uppercase italic text-sm">
                                                    {booking.eventName}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    <span>ID: #{(booking._id || booking.id || "000000").slice(-8).toUpperCase()}</span>
                                                    <span>•</span>
                                                    {booking.isVendorBooking ? (
                                                        <span>Service Session</span>
                                                    ) : (
                                                        <span>{booking.ticketCount} Seats</span>
                                                    )}
                                                    <span>•</span>
                                                    <span>₹{booking.totalPrice}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                booking.status === "Cancelled" || booking.status === "Rejected"
                                                    ? "bg-red-50 text-red-500 border-red-100" 
                                                    : "bg-[#fefce8] text-[#a16207] border-[#fef08a]"
                                            }`}>
                                                {booking.status}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => setViewTicketModal(booking)}
                                                    className="text-pink-500 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
                                                >
                                                    {booking.isVendorBooking ? "Booking Details" : "View Ticket"}
                                                </button>
                                                <button 
                                                    onClick={() => setViewInvoiceModal(booking)}
                                                    className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
                                                >
                                                    Invoice
                                                </button>
                                                <JoinNowButton 
                                                    eventId={booking.eventId} 
                                                    className="h-7 !px-3 !py-0 !rounded-lg !text-[9px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: "60px 24px", textAlign: "center", color: t.textSub, border: `1px dashed ${t.border}`, borderRadius: "12px" }}>
                                <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}>
                                    {bookingFilter === "cancelled" ? "📂" : (bookingFilter === "payments" ? "💳" : "🎟️")}
                                </div>
                                <p style={{ fontSize: "16px", fontWeight: "600", color: t.textMain, margin: "0 0 8px" }}>
                                    No {bookingFilter === "booked" ? "Booked Tickets" : (bookingFilter === "cancelled" ? "Cancelled Tickets" : "Payment Records")} Found
                                </p>
                                <p style={{ fontSize: "13px", margin: "0 0 20px" }}>
                                    {bookingFilter === "cancelled" ? "You don't have any cancelled ticket requests." : "Browse our events to start your next adventure!"}
                                </p>
                                <Link href="/" style={{ padding: "10px 24px", background: t.accent, color: "#fff", borderRadius: "50px", textDecoration: "none", fontWeight: "700", fontSize: "14px", display: "inline-block", boxShadow: `0 4px 12px ${t.accentGlow}` }}>
                                    Explore Events
                                </Link>
                            </div>
                        )}
                    </div>
                );
            case "change_password":
                return (
                    <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Change Password</h3>
                        <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "20px" }}>Update your account password to stay secure.</p>

                        <div style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Current Password</label>
                                <input type="password" placeholder="Enter current password" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, outline: "none", fontSize: "14px" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>New Password</label>
                                <input type="password" placeholder="Enter new password" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, outline: "none", fontSize: "14px" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Confirm New Password</label>
                                <input type="password" placeholder="Confirm new password" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, outline: "none", fontSize: "14px" }} />
                            </div>
                            <button style={{ marginTop: "8px", padding: "14px", borderRadius: "10px", border: "none", background: t.accent, color: "#fff", fontWeight: "700", cursor: "pointer", boxShadow: `0 4px 12px ${t.accentGlow}` }}>
                                Update Password
                            </button>
                        </div>
                    </div>
                );
            case "wishlist":
                return (
                    <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                        <div style={{ marginBottom: "20px" }}>
                            <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase flex items-center gap-2">
                                <Heart className="text-pink-500" fill="currentColor" size={24} /> My Wishlist
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">Events you've saved for later.</p>
                        </div>
                        {wishlistEvents.length > 0 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                                {wishlistEvents.map(event => (
                                    <TicketCard key={event.id} event={event} router={router} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: "60px 24px", textAlign: "center", color: t.textSub, border: `1px dashed ${t.border}`, borderRadius: "12px" }}>
                                <Heart size={40} className="mx-auto text-slate-300 mb-4" />
                                <p style={{ fontSize: "16px", fontWeight: "600", color: t.textMain, margin: "0 0 8px" }}>
                                    Your Wishlist is Empty
                                </p>
                                <p style={{ fontSize: "13px", margin: "0 0 20px" }}>
                                    Save events you love to keep track of them here.
                                </p>
                                <Link href="/" style={{ padding: "10px 24px", background: t.accent, color: "#fff", borderRadius: "50px", textDecoration: "none", fontWeight: "700", fontSize: "14px", display: "inline-block", boxShadow: `0 4px 12px ${t.accentGlow}` }}>
                                    Explore Events
                                </Link>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="hidden md:flex profile-content-wrap">
            {/* Profile Sidebar */}
            <aside className="profile-sidebar">
                <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: `1px solid ${t.sidebarBorder}` }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: t.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "24px", marginBottom: "12px" }}>
                        {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <h2 style={{ fontSize: "16px", fontWeight: "700", color: t.textMain, margin: "0 0 4px" }}>{user.name || "Public User"}</h2>
                    <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>{user.identifier}</p>
                </div>

                <nav style={{ padding: "12px" }}>
                    {user.role === 'organiser' && (
                        <button
                            onClick={() => router.push("/organiser")}
                            style={{ width: "100%", padding: "12px 16px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#fff", fontWeight: "700", fontSize: "14px", marginBottom: "12px", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(248, 68, 100, 0.2)" }}
                        >
                            <LayoutDashboard size={18} /> Organiser Panel
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab("my_booking")}
                        style={{ width: "100%", padding: "12px 16px", background: activeTab === "my_booking" ? t.activeItem : "transparent", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: activeTab === "my_booking" ? t.activeText : t.textSub, fontWeight: "600", fontSize: "14px", marginBottom: "4px", transition: "all 0.2s" }}
                    >
                        <Ticket size={18} /> My Booking
                    </button>
                    <button
                        onClick={() => setActiveTab("wishlist")}
                        style={{ width: "100%", padding: "12px 16px", background: activeTab === "wishlist" ? t.activeItem : "transparent", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: activeTab === "wishlist" ? t.activeText : t.textSub, fontWeight: "600", fontSize: "14px", marginBottom: "4px", transition: "all 0.2s" }}
                    >
                        <Heart size={18} /> Wishlist
                    </button>
                    <button
                        onClick={() => setActiveTab("change_password")}
                        style={{ width: "100%", padding: "12px 16px", background: activeTab === "change_password" ? t.activeItem : "transparent", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: activeTab === "change_password" ? t.activeText : t.textSub, fontWeight: "600", fontSize: "14px", marginBottom: "4px", transition: "all 0.2s" }}
                    >
                        <Lock size={18} /> Change Password
                    </button>
                    <button
                        onClick={logout}
                        style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#ef4444", fontWeight: "600", fontSize: "14px", marginTop: "16px", transition: "all 0.2s" }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="profile-main">
                <div style={{ marginBottom: "24px" }}>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">My Bookings & Activity</h2>
                    <p className="text-slate-500 font-medium">Manage your event experiences and professional sessions.</p>
                </div>

                <button 
                    onClick={() => router.push('/')}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        background: "#fff",
                        border: `1px solid ${t.border}`,
                        borderRadius: "8px",
                        color: t.textMain,
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        marginBottom: "16px",
                        transition: "all 0.2s",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        width: "fit-content"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(-4px)";
                        e.currentTarget.style.borderColor = t.textSub;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.borderColor = t.border;
                    }}
                >
                    <ArrowLeft size={16} strokeWidth={2.5} />
                    Back to Home
                </button>

                {renderTabContent()}
            </main>
        </div>
    );
}
