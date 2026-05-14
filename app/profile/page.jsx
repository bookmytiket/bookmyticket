"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket, Lock, LogOut, ArrowLeft, Sparkles, Video, X, LayoutDashboard, Heart } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import { isVirtualEvent } from "@/app/utils/eventUtils";
import { supabase } from "@/lib/supabase";
import JoinNowButton from "@/components/JoinNowButton";
import DigitalTicket from "@/components/DigitalTicket";
import DigitalInvoice from "@/components/DigitalInvoice";
import TicketCard from "@/components/TicketCard";

const THEME = {
    bg: "#f8fafc",
    cardBg: "#ffffff",
    border: "#e2e8f0",
    textMain: "#0f172a",
    textSub: "#64748b",
    headerBg: "#ffffff",
    sidebarBg: "#ffffff",
    sidebarBorder: "#e2e8f0",
    activeItem: "#f1f5f9",
    activeText: "#000000",
    accent: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
    accentGlow: "rgba(192, 38, 211, 0.3)",
};

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "my_booking");

    useEffect(() => {
        setMounted(true);
    }, []);
    const [bookingFilter, setBookingFilter] = useState("booked");
    const [viewTicketModal, setViewTicketModal] = useState(null);
    const [viewInvoiceModal, setViewInvoiceModal] = useState(null);

    const [eventBookingsList, setEventBookingsList] = useState([]);
    const [vendorBookingsList, setVendorBookingsList] = useState([]);
    const [wishlistEvents, setWishlistEvents] = useState([]);
    const [siteBranding, setSiteBranding] = useState({});

    useEffect(() => {
        if (!user?.id) return;
        const uid = user.id;
        
        supabase.from('user_wishlists').select('*, events(*)').eq('user_id', uid)
            .then(({ data }) => setWishlistEvents((data || []).map(w => w.events).filter(Boolean)));
        supabase.from('bookings').select('*, events(*)').eq('user_id', uid)
            .then(({ data }) => setEventBookingsList((data || []).map(b => ({
                ...b,
                eventName: b.events?.title || "Event Booking",
                eventImg: b.events?.img || b.events?.banner_preview,
                eventDate: b.events?.date,
                eventTime: b.events?.time || "TBA",
                eventLocation: b.events?.venue || b.events?.location || b.events?.address || "Venue",
                ticketCount: b.ticket_count,
                totalPrice: b.total_price,
                eventId: b.event_id,
                meetingUrl: b.meeting_url,
                _id: b.id
            }))));
            
        // Use user.id (UUID) for the relational vendor_bookings table
        if (user.id) {
            supabase.from('vendor_bookings').select('*').eq('user_id', user.id)
                .then(({ data }) => setVendorBookingsList((data || []).map(b => ({ 
                    ...b, 
                    isVendorBooking: true,
                    eventName: b.service_type || "Professional Service", 
                    eventImg: b.customer_details?.service_image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
                    totalPrice: b.total_amount,
                    bookingDate: b.booking_date,
                    eventDate: b.booking_date,
                    eventTime: b.booking_time || "TBA",
                    eventLocation: b.customer_address || b.customer_details?.address || "Venue",
                    _id: b.id
                }))));
        }

        // Fetch site branding via API for ticket sponsor logos (bypasses RLS)
        fetch('/api/branding')
            .then(res => res.json())
            .then(data => { if (data && !data.error) setSiteBranding(data); });
    }, [user?.identifier, user?.email, user.id]);

    // Removed forced redirect for organisers/staff to allow them to view personal bookings and join meetings
    // Automatically redirect to signin if user is not found and loading is complete
    // REDIRECT GUARD: Branding users belong to the branding portal, not normal profile
    useEffect(() => {
        if (!loading && mounted) {
            if (!user) {
                router.push("/signin?redirect=/profile");
            }
        }
    }, [user, loading, router, mounted]);

    // Hydration guard: show nothing or a loader until client-side mount
    if (!mounted) {
        return (
            <div style={{ minHeight: "100vh", background: THEME.bg }}>
                {/* Semrush checks initial HTML; this ensures an H1 exists pre-hydration */}
                <h1 style={{ fontSize: "34px", fontWeight: 900, color: THEME.textMain, margin: "0 0 10px", padding: "120px 24px 0" }}>
                    Your Profile
                </h1>
            </div>
        );
    }

    // Fallback UI rendering for when user is not loaded
    if (!user) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg }}>
                <div style={{ textAlign: "center", padding: "24px" }}>
                    <h1 style={{ fontSize: "34px", fontWeight: 900, color: THEME.textMain, margin: "0 0 10px" }}>
                        Your Profile
                    </h1>
                    <p style={{ color: THEME.textSub }}>Redirecting to login...</p>
                </div>
            </div>
        );
    }

    const t = THEME;

    // Derived combined booking list
    const bookings = [
        ...(eventBookingsList || []),
        ...(vendorBookingsList || [])
    ].filter(b => {
        // Automatically hide Pending bookings older than 24 hours
        if (b.status === "Pending") {
            const createdTime = b.created_at || b._creationTime;
            if (createdTime) {
                const diff = Date.now() - new Date(createdTime).getTime();
                return diff < (24 * 60 * 60 * 1000); // 24 Hours
            }
        }
        return true;
    }).sort((a, b) => {
        const dateA = a.bookingDate || a._creationTime || a.created_at;
        const dateB = b.bookingDate || b._creationTime || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const bookedTickets = bookings.filter(b => ["Confirmed", "Paid", "Scanned"].includes(b.status));
    const cancelledTickets = bookings.filter(b => ["Cancelled", "Rejected"].includes(b.status));
    const paidTickets = bookings.filter(b => ["Paid", "Scanned", "Confirmed"].includes(b.status));

    const renderTabContent = () => {
        switch (activeTab) {
            case "my_booking":
                const displayBookings = bookingFilter === "booked" ? bookedTickets :
                        bookingFilter === "cancelled" ? cancelledTickets : paidTickets;

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
                                                    : "bg-yellow-100 text-yellow-600 border-yellow-200"
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
        <div className="profile-page-container">
            <style>{`
                .profile-page-container {
                    min-height: 100vh;
                    background-color: ${t.bg};
                    font-family: 'Inter', sans-serif;
                    padding-top: 120px;
                    padding-bottom: 40px;
                }
                .profile-content-wrap {
                    display: flex;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                    gap: 32px;
                    align-items: flex-start;
                }
                .profile-sidebar {
                    width: 260px;
                    background-color: ${t.sidebarBg};
                    border-radius: 16px;
                    border: 1px solid ${t.sidebarBorder};
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .profile-main {
                    flex: 1;
                    min-width: 0;
                }
                .booking-card {
                    border: 1px solid ${t.border};
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: ${t.cardBg};
                }
                .booking-info {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                .booking-actions {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 8px;
                }
                @media (max-width: 768px) {
                    .profile-page-container {
                        padding-top: 80px;
                    }
                    .profile-content-wrap {
                        flex-direction: column;
                        padding: 0 16px;
                        gap: 24px;
                    }
                    .profile-sidebar {
                        width: 100%;
                    }
                    .profile-main {
                        width: 100%;
                    }
                    .booking-card {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .booking-actions {
                        width: 100%;
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                        padding-top: 12px;
                        border-top: 1px solid ${t.border};
                    }
                    .booking-info {
                        width: 100%;
                    }
                }
            `}</style>

            <div className="profile-content-wrap">

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

            {/* View Ticket Modal */}
            {viewTicketModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 11000, padding: "10px", paddingBottom: "20px", backdropFilter: "blur(12px)", overflowY: "auto" }} onClick={() => setViewTicketModal(null)}>
                    <div style={{ width: "100%", maxWidth: "850px", position: "relative" }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setViewTicketModal(null)} 
                            className="absolute top-4 right-4 z-[100] p-2 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 hover:text-purple-900 transition-all rounded-full"
                        >
                            <X size={20} />
                        </button>
                        
                        <DigitalTicket 
                            booking={viewTicketModal}
                            event={{
                                title: viewTicketModal.eventName || "Event Ticket",
                                img: viewTicketModal.eventImg || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
                                date: viewTicketModal.eventDate || "—",
                                time: viewTicketModal.eventTime || "—",
                                location: viewTicketModal.eventLocation || "Venue",
                                category: viewTicketModal.events?.category || "Event"
                            }}
                            showDownload={true}
                            branding={siteBranding}
                        />

                        {/* Meeting Access Button if applicable */}
                        {(viewTicketModal.meetingUrl || viewTicketModal.isVirtual) && (
                            <div className="mt-4 px-4">
                                <JoinNowButton 
                                    eventId={viewTicketModal.eventId} 
                                    className="w-full !py-4 !text-xs !tracking-[0.2em] !shadow-xl"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* View Invoice Modal */}
            {viewInvoiceModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 11000, padding: "20px", backdropFilter: "blur(12px)", overflowY: "auto" }} onClick={() => setViewInvoiceModal(null)}>
                    <div style={{ width: "100%", maxWidth: "900px", position: "relative" }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setViewInvoiceModal(null)} 
                            className="absolute top-4 right-4 z-[100] p-2 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 hover:text-pink-600 transition-all rounded-full"
                        >
                            <X size={20} />
                        </button>
                        
                        <DigitalInvoice 
                            booking={viewInvoiceModal}
                            event={{
                                title: viewInvoiceModal.eventName || "Event Booking",
                                date: viewInvoiceModal.eventDate || "—",
                                location: viewInvoiceModal.eventLocation || "Venue"
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
