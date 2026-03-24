"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket, Lock, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
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
    const { user, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "my_booking");

    useEffect(() => {
        if (user && (user.role === "organiser" || user.role === "staff")) {
            router.replace("/organiser");
        }
    }, [user, router]);

    // Fallback UI rendering for when user is not loaded
    if (!user) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg }}>
                <p style={{ color: THEME.textSub }}>Redirecting to login...</p>
            </div>
        );
    }

    const t = THEME;

    const renderTabContent = () => {
        switch (activeTab) {
            case "my_booking":
                const displayBookings = bookingFilter === "all" ? userBookings :
                    bookingFilter === "booked" ? bookedTickets :
                        bookingFilter === "cancelled" ? cancelledTickets : paidTickets;

                return (
                    <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px", color: t.textMain }}>My Event Experience</h3>
                                <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>Track your ticket bookings, cancellations and payments.</p>
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
                                            <div style={{ width: "48px", height: "48px", background: booking.status === 'Cancelled' ? '#fee2e2' : '#fef9c3', borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                                                {booking.status === 'Cancelled' ? '❌' : '🎟️'}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: t.textMain }}>{booking.eventName || "Event Ticket"}</h4>
                                                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                                                    <p style={{ margin: 0, fontSize: "13px", color: t.textSub }}>ID: #{booking._id?.substring(0, 6).toUpperCase()}</p>
                                                    <span className="hide-mobile" style={{ fontSize: "12px", color: t.border }}>|</span>
                                                    <p style={{ margin: 0, fontSize: "13px", color: t.textSub }}>{booking.ticketCount} Seats • ₹{booking.totalPrice}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="booking-actions">
                                            <span style={{
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                textTransform: "uppercase",
                                                background: (booking.scanned || booking.status === 'Scanned' || booking.status === 'Confirmed' || booking.status === 'Paid') ? '#dcfce7' : booking.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                                                color: (booking.scanned || booking.status === 'Scanned' || booking.status === 'Confirmed' || booking.status === 'Paid') ? '#166534' : booking.status === 'Cancelled' ? '#991b1b' : '#92400e'
                                            }}>
                                                {(booking.scanned || booking.status === 'Scanned') ? 'Checked In' : booking.status}
                                            </span>
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                {booking.status !== 'Cancelled' && (
                                                    <button onClick={() => setViewTicketModal(booking)} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: 0 }}>View Ticket</button>
                                                )}
                                                {booking.status !== 'Cancelled' && (booking.meetingUrl || booking.eventType === "Online") && (
                                                    <a 
                                                        href={booking.meetingUrl || "#"} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        style={{ 
                                                            padding: "6px 14px", 
                                                            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", 
                                                            color: "#fff", 
                                                            borderRadius: "8px", 
                                                            fontSize: "12px", 
                                                            fontWeight: "700", 
                                                            textDecoration: "none",
                                                            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"
                                                        }}
                                                    >
                                                        Join Now
                                                    </a>
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
                        <h1 style={{ fontSize: "24px", fontWeight: "800", color: t.textMain, margin: "0 0 6px" }}>
                            {activeTab === "my_booking" ? "Ticket Bookings" : "Security"}
                        </h1>
                        <p style={{ fontSize: "14px", color: t.textSub, margin: 0 }}>
                            Manage your event experiences and account settings.
                        </p>
                    </div>
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
                        {(viewTicketModal.meetingUrl || viewTicketModal.eventType === "Online") && (
                            <a 
                                href={viewTicketModal.meetingUrl || "#"} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                    display: "block",
                                    marginTop: "20px",
                                    padding: "14px", 
                                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", 
                                    color: "#fff", 
                                    borderRadius: "12px", 
                                    fontSize: "14px", 
                                    fontWeight: "800", 
                                    textDecoration: "none",
                                    boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
                                    textAlign: "center"
                                }}
                            >
                                🎥 Join Meeting Now
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
