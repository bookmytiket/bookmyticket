"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket, Lock, LogOut, ArrowLeft, Sparkles, Video } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import { isVirtualEvent } from "@/app/utils/eventUtils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
    const [bookingFilter, setBookingFilter] = useState("all");
    const [viewTicketModal, setViewTicketModal] = useState(null);

    const eventBookingsList = useQuery(api.bookings.getByUser, user?.identifier ? { userId: user.identifier } : "skip");
    const vendorBookingsList = useQuery(api.vendorBookings.getByUser, user?.identifier ? { userId: user.identifier } : "skip");

    // Removed forced redirect for organisers/staff to allow them to view personal bookings and join meetings
    // Automatically redirect to signin if user is not found and loading is complete
    useEffect(() => {
        if (!loading && !user && mounted) {
            router.push("/signin?redirect=/profile");
        }
    }, [user, loading, router, mounted]);

    // Hydration guard: show nothing or a loader until client-side mount
    if (!mounted) {
        return (
            <div style={{ minHeight: "100vh", background: THEME.bg }} />
        );
    }

    // Fallback UI rendering for when user is not loaded
    if (!user) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg }}>
                <p style={{ color: THEME.textSub }}>Redirecting to login...</p>
            </div>
        );
    }

    const t = THEME;

    // Derived combined booking list
    const bookings = [
        ...(eventBookingsList || []),
        ...(vendorBookingsList || [])
    ].sort((a, b) => {
        const dateA = a.bookingDate || a._creationTime;
        const dateB = b.bookingDate || b._creationTime;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const bookedTickets = bookings.filter(b => ["Confirmed", "Paid", "Scanned"].includes(b.status));
    const cancelledTickets = bookings.filter(b => ["Cancelled", "Rejected"].includes(b.status));
    const paidTickets = bookings.filter(b => ["Paid", "Scanned", "Confirmed"].includes(b.status));

    const renderTabContent = () => {
        switch (activeTab) {
            case "my_booking":
                const displayBookings = bookingFilter === "all" ? bookings :
                    bookingFilter === "booked" ? bookedTickets :
                        bookingFilter === "cancelled" ? cancelledTickets : paidTickets;

                return (
                    <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Personal Experiences</h3>
                                <p className="text-sm text-slate-500 font-medium">Track your ticket bookings, sessions, and payments.</p>
                            </div>
                            <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", gap: "4px" }}>
                                {["all", "booked", "cancelled", "payments"].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setBookingFilter(f)}
                                        style={{
                                            padding: "6px 12px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: bookingFilter === f ? "#fff" : "transparent",
                                            color: bookingFilter === f ? "#000" : t.textSub,
                                            boxShadow: bookingFilter === f ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                            cursor: "pointer",
                                            textTransform: "capitalize"
                                        }}
                                    >
                                        {f}
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
                                                    <span>ID: #{booking._id.slice(-6).toUpperCase()}</span>
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
                                                {"Cancelled" !== booking.status && (booking.meetingUrl || isVirtualEvent(booking) || booking.virtual) && (
                                                    booking.meetingUrl ? (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const url = booking.meetingUrl;
                                                                        // SANITIZE: Prevent redirection to management internal routes if misconfigured
                                                                        if (!url.startsWith("http") && (url.toLowerCase().includes("organiser") || url.toLowerCase().includes("admin") || url.toLowerCase().includes("vendor"))) {
                                                                            console.warn("Invalid meeting URL detected:", url);
                                                                            return;
                                                                        }
                                                                        // If it's a full URL (starts with http), open it directly.
                                                                        // Otherwise, it's a 9-digit code for our internal meeting room.
                                                                        const target = (url.startsWith("http://") || url.startsWith("https://")) ? url : `/${url}`;
                                                                        window.open(target, '_blank', 'noopener,noreferrer');
                                                                    }}
                                                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all cursor-pointer shadow-sm"
                                                                >
                                                                    <Video size={10} /> Join Now
                                                                </button>
                                                    ) : (
                                                        <span className="flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-not-allowed" title="Meeting link not yet available">
                                                            <Video size={10} /> Pending
                                                        </span>
                                                    )
                                                )}
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
                                    No {bookingFilter !== "all" ? bookingFilter : ""} records found
                                </p>
                                <p style={{ fontSize: "13px", margin: "0 0 20px" }}>
                                    {bookingFilter === "cancelled" ? "You don't have any cancelled ticket requests." : "Browse our events to start your next adventure!"}
                                </p>
                                {bookingFilter === "all" && (
                                    <Link href="/" style={{ padding: "10px 24px", background: t.accent, color: "#fff", borderRadius: "50px", textDecoration: "none", fontWeight: "700", fontSize: "14px", display: "inline-block", boxShadow: `0 4px 12px ${t.accentGlow}` }}>
                                        Explore Events
                                    </Link>
                                )}
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
                        <button
                            onClick={() => setActiveTab("my_booking")}
                            style={{ width: "100%", padding: "12px 16px", background: activeTab === "my_booking" ? t.activeItem : "transparent", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: activeTab === "my_booking" ? t.activeText : t.textSub, fontWeight: "600", fontSize: "14px", marginBottom: "4px", transition: "all 0.2s" }}
                        >
                            <Ticket size={18} /> My Booking
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
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={() => setViewTicketModal(null)}>
                    <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "400px", border: `1px solid ${t.border}`, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: 0 }}>Digital Ticket</h2>
                            <button onClick={() => setViewTicketModal(null)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer", fontSize: "20px" }}>✕</button>
                        </div>
                        <div style={{ padding: "24px", background: "#f8fafc", borderRadius: "16px", border: `1px dashed ${t.border}`, marginBottom: "24px" }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${viewTicketModal._id}`} alt="QR Code" style={{ width: "200px", height: "200px", borderRadius: "8px", margin: "0 auto", display: "block" }} />
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: t.textMain }}>{viewTicketModal.eventName || "Event Ticket"}</h3>
                        <p style={{ margin: "0 0 16px", fontSize: "14px", color: t.textSub }}>Booking ID: <span style={{ fontWeight: 700, color: t.textMain }}>{viewTicketModal._id}</span></p>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px", backgroundColor: "#f1f5f9", borderRadius: "12px", textAlign: "left" }}>
                            <div>
                                <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>Quantity</p>
                                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.textMain }}>{viewTicketModal.ticketCount} Ticket(s)</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>Status</p>
                                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.textMain }}>{viewTicketModal.status}</p>
                            </div>
                        </div>
                        {(viewTicketModal.meetingUrl || isVirtualEvent(viewTicketModal) || viewTicketModal.virtual) && (
                            <div style={{ marginTop: "20px" }}>
                                <div style={{ marginBottom: "12px", background: "#fff", border: "1.5px solid #e2e8f0", padding: "10px", borderRadius: "12px" }}>
                                    <p style={{ margin: "0 0 2px", fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        {viewTicketModal.meetingUrl?.startsWith("http") ? "Meeting URL" : "Meeting Code"}
                                    </p>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: viewTicketModal.meetingUrl?.startsWith("http") ? "12px" : "16px", 
                                        fontWeight: 900, 
                                        color: "#0f172a", 
                                        fontFamily: "monospace", 
                                        letterSpacing: viewTicketModal.meetingUrl?.startsWith("http") ? "0" : "0.1em",
                                        wordBreak: "break-all"
                                    }}>
                                        {viewTicketModal.meetingUrl || "PENDING"}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const url = viewTicketModal.meetingUrl;
                                        if (url) {
                                            // Identify if the current URL is an internal management link that should be ignored
                                            const isInternalLink = url.toLowerCase().includes("organiser") || url.toLowerCase().includes("admin") || url.toLowerCase().includes("vendor");
                                            
                                            // Resolve the target: If it's a full URL and NOT an internal management link, use it.
                                            // Otherwise use the URL as a path segment (for 9-digit codes).
                                            // If it's a "bad" internal link, the backend resolution should have already fixed it, 
                                            // but as a failsafe we block it here.
                                            if (isInternalLink && url.startsWith("http")) {
                                                console.warn("Blocking redirect to management portal:", url);
                                                return;
                                            }
                                            
                                            const target = (url.startsWith("http://") || url.startsWith("https://")) ? url : `/${url}`;
                                            window.open(target, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                    style={{ 
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        padding: "14px", 
                                        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", 
                                        color: "#fff", 
                                        borderRadius: "12px", 
                                        fontSize: "14px", 
                                        fontWeight: "800", 
                                        textDecoration: "none",
                                        boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
                                        textAlign: "center",
                                        border: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Video size={18} /> Join Meeting Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
