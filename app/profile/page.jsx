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
import DesktopDashboard from "@/components/DesktopDashboard";
import MobileDashboard from "@/components/MobileDashboard";
import MobileTicketView from "@/components/MobileTicketView";
import MobileInvoiceView from "@/components/MobileInvoiceView";
import { trackUserDevice, getDashboardPreferences, saveDashboardPreferences } from "@/lib/mobileTracking";

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
        
        // Track device and preferences in Supabase
        trackUserDevice(uid);
        getDashboardPreferences(uid).then(prefs => {
            if (prefs?.default_tab) {
                setActiveTab(prefs.default_tab);
            }
        });
        
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

    return (
        <div className="profile-page-container">
            <style>{`
                .profile-page-container {
                    min-height: 100vh;
                    background-color: ${t.bg};
                    font-family: 'Inter', sans-serif;
                    padding-top: 120px;
                    padding-bottom: 80px;
                }
                @media (min-width: 769px) {
                    .profile-content-wrap {
                        display: flex;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 0 24px;
                        gap: 32px;
                        align-items: flex-start;
                    }
                }
                @media (max-width: 768px) {
                    .profile-content-wrap {
                        display: none !important;
                    }
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
                @media (max-width: 768px) {
                    .profile-page-container {
                        padding-top: 70px;
                        padding-bottom: 120px;
                    }
                }
            `}</style>

            {/* Desktop View Dashboard */}
            <DesktopDashboard 
                user={user}
                bookings={bookings}
                activeTab={activeTab}
                setActiveTab={(tab) => {
                    setActiveTab(tab);
                    saveDashboardPreferences(user.id, { defaultTab: tab });
                }}
                bookingFilter={bookingFilter}
                setBookingFilter={setBookingFilter}
                setViewTicketModal={setViewTicketModal}
                setViewInvoiceModal={setViewInvoiceModal}
                wishlistEvents={wishlistEvents}
                logout={logout}
                router={router}
                t={t}
            />

            {/* Mobile View Dashboard */}
            <MobileDashboard 
                user={user}
                bookings={bookings}
                activeTab={activeTab}
                setActiveTab={(tab) => {
                    setActiveTab(tab);
                    saveDashboardPreferences(user.id, { defaultTab: tab });
                }}
                bookingFilter={bookingFilter}
                setBookingFilter={setBookingFilter}
                setViewTicketModal={setViewTicketModal}
                setViewInvoiceModal={setViewInvoiceModal}
                wishlistEvents={wishlistEvents}
                logout={logout}
                router={router}
                t={t}
            />

            {/* View Ticket Modal */}
            {viewTicketModal && (
                <>
                    {/* Desktop View Modal */}
                    <div className="hidden md:flex" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", zIndex: 11000, padding: "10px", paddingBottom: "20px", backdropFilter: "blur(12px)", overflowY: "auto" }} onClick={() => setViewTicketModal(null)}>
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

                    {/* Mobile View Modal */}
                    <MobileTicketView 
                        booking={viewTicketModal}
                        event={{
                            title: viewTicketModal.eventName || "Event Ticket",
                            img: viewTicketModal.eventImg || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
                            date: viewTicketModal.eventDate || "—",
                            time: viewTicketModal.eventTime || "—",
                            location: viewTicketModal.eventLocation || "Venue",
                            category: viewTicketModal.events?.category || "Event"
                        }}
                        ticket={null}
                        onClose={() => setViewTicketModal(null)}
                        branding={siteBranding}
                    />
                </>
            )}

            {/* View Invoice Modal */}
            {viewInvoiceModal && (
                <>
                    {/* Desktop View Modal */}
                    <div className="hidden md:flex" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", zIndex: 11000, padding: "20px", backdropFilter: "blur(12px)", overflowY: "auto" }} onClick={() => setViewInvoiceModal(null)}>
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
                                branding={siteBranding}
                            />
                        </div>
                    </div>

                    {/* Mobile View Modal */}
                    <MobileInvoiceView 
                        booking={viewInvoiceModal}
                        event={{
                            title: viewInvoiceModal.eventName || "Event Booking",
                            date: viewInvoiceModal.eventDate || "—",
                            location: viewInvoiceModal.eventLocation || "Venue"
                        }}
                        onClose={() => setViewInvoiceModal(null)}
                        branding={siteBranding}
                    />
                </>
            )}
        </div>
    );
}
