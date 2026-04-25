/* eslint-disable */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import GstPortal from "@/app/admin/components/GstPortal";
import { useAuth } from "@/components/AuthContext";
import AdminCheckoutFooter from "@/app/admin/components/AdminCheckoutFooter";
import MobileBannersAdmin from "@/app/admin/components/MobileBannersAdmin";
import AdminPartnerRequestsTable from "@/app/admin/components/AdminPartnerRequestsTable";
import BrandingHeader from "@/components/BrandingHeader";
import EmailCommSystem from "@/app/admin/components/EmailCommSystem";
import SeoAnalyticsAdmin from "@/app/admin/components/SeoAnalyticsAdmin";


import { MoreVertical, Briefcase, LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles, CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2, Mail, Lock, CreditCard, Code, Globe, Shield, FileText, Megaphone, Tag, LayoutGrid, Calendar, ShoppingCart, UserCircle, Gift, Send, BarChart3, Archive, MessageCircle, Upload, Edit, Search, AlertCircle, ChevronDown, ChevronRight, LogOut, Activity, RefreshCw, AlertTriangle, Info, Smartphone, MessageSquare } from "lucide-react";
import { HOME_EVENTS, HERO_BANNER_SLIDES } from "@/app/data/homeEvents";
import { eventMatchesCategory } from "@/app/utils/categoryMatch";
import { hashPassword } from "@/app/utils/hashPassword";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

const SERVICE_CATEGORIES = ["Mehendi Artist", "Mehandi Artist", "Photographer/Studio", "Makeup Artist", "Personal Service", "Artist"];
// Standardize icons
const NavIcon = ({ icon: Icon, size = 18, color }) => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '32px', 
        height: '32px', 
        borderRadius: '8px', 
        backgroundColor: color ? `${color}15` : 'transparent',
        color: color || 'inherit'
    }}>
        <Icon size={size} strokeWidth={2.5} />
    </div>
);

const useSupabaseConfig = (table, initialValue) => {
    const { key } = initialValue || {};
    const { data } = useSupabaseQuery(table, (q) => key ? q.eq('key', key) : q, [key]);
    const [updateConfig] = useSupabaseMutation(table, 'update', (q, p) => p.id ? q.eq('id', p.id) : (key ? q.eq('key', key) : q));

    const rawData = data && data[0] ? data[0] : initialValue;
    const config = (table === 'system_config' && rawData?.value) 
        ? { ...rawData, ...rawData.value } 
        : rawData;

    const setConfig = async (newValue) => {
        const payload = typeof newValue === 'function' ? newValue(config) : newValue;
        const isKeyValueTable = table === 'system_config';
        
        if (config.id || (isKeyValueTable && key)) {
            let updatePayload;
            if (isKeyValueTable) {
                const { id: _, key: __, value: ___, updated_at: ____, ...rest } = payload;
                updatePayload = { key, value: rest };
                if (config.id) updatePayload.id = config.id;
            } else {
                updatePayload = { ...payload };
                if (config.id) updatePayload.id = config.id;
            }
            
            Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);
            await updateConfig(updatePayload);
        } else {
            await supabase.from(table).insert(isKeyValueTable ? { key, value: payload } : payload);
        }
    };

    return [config, setConfig];
};


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: "50px", backgroundColor: "#fff0f0", color: "#d8000c" }}>
                    <h1>Something went wrong in the Admin Panel.</h1>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        <summary>Click for error details</summary>
                        <br />
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function AdminHomePageWrapper() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <ErrorBoundary>
            <AdminHomePage />
        </ErrorBoundary>
    );
}

const SubscribersTable = ({ t, theme }) => {
    const { data: subscribers = [], loading, error } = useSupabaseQuery('subscribers');
    const [removeSubscriber] = useSupabaseMutation('subscribers', 'delete', (q, p) => q.eq('id', p.id));
    const { showToast } = useToast();

    // Fallback if it takes too long or fails
    const [isStuck, setIsStuck] = useState(false);
    useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => setIsStuck(true), 10000);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    if (error) return <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>Error loading subscribers: {error.message}</div>;
    if (loading && !isStuck) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading subscribers...</div>;
    
    // Safely fallback if data is missing or empty
    const safeSubscribers = Array.isArray(subscribers) ? subscribers : [];
    if (safeSubscribers.length === 0) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No subscribers found.</div>;

    return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead>
                <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Email Address</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Subscribed At</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {subscribers.map((subs) => (
                    <tr key={subs.id} style={{ backgroundColor: theme === 'light' ? '#fff' : t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#ec489920", display: "flex", alignItems: "center", justifyContent: "center", color: "#ec4899" }}>
                                    <Mail size={16} />
                                </div>
                                <span style={{ fontWeight: 600, color: t.textMain }}>{subs.email}</span>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <span style={{ 
                                padding: "4px 10px", 
                                borderRadius: "100px", 
                                fontSize: "11px", 
                                fontWeight: 800, 
                                backgroundColor: subs.status === 'Active' ? "#22c55e20" : "#ef444420",
                                color: subs.status === 'Active' ? "#22c55e" : "#ef4444"
                            }}>
                                {(subs.status || 'Active').toUpperCase()}
                            </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div style={{ fontSize: "12px", color: t.textSub }}>{new Date(subs.created_at).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                            <button 
                                onClick={async () => { 
                                    try {
                                        await removeSubscriber({ id: subs.id }); 
                                        showToast("Subscriber removed", "success");
                                    } catch (err) {
                                        showToast("Error removing subscriber", "error");
                                    }
                                }}
                                style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: "#ef4444", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const AdminMeetingsTable = ({ t, router }) => {
    const { data: meetings = [], loading } = useSupabaseQuery('meetings', (q) => q.order('created_at', { ascending: false }));
    const [deleteMeeting] = useSupabaseMutation('meetings', 'delete', (q, p) => q.eq('id', p.id));
    const { showToast } = useToast();

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading meetings...</div>;
    if (meetings.length === 0) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No meetings scheduled on the platform.</div>;

    return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead>
                <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Meeting Details</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Organiser</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Created At</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {meetings.map((meeting) => (
                    <tr key={meeting.id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#3b82f620", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                                    <Video size={20} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>{meeting.title}</p>
                                    <p style={{ fontSize: "12px", color: t.textSub, margin: "2px 0 0" }}>ID: {meeting.meeting_link}</p>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: t.textMain }}>{meeting.creator_id ? meeting.creator_id.split('-')[0] : 'System'}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <span style={{ 
                                padding: "4px 10px", 
                                borderRadius: "100px", 
                                fontSize: "11px", 
                                fontWeight: 800, 
                                backgroundColor: (meeting.status === 'live' ? "#22c55e20" : "#3b82f620"),
                                color: (meeting.status === 'live' ? "#22c55e" : "#3b82f6")
                            }}>
                                {meeting.status.toUpperCase()}
                            </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div style={{ fontSize: "12px", color: t.textSub }}>{new Date(meeting.created_at).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button 
                                    onClick={() => {
                                        const url = meeting.meeting_link && meeting.meeting_link.startsWith("http") ? meeting.meeting_link : `/${meeting.meeting_link}`;
                                        window.open(url, '_blank');
                                    }}
                                    style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: "#3b82f6", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Join
                                </button>
                                <button 
                                    onClick={async () => { 
                                        try {
                                            await deleteMeeting({ id: meeting.id }); 
                                            showToast("Meeting deleted", "success");
                                        } catch (err) {
                                            showToast("Error deleting meeting", "error");
                                        }
                                    }}
                                    style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: "#ef4444", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const TurfsTable = ({ t, statusFilter = "all", setActiveTab }) => {
    const { data: turfs = [], loading } = useSupabaseQuery('turfs', (q) => q.order('created_at', { ascending: false }));
    const [updateTurf] = useSupabaseMutation('turfs', 'update', (q, p) => q.eq('id', p.id));
    const [deleteTurf] = useSupabaseMutation('turfs', 'delete', (q, p) => q.eq('id', p.id));

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading turfs...</div>;

    const filteredTurfs = turfs.filter(turf => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return turf.status === "active" || !turf.status;
        if (statusFilter === "banned") return turf.status === "banned";
        return true;
    });

    if (filteredTurfs.length === 0) return (
        <div style={{ padding: "60px 40px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "16px", border: "2px dashed #e2e8f0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#94a3b8", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                <ImageIcon size={32} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 800, color: t.textMain, marginBottom: "8px" }}>No facilities detected</p>
            <p style={{ fontSize: "13px", color: t.textSub, maxWidth: "300px", margin: "0 auto 20px", lineHeight: 1.6 }}>Approved partners must add their turf facilities in their vendor portal before they appear here.</p>
            <button 
                onClick={() => setActiveTab("turf_partners")}
                style={{ padding: "10px 20px", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0", color: "#3b82f6", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all" }}
            >
                View Approved Partners
            </button>
        </div>
    );

    return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead>
                <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Turf Identity</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Location / Venue</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Price Model</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Amenities</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredTurfs.map((turf) => (
                    <tr key={turf.id} style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {turf.images?.[0] ? (
                                    <img src={turf.images[0]} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                                        <ImageIcon size={20} />
                                    </div>
                                )}
                                <div>
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>{turf.name}</p>
                                    <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>ID: {turf.id.slice(0, 8)}</p>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: t.textMain }}>
                                <MapPin size={14} style={{ color: t.accent }} />
                                {turf.location || "On-field"}
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: t.textMain }}>
                                {turf.pricing_type === 'tiered' ? 'Tiered Pricing' : `₹${turf.flat_price || 0}/hr`}
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {(turf.amenities || []).slice(0, 2).map((am, i) => (
                                    <span key={i} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>{am}</span>
                                ))}
                                {turf.amenities?.length > 2 && <span style={{ fontSize: "10px", color: t.textSub }}>+{turf.amenities.length - 2}</span>}
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <span style={{ 
                                padding: "4px 10px", 
                                borderRadius: "100px", 
                                fontSize: "11px", 
                                fontWeight: 800, 
                                backgroundColor: turf.status === 'banned' ? "#ef444420" : "#22c55e20",
                                color: turf.status === 'banned' ? "#ef4444" : "#22c55e"
                            }}>
                                {(turf.status || 'ACTIVE').toUpperCase()}
                            </span>
                        </td>
                        <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {turf.status === 'banned' ? (
                                    <button 
                                        onClick={() => updateTurf({ id: turf.id, status: 'active' })}
                                        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "6px", borderRadius: "6px", cursor: "pointer" }}
                                        title="Activate Turf"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => updateTurf({ id: turf.id, status: 'banned' })}
                                        style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "6px", borderRadius: "6px", cursor: "pointer" }}
                                        title="Ban Turf"
                                    >
                                        <Ban size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => { if(confirm("Are you sure?")) deleteTurf({ id: turf.id }); }}
                                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px", borderRadius: "6px", cursor: "pointer" }}
                                    title="Delete Turf"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const TurfBookingsTable = ({ t }) => {
    const { data: bookings = [], loading } = useSupabaseQuery('turf_bookings', (q) => q.order('created_at', { ascending: false }));

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading turf bookings...</div>;
    if (bookings.length === 0) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No turf bookings found.</div>;

    return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead>
                <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Turf / Facility</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Customer</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Slot</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Finance</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                </tr>
            </thead>
            <tbody>
                {bookings.map((booking) => (
                    <tr key={booking.id} style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                            <div>
                                <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>{booking.turf_name}</p>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: "2px 0 0" }}>{booking.location}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div>
                                <p style={{ fontWeight: 600, margin: 0, fontSize: "13px", color: t.textMain }}>{booking.customer_details?.name}</p>
                                <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{booking.customer_details?.phone}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div>
                                <p style={{ fontWeight: 700, margin: 0, fontSize: "13px", color: t.textMain }}>{new Date(booking.date).toLocaleDateString()}</p>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>{booking.start_time} - {booking.end_time}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div>
                                <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>₹{booking.total_amount}</p>
                                <p style={{ fontSize: "10px", color: "#22c55e", fontWeight: 700, margin: "2px 0 0" }}>Rev: ₹{Number(booking.platform_revenue || 0).toFixed(2)}</p>
                                <p style={{ fontSize: "10px", color: "#3b82f6", fontWeight: 700, margin: 0 }}>GST: ₹{Number(booking.gst_amount || 0).toFixed(2)}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                            <span style={{ 
                                padding: "4px 10px", 
                                borderRadius: "100px", 
                                fontSize: "11px", 
                                fontWeight: 800, 
                                backgroundColor: booking.status === 'confirmed' ? "#22c55e20" : "#f59e0b20",
                                color: booking.status === 'confirmed' ? "#22c55e" : "#f59e0b"
                            }}>
                                {booking.status.toUpperCase()}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const PoolBookingsTable = ({ t }) => {
    const { data: bookings = [], loading, refetch } = useSupabaseQuery('pool_bookings', (q) => q.select('*, swimming_pools(name, city), profiles:user_id(full_name, phone)').order('created_at', { ascending: false }));
    const [updateStatus] = useSupabaseMutation('pool_bookings', 'update', (q, p) => q.eq('id', p.id));
    const { showToast } = useToast();

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading pool requests...</div>;
    if (bookings.length === 0) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No pool service requests found.</div>;

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateStatus({ id, status: newStatus });
            showToast(`Request ${newStatus.toLowerCase()} successfully`, "success");
            refetch();
        } catch (err) {
            showToast("Error updating status: " + err.message, "error");
        }
    };

    return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead>
                <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Pool Facility</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Customer</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Details</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Finance</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {bookings.map((booking) => (
                    <tr key={booking.id} style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                            <div>
                                <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>{booking.swimming_pools?.name}</p>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: "2px 0 0" }}>{booking.swimming_pools?.city}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div>
                                <p style={{ fontWeight: 600, margin: 0, fontSize: "13px", color: t.textMain }}>{booking.profiles?.full_name || 'User'}</p>
                                <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{booking.profiles?.phone}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div>
                                <p style={{ fontWeight: 700, margin: 0, fontSize: "13px", color: t.textMain }}>{new Date(booking.booking_date).toLocaleDateString()}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div>
                                <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>₹{Number(booking.price_paid || 0).toFixed(2)}</p>
                                <p style={{ fontSize: "10px", color: "#22c55e", fontWeight: 700, margin: "2px 0 0" }}>Rev: ₹{Number(booking.platform_revenue || 0).toFixed(2)}</p>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <span style={{ 
                                padding: "4px 10px", 
                                borderRadius: "100px", 
                                fontSize: "11px", 
                                fontWeight: 800, 
                                backgroundColor: booking.status === 'Approved' ? "#22c55e20" : (booking.status === 'Pending' ? "#f59e0b20" : "#ef444420"),
                                color: booking.status === 'Approved' ? "#22c55e" : (booking.status === 'Pending' ? "#f59e0b" : "#ef4444")
                            }}>
                                {booking.status.toUpperCase()}
                            </span>
                        </td>
                        <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {booking.status === 'Pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleStatusChange(booking.id, 'Approved')}
                                            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(booking.id, 'Rejected')}
                                            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {booking.status === 'Approved' && (
                                    <button 
                                        onClick={() => handleStatusChange(booking.id, 'Completed')}
                                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Mark Completed
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const MapPin = ({ size, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);


function AdminHomePage() {
    const { user, loading, logout } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || (user.role !== "admin" && user.role !== "super_admin"))) {
            router.push("/signin?redirect=/admin");
        }
    }, [user, loading, router]);

    const handleLogout = () => {
        logout();
    };
    const [activeTab, setActiveTab] = useState("dashboard");
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Auto-expand sidebar categories based on active tab
    useEffect(() => {
        const homeTabs = ["hero", "mobile_banners", "video_banner", "site_branding", "events_settings", "event_partners", "memories", "sections", "copyright", "meeting_settings", "maintenance"];
        const organizerTabs = ["all_org", "active_org", "kyc_verified", "kyc_pending", "banned_org"];
        const serviceTabs = ["all_turfs", "turf_bookings", "pool_bookings", "service_active", "service_banned"];
        const growthTabs = ["promotions", "send_notif", "comm_hub"];
        const settingTabs = ["api_settings", "payment_settings", "email_settings", "meta_management", "email_templates", "disclaimer_settings", "sso_settings", "ticket_settings", "comm_hub"];

        if (homeTabs.includes(activeTab)) setIsHomeSettingsOpen(true);
        if (organizerTabs.includes(activeTab)) setIsOrganizersOpen(true);
        if (serviceTabs.includes(activeTab)) setIsServicesOpen(true);
        if (growthTabs.includes(activeTab)) setIsGrowthOpen(true);
        if (settingTabs.includes(activeTab)) setIsSettingsOpen(true);
    }, [activeTab]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState("light");
    const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedRequestForApproval, setSelectedRequestForApproval] = useState(null);
    const [generatedTempPassword, setGeneratedTempPassword] = useState("");
    const [manualApprovalPassword, setManualApprovalPassword] = useState("");
    const [isHomeSettingsOpen, setIsHomeSettingsOpen] = useState(false);
    const [isOrganizersOpen, setIsOrganizersOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [isGrowthOpen, setIsGrowthOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [openRequestActionId, setOpenRequestActionId] = useState(null);
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [turfBookings, setTurfBookings] = useState([]);
    const [paymentGatewayConfig, setPaymentGatewayConfig] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [eventPartners, setEventPartners] = useState([]);
    const [partnerModal, setPartnerModal] = useState(null); // 'add' | 'edit'
    const [editingPartner, setEditingPartner] = useState(null);
    const [partnerForm, setPartnerForm] = useState({ name: "", logo: "", url: "" });
    const [videoBannerConfig, setVideoBannerConfig] = useSupabaseConfig("system_config", {
        key: 'admin_video_banner',
        videoUrl: "/bookmyticket/videoplayback.mp4",
        title1: "Discover Your Next",
        title2: "Unforgettable Experience",
        subtitle: "Explore concerts, shows, nightlife, and exclusive experiences happening around you.",
    });

    const [maintenanceConfig, setMaintenanceConfig] = useSupabaseConfig("system_config", {
        key: 'maintenance_mode',
        maintenance_mode: false,
        maintenance_message: "We're upgrading your experience. Please check back soon!"
    });

    const [seoAnalyticsConfig, setSeoAnalyticsConfig] = useSupabaseConfig("system_config", {
        key: 'seo_analytics',
        ga_id: "G-XXXXXXXXXX",
        ga_enabled: false,
        city_seo_overrides: {},
        backlink_tracking: [],
        sitemap_last_ping: null
    });


    const { data: rawPaymentGateways = [], loading: gatewaysLoading } = useSupabaseQuery('payment_gateways', q => q, [], { realtime: false });
    const [addPaymentGateway] = useSupabaseMutation('payment_gateways', 'insert');
    const [patchPaymentGateway] = useSupabaseMutation('payment_gateways', 'update', (q, p) => q.eq('id', p.id));
    const [removePaymentGateway] = useSupabaseMutation('payment_gateways', 'delete', (q, p) => q.eq('id', p.id));

    // Sync turf bookings from Supabase
    const { data: turfBookingsArr = [] } = useSupabaseQuery('turf_bookings', q => q, [], { realtime: false });
    useEffect(() => {
        if (turfBookingsArr.length > 0) {
            setTurfBookings(turfBookingsArr);
        }
    }, [turfBookingsArr]);

    // Seed default gateways if empty
    useEffect(() => {
        if (!gatewaysLoading && rawPaymentGateways.length === 0) {
            const defaults = [
                { name: "Stripe", is_enabled: true, config: { apiKey: "", secret_key: "", webhook_secret: "", mode: "test" }, test_mode: true },
                { name: "PayPal", is_enabled: false, config: { apiKey: "", secret_key: "", mode: "test" }, test_mode: true },
                { name: "Razorpay", is_enabled: false, config: { apiKey: "", secret_key: "", mode: "test" }, test_mode: true },
                { name: "PayU", is_enabled: false, config: { apiKey: "", secret_key: "", mode: "test" }, test_mode: true },
                { name: "PhonePe", is_enabled: false, config: { apiKey: "", secret_key: "", mode: "test" }, test_mode: true },
                { name: "Paytm", is_enabled: false, config: { apiKey: "", secret_key: "", mode: "test" }, test_mode: true }
            ];
            defaults.forEach(d => addPaymentGateway(d).catch(e => console.log('Gateway seed skipped:', e.message)));
        }
    }, [rawPaymentGateways, gatewaysLoading]);

    // Fee Settings
    const { data: feeSettingsArr = [] } = useSupabaseQuery('fee_settings', q => q, [], { realtime: false });
    const [updateFeeSettings] = useSupabaseMutation('fee_settings', 'update', (q, p) => q.eq('id', p.id));

    const [localFeeSettings, setLocalFeeSettings] = useState({
        convenience_fee_type: "percent",
        convenience_fee_value: 5,
        gst_percent: 18
    });
    const [isSavingFees, setIsSavingFees] = useState(false);

    useEffect(() => {
        if (feeSettingsArr?.[0]) {
            setLocalFeeSettings(feeSettingsArr[0]);
        }
    }, [feeSettingsArr]);

    const handleSaveFees = async () => {
        setIsSavingFees(true);
        try {
            if (localFeeSettings.id) {
                await updateFeeSettings(localFeeSettings);
            } else {
                await supabase.from('fee_settings').insert(localFeeSettings);
            }
            showToast("Settings updated successfully!", "success");
        } catch (err) {
            showToast("Error: " + err.message, "error");
        } finally {
            setIsSavingFees(false);
        }
    };

    // Supabase settings definitions
    const { data: ticketSettingsArr = [] } = useSupabaseQuery('ticket_settings', q => q, [], { realtime: false });
    const [updateTicketSettings] = useSupabaseMutation('ticket_settings', 'update', (q, p) => q.eq('id', p.id));

    const { data: emailSettingsArr = [] } = useSupabaseQuery('email_settings', q => q, [], { realtime: false });
    const [updateEmailSettings] = useSupabaseMutation('email_settings', 'update', (q, p) => q.eq('id', p.id));

    const { data: seoSettingsArr = [] } = useSupabaseQuery('seo_settings', q => q, [], { realtime: false });
    const [updateSeoSettings] = useSupabaseMutation('seo_settings', 'update', (q, p) => q.eq('id', p.id));

    const { data: emailTemplates = [] } = useSupabaseQuery('email_templates', q => q, [], { realtime: false });
    const [addEmailTemplate] = useSupabaseMutation('email_templates', 'upsert');
    const [patchEmailTemplate] = useSupabaseMutation('email_templates', 'update', (q, p) => q.eq('id', p.id));
    const [removeEmailTemplate] = useSupabaseMutation('email_templates', 'delete', (q, p) => q.eq('id', p.id));

    // Seed default email templates if empty
    useEffect(() => {
        if (emailTemplates !== undefined && emailTemplates.length === 0) {
            const defaults = [
                { identifier: "booking", name: "Ticket Booking Confirmation", subject: "Your Tickets for {{event_name}}", body: "Hello {{user_name}},\n\nYour tickets for {{event_name}} are confirmed.\n\nDate: {{event_date}}\nVenue: {{event_venue}}\n\nDownload your ticket here: {{ticket_url}}\n\nThank you for booking with us!", auto_send: true },
                { identifier: "canceled", name: "Ticket Booking Canceled", subject: "Booking Canceled: {{event_name}}", body: "Hello {{user_name}},\n\nYour booking for {{event_name}} has been canceled.\n\nRefund details: {{refund_info}}\n\nWe hope to see you again soon.", auto_send: true },
                { identifier: "registration", name: "User Registration", subject: "Welcome to BookMyTicket!", body: "Welcome to BookMyTicket!\n\nYour account has been successfully created.\n\nStart exploring events here: {{site_url}}", auto_send: true },
                { identifier: "otp", name: "OTP Verification", subject: "{{otp}} is your verification code", body: "Your verification code is: {{otp}}\n\nDo not share this code with anyone.", auto_send: true },
            ];
            defaults.forEach(d => addEmailTemplate(d, { onConflict: 'identifier' }));
        }
    }, [emailTemplates]);

    const { data: commSettingsArr = [], refresh: refreshComm } = useSupabaseQuery('communicationSettings');
    const [updateCommSetting] = useSupabaseMutation('communicationSettings', 'update', (q, p) => q.eq('key', p.key));
    const [localCommSettings, setLocalCommSettings] = useState([]);

    useEffect(() => {
        if (commSettingsArr && commSettingsArr.length > 0) {
            setLocalCommSettings(JSON.parse(JSON.stringify(commSettingsArr)));
        }
    }, [commSettingsArr]);

    const handleSaveComm = async () => {
        try {
            for (const setting of localCommSettings) {
                await updateCommSetting({ key: setting.key, value: setting.value });
            }
            showToast("Communication settings updated!", "success");
            refreshComm();
        } catch (err) {
            showToast("Failed to save settings: " + err.message, "error");
        }
    };

    const updateLocalSetting = (key, field, val) => {
        setLocalCommSettings(prev => prev.map(s => s.key === key ? { ...s, value: { ...s.value, [field]: val } } : s));
    };

    const { data: policiesArr = [] } = useSupabaseQuery('policies', q => q, [], { realtime: false });
    const [updatePolicies] = useSupabaseMutation('policies', 'update', (q, p) => q.eq('id', p.id));

    const { data: ssoSettingsArr = [] } = useSupabaseQuery('sso_settings', q => q, [], { realtime: true });
    const [updateSsoSettings] = useSupabaseMutation('sso_settings', 'upsert');

    const { data: homeCategoriesArr = [] } = useSupabaseQuery('categories');
    const [addCategory] = useSupabaseMutation('categories', 'insert');
    const [patchCategory] = useSupabaseMutation('categories', 'update', (q, p) => q.eq('id', p.id));
    const [removeCategory] = useSupabaseMutation('categories', 'delete', (q, p) => q.eq('id', p.id));

    const { data: homePartnersArr = [] } = useSupabaseQuery('home_partners');
    const [addEventPartner] = useSupabaseMutation('home_partners', 'insert');
    const [patchEventPartner] = useSupabaseMutation('home_partners', 'update', (q, p) => q.eq('id', p.id));
    const [removeEventPartner] = useSupabaseMutation('home_partners', 'delete', (q, p) => q.eq('id', p.id));

    const { data: homeSlidesArr = [] } = useSupabaseQuery('home_slides', q => q, [], { realtime: false });
    const [addBannerSlide] = useSupabaseMutation('home_slides', 'insert');
    const [updateBannerSlide] = useSupabaseMutation('home_slides', 'update', (q, p) => q.eq('id', p.id));
    const [removeBannerSlide] = useSupabaseMutation('home_slides', 'delete', (q, p) => q.eq('id', p.id));

    // Pages management
    const { data: pages = [] } = useSupabaseQuery('pages', q => q, [], { realtime: false });
    const [createPage] = useSupabaseMutation('pages', 'insert');
    const [updatePage] = useSupabaseMutation('pages', 'update', (q, p) => q.eq('id', p.id));
    const [deletePage] = useSupabaseMutation('pages', 'delete', (q, p) => q.eq('id', p.id));

    // Recent Memories management
    const { data: memories = [] } = useSupabaseQuery('memories');
    const [createMemory] = useSupabaseMutation('memories', 'insert');
    const [updateMemory] = useSupabaseMutation('memories', 'update', (q, p) => q.eq('id', p.id));
    const [deleteMemory] = useSupabaseMutation('memories', 'delete', (q, p) => q.eq('id', p.id));

    // Consolidated remaining queries
    const { data: bannerRequests = [] } = useSupabaseQuery('banners', (q) => q.eq('status', 'Pending'));
    const { data: allBanners = [] } = useSupabaseQuery('banners');
    const { data: allBrandingKYC = [] } = useSupabaseQuery('brand_kyc');
    const [verifyKYCMutation] = useSupabaseMutation('brand_kyc', 'update', (q, p) => q.eq('id', p.id));
    const { data: siteBrandingArr = [] } = useSupabaseQuery('site_branding', q => q, [], { realtime: false });
    const { data: promotionsArr = [] } = useSupabaseQuery('promotions');
    
    // Structured User Management: Fetch from role-specific tables
    const { data: vendorsOnly = [], refresh: refreshVendors } = useSupabaseQuery('organisers');
    
    // Merge for backward compatibility in Admin Panel
    const organisersArr = useMemo(() => {
        return vendorsOnly;
    }, [vendorsOnly]);


    const { data: serviceProvidersArr = [] } = useSupabaseQuery('vendors', (q) => q.select('*, profiles:id(email)'));
    const { data: homeSectionsArr = [] } = useSupabaseQuery('home_sections');
    const { data: supportTicketsArr = [] } = useSupabaseQuery('support_tickets');
    const { data: usersArr = [] } = useSupabaseQuery('profiles');
    const { data: adminsArr = [] } = useSupabaseQuery('admins', q => q.select('*, profiles:id (full_name, email, username)'));
    const { data: allAdPopups = [] } = useSupabaseQuery('ad_popups', q => q.order('sort_order', { ascending: true }), [], { realtime: false });
    const { data: eventsArr = [] } = useSupabaseQuery('events', (q) => q.order('created_at', { ascending: false }));
    const { data: bookingsArr = [] } = useSupabaseQuery('bookings');
    const { data: apiKeysArr = [] } = useSupabaseQuery('api_keys', q => q, [], { realtime: false });
    const [editingMemoryObj, setEditingMemoryObj] = useState(null);
    const [memoryForm, setMemoryForm] = useState({ imageUrl: "", altText: "" });
    const [isUploading, setIsUploading] = useState(false);

    // Banner Ads management
    const [approveBanner] = useSupabaseMutation('banners', 'update', (q, p) => q.eq('id', p.id));
    const [deleteBanner] = useSupabaseMutation('banners', 'delete', (q, p) => q.eq('id', p.id));
    const [approvingBanner, setApprovingBanner] = useState(null);
    const [bannerImage, setBannerImage] = useState("");

    const handleUploadMemory = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `memory-${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('branding')
                .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName);

            setMemoryForm({ ...memoryForm, imageUrl: publicUrl });
            showToast("Image uploaded successfully!", "success");
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Upload failed: " + err.message, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveMemory = async () => {
        if (!memoryForm.imageUrl || !memoryForm.altText) {
            showToast("Please provide both an image and alt text.", "error");
            return;
        }
        try {
            if (editingMemoryObj) {
                await updateMemory({
                    id: editingMemoryObj.id,
                    image_url: memoryForm.imageUrl,
                    alt_text: memoryForm.altText,
                });
                showToast("Memory updated successfully", "success");
            } else {
                await createMemory({
                    image_url: memoryForm.imageUrl,
                    alt_text: memoryForm.altText,
                });
                showToast("Memory created successfully", "success");
            }
            setMemoryForm({ imageUrl: "", altText: "" });
            setEditingMemoryObj(null);
        } catch (err) {
            showToast("Error saving memory: " + err.message, "error");
        }
    };

    const handleDeleteMemory = async (id) => {
        try {
            await deleteMemory({ id });
            showToast("Memory deleted successfully", "success");
        } catch (err) {
            showToast("Failed to delete memory", "error");
        }
    };

    // Seed defaults logic (simplified for Supabase as most seeding is done via script)
    useEffect(() => {
        // This is a safety check. If the basic tables are empty, we could trigger initialization.
        // For now, we assume Supabase is seeded.
    }, []);

    // Fallback settings for stable UI
    const ticketSettings = useMemo(() => ticketSettingsArr[0] || {
        companyName: "book my ticket",
        logo_url: "",
        important_info: "",
        support_url: "",
        send_via_email: true,
        send_via_sms: true,
        send_pdf_whatsapp: true,
        auto_approve: true,
        notify_organiser: true,
        notify_user: true,
        invoice_prefix: "BMT-"
    }, [ticketSettingsArr]);

    const emailSettings = useMemo(() => emailSettingsArr[0] || {
        host: "smtp.mailtrap.io",
        port: 2525,
        user: "api",
        pass: "",
        from: "noreply@bookmyticket.com",
        from_name: "Ticketing Tool",
        encryption: "None",
        auth_method: "Basic Authentication"
    }, [emailSettingsArr]);

    // Site Branding
    const [updateSiteBranding] = useSupabaseMutation('site_branding', 'update', (q, p) => q.eq('id', p.id));

    const siteBranding = useMemo(() => siteBrandingArr[0] || {
        name: "book my ticket",
        logo_color: "#111111",
        logo_url: "/logo.png"
    }, [siteBrandingArr]);

    const [localBranding, setLocalBranding] = useState({ 
        name: "book my ticket", 
        logo_color: "#111111", 
        logo_url: "/logo.png",
        site_url: "https://www.bookmyticket.net",
        powered_by_logo_url: "",
        powered_by_link: ""
    });

    useEffect(() => {
        if (siteBrandingArr[0]) {
            setLocalBranding(siteBrandingArr[0]);
        }
    }, [siteBrandingArr]);

    const metaSettings = useMemo(() => ({
        global: {
            title: seoSettingsArr[0]?.global_title || "BookMyTicket - Best Event Ticketing Platform",
            keywords: seoSettingsArr[0]?.global_keywords || "tickets, events, concerts, sports, theater",
            description: seoSettingsArr[0]?.global_description || "Book tickets for your favorite events, concerts, movies and more.",
            meta_ads_code: seoSettingsArr[0]?.meta_ads_code || ""
        }
    }), [seoSettingsArr]);

    const disclaimerContent = useMemo(() => ({
        booking_header: policiesArr[0]?.booking_header || "",
        payment_terms: policiesArr[0]?.payment_terms || "",
        event_disclaimer: policiesArr[0]?.event_disclaimer || "",
        cancellation_policy: policiesArr[0]?.cancellation_policy || ""
    }), [policiesArr]);

    const ssoConfigs = useMemo(() => ({
        facebook: !!ssoSettingsArr[0]?.facebook_enabled,
        google: !!ssoSettingsArr[0]?.google_enabled,
        facebookConfig: ssoSettingsArr[0]?.facebook_config || {},
        googleConfig: ssoSettingsArr[0]?.google_config || {}
    }), [ssoSettingsArr]);

    const handleBrandingUpload = async (file, type) => {
        if (!file) return;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}-${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('branding')
                .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName);

            if (type === 'logo') {
                setLocalBranding(prev => ({ ...prev, logo_url: publicUrl }));
            } else {
                setLocalBranding(prev => ({ ...prev, powered_by_logo_url: publicUrl }));
            }
            showToast(`${type === 'logo' ? 'Site logo' : 'Powered By logo'} uploaded successfully!`, "success");
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Upload failed: " + err.message, "error");
        }
    };

    useEffect(() => {
        if (activeTemplate) {
            setEditingTemplate({ ...activeTemplate });
        } else {
            setEditingTemplate(null);
        }
    }, [activeTemplate]);
    const [pageForm, setPageForm] = useState({ title: "", slug: "", content: "", showInFooter: true, order: 0 });
    const [pageModal, setPageModal] = useState(null); // 'create' | 'edit'
    const [pageToDelete, setPageToDelete] = useState(null);

    const handleSavePage = async () => {
        try {
            if (pageModal === "create") {
                await createPage({ ...pageForm, order: pages.length });
            } else if (pageModal === "edit" && pageForm.id) {
                await updatePage(pageForm);
            }
            setPageModal(null);
            setPageForm({ title: "", slug: "", content: "", showInFooter: true, order: 0 });
        } catch (e) {
            showToast("Error saving page: " + e.message, "error");
        }
    };

    const handleDeletePage = async (id) => {
        try {
            await deletePage({ id });
            setPageToDelete(null);
            showToast("Page deleted successfully", "success");
        } catch(e) {
            showToast("Error deleting page", "error");
        }
    };


    const [footerCopyrightConfig, setFooterCopyrightConfig] = useSupabaseConfig("system_config", {
        key: 'admin_footer_copyright',
        copyrightText: "© Copyright 2026 – Nexvant Technologies. All Rights Reserved.",
        privacyUrl: "#",
        termsUrl: "#"
    });
    
    const [internalMeetingEnabled, setInternalMeetingEnabled] = useSupabaseConfig("system_config", {
        key: 'internal_meeting_portal_enabled',
        value: true
    });

    // Bookings (ticket orders) — sync with homepage/organiser events
    const [createPromotion] = useSupabaseMutation('promotions', 'insert');
    const [removePromotion] = useSupabaseMutation('promotions', 'delete', (q, p) => q.eq('id', p.id));
    const [newPromo, setNewPromo] = useState({ code: "", type: "percent", value: "", validUntil: "", bogo: false });

    const handleCreatePromotion = async () => {
        if (!newPromo.code) return;
        await createPromotion({
            code: newPromo.code,
            type: newPromo.type,
            value: newPromo.value || "10",
            bogo: newPromo.bogo,
            valid_until: newPromo.validUntil || "2026-12-31",
            usage: 0,
            active: true,
        });
        setNewPromo({ code: "", type: "percent", value: "", validUntil: "", bogo: false });
    };

    // Archive: hide events from main list
    const [archivedHomeIds, setArchivedHomeIds] = useSupabaseConfig("system_config", { key: 'admin_archived_home_ids', value: [] });
    const [eventMetaOverrides, setEventMetaOverrides] = useSupabaseConfig("system_config", { key: 'admin_event_meta_overrides', value: {} });

    const [organizers, setOrganizers] = useState([]);
    const [createOrganizer] = useSupabaseMutation('organisers', 'insert');
    const [patchOrganizerMutation] = useSupabaseMutation('organisers', 'update', (q, p) => q.eq('id', p.id));
    const [removeOrganizerMutation] = useSupabaseMutation('organisers', 'delete', (q, p) => q.eq('id', p.id));
    const [patchServiceProviderMutation] = useSupabaseMutation('service_providers', 'update', (q, p) => q.eq('id', p.id));
    const [removeServiceProviderMutation] = useSupabaseMutation('service_providers', 'delete', (q, p) => q.eq('id', p.id));
    const [selectedKycOrg, setSelectedKycOrg] = useState(null);
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");
    const isProfService = (cat) => {
        const c = String(cat || "").trim().toLowerCase();
        const serviceKeywords = ["mehandi", "mehendi", "photograph", "makeup", "artist", "personal service", "studio", "decorator", "catering", "turf"];
        return serviceKeywords.some(keyword => c.includes(keyword));
    };

    const mappedOrganizers = useMemo(() => {
        return organisersArr
            .filter(o => o.type !== "professional_service")
            .map(o => ({
                id: o.id,
                username: o.business_name || o.name || "Unnamed Organiser",
                email: o.kyc_details?.email || o.user_id || o.id,
                status: o.kyc_status || "NOT STARTED",
                category: o.category || o.kyc_details?.category || "Event Organiser",
                balance: `₹${(o.wallet_balance || 0).toFixed(2)}`,
                kycDetails: o.kyc_details,
                kyc_status: o.kyc_status || "NOT STARTED"
            }));
    }, [organisersArr]);

    // Redundant serviceKyc memos removed as per simplified workflow.


    const organiserKycVerified = useMemo(() => {
        return organisersArr.filter(o => o.type !== "professional_service" && o.kyc_status === "Submitted");
    }, [organisersArr]);

    const [approveOrganiserRequest] = useSupabaseMutation('organiser_details', 'update', (q, p) => q.eq('id', p.id));



    const serviceActive = useMemo(() => {
        let filtered = serviceProvidersArr.filter(o => 
            (o.kyc_status === "Active" || 
            o.kyc_status === "Not Required" || 
            o.kyc_status === "KYC Completed" ||
            o.kyc_status === "Approved" ||
            o.is_approved === true) &&
            !organisersArr.some(org => org.id === o.id)
        );
        if (serviceCategoryFilter !== "all") {
            filtered = filtered.filter(o => (o.category || o.kyc_details?.category) === serviceCategoryFilter);
        }
        return filtered;
    }, [serviceProvidersArr, serviceCategoryFilter]);

    const turfPartners = useMemo(() => {
        return serviceProvidersArr.filter(o => 
            (o.category === "Turf Partner" || (o.kyc_details?.category === "Turf Partner")) &&
            (o.kyc_status === "Active" || o.kyc_status === "Approved" || o.is_approved === true)
        );
    }, [serviceProvidersArr]);

    const serviceBanned = useMemo(() => {
        let filtered = serviceProvidersArr.filter(o => 
            o.kyc_status === "Banned" && 
            !organisersArr.some(org => org.id === o.id)
        );
        if (serviceCategoryFilter !== "all") {
            filtered = filtered.filter(o => (o.category || o.kyc_details?.category) === serviceCategoryFilter);
        }
        return filtered;
    }, [serviceProvidersArr, serviceCategoryFilter]);


    // Home Settings
    const [updateHomeSections] = useSupabaseMutation('home_sections', 'update', (q, p) => q.eq('id', p.id));
    const homeSectionsOrder = useMemo(() => homeSectionsArr[0]?.order || [
        "Hero Banner", "Sub Navigation", "Featured Events", "Coming Soon", "Spotlight", "Top Hand-picked"
    ], [homeSectionsArr]);
    
    const [slides, setSlides] = useState([]);
    useEffect(() => {
        if (homeSlidesArr.length > 0) {
            setSlides(homeSlidesArr);
        } else if (slides.length === 0) {
            setSlides(HERO_BANNER_SLIDES.map((s, i) => ({ id: s.id ?? i + 1, img: s.img || "", title: s.title || "", sub: s.sub || "", alt: s.title || `Slide ${i + 1}`, url: s.link || "" })));
        }
    }, [homeSlidesArr]);

    const [categoryModal, setCategoryModal] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", icon: "📁" });
    const [updateTicket] = useSupabaseMutation('support_tickets', 'update', (q, p) => q.eq('id', p.id));
    const [removeTicket] = useSupabaseMutation('support_tickets', 'delete', (q, p) => q.eq('id', p.id));

    const mappedSupportTickets = useMemo(() => {
        return supportTicketsArr.map(t => ({
            id: t.id,
            subject: (t.issue || "").split('\n')[0],
            status: t.status,
            createdAt: t.created_at,
            adminNotes: t.admin_notes || "",
            updatedAt: t.updated_at,
            organiserName: t.user_id,
        }));
    }, [supportTicketsArr]);


    // Combined events: homepage + organiser (Admin + Home integration); exclude archived
    const allEvents = useMemo(() => {
        const organiserList = (Array.isArray(eventsArr) ? eventsArr : []).filter(e => !e.archived);
        const homeList = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).filter(e => !archivedHomeIds.includes(e.id));
        return [
            ...homeList.map(e => ({ ...e, source: "home" })),
            ...organiserList.map((e, index) => ({
                ...e,
                id: e.id || `temp-${index}`,
                title: e.title || "Event",
                category: e.category || "Others",
                type: e.type || "Paid",
                source: "organiser"
            }))
        ];
    }, [eventsArr, archivedHomeIds]);

    const [updateEvent] = useSupabaseMutation('events', 'update', (q, p) => q.eq('id', p.id));
    const [deleteEvent] = useSupabaseMutation('events', 'delete', (q, p) => q.eq('id', p.id));
    const [createAdmin] = useSupabaseMutation('admins', 'insert');
    const [updateAdminStatus] = useSupabaseMutation('admins', 'update', (q, p) => q.eq('id', p.id));
    const [deleteAdmin] = useSupabaseMutation('admins', 'delete', (q, p) => q.eq('id', p.id));

    const dashboardStats = useMemo(() => {
        return {
            totalRevenue: bookingsArr.reduce((acc, b) => acc + (b.total_amount || 0), 0),
            totalEvents: eventsArr.length,
            totalTickets: bookingsArr.length, // Simplified
            totalUsers: usersArr.length,
            totalOrganisers: organisersArr.length,
            totalServiceProviders: serviceProvidersArr.length,
            totalBookings: bookingsArr.length,
        };
    }, [bookingsArr, eventsArr, usersArr, organisersArr, serviceProvidersArr]);

    // Ad Popups
    const [createAdPopup] = useSupabaseMutation('ad_popups', 'insert');
    const [updateAdPopup] = useSupabaseMutation('ad_popups', 'update', (q, p) => q.eq('id', p.id));
    const [toggleAdPopup] = useSupabaseMutation('ad_popups', 'update', (q, p) => q.eq('id', p.id));
    const [deleteAdPopup] = useSupabaseMutation('ad_popups', 'delete', (q, p) => q.eq('id', p.id));
    
    const [adPopupForm, setAdPopupForm] = useState({
        title: "", description: "", imageUrl: "",
        redirectUrl: "", redirectType: "url", redirectId: "", 
        ctaText: "Book Now",
        bgColor: "", badgeText: "",
        isActive: true, showEveryMinutes: 30,
        sortOrder: 0
    });
    const [adPopupEditingId, setAdPopupEditingId] = useState(null);
    const [adPopupImageFile, setAdPopupImageFile] = useState(null);
    const [adPopupSaving, setAdPopupSaving] = useState(false);
    const [showAdPopupForm, setShowAdPopupForm] = useState(false);

    const handleSaveAdPopup = async () => {
        if (!adPopupForm.title) { showToast("Title is required", "error"); return; }
        setAdPopupSaving(true);
        try {
            let finalImageUrl = adPopupForm.imageUrl;
            // File upload logic to Supabase storage would go here
            // For now, assume imageUrl is provided or handled elsewhere
            
            const payload = {
                title: adPopupForm.title,
                description: adPopupForm.description,
                image_url: finalImageUrl,
                redirect_url: adPopupForm.redirectUrl,
                redirect_type: adPopupForm.redirectType,
                redirect_id: adPopupForm.redirectId,
                cta_text: adPopupForm.ctaText,
                bg_color: adPopupForm.bgColor,
                badge_text: adPopupForm.badgeText,
                is_active: adPopupForm.isActive,
                show_every_minutes: adPopupForm.showEveryMinutes,
                sort_order: adPopupForm.sortOrder
            };

            if (adPopupEditingId) {
                await updateAdPopup({ id: adPopupEditingId, ...payload });
            } else {
                await createAdPopup(payload);
            }
            
            setAdPopupForm({ title: "", description: "", imageUrl: "", redirectUrl: "", redirectType: "url", redirectId: "", ctaText: "Book Now", bgColor: "", badgeText: "", isActive: true, showEveryMinutes: 30, sortOrder: 0 });
            setAdPopupEditingId(null);
            setAdPopupImageFile(null);
            setShowAdPopupForm(false);
            showToast("Popup saved successfully", "success");
        } catch(e) { showToast("Error saving popup", "error"); }
        finally { setAdPopupSaving(false); }
    };

    const handleEditAdPopup = (popup) => {
        setAdPopupForm({
            title: popup.title || "", description: popup.description || "",
            imageUrl: popup.image_url || "",
            redirectUrl: popup.redirect_url || "", 
            redirectType: popup.redirect_type || "url",
            redirectId: popup.redirect_id || "",
            ctaText: popup.cta_text || "",
            bgColor: popup.bg_color || "", badgeText: popup.badge_text || "",
            isActive: popup.is_active, show_every_minutes: popup.show_every_minutes || 30,
            sortOrder: popup.sort_order || 0
        });
        setAdPopupEditingId(popup.id);
        setAdPopupImageFile(null);
        setShowAdPopupForm(true);
    };

    const handleDeleteAdPopup = async (id) => {
        try {
            await deleteAdPopup({ id });
            showToast("Popup deleted", "info");
        } catch(e) {
            showToast("Error deleting popup", "error");
        }
    };

    const [adminModal, setAdminModal] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ fullName: '', username: '', email: '', password: '', role: 'Admin' });

    // Premium Branding Banners Pricing
    const [brandingPricingConfig, setBrandingPricingConfig] = useSupabaseConfig("system_config", {
        key: 'branding_pricing',
        monthlyPrice: 999,
        yearlyPrice: 9999
    });
    const [brandingPricing, setBrandingPricing] = useState({ monthlyPrice: 999, yearlyPrice: 9999 });

    // Sync Pricing Config
    useEffect(() => {
        if (brandingPricingConfig) {
            setBrandingPricing(prev => {
                if (prev.monthlyPrice === brandingPricingConfig.monthlyPrice && 
                    prev.yearlyPrice === brandingPricingConfig.yearlyPrice) {
                    return prev;
                }
                return { ...brandingPricingConfig };
            });
        }
    }, [brandingPricingConfig]);

    // Auto-expire events on Admin Login/Load
    useEffect(() => {
        const triggerAutoExpire = async () => {
            try {
                // Call the Postgres RPC function we created in the migration
                await supabase.rpc('run_auto_expire');
                console.log('[Admin] Event expiration check completed');
            } catch (err) {
                console.warn('[Admin] Auto-expire trigger warning (expected if migration not yet applied):', err.message);
            }
        };
        triggerAutoExpire();
    }, []);

    const handleSaveBrandingPricing = async () => {
        try {
            await setBrandingPricingConfig(brandingPricing);
            showToast("Premium Banner Pricing updated successfully!", "success");
        } catch (e) {
            showToast("Error updating pricing", "error");
        }
    };

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "categories") setActiveTab("categories");
    }, [searchParams]);

    // Sync events from Supabase
    useEffect(() => {
        if (eventsArr.length > 0) {
            setEvents(eventsArr.map(e => ({ ...e, source: "organiser" })));
        }
    }, [eventsArr]);

    // Sync bookings from Supabase
    useEffect(() => {
        if (bookingsArr.length > 0) {
            setBookings(bookingsArr);
        }
    }, [bookingsArr]);



    const [newOrg, setNewOrg] = useState({ username: "", password: "", email: "" });
    const [notificationForm, setNotificationForm] = useState({ subject: "", message: "", target: "all" });
    const [openActionDropdown, setOpenActionDropdown] = useState(null);

    // Email Settings Redesign States
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const [isValidatingM365, setIsValidatingM365] = useState(false);
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
    const [testEmailRecipient, setTestEmailRecipient] = useState("");


    const [createApiKey] = useSupabaseMutation('api_keys', 'insert');
    const [toggleApiKeyStatus] = useSupabaseMutation('api_keys', 'update', (q, p) => q.eq('id', p.id));
    const [removeApiKey] = useSupabaseMutation('api_keys', 'delete', (q, p) => q.eq('id', p.id));

    // Sync categories from Supabase
    useEffect(() => {
        if (homeCategoriesArr.length > 0) {
            setCategories(homeCategoriesArr);
        }
    }, [homeCategoriesArr]);

    const handleSaveCategory = async () => {
        const name = (categoryForm.name || "").trim();
        const slug = (categoryForm.slug || name.toLowerCase().replace(/\s+/g, "-")).trim();
        if (!name) return;

        try {
            if (categoryModal === "add") {
                await addCategory({
                    name,
                    slug,
                    icon: categoryForm.icon || "📁",
                    count: 0,
                    order: (homeCategoriesArr?.length || 0) + 1
                });
                showToast("Category added", "success");
            } else if (categoryModal === "edit" && editingCategory) {
                await patchCategory({
                    id: editingCategory.id,
                    name,
                    slug,
                    icon: categoryForm.icon || "📁"
                });
                showToast("Category updated", "success");
            }
            closeCategoryModal();
        } catch (err) {
            showToast("Error saving category: " + err.message, "error");
        }
    };

    const closeCategoryModal = () => {
        setCategoryModal(null);
        setEditingCategory(null);
        setCategoryForm({ name: "", slug: "", icon: "📁" });
    };

    // Sync event partners from Supabase
    useEffect(() => {
        if (homePartnersArr.length > 0) {
            setEventPartners(homePartnersArr);
        }
    }, [homePartnersArr]);

    const handleSavePartner = async () => {
        if (!partnerForm.name || !partnerForm.logo) {
            showToast("Name and Logo are required", "error");
            return;
        }

        try {
            if (partnerModal === "add") {
                await addEventPartner({
                    name: partnerForm.name,
                    logo_url: partnerForm.logo,
                    url: partnerForm.url,
                    sort_order: eventPartners.length + 1
                });
                showToast("Partner added", "success");
            } else if (partnerModal === "edit" && editingPartner) {
                await patchEventPartner({
                    id: editingPartner.id,
                    name: partnerForm.name,
                    logo_url: partnerForm.logo,
                    url: partnerForm.url
                });
                showToast("Partner updated", "success");
            }
            closePartnerModal();
        } catch (err) {
            showToast("Error saving partner: " + err.message, "error");
        }
    };

    const closePartnerModal = () => {
        setPartnerModal(null);
        setEditingPartner(null);
        setPartnerForm({ name: "", logo: "", url: "" });
    };

    // Seed default API keys if empty
    useEffect(() => {
        if (apiKeysArr.length === 0) {
            const defaults = [
                { label: "Production Mobile App", key: "ak_live_724819...9238" },
                { label: "Staging Environment", key: "ak_test_123891...0841" }
            ];
            defaults.forEach(d => createApiKey(d));
        }
    }, [apiKeysArr]);
    const [localEmailSettings, setLocalEmailSettings] = useState({
        provider: "SMTP",
        host: "",
        port: 0,
        user: "",
        pass: "",
        from: "",
        fromName: "",
        encryption: "None",
        authMethod: "Basic Authentication",
        microsoft365: {
            clientId: "",
            tenantId: "",
            clientSecret: "",
            status: "Not Connected"
        }
    });

    useEffect(() => {
        if (emailSettingsArr?.[0]) {
            const dbSettings = emailSettingsArr[0];
            setLocalEmailSettings({
                id: dbSettings.id,
                provider: dbSettings.provider || "SMTP",
                host: dbSettings.host || "",
                port: dbSettings.port || 0,
                user: dbSettings.user_name || "",
                pass: dbSettings.pass || "",
                from: dbSettings.from_email || "",
                fromName: dbSettings.from_name || "",
                encryption: dbSettings.encryption || "None",
                authMethod: dbSettings.auth_method || "Basic Authentication",
                microsoft365: dbSettings.microsoft_365 || {
                    clientId: "",
                    tenantId: "",
                    clientSecret: "",
                    status: "Not Connected"
                }
            });
        }
    }, [emailSettingsArr]);

    const handleSaveEmail = async () => {
        setIsSavingEmail(true);
        try {
            const dbPayload = {
                provider: localEmailSettings.provider,
                host: localEmailSettings.host,
                port: localEmailSettings.port,
                user_name: localEmailSettings.user,
                pass: localEmailSettings.pass,
                from_email: localEmailSettings.from,
                from_name: localEmailSettings.fromName,
                encryption: localEmailSettings.encryption,
                auth_method: localEmailSettings.authMethod,
                microsoft_365: localEmailSettings.microsoft365,
                updated_at: new Date().toISOString()
            };

            if (localEmailSettings.id) {
                await updateEmailSettings({ id: localEmailSettings.id, ...dbPayload });
            } else {
                await supabase.from('email_settings').insert(dbPayload);
            }
            showToast("Email settings saved successfully!", "success");
        } catch (err) {
            showToast("Error saving email settings: " + err.message, "error");
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleValidateM365 = async () => {
        setIsValidatingM365(true);
        try {
            if (!localEmailSettings.from) {
                showToast("Please provide 'From Email' for validation.", "warning");
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            // Call local API instead of Edge Function for stability
            const res = await fetch('/api/admin/action', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    action: 'validate-email-settings',
                    data: { settings: localEmailSettings }
                })
            });
            const result = await res.json();

            if (res.ok && result.success) {
                showToast("Microsoft 365 connection validated! (Check your inbox)", "success");
                setLocalEmailSettings(s => ({ 
                    ...s, 
                    provider: "MICROSOFT_365", // Auto-switch provider on validation success
                    microsoft365: { ...s.microsoft365, status: "Connected" } 
                }));
            } else {
                showToast("Connection failed: " + (result?.error || error?.message), "error");
                setLocalEmailSettings(s => ({ 
                    ...s, 
                    microsoft365: { ...s.microsoft365, status: "Not Connected" } 
                }));
            }
        } catch (err) {
            showToast("Validation error: " + err.message, "error");
        } finally {
            setIsValidatingM365(false);
        }
    };

    const colors = {
        light: {
            bg: "#f8fafc",
            sidebar: "#ffffff",
            header: "#ffffff",
            textMain: "#0f172a",
            textSub: "#64748b",
            cardBg: "#ffffff",
            border: "#e2e8f0",
            activeLink: "#3b82f6",
            activeText: "#ffffff",
            sidebarBorder: "#e2e8f0"
        },
        dark: {
            bg: "#0f172a",
            sidebar: "#111827",
            header: "#111827",
            textMain: "#f8fafc",
            textSub: "#94a3b8",
            cardBg: "#1e293b",
            border: "#334155",
            activeLink: "#3b82f6",
            activeText: "#ffffff",
            sidebarBorder: "#1e293b"
        }
    };

    const ACCENT_BLUE = "#3b82f6";
    const ACCENT_PURPLE = "#8b5cf6";
    const ACCENT_PINK = "#f84464"; // Unified with Organiser portal
    const ACCENT_GRADIENT = `linear-gradient(135deg, ${ACCENT_BLUE} 0%, ${ACCENT_PURPLE} 100%)`;

    const t = colors[theme] || colors.dark;

    const addSlide = async () => {
        try {
            await addBannerSlide({
                img: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=1200&h=480&fit=crop",
                title: "New Slide",
                sub: "Subtitle here",
                alt: "New Slide",
                url: "",
                order: slides.length
            });
            showToast("Slide added", "success");
        } catch (err) {
            showToast("Error adding slide", "error");
        }
    };

    const removeSlide = async (id) => {
        try {
            await removeBannerSlide({ id });
            showToast("Slide removed", "success");
        } catch (err) {
            showToast("Error removing slide", "error");
        }
    };

    const handleSaveSlide = async (slide) => {
        try {
            if (slide.id) {
                await updateBannerSlide(slide);
                showToast("Slide updated", "success");
            } else {
                showToast("Slide not persisted yet.", "warning");
            }
        } catch (err) {
            showToast("Error updating slide", "error");
        }
    };

    const updateSlideLocal = (id, field, value) => {
        setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc', fontFamily: "'Figtree', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap');
                .admin-container { 
                    display: flex; 
                    min-height: 100vh; 
                    background-color: #f8fafc; 
                    color: #0f172a;
                    font-family: 'Figtree', sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    transition: all 0.3s ease;
                }
                .sidebar {
                    width: 250px;
                    background-color: ${t.sidebar};
                    color: ${t.textSub};
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    height: 100vh;
                    left: 0;
                    top: 0;
                    z-index: 100;
                    border-right: 1px solid ${t.sidebarBorder};
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    overflow-y: auto;
                    padding: 20px 0;
                }
                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    margin: 4px 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    font-weight: 500;
                    color: ${t.textSub};
                    text-decoration: none;
                }
                .sidebar-item:hover {
                    background-color: ${t.activeLink}30;
                    color: ${t.activeText};
                }
                .sidebar-item.active {
                    background-color: ${t.activeLink};
                    color: ${t.activeText};
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }
                .sidebar-group-title {
                    padding: 0 32px;
                    margin: 20px 0 10px 0;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: ${t.textSub}80;
                }
                .submenu {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin: 4px 16px 12px 32px;
                }
                .submenu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 13px;
                    font-weight: 500;
                    color: ${t.textSub};
                }
                .submenu-item:hover {
                    background-color: ${t.activeLink}30;
                    color: ${t.activeText};
                }
                .submenu-item.active-sub {
                    background-color: transparent;
                    color: ${t.activeText};
                    font-weight: 700;
                }
                .dot-icon {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: currentColor;
                    opacity: 0.5;
                }
                .submenu-item.active-sub .dot-icon {
                    opacity: 1;
                    background-color: ${t.activeText};
                }
                .sidebar::-webkit-scrollbar {
                    width: 5px;
                }
                .sidebar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .sidebar::-webkit-scrollbar-thumb {
                    background-color: ${t.border};
                    border-radius: 10px;
                }
                .main-content {
                    flex: 1;
                    padding: 24px;
                    min-width: 0;
                }
                @media (max-width: 1024px) {
                    .sidebar { transform: translateX(-100%); width: 280px; }
                    .sidebar.open { transform: translateX(0); }
                    .main-content { margin-left: 0; padding: 20px; }
                    .sidebar-overlay { 
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                        background: rgba(0,0,0,0.5); z-index: 90; display: none; 
                    }
                    .sidebar-overlay.visible { display: block; }
                }
                .widget-card {
                    background-color: ${t.cardBg};
                    border-radius: 16px;
                    border: 1px solid ${t.border};
                    padding: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .widget-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .section-card {
                    background-color: ${t.cardBg};
                    border-radius: 16px;
                    border: 1px solid ${t.border};
                    padding: 16px;
                    margin-bottom: 24px;
                }
                .table-container {
                    overflow-x: auto;
                    border-radius: 12px;
                    border: 1px solid ${t.border};
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th {
                    text-align: left;
                    padding: 10px 14px;
                    background-color: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
                    color: ${t.textSub};
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid ${t.border};
                }
                td {
                    padding: 12px;
                    border-bottom: 1px solid ${t.border};
                    font-size: 14px;
                }
                .badge {
                    padding: 4px 10px;
                    border-radius: 99px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .badge-blue { background: #dbeafe; color: #1e40af; }
                .badge-green { background: #dcfce7; color: #166534; }
                .badge-yellow { background: #fef9c3; color: #854d0e; }
                .badge-red { background: #fee2e2; color: #991b1b; }
                
                @keyframes dropdownFade {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dropdown-hover:hover {
                    background-color: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} !important;
                }
                .dropdown-hover-red:hover {
                    background-color: #fef2f2 !important;
                }
                .sidebar-logo-text {
                    font-size: 18px; 
                    font-weight: 800; 
                    color: ${t.textMain}; 
                    letter-spacing: -0.5px;
                }
            `}</style>

            
            {/* Sidebar Overlay (mobile only) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar Navigation - always visible on desktop, slide-in on mobile */}
            <aside className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl shadow-slate-200/50 flex flex-col flex-shrink-0`}>
                {/* Header */}
                <div className="h-16 flex items-center justify-center border-b border-slate-50 bg-white">
                    <div className="flex items-center cursor-pointer" onClick={() => setActiveTab("dashboard")}>
                        <img src="/logo.png" alt="BookMyTicket" className="h-14 w-auto" />
                    </div>
                </div>
                
                {/* Side Sub-Header (Service Role) */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                        <Sparkles size={40} className="text-pink-500" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">Admin Portal</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Super Admin</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {/* Render Helper */}
                    {(() => {
                        const SidebarItem = ({ id, label, icon: Icon, onClick, active }) => (
                            <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all duration-400 group relative ${ active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.02]' }`}>
                                <Icon size={18} className={active ? 'text-pink-500' : 'text-slate-300 group-hover:text-slate-900'} strokeWidth={active ? 3 : 2} />
                                <span className={`text-[11px] uppercase tracking-widest whitespace-nowrap ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
                                {active && <div className="absolute right-4 w-1 h-4 bg-pink-500 rounded-full"></div>}
                            </button>
                        );
                        const SidebarGroupTitle = ({ title }) => (
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4 mb-1 px-4 first:mt-2">{title}</p>
                        );
                        const SidebarCategoryHeader = ({ label, icon: Icon, isOpen, onClick }) => (
                            <button 
                                onClick={onClick}
                                className={`w-full flex items-center justify-between px-4 py-2 mt-2 transition-all duration-300 group ${isOpen ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Icon size={18} className={isOpen ? "text-pink-500" : "text-slate-300 group-hover:text-slate-400"} strokeWidth={2.5} />
                                    <span className={`text-[11px] uppercase tracking-[0.2em] whitespace-nowrap ${isOpen ? 'font-black' : 'font-bold'}`}>{label}</span>
                                </div>
                                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-pink-500' : 'text-slate-300'}`} />
                            </button>
                        );
                        const SidebarSubItem = ({ id, label, onClick, active }) => (
                            <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-1.5 pl-10 rounded-xl transition-all duration-300 group ${ active ? 'bg-pink-50 text-pink-600 font-black scale-[1.01]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800' }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-pink-500' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
                                <span className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">{label}</span>
                            </button>
                        );

                        return (
                            <div className="flex flex-col pb-4">
                                <SidebarGroupTitle title="Home" />
                                <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
                                 <SidebarItem id="partner_requests" label="Partner Requests" icon={Users} active={activeTab === "partner_requests"} onClick={() => setActiveTab("partner_requests")} />
                                <SidebarItem id="banner_ads" label="Banner Ads" icon={Megaphone} active={activeTab === "banner_ads"} onClick={() => setActiveTab("banner_ads")} />
                                
                                <SidebarCategoryHeader label="Home Page" icon={Globe} isOpen={isHomeSettingsOpen} onClick={() => setIsHomeSettingsOpen(!isHomeSettingsOpen)} />
                                {isHomeSettingsOpen && (
                                    <div className="space-y-0.5">
                                        {[
                                            { label: "Hero Banner", id: "hero" },
                                            { label: "Mobile Banners", id: "mobile_banners" },
                                            { label: "Video Banner", id: "video_banner" },
                                            { label: "Site Branding", id: "site_branding" },
                                            { label: "Featured Events", id: "events_settings" },
                                            { label: "Event Partners", id: "event_partners" },
                                            { label: "Recent Memories", id: "memories" },
                                            { label: "Sections Order", id: "sections" },
                                            { label: "Copyright Header", id: "copyright" },
                                            { label: "Meeting Settings", id: "meeting_settings" },
                                            { label: "Maintenance Mode", id: "maintenance" }
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={sub.onClick || (() => setActiveTab(sub.id))} />
                                        ))}
                                    </div>
                                )}

                                <SidebarGroupTitle title="Operations" />
                                <SidebarItem id="all_events" label="Events" icon={Calendar} active={activeTab === "all_events"} onClick={() => setActiveTab("all_events")} />
                                <SidebarItem id="bookings" label="Bookings" icon={ShoppingCart} active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} />
                                <SidebarItem id="meetings" label="Meetings" icon={Video} active={activeTab === "meetings"} onClick={() => setActiveTab("meetings")} />
                                <SidebarItem id="categories" label="Categories" icon={LayoutGrid} active={activeTab === "categories"} onClick={() => setActiveTab("categories")} />

                                <SidebarGroupTitle title="Partners" />
                                <SidebarItem id="customers" label="Customers" icon={UserCircle} active={activeTab === "customers"} onClick={() => setActiveTab("customers")} />
                                <SidebarItem id="subscribers" label="Subscribers" icon={Mail} active={activeTab === "subscribers"} onClick={() => setActiveTab("subscribers")} />
                                
                                <SidebarCategoryHeader label="Organizers" icon={Users} isOpen={isOrganizersOpen} onClick={() => setIsOrganizersOpen(!isOrganizersOpen)} />
                                {isOrganizersOpen && (
                                    <div className="space-y-0.5">
                                        {[
                                            { label: "All Organizers", id: "all_org" },
                                            { label: "Active", id: "active_org" },
                                            { label: "Under Review", id: "kyc_verified" },
                                            { label: "Pending Setup", id: "kyc_pending" },
                                            { label: "Restricted", id: "banned_org" },
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={sub.onClick || (() => setActiveTab(sub.id))} />
                                        ))}
                                    </div>
                                )}

                                <SidebarCategoryHeader label="Services" icon={Briefcase} isOpen={isServicesOpen} onClick={() => setIsServicesOpen(!isServicesOpen)} />
                                {isServicesOpen && (
                                    <div className="space-y-0.5">
                                        {[
                                            { label: "Turf Partners", id: "turf_partners" },
                                            { label: "All Turfs", id: "all_turfs" },
                                            { label: "Active Turfs", id: "turf_active" },
                                            { label: "Banned Turfs", id: "turf_banned" },
                                            { label: "Turf Bookings", id: "turf_bookings" },
                                            { label: "Pool Requests", id: "pool_bookings" },
                                            { label: "Active Professionals", id: "service_active" },
                                            { label: "Banned Professionals", id: "service_banned" },
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={sub.onClick || (() => setActiveTab(sub.id))} />
                                        ))}
                                    </div>
                                )}

                                <SidebarGroupTitle title="Growth" />
                                <SidebarCategoryHeader label="Marketing" icon={Gift} isOpen={isGrowthOpen} onClick={() => setIsGrowthOpen(!isGrowthOpen)} />
                                {isGrowthOpen && (
                                    <div className="space-y-0.5">
                                        {[
                                            { label: "Promotions", id: "promotions" },
                                            { label: "Push Notifications", id: "send_notif" },
                                            { label: "Email Broadcast", id: "email_templates" },

                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={sub.onClick || (() => setActiveTab(sub.id))} />
                                        ))}
                                    </div>
                                )}
                                
                                <SidebarGroupTitle title="Finance" />
                                <SidebarItem id="gst" label="GST Reports" icon={Briefcase} active={activeTab === "gst"} onClick={() => setActiveTab("gst")} />

                                <SidebarGroupTitle title="Reports" />
                                <SidebarItem id="support_tickets" label="Support Tickets" icon={MessageCircle} active={activeTab === "support_tickets"} onClick={() => setActiveTab("support_tickets")} />
                                <SidebarItem id="branding_partners" label="Branding Partners" icon={Shield} active={activeTab === "branding_partners"} onClick={() => setActiveTab("branding_partners")} />
                                <SidebarItem id="pages" label="Pages" icon={FileText} active={activeTab === "pages"} onClick={() => setActiveTab("pages")} />
                                <SidebarItem id="ad_popups" label="Ad Popups" icon={Megaphone} active={activeTab === "ad_popups"} onClick={() => setActiveTab("ad_popups")} />
                                <SidebarItem id="checkout_footer" label="Checkout Footer" icon={LayoutGrid} active={activeTab === "checkout_footer"} onClick={() => setActiveTab("checkout_footer")} />

                                <SidebarGroupTitle title="Administration" />
                                <SidebarItem id="admin_management" label="Team Management" icon={Shield} active={activeTab === "admin_management"} onClick={() => setActiveTab("admin_management")} />

                                <SidebarGroupTitle title="System" />
                                <SidebarCategoryHeader label="Settings" icon={Settings} isOpen={isSettingsOpen} onClick={() => setIsSettingsOpen(!isSettingsOpen)} />
                                {isSettingsOpen && (
                                    <div className="space-y-0.5">
                                        {[
                                            { label: "Email System", id: "email_templates" },
                                            { label: "SMS & WhatsApp", id: "comm_hub" },
                                            { label: "Payments", id: "payment_settings" },
                                            { label: "Emails", id: "email_settings" },
                                            { label: "SEO & Analytics", id: "seo_settings", onClick: () => router.push('/admin/settings/seo') },
                                            { label: "Email Templates", id: "email_templates" },
                                            { label: "Disclaimers", id: "disclaimer_settings" },
                                            { label: "SSO Config", id: "sso_settings" },
                                            { label: "Tickets & Notifs", id: "ticket_settings" }
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={sub.onClick || (() => setActiveTab(sub.id))} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                </nav>

                {/* Footer - Profile Minimal */}
                <div className="p-4 border-t border-slate-50 bg-slate-50/50 mt-auto">
                    <div className="bg-white rounded-[1.2rem] p-3 mb-2 flex items-center space-x-3 border border-slate-100 shadow-sm group cursor-pointer hover:border-pink-500/30 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center text-pink-500 border border-pink-200 overflow-hidden shadow-inner font-bold text-xs">
                            A
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-black text-slate-900 truncate uppercase tracking-tight italic">Admin User</p>
                            <p className="text-[8px] font-black text-slate-300 truncate uppercase tracking-[0.2em] mt-0.5">Verified</p>
                        </div>
                    </div>
                    <div className="mb-2" />
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[0.8rem] bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-pink-500/20 group"
                    >
                        <LogOut size={12} strokeWidth={3} className="text-white" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between px-8 lg:px-12">
                    <div className="flex items-center space-x-8">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-3 rounded-2xl bg-slate-50 text-slate-400 lg:hidden hover:bg-slate-100 transition-all border border-slate-100 shadow-sm"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2.5 mb-0.5">
                                <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                                    {activeTab.replace('_', ' ')}
                                </h1>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3.5">
                                Admin Dashboard Overview
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="relative p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all border border-slate-100 shadow-sm">
                            <Bell size={20} />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>
                            <span className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full border border-white"></span>
                        </button>
                        
                        <div className="hidden md:flex items-center space-x-4 ml-4 pl-4 border-l border-slate-200">
                            <div className="text-right">
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic">Admin User</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Platform Admin</p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-slate-900/20">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === "dashboard" && (
                        <>
                            {/* Welcome Banner */}
                            <div style={{ 
                                background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                borderRadius: "20px",
                                padding: "24px",
                                marginBottom: "24px",
                                position: "relative",
                                overflow: "hidden",
                                border: `1px solid ${t.border}`,
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)"
                            }}>
                                <div style={{ position: "relative", zIndex: 2 }}>
                                    <h2 style={{ fontSize: "28px", fontWeight: 900, color: t.textMain, marginBottom: "8px", letterSpacing: "-0.03em" }}>Welcome back, Admin! 👋</h2>
                                    <p style={{ fontSize: "14px", color: t.textSub, maxWidth: "500px", lineHeight: "1.5", fontWeight: 500 }}>
                                        Here's what's happening with your platform today. You have pending ad requests and thousands of active events.
                                    </p>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                                        <button onClick={() => setActiveTab("org_requests")} style={{ padding: "10px 20px", borderRadius: "12px", background: ACCENT_GRADIENT, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 20px -5px rgba(59, 130, 246, 0.4)", transition: "all 0.2s", fontSize: "12px" }}>View Requests</button>
                                        <button onClick={() => setActiveTab("all_events")} style={{ padding: "10px 20px", borderRadius: "12px", background: theme === 'dark' ? "rgba(255,255,255,0.05)" : "#fff", color: t.textMain, border: `1px solid ${t.border}`, fontWeight: 800, cursor: "pointer", transition: "all 0.2s", fontSize: "12px" }}>Manage Events</button>
                                    </div>
                                </div>
                                {/* Modern Abstract Background Element */}
                                <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "400px", height: "400px", borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT_BLUE}15 0%, transparent 70%)`, pointerEvents: "none" }}></div>
                                <div style={{ position: "absolute", bottom: "-100px", left: "10%", width: "300px", height: "300px", borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT_PINK}10 0%, transparent 70%)`, pointerEvents: "none" }}></div>
                            </div>

                            <div className="stats-grid">
                                {[
                                    { label: "Total Revenue", value: dashboardStats ? `₹${dashboardStats.totalRevenue.toLocaleString()}` : "…", icon: LayoutDashboard, color: "#3b82f6", trend: "+12.5%" },
                                    { label: "Total Events", value: dashboardStats ? dashboardStats.totalEvents.toString() : "…", icon: Ticket, color: "#8b5cf6", trend: "+5.2%" },
                                    { label: "Tickets Sold", value: dashboardStats ? dashboardStats.totalTickets.toString() : "…", icon: Ticket, color: "#ec4899", trend: "+8.1%" },
                                    { label: "Customers", value: dashboardStats ? dashboardStats.totalUsers.toString() : "…", icon: UserCircle, color: "#f59e0b", trend: "+2.4%" },
                                    { label: "Organisers", value: dashboardStats ? dashboardStats.totalOrganisers.toString() : "…", icon: Users, color: "#10b981", trend: "+1.8%" },
                                    { label: "Service Providers", value: dashboardStats ? (dashboardStats.totalServiceProviders || 0).toString() : "…", icon: Briefcase, color: "#f97316", trend: "+4.2%" },
                                    { label: "Bookings", value: dashboardStats ? dashboardStats.totalBookings.toString() : "…", icon: ShoppingCart, color: "#06b6d4", trend: "+14.2%" }
                                ].map((stat, i) => (
                                    <div key={i} className="widget-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                                                <stat.icon size={20} />
                                            </div>
                                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e", backgroundColor: "#f0fdf4", padding: "2px 6px", borderRadius: "4px" }}>{stat.trend}</span>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: t.textSub }}>{stat.label}</p>
                                            <h3 style={{ margin: "2px 0 0 0", fontSize: "22px", fontWeight: 800, color: t.textMain, letterSpacing: "-0.5px" }}>{stat.value}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {activeTab === "banner_ads" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {/* Pending Requests */}
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Pending Ad Requests</h3>
                                {bannerRequests.length === 0 ? (
                                    <p style={{ color: t.textSub, fontSize: "14px" }}>No pending requests.</p>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                                    <th style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>User</th>
                                                    <th style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>Package</th>
                                                    <th style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>Target URL</th>
                                                    <th style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>Date</th>
                                                    <th style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bannerRequests.map((req) => (
                                                    <tr key={req._id} style={{ borderBottom: `1px solid ${t.sidebarBorder}` }}>
                                                        <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600 }}>{req.userId}</td>
                                                        <td style={{ padding: "12px", fontSize: "14px" }}>
                                                            {/* We'd normally fetch package details, but for now just show ID or constant */}
                                                            Hero Banner
                                                        </td>
                                                        <td style={{ padding: "12px", fontSize: "13px", color: "#3b82f6" }}>
                                                            <a href={req.link} target="_blank" rel="noreferrer">{req.link || "N/A"}</a>
                                                        </td>
                                                        <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>
                                                            {new Date(req.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: "12px" }}>
                                                            <button
                                                                onClick={() => setApprovingBanner(req)}
                                                                style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "#10b981", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                                            >
                                                                Approve / Upload
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Active Banners */}
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Active / All Banners</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                                    {allBanners.filter(b => b.status !== "pending").map((banner) => (
                                        <div key={banner._id} style={{ borderRadius: "12px", border: `1px solid ${t.border}`, overflow: "hidden", position: "relative" }}>
                                            <img src={banner.imageUrl} alt="Banner" style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                                            <div style={{ padding: "12px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                    <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", backgroundColor: banner.endDate > Date.now() ? "#dcfce7" : "#fee2e2", color: banner.endDate > Date.now() ? "#166534" : "#991b1b" }}>
                                                        {banner.endDate > Date.now() ? "Active" : "Expired"}
                                                    </span>
                                                    <button onClick={() => deleteBannerMutation({ id: banner._id })} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                                                </div>
                                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Starts: {new Date(banner.startDate).toLocaleDateString()}</p>
                                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Ends: {new Date(banner.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Creation Modal */}
                    {adminModal === "add" && (
                        <div className="modal-backdrop" onClick={() => setAdminModal(null)}>
                            <div className="org-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "32px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>Create Admin Account</h2>
                                    <button onClick={() => setAdminModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub }}><X size={24} /></button>
                                </div>
                                
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Full Name</label>
                                        <input 
                                            type="text" 
                                            value={newAdmin.fullName}
                                            onChange={(e) => setNewAdmin({...newAdmin, fullName: e.target.value})}
                                            placeholder="John Doe" 
                                            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }} 
                                        />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Username</label>
                                            <input 
                                                type="text" 
                                                value={newAdmin.username}
                                                onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                                                placeholder="admin123" 
                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }} 
                                        />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Role</label>
                                            <select 
                                                value={newAdmin.role}
                                                onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="Developer">Developer</option>
                                                <option value="Tester">Tester</option>
                                                <option value="Support">Support</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Email Address</label>
                                        <input 
                                            type="email" 
                                            value={newAdmin.email}
                                            onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                                            placeholder="admin@example.com" 
                                            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Password</label>
                                        <input 
                                            type="password" 
                                            value={newAdmin.password}
                                            onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                            placeholder="••••••••" 
                                            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }} 
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={async () => {
                                            if(!newAdmin.fullName || !newAdmin.username || !newAdmin.email || !newAdmin.password) {
                                                showToast("Please fill in all fields.", "warning");
                                                return;
                                            }
                                            try {
                                                await createAdminMutation(newAdmin);
                                                showToast("Admin account created successfully!", "success");
                                                setAdminModal(null);
                                                setNewAdmin({ fullName: '', username: '', email: '', password: '', role: 'Admin' });
                                            } catch (err) {
                                                showToast("Error creating admin: " + err.message, "error");
                                            }
                                        }}
                                        style={{ marginTop: "12px", padding: "12px", borderRadius: "10px", background: ACCENT_GRADIENT, backgroundColor: ACCENT_PINK, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "16px", boxShadow: "0 10px 24px rgba(236,72,153,0.18)" }}
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Approval Modal */}
                    {approvingBanner && (
                        <div className="modal-backdrop" onClick={() => setApprovingBanner(null)}>
                            <div className="org-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "32px" }}>
                                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>Approve Banner</h2>
                                <p style={{ color: t.textSub, fontSize: "14px", marginBottom: "24px" }}>
                                    Upload the banner image and confirm the duration for <strong>{approvingBanner.userId}</strong>.
                                </p>

                                <div style={{ marginBottom: "20px" }}>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Banner Image (844x322 recommended)</label>
                                    <div style={{ border: `2px dashed ${t.border}`, borderRadius: "12px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
                                        <input
                                            type="file"
                                            id="banner-upload"
                                            hidden
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                try {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `banner-${Date.now()}.${fileExt}`;
                                                    const { data, error } = await supabase.storage
                                                        .from('branding')
                                                        .upload(fileName, file, { cacheControl: '3600', upsert: true });

                                                    if (error) throw error;

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('branding')
                                                        .getPublicUrl(fileName);

                                                    setBannerImage(publicUrl);
                                                    showToast("Banner uploaded!", "success");
                                                } catch (err) { 
                                                    console.error(err);
                                                    showToast("Upload failed: " + err.message, "error"); 
                                                }
                                            }}
                                        />
                                        <label htmlFor="banner-upload" style={{ cursor: "pointer" }}>
                                            {bannerImage ? (
                                                <img src={bannerImage} alt="Preview" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" }} />
                                            ) : (
                                                <div style={{ color: t.textSub }}>
                                                    <Upload size={32} style={{ marginBottom: "8px" }} />
                                                    <p style={{ margin: 0 }}>Click to upload banner</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button
                                        onClick={async () => {
                                            if (!bannerImage) { showToast("Please upload an image", "warning"); return; }
                                            await approveBannerMutation({
                                                id: approvingBanner._id,
                                                imageUrl: bannerImage,
                                                durationDays: 7, // Default to 7 if package info isn't reactive here
                                                link: approvingBanner.link
                                            });
                                            setApprovingBanner(null);
                                            setBannerImage("");
                                        }}
                                        style={{ flex: 1, padding: "12px", borderRadius: "8px", backgroundColor: "#1e293b", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Approve (Weekly)
                                    </button>
                                    <button
                                        onClick={() => setApprovingBanner(null)}
                                        style={{ padding: "12px 24px", borderRadius: "8px", border: `1px solid ${t.border}`, background: "none", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "all_events" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>All Events (Homepage + Organisers)</h3>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <a href="/organiser" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "10px", background: ACCENT_GRADIENT, backgroundColor: ACCENT_PINK, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "14px", textDecoration: "none", boxShadow: "0 10px 24px rgba(236,72,153,0.18)" }}><Plus size={18} /> Create event</a>
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        style={{ padding: "8px 12px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                    />
                                </div>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Event Title</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Venue / Location</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Date</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Source</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allEvents.length > 0 ? allEvents.map((ev) => (
                                            <tr key={ev.id + (ev.source || "")} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{ev.title}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{ev.venue || ev.location || "—"}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{ev.date}{ev.time ? ` ${ev.time}` : ""}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#3b82f615", color: "#3b82f6" }}>{ev.category || "—"}</span>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "12px", color: t.textSub }}>{ev.source === "organiser" ? "Organiser" : "Homepage"}</td>
                                                <td style={{ padding: "12px" }}>
                                                    {(() => {
                                                        const eventDateStr = ev.date;
                                                        const eventTimeStr = ev.time || "23:59";
                                                        let isExpired = false;
                                                        try {
                                                            const eDate = new Date(`${eventDateStr}T${eventTimeStr.includes(':') ? eventTimeStr : eventTimeStr + ':00'}`);
                                                            isExpired = !isNaN(eDate.getTime()) && eDate < new Date();
                                                        } catch (e) {
                                                            isExpired = false;
                                                        }
                                                        
                                                        if (isExpired || ev.status === 'expired') {
                                                            return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#ef444415", color: "#ef4444" }}>EXPIRED</span>;
                                                        }
                                                        return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#22c55e15", color: "#22c55e" }}>ACTIVE</span>;
                                                    })()}
                                                </td>
                                                <td style={{ padding: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                    {ev.source === "organiser" && (
                                                        <>
                                                            <button 
                                                                onClick={() => {
                                                                    window.location.href = `/organiser?tab=events&editId=${ev.id}`;
                                                                }}
                                                                style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    try {
                                                                        await updateEvent({ id: ev.id, archived: true });
                                                                        showToast("Event archived successfully", "success");
                                                                    } catch (err) {
                                                                        showToast("Error archiving event", "error");
                                                                    }
                                                                }} 
                                                                style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                                                            >
                                                                <Archive size={14} /> Archive
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    const confirmed = await confirm("Cancel Event", `Are you sure you want to cancel "${ev.title}"?`, { confirmText: "YES, CANCEL", type: "warning" });
                                                                    if (confirmed) {
                                                                        try {
                                                                            await updateEvent({ id: ev.id, status: 'cancelled' });
                                                                            showToast("Event cancelled", "info");
                                                                        } catch (err) {
                                                                            showToast("Error cancelling event", "error");
                                                                        }
                                                                    }
                                                                }}
                                                                style={{ color: "#f59e0b", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    const confirmed = await confirm(
                                                                        "Delete Event",
                                                                        `Are you sure you want to PERMANENTLY DELETE "${ev.title}"? This action cannot be undone and will fail if there are active bookings.`,
                                                                        { confirmText: "DELETE", type: "danger" }
                                                                    );
                                                                    if (confirmed) {
                                                                        try {
                                                                            await deleteEvent({ id: ev.id });
                                                                            showToast("Event deleted permanently", "success");
                                                                        } catch (err) {
                                                                            showToast("Error: " + (err.message || "Could not delete event. It may have active bookings."), "error");
                                                                        }
                                                                    }
                                                                }}
                                                                style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                    {ev.source === "home" && (
                                                        <button onClick={() => setArchivedHomeIds([...archivedHomeIds, ev.id])} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}><Archive size={14} /> Archive</button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No events found. Homepage events and organiser-created events appear here.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "bookings" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Ticket Orders</h3>
                                <input type="text" placeholder="Search by order ID, email, event..." style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "13px", minWidth: "220px" }} />
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Order ID</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Event</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Customer</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Tickets</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Amount</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.length > 0 ? bookings.map((b) => (
                                            <tr key={b.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>#{String(b.id).slice(-8).toUpperCase()}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{b.eventName}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{b.customerEmail}</td>
                                                <td style={{ padding: "12px" }}>{b.ticketCount}</td>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>₹{b.totalPrice?.toLocaleString()}</td>
                                                <td style={{ padding: "12px" }}><span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#22c55e15", color: "#22c55e" }}>{b.status || "Confirmed"}</span></td>
                                                <td style={{ padding: "12px" }}><button style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>View</button></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="7" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No bookings yet. Orders from homepage and organiser events will appear here.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "turf_partners" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Approved Turf Partners</h3>
                                <div style={{ fontSize: "12px", fontWeight: 700, color: t.textSub }}>{turfPartners.length} Partners</div>
                            </div>
                            <div className="table-container">
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                    <thead>
                                        <tr style={{ textAlign: "left" }}>
                                            <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Partner</th>
                                            <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Contact</th>
                                            <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Location</th>
                                            <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                            <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {turfPartners.length > 0 ? turfPartners.map((org) => (
                                            <tr key={org.id} style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#3b82f6" }}>
                                                            {org.business_name?.charAt(0) || org.username?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>{org.business_name || org.username}</p>
                                                            <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{org.category}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ fontSize: "13px", color: t.textMain }}>{org.email}</div>
                                                    <div style={{ fontSize: "11px", color: t.textSub }}>{org.phone || "No phone"}</div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ fontSize: "13px", color: t.textMain }}>{org.kyc_details?.city || "Global"}</div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <span style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: "#22c55e20", color: "#22c55e" }}>
                                                        ACTIVE
                                                    </span>
                                                </td>
                                                <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                                                    <button onClick={() => { setActiveTab("service_active"); }} style={{ padding: "6px 12px", borderRadius: "6px", background: "#f1f5f9", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Manage</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No approved turf partners yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "all_turfs" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>All Turf Facilities</h3>
                            </div>
                            <div className="table-container">
                                <TurfsTable t={t} statusFilter="all" setActiveTab={setActiveTab} />
                            </div>
                        </div>
                    )}

                    {activeTab === "turf_active" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Active Turfs</h3>
                            </div>
                            <div className="table-container">
                                <TurfsTable t={t} statusFilter="active" setActiveTab={setActiveTab} />
                            </div>
                        </div>
                    )}

                    {activeTab === "turf_banned" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Banned Turfs</h3>
                            </div>
                            <div className="table-container">
                                <TurfsTable t={t} statusFilter="banned" setActiveTab={setActiveTab} />
                            </div>
                        </div>
                    )}

                    {activeTab === "turf_bookings" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Turf Reservation Ledger</h3>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button style={{ padding: "8px 16px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Archive size={14} /> Export CSV
                                    </button>
                                </div>
                            </div>
                            <div className="table-container">
                                <TurfBookingsTable t={t} />
                            </div>
                        </div>
                    )}

                    {activeTab === "pool_bookings" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Swimming Pool Service Requests</h3>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button style={{ padding: "8px 16px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Archive size={14} /> Export CSV
                                    </button>
                                </div>
                            </div>
                            <div className="table-container">
                                <PoolBookingsTable t={t} />
                            </div>
                        </div>
                    )}

                    {activeTab === "customers" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Customer CRM</h3>
                                <input type="text" placeholder="Search by name, email, phone..." style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "13px", minWidth: "220px" }} />
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Role</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Joined</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const customersOnly = usersArr.filter(c => !c.role || c.role === "user");
                                            return customersOnly.length > 0 ? customersOnly.map((c) => (
                                                <tr key={c.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                    <td style={{ padding: "12px", fontWeight: 600 }}>{c.username}</td>
                                                    <td style={{ padding: "12px", fontSize: "13px" }}>{c.email}</td>
                                                    <td style={{ padding: "12px" }}>
                                                        <span style={{ padding: "2px 8px", borderRadius: "6px", backgroundColor: "#22c55e22", color: "#22c55e", fontSize: "11px", fontWeight: 700 }}>{c.role || "user"}</span>
                                                    </td>
                                                    <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                                                    <td style={{ padding: "12px" }}><button style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>View history</button></td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No customers yet. Registered users will appear here.</td></tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    )}

                    {activeTab === "promotions" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Coupon codes & BOGO</h3>
                                <button onClick={handleCreatePromotion} style={{ padding: "8px 16px", background: ACCENT_GRADIENT, backgroundColor: ACCENT_PINK, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 10px 24px rgba(236,72,153,0.14)" }}><Plus size={18} /> Create promotion</button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                                <div style={{ padding: "16px", border: `1px solid ${t.border}`, borderRadius: "10px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textSub }}>Code</label>
                                    <input type="text" placeholder="e.g. SAVE10" value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }} />
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", marginTop: "10px", color: t.textSub }}>Type</label>
                                    <select value={newPromo.type} onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}>
                                        <option value="percent">Percentage off</option>
                                        <option value="fixed">Fixed amount off</option>
                                    </select>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", marginTop: "10px", color: t.textSub }}>Value</label>
                                    <input type="text" placeholder={newPromo.type === "percent" ? "10" : "50"} value={newPromo.value} onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }} />
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", cursor: "pointer" }}>
                                        <input type="checkbox" checked={newPromo.bogo} onChange={(e) => setNewPromo({ ...newPromo, bogo: e.target.checked })} />
                                        <span style={{ fontSize: "13px" }}>Buy 1 Get 1</span>
                                    </label>
                                </div>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Code</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Type</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Value</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>BOGO</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Valid until</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Usage</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {promotionsArr.length > 0 ? promotionsArr.map((p) => (
                                            <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 700 }}>{p.code}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{p.type === "percent" ? "Percent" : "Fixed"}</td>
                                                <td style={{ padding: "12px" }}>{p.type === "percent" ? p.value + "%" : "₹" + p.value}</td>
                                                <td style={{ padding: "12px" }}>{p.bogo ? "Yes" : "No"}</td>
                                                <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>{p.valid_until}</td>
                                                <td style={{ padding: "12px" }}>{p.usage || 0}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ marginRight: "8px", padding: "2px 8px", borderRadius: "6px", backgroundColor: p.active ? "#22c55e22" : "#ef444422", color: p.active ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: 700 }}>{p.active ? "Active" : "Inactive"}</span>
                                                    <button onClick={() => removePromotion({ id: p.id })} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="7" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No promotions yet. Create coupon codes or Buy 1 Get 1 offers above.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "financials" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Financial reports</h3>
                            <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "24px" }}>Export CSV or PDF for accounting and reconciliation.</p>
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                <button onClick={() => { const csv = "Date,Event,Order ID,Amount,Status\n" + (bookings.length ? bookings.map(b => `${new Date().toISOString().split("T")[0]},${b.eventName || ""},${b.id},${b.amount || "0"},${b.status || "Confirmed"}`).join("\n") : "No data"); const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "financials-report.csv"; a.click(); }} style={{ padding: "12px 24px", backgroundColor: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><FileText size={18} /> Export CSV</button>
                                <button onClick={() => window.print()} style={{ padding: "12px 24px", background: ACCENT_GRADIENT, backgroundColor: ACCENT_PINK, color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 10px 24px rgba(236,72,153,0.14)" }}><FileText size={18} /> Export PDF (print)</button>
                            </div>
                            <div style={{ marginTop: "24px", padding: "20px", border: `1px solid ${t.border}`, borderRadius: "10px", backgroundColor: theme === "light" ? "#f8fafc" : "#0f172a" }}>
                                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: t.textSub }}>Financial Summary</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px" }}>
                                    <div style={{ padding: "16px", background: "#fff", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                        <p style={{ margin: "0", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Total Bookings</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 900 }}>{bookings.length + turfBookings.length}</p>
                                    </div>
                                    <div style={{ padding: "16px", background: "#fff", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                        <p style={{ margin: "0", fontSize: "11px", fontWeight: 800, color: "#22c55e", textTransform: "uppercase" }}>Platform Revenue</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 900 }}>₹{turfBookings.reduce((sum, b) => sum + (b.platform_revenue || 0), 0).toFixed(2)}</p>
                                    </div>
                                    <div style={{ padding: "16px", background: "#fff", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                        <p style={{ margin: "0", fontSize: "11px", fontWeight: 800, color: "#3b82f6", textTransform: "uppercase" }}>GST Collected</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 900 }}>₹{turfBookings.reduce((sum, b) => sum + (b.gst_amount || 0), 0).toFixed(2)}</p>
                                    </div>
                                    <div style={{ padding: "16px", background: "#fff", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                        <p style={{ margin: "0", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Total Gross</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 900 }}>₹{(bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0) + turfBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "categories" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Event Categories</h3>
                                <button onClick={() => setCategoryModal("add")} style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <Plus size={16} /> Add Category
                                </button>
                            </div>
                            <div style={{ border: `1px solid ${t.border}`, borderRadius: "8px", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                    <thead style={{ backgroundColor: theme === 'light' ? "#f8fafc" : "#1e293b", borderBottom: `1px solid ${t.border}` }}>
                                        <tr>
                                            <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>Icon</th>
                                            <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>Slug</th>
                                            <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>Total Events</th>
                                            <th style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((cat) => {
                                            const count = allEvents.filter(e => eventMatchesCategory(e, cat)).length;
                                            return (
                                                <tr key={cat.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                    <td style={{ padding: "12px 16px", fontSize: "18px" }}>{cat.icon}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500 }}>{cat.name}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: "14px", color: t.textSub }}>{cat.slug}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: "14px" }}><span style={{ backgroundColor: theme === "light" ? "#eff6ff" : "#1e3a5f", color: "#3b82f6", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>{count}</span></td>
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <button 
                                                            onClick={() => {
                                                                setEditingCategory(cat);
                                                                setCategoryForm({ name: cat.name, slug: cat.slug, icon: cat.icon || "📁" });
                                                                setCategoryModal("edit");
                                                            }}
                                                            style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", marginRight: "12px", fontWeight: 600 }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={async () => { 
                                                                    try {
                                                                        await removeCategoryMutation({ id: cat.id || cat._id });
                                                                        showToast("Category removed", "success");
                                                                    } catch (err) {
                                                                        showToast("Error removing category", "error");
                                                                    }
                                                            }} 
                                                            style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "support_tickets" && (() => {
                        const TICKET_STATUSES = ["Open", "Pending", "On-Hold", "In-Progress", "Resolved", "Closed"];
                        const updateTicket = (ticketId, updates) => {
                            updateTicketMutation({ id: ticketId, ...updates });
                        };
                        return (
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "16px" }}>Changes here (status, notes) are saved to the same data the Organiser panel uses. Refreshing or reopening Support Tickets in the Organiser panel will show updates. Status changes trigger an email notification to the organiser (hook ready for SMTP).</p>
                                {mappedSupportTickets.length === 0 ? (
                                    <p style={{ fontSize: "14px", color: t.textSub }}>No support tickets yet. Organisers create tickets from their dashboard.</p>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                            <thead>
                                                <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                                                    <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>ID</th>
                                                    <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Subject</th>
                                                    <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Organiser</th>
                                                    <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Status</th>
                                                    <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Created</th>
                                                    <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Admin notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mappedSupportTickets.map((ticket) => (
                                                    <tr key={ticket.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                        <td style={{ padding: "10px 8px", color: t.textMain, fontFamily: "monospace" }}>{ticket.id}</td>
                                                        <td style={{ padding: "10px 8px", color: t.textMain }}>{ticket.subject}</td>
                                                        <td style={{ padding: "10px 8px", color: t.textSub }}>{ticket.organiserName || "—"}</td>
                                                        <td style={{ padding: "10px 8px" }}>
                                                            <select value={ticket.status || "Open"} onChange={(e) => updateTicket(ticket.id, { status: e.target.value })} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                                                {TICKET_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: "10px 8px", color: t.textSub }}>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}</td>
                                                        <td style={{ padding: "10px 8px" }}>
                                                            <textarea key={`${ticket.id}-${ticket.updatedAt || ""}`} defaultValue={ticket.adminNotes || ""} onBlur={(e) => { const v = e.target.value; if ((ticket.adminNotes || "") !== v) updateTicket(ticket.id, { adminNotes: v }); }} placeholder="Admin notes (saved on blur)" rows={2} style={{ width: "100%", minWidth: "160px", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px", resize: "vertical" }} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {activeTab === "hero" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Hero Banner Management</h3>
                                <button onClick={addSlide} className="tab-btn" style={{ padding: "8px 16px", background: ACCENT_GRADIENT, backgroundColor: ACCENT_PINK, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, boxShadow: "0 10px 24px rgba(236,72,153,0.12)" }}>
                                    <Plus size={18} /> Add New Slide
                                </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                                {slides.map((slide) => (
                                    <div key={slide.id} style={{ border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden", backgroundColor: t.bg, display: "flex", flexDirection: "column" }}>
                                        <div style={{ position: "relative", height: "150px" }}>
                                            <img src={slide.img || "/banner-hero-events.png"} alt={slide.alt || "Slide"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <button onClick={() => removeSlide(slide.id, slide._id)} style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                                        </div>
                                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <label style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, textTransform: "uppercase" }}>Image URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="Slide Image URL"
                                                    value={slide.img || ""}
                                                    onChange={(e) => updateSlideLocal(slide.id, 'img', e.target.value)}
                                                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <label style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, textTransform: "uppercase" }}>Title</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Live Concerts"
                                                    value={slide.title || ""}
                                                    onChange={(e) => updateSlideLocal(slide.id, 'title', e.target.value)}
                                                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <label style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, textTransform: "uppercase" }}>Subtitle</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Book your favourite artists"
                                                    value={slide.sub || ""}
                                                    onChange={(e) => updateSlideLocal(slide.id, 'sub', e.target.value)}
                                                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <label style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, textTransform: "uppercase" }}>Target URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="/events or full URL"
                                                    value={slide.url || ""}
                                                    onChange={(e) => updateSlideLocal(slide.id, 'url', e.target.value)}
                                                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                                />
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleSaveSlide(slide)}
                                                style={{ marginTop: "8px", padding: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                                            >
                                                <Save size={16} /> Save Slide
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {slides.length === 0 && (
                                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", border: `2px dashed ${t.border}`, borderRadius: "12px" }}>
                                        <ImageIcon size={48} color={t.textSub} style={{ opacity: 0.3, marginBottom: "16px" }} />
                                        <p style={{ color: t.textSub }}>No slides added yet. Click 'Add New Slide' to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "event_partners" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Event Partners & Organisers</h3>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button
                                        onClick={() => {
                                            setPartnerForm({ name: "", logo: "", url: "" });
                                            setPartnerModal("add");
                                        }}
                                        style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                    >
                                        <Plus size={18} /> Add Partner
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("dashboard")}
                                        style={{ padding: "8px 16px", backgroundColor: "#334155", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                    >
                                        Return to Dashboard
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                                {eventPartners.map(partner => (
                                    <div key={partner.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: `1px solid ${t.border}`, borderRadius: "12px", backgroundColor: t.bg, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                        <div style={{ width: "80px", height: "80px", borderRadius: "12px", backgroundColor: "#f8fafc", overflow: "hidden", flexShrink: 0, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {partner.logo_url ? (
                                                <img src={partner.logo_url} alt={partner.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", mixBlendMode: theme === 'light' ? 'multiply' : 'normal' }} />
                                            ) : (
                                                <ImageIcon size={32} color="#cbd5e1" />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: "0 0 4px 0" }}>{partner.name}</h4>
                                            <p style={{ fontSize: "12px", color: t.textSub, margin: "0 0 12px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{partner.url || "No website linked"}</p>
                                            <div style={{ display: "flex", gap: "12px" }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingPartner(partner);
                                                        setPartnerForm({ name: partner.name, logo: partner.logo_url, url: partner.url || "" });
                                                        setPartnerModal("edit");
                                                    }}
                                                    style={{ display: "flex", alignItems: "center", gap: "6px", color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                            try {
                                                                await removeEventPartnerMutation({ id: partner.id || partner._id });
                                                                showToast("Partner removed", "success");
                                                            } catch (err) {
                                                                showToast("Error removing partner", "error");
                                                            }
                                                    }}
                                                    style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {eventPartners.length === 0 && (
                                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", backgroundColor: t.cardBg, borderRadius: "12px", border: `2px dashed ${t.border}` }}>
                                        <Users size={48} color={t.textSub} style={{ opacity: 0.3, marginBottom: "16px" }} />
                                        <p style={{ color: t.textSub, fontWeight: 600 }}>No event partners have been added yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "memories" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setActiveTab("dashboard")}
                                    style={{ padding: "8px 16px", backgroundColor: "#334155", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                            {/* Upload Form */}
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Add New Memory</h3>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
                                    <div style={{ flex: "1 1 300px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Alt Text / Title</label>
                                        <input
                                            type="text"
                                            value={memoryForm.altText}
                                            onChange={(e) => setMemoryForm({ ...memoryForm, altText: e.target.value })}
                                            placeholder="e.g. Concert at Mumbai"
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                        />
                                    </div>
                                    <div style={{ flex: "1 1 300px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Image</label>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <input
                                                type="text"
                                                value={memoryForm.imageUrl}
                                                readOnly
                                                placeholder="Upload an image..."
                                                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#f1f5f9" : "#0f172a", color: t.textMain, opacity: 0.7 }}
                                            />
                                            <label style={{ padding: "10px 16px", backgroundColor: t.border, borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13px" }}>
                                                {isUploading ? "Uploading..." : <><Upload size={16} /> Upload</>}
                                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadMemory} disabled={isUploading} />
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveMemory}
                                        disabled={!memoryForm.imageUrl || !memoryForm.altText || isUploading}
                                        style={{ padding: "10px 24px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", opacity: (!memoryForm.imageUrl || !memoryForm.altText || isUploading) ? 0.6 : 1 }}
                                    >
                                        Save Memory
                                    </button>
                                </div>
                                {memoryForm.imageUrl && (
                                    <div style={{ width: "200px", height: "120px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${t.border}`, marginTop: "16px" }}>
                                        <img src={memoryForm.imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                )}
                            </div>

                            {/* Memories List */}
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Existing Memories ({memories.length})</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                                    {memories.map((memory) => (
                                        <div key={memory.id} style={{ border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden", backgroundColor: theme === "light" ? "#f8fafc" : "#1e293b", position: "relative" }}>
                                            <div style={{ height: "160px", width: "100%" }}>
                                                <img src={memory.image_url} alt={memory.alt_text} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                            <div style={{ padding: "12px" }}>
                                                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: t.textMain }}>{memory.alt_text}</p>
                                                <p style={{ margin: "4px 0 0", fontSize: "11px", color: t.textSub }}>Added {new Date(memory.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMemory(memory.id)}
                                                style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", zIndex: 10 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {memories.length === 0 && (
                                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: t.textSub }}>
                                            <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: "12px" }} />
                                            <p>No memories found. Upload your first memory above!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "subnav" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Manage Sub Navigation Menu</h3>
                                <button
                                    onClick={() => showToast('Sub navigation menu is auto-saved to backend.', 'info')}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}
                                >
                                    <Save size={18} /> Save
                                </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                                {subnavItems.map((item) => (
                                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                                        <span style={{ fontSize: "20px" }}>{item.icon}</span>
                                        <input
                                            type="text"
                                            value={item.label}
                                            onChange={(e) => {
                                                const newOrder = [...subnavItems];
                                                newOrder[idx] = { ...item, label: e.target.value };
                                                // Mutation logic for updating a single item would go here if implemented, or update the whole set
                                            }}
                                            style={{ flex: 1, padding: "4px 8px", borderRadius: "4px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                        />
                                        <button onClick={() => setSubnavItems(subnavItems.filter(si => si.id !== item.id))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addSubnavItemMutation({ label: "New Item", icon: "✨", order: subnavItems.length })}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", border: `2px dashed ${t.border}`, borderRadius: "8px", background: "none", cursor: "pointer", color: t.textSub }}>
                                    <Plus size={18} /> Add Menu Item
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "video_banner" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Video Banner Settings</h3>
                                <button
                                    onClick={() => showToast('Video Banner menu is saved seamlessly to the frontend via Supabase Config!', 'info')}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}
                                >
                                    <Save size={18} /> Save Settings
                                </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "800px" }}>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Video Format Source (MP4 URL)</label>
                                <input
                                    type="text"
                                    value={videoBannerConfig?.videoUrl || ""}
                                    onChange={(e) => setVideoBannerConfig({ ...videoBannerConfig, videoUrl: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                />

                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Primary Title (Top Line)</label>
                                <input
                                    type="text"
                                    value={videoBannerConfig?.title1 || ""}
                                    onChange={(e) => setVideoBannerConfig({ ...videoBannerConfig, title1: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                />

                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Secondary Title (Bottom Line)</label>
                                <input
                                    type="text"
                                    value={videoBannerConfig?.title2 || ""}
                                    onChange={(e) => setVideoBannerConfig({ ...videoBannerConfig, title2: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                />

                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Subtitle Description</label>
                                <textarea
                                    rows={3}
                                    value={videoBannerConfig?.subtitle || ""}
                                    onChange={(e) => setVideoBannerConfig({ ...videoBannerConfig, subtitle: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, resize: 'vertical' }}
                                />

                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Banner Categories (Comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Concert, Sports, Music"
                                    value={videoBannerConfig?.categories?.join(", ") || ""}
                                    onChange={(e) => {
                                        const cats = e.target.value.split(",").map(c => c.trim()).filter(Boolean);
                                        setVideoBannerConfig({ ...videoBannerConfig, categories: cats });
                                    }}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "meeting_settings" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Internal Meeting Portal Settings</h3>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 700, color: internalMeetingEnabled ? "#22c55e" : "#ef4444" }}>
                                        {internalMeetingEnabled ? "ENABLED" : "DISABLED"}
                                    </span>
                                    <button
                                        onClick={() => setInternalMeetingEnabled(!internalMeetingEnabled)}
                                        style={{ 
                                            position: "relative", 
                                            width: "50px", 
                                            height: "26px", 
                                            borderRadius: "100px", 
                                            backgroundColor: internalMeetingEnabled ? "#22c55e" : "#cbd5e1", 
                                            border: "none", 
                                            cursor: "pointer",
                                            transition: "all 0.3s ease" 
                                        }}
                                    >
                                        <div style={{ 
                                            position: "absolute", 
                                            top: "3px", 
                                            left: internalMeetingEnabled ? "27px" : "3px", 
                                            width: "20px", 
                                            height: "20px", 
                                            borderRadius: "50%", 
                                            backgroundColor: "#fff", 
                                            transition: "all 0.3s ease",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                        }} />
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', padding: "20px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "#3b82f620", color: "#3b82f6" }}>
                                        <Video size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: t.textMain }}>Internal Meeting Portal Access</h4>
                                        <p style={{ margin: "8px 0 0", fontSize: "14px", color: t.textSub, lineHeight: "1.6" }}>
                                            When enabled, organisers can generate platform-managed meeting links for virtual events. When disabled, organisers are forced to provide external meeting links (Zoom, Google Meet, Microsoft Teams, etc.).
                                        </p>
                                        {!internalMeetingEnabled && (
                                            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", backgroundColor: "#ef444410", color: "#ef4444", border: "1px solid #ef444420", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
                                                <AlertCircle size={16} />
                                                Organisers will only see the 'External Link' option when creating virtual events.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "copyright" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Copyright & Footer</h3>
                                <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>This text appears in the footer on the home page.</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "800px" }}>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Copyright Text</label>
                                <input
                                    type="text"
                                    placeholder="© Copyright 2026 – BookMyTicket. All Rights Reserved."
                                    value={footerCopyrightConfig?.copyrightText || ""}
                                    onChange={(e) => setFooterCopyrightConfig({ ...footerCopyrightConfig, copyrightText: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                />
                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Privacy Policy URL</label>
                                <input
                                    type="text"
                                    placeholder="# or https://..."
                                    value={footerCopyrightConfig?.privacyUrl || ""}
                                    onChange={(e) => setFooterCopyrightConfig({ ...footerCopyrightConfig, privacyUrl: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                />
                                <label style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, marginBottom: "-8px" }}>Terms of Service URL</label>
                                <input
                                    type="text"
                                    placeholder="# or https://..."
                                    value={footerCopyrightConfig?.termsUrl || ""}
                                    onChange={(e) => setFooterCopyrightConfig({ ...footerCopyrightConfig, termsUrl: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "events_settings" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Featured Events Selection</h3>
                            <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "20px" }}>Toggle which events appear in the 'Featured' section on the Home Page.</p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Event</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Category</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Is Featured?</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((ev) => (
                                            <tr key={ev.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{ev.title}</td>
                                                <td style={{ padding: "12px", color: t.textSub }}>{ev.category}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <button
                                                        onClick={() => setEvents(events.map(e => e.id === ev.id ? { ...e, isFeatured: !e.isFeatured } : e))}
                                                        style={{
                                                            padding: "6px 12px",
                                                            borderRadius: "6px",
                                                            border: "none",
                                                            backgroundColor: ev.isFeatured ? "#22c55e" : "#f1f5f9",
                                                            color: ev.isFeatured ? "#fff" : "#64748b",
                                                            cursor: "pointer",
                                                            fontSize: "12px",
                                                            fontWeight: 600
                                                        }}>
                                                        {ev.isFeatured ? "Featured" : "No"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "sections" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Sections Display Order</h3>
                            <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "20px" }}>Drag or use arrows to reorder sections on the home page.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {homeSectionsOrder.map((sect, idx) => (
                                    <div key={sect} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ color: t.textSub, fontWeight: "bold" }}>#{idx + 1}</span>
                                            <span style={{ fontWeight: 600 }}>{sect}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => {
                                                    if (idx === 0) return;
                                                    const newOrder = [...homeSectionsOrder];
                                                    [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
                                                    setHomeSectionsOrder(newOrder);
                                                }}
                                                style={{ background: "none", border: `1px solid ${t.border}`, color: t.textSub, borderRadius: "4px", padding: "4px", cursor: "pointer" }}><Plus size={14} style={{ transform: "rotate(180deg)" }} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (idx === homeSectionsOrder.length - 1) return;
                                                    const newOrder = [...homeSectionsOrder];
                                                    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
                                                    setHomeSectionsOrder(newOrder);
                                                }}
                                                style={{ background: "none", border: `1px solid ${t.border}`, color: t.textSub, borderRadius: "4px", padding: "4px", cursor: "pointer" }}><Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "site_branding" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Site Branding & Logo</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Site Name</label>
                                        <input
                                            type="text"
                                            value={localBranding.name || ""}
                                            onChange={(e) => setLocalBranding({ ...localBranding, name: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Logo URL</label>
                                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                            <input
                                                type="text"
                                                placeholder="e.g. /logo.png or https://..."
                                                value={localBranding.logo_url || ""}
                                                onChange={(e) => setLocalBranding({ ...localBranding, logo_url: e.target.value })}
                                                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                            />
                                            <label style={{ padding: "10px 16px", backgroundColor: t.border, borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "12px", color: t.textMain }}>
                                                <Upload size={16} /> Upload
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    style={{ display: "none" }} 
                                                    onChange={(e) => handleBrandingUpload(e.target.files[0], 'logo')}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Logomark Color</label>
                                        <input
                                            type="color"
                                            value={localBranding.logo_color || "#111111"}
                                            onChange={(e) => setLocalBranding({ ...localBranding, logo_color: e.target.value })}
                                            style={{ width: "60px", height: "40px", padding: "2px", borderRadius: "4px", border: "none", cursor: "pointer" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Public Site URL (for Emails)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. https://bookmyticket.in"
                                            value={localBranding.site_url || ""}
                                            onChange={(e) => setLocalBranding({ ...localBranding, site_url: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                        <p style={{ fontSize: "11px", color: t.textSub, marginTop: "4px", marginBottom: 0 }}>This is used to construct full image URLs in transactional emails.</p>
                                    </div>
                                    <div style={{ padding: "16px", backgroundColor: "#f1f5f9", borderRadius: "12px", marginTop: "10px" }}>
                                        <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#334155" }}>"Powered By" Branding</h4>
                                        <div style={{ marginBottom: "12px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Powered By Logo URL</label>
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. /powered-by.png"
                                                    value={localBranding.powered_by_logo_url || ""}
                                                    onChange={(e) => setLocalBranding({ ...localBranding, powered_by_logo_url: e.target.value })}
                                                    style={{ flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: "#fff", color: "#1e293b" }}
                                                />
                                                <label style={{ padding: "8px 12px", backgroundColor: "#e2e8f0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "11px", color: "#1e293b" }}>
                                                    <Upload size={14} />
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        style={{ display: "none" }} 
                                                        onChange={(e) => handleBrandingUpload(e.target.files[0], 'powered_by')}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Powered By Link URL</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. https://bookmyticket.net"
                                                value={localBranding.powered_by_link || ""}
                                                onChange={(e) => setLocalBranding({ ...localBranding, powered_by_link: e.target.value })}
                                                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: "#fff", color: "#1e293b" }}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async (e) => {
                                            const btn = e.target;
                                            const originalText = btn.innerText;
                                            btn.innerText = "Saving...";
                                            try {
                                                let finalUrl = localBranding.logo_url || "";
                                                if (finalUrl.includes("public/")) {
                                                    finalUrl = "/" + finalUrl.split("public/")[1];
                                                }
                                                
                                                let finalSiteUrl = localBranding.site_url || "";
                                                if (finalSiteUrl.endsWith("/")) {
                                                    finalSiteUrl = finalSiteUrl.slice(0, -1);
                                                }

                                                const payload = {
                                                    id: localBranding.id,
                                                    name: localBranding.name || "BookMyTicket",
                                                    logo_color: localBranding.logo_color || "#111111",
                                                    logo_url: finalUrl,
                                                    site_url: finalSiteUrl,
                                                    powered_by_logo_url: localBranding.powered_by_logo_url,
                                                    powered_by_link: localBranding.powered_by_link
                                                };

                                                await updateSiteBranding(payload);
                                                
                                                btn.innerText = "Saved!";
                                                setTimeout(() => { btn.innerText = originalText; }, 2000);
                                                showToast("Branding updated successfully!", "success");
                                            } catch(err) {
                                                showToast("Error saving: " + err.message, "error");
                                                btn.innerText = originalText;
                                            }
                                        }}
                                        style={{ padding: "12px 24px", borderRadius: "8px", background: `linear-gradient(135deg, ${localBranding.logo_color || '#3b82f6'}, #1d4ed8)`, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", marginTop: "10px", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                                    >
                                        Save Branding Info
                                    </button>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Logo Preview</label>
                                    <div style={{ padding: "40px", border: `2px dashed ${t.border}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', overflow: "hidden", gap: "24px" }}>
                                        <div style={{ textAlign: "center" }}>
                                            <p style={{ fontSize: "10px", color: t.textSub, marginBottom: "8px", textTransform: "uppercase", fontWeight: 700 }}>Main Logo</p>
                                            {localBranding.logo_url ? (
                                                <img
                                                    key={`img-${localBranding.logo_url}`}
                                                    src={localBranding.logo_url}
                                                    alt="Logo Preview"
                                                    style={{ height: "60px", objectFit: "contain", filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none' }}
                                                />
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{ width: "48px", height: "48px", background: `linear-gradient(135deg, ${localBranding.logo_color}, #3b82f6)`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 15px rgba(37, 99, 235, 0.3)" }}>
                                                        <Ticket color="#fff" size={28} />
                                                    </div>
                                                    <span style={{ fontSize: "24px", fontWeight: 800, color: t.textMain }}>{localBranding.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ textAlign: "center", borderTop: `1px solid ${t.border}`, paddingTop: "24px", width: "100%" }}>
                                            <p style={{ fontSize: "10px", color: t.textSub, marginBottom: "8px", textTransform: "uppercase", fontWeight: 700 }}>"Powered By" Logo</p>
                                            {localBranding.powered_by_logo_url ? (
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Powered By</span>
                                                    <img
                                                        key={`pb-${localBranding.powered_by_logo_url}`}
                                                        src={localBranding.powered_by_logo_url}
                                                        alt="Powered By Preview"
                                                        style={{ height: "40px", objectFit: "contain", filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none' }}
                                                    />
                                                </div>
                                            ) : (
                                                <p style={{ color: t.textSub, fontSize: "12px" }}>No "Powered By" logo</p>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "12px", color: t.textSub, marginTop: "12px" }}>Logo images with transparent backgrounds work best.</p>
                                </div>
                            </div>

                            <hr style={{ margin: "40px 0", borderColor: t.border }} />

                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Brand Premium Banner Pricing</h3>
                            <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "24px" }}>Configure the Monthly and Yearly price for brands to upload Hero Banners on the Home Page.</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Monthly Price (₹)</label>
                                    <input
                                        type="number"
                                        value={brandingPricing.monthlyPrice}
                                        onChange={(e) => setBrandingPricing({ ...brandingPricing, monthlyPrice: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Yearly Price (₹)</label>
                                    <input
                                        type="number"
                                        value={brandingPricing.yearlyPrice}
                                        onChange={(e) => setBrandingPricing({ ...brandingPricing, yearlyPrice: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSaveBrandingPricing}
                                style={{
                                    padding: "10px 24px",
                                    borderRadius: "8px",
                                    background: ACCENT_GRADIENT,
                                    color: "#fff",
                                    fontWeight: 600,
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                Save Pricing
                            </button>
                        </div>
                    )}

                    {activeTab === "branding_partners" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Branding Partners KYC</h3>
                                <p style={{ fontSize: "13px", color: t.textSub }}>{allBrandingKYC.length} total applications</p>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Org Name</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Location</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Tax IDs</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allBrandingKYC.length > 0 ? allBrandingKYC.map((kyc) => (
                                            <tr key={kyc.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ fontWeight: 700 }}>{kyc.org_name}</div>
                                                    <div style={{ fontSize: "11px", color: t.textSub }}>ID: {kyc.brand_id ? kyc.brand_id.slice(-8) : 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>
                                                    {kyc.city}, {kyc.state}
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>
                                                    <div>GST: {kyc.gst_number}</div>
                                                    <div>PAN: {kyc.pan_number}</div>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ 
                                                        fontSize: "11px", 
                                                        padding: "4px 10px", 
                                                        borderRadius: "20px", 
                                                        fontWeight: 700,
                                                        backgroundColor: kyc.status === "Verified" ? "#22c55e22" : kyc.status === "Rejected" ? "#ef444422" : "#f59e0b22",
                                                        color: kyc.status === "Verified" ? "#22c55e" : kyc.status === "Rejected" ? "#ef4444" : "#f59e0b"
                                                    }}>
                                                        {kyc.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {kyc.status === "Pending Review" || kyc.status === "Verification Pending" ? (
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button 
                                                                onClick={() => verifyKYCMutation({ id: kyc.id, status: "Verified" })}
                                                                style={{ padding: "6px 12px", backgroundColor: "#22c55e", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => verifyKYCMutation({ id: kyc.id, status: "Rejected" })}
                                                                style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: "12px", color: t.textSub }}>No actions available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No Branding Partner KYC requests found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {["all_org", "active_org", "banned_org", "email_unverified", "mobile_unverified", "kyc_unverified", "kyc_pending", "kyc_verified", "with_balance"].includes(activeTab) && (
                        <>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                                        {activeTab === "all_org" ? "Manage Organizers" :
                                            activeTab.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    </h3>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type="text"
                                                placeholder="Search organizers..."
                                                style={{ padding: "8px 12px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", width: "200px" }}
                                            />
                                        </div>
                                        {/* Manual creation removed as per new workflow request */}
                                    </div>
                                </div>
                                <div className="table-container" style={{ position: "relative", paddingBottom: "160px" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Username</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Email</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Balance</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mappedOrganizers.filter(org => {
                                                if (activeTab === "all_org") return true;
                                                if (activeTab === "active_org") return ["Active", "KYC Completed", "KYC Verified"].includes(org.status);
                                                if (activeTab === "banned_org") return ["Banned", "Rejected"].includes(org.status);
                                                if (activeTab === "kyc_pending") return ["KYC Pending", "Start Onboarding", "NOT STARTED", "Not Started"].includes(org.status);
                                                if (activeTab === "kyc_verified") return ["Submitted", "Under Review", "Pending"].includes(org.status);
                                                if (activeTab === "with_balance") return parseFloat(String(org.balance).replace(/[^\d.-]/g, '')) > 0;
                                                if (activeTab === "email_unverified") return String(org.id).length % 2 === 0; // Fixed temporary logic
                                                if (activeTab === "mobile_unverified") return String(org.id).length % 3 === 0; // Fixed temporary logic
                                                if (activeTab === "kyc_unverified") return !["KYC Pending", "Pending", "Submitted", "Active", "KYC Completed"].includes(org.status);
                                                if (activeTab === "service_mehendi") return org.category === "Mehendi Artist";
                                                if (activeTab === "service_photo") return org.category === "Photographer/Studio";
                                                if (activeTab === "service_makeup") return org.category === "Makeup Artist";
                                                return true;
                                            }).map((org) => (
                                                <tr key={org.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                    <td style={{ padding: "12px", fontWeight: 600, color: t.textMain }}>{org.username}</td>
                                                    <td style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>{org.email}</td>
                                                    <td style={{ padding: "12px" }}>
                                                        <span style={{
                                                            padding: "4px 10px",
                                                            borderRadius: "20px",
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            backgroundColor:
                                                                (org.kyc_status === 'Active' || org.kyc_status === 'KYC Completed') ? '#22c55e15' :
                                                                    org.kyc_status === 'Banned' ? '#ef444415' :
                                                                        (org.kyc_status === 'Submitted' || org.kyc_status === 'Pending') ? '#3b82f615' :
                                                                        (org.kyc_status === 'KYC Pending' || org.kyc_status === 'Start Onboarding') ? '#f9731615' : '#64748b15',
                                                            color:
                                                                (org.kyc_status === 'Active' || org.kyc_status === 'KYC Completed') ? '#22c55e' :
                                                                    org.kyc_status === 'Banned' ? '#ef4444' :
                                                                        (org.kyc_status === 'Submitted' || org.kyc_status === 'Pending') ? '#3b82f6' :
                                                                        (org.kyc_status === 'KYC Pending' || org.kyc_status === 'Start Onboarding') ? '#f97316' : t.textSub
                                                        }}>
                                                            {org.kyc_status === 'Submitted' || org.kyc_status === 'Pending' ? 'UNDER REVIEW' : 
                                                             org.kyc_status === 'KYC Pending' || org.kyc_status === 'Start Onboarding' ? 'KYC PENDING' : 
                                                             org.kyc_status === 'KYC Completed' ? 'ACTIVE' : (org.kyc_status || 'NOT STARTED').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px", color: t.textMain, fontSize: "13px", fontWeight: 600 }}>{org.balance}</td>
                                                    <td style={{ padding: "12px", position: "relative" }}>
                                                        <button onClick={() => setOpenActionDropdown(openActionDropdown === org.id ? null : org.id)} style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        {openActionDropdown === org.id && (
                                                            <div style={{ position: "absolute", right: "20px", top: "45px", backgroundColor: theme === 'light' ? '#fff' : '#1e293b', border: `1px solid ${t.border}`, borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, width: "160px", overflow: "hidden" }}>
                                                                    <button onClick={(e) => { e.stopPropagation(); setEditingOrg(org); setIsEditModalOpen(true); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: t.textMain, fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <Save size={16} /> Edit Profile
                                                                    </button>
                                                                {(org.kyc_status === 'KYC Pending' || org.kyc_status === 'Pending' || org.kyc_status === 'Submitted' || org.kyc_status === 'Start Onboarding') && (
                                                                    <>
                                                                        <button onClick={() => { setSelectedKycOrg(org); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                            <FileText size={16} /> View KYC
                                                                        </button>

                                                                        <button onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            patchOrganizerMutation({ id: org.id, kyc_status: 'KYC Completed' });
                                                                            setOpenActionDropdown(null);
                                                                        }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#22c55e", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                            <CheckCircle size={16} /> Approve KYC
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {org.kyc_status !== 'Active' && (
                                                                    <button onClick={async (e) => { e.stopPropagation(); await patchOrganizerMutation({ id: org.id, kyc_status: 'Active' }); refreshVendors(); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#22c55e", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <CheckCircle size={16} /> Mark as Active
                                                                    </button>
                                                                )}
                                                                {org.kyc_status !== 'Inactive' && (
                                                                    <button onClick={async (e) => { e.stopPropagation(); await patchOrganizerMutation({ id: org.id, kyc_status: 'Inactive' }); refreshVendors(); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#f97316", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <AlertCircle size={16} /> Mark as Inactive
                                                                    </button>
                                                                )}
                                                                {org.kyc_status !== 'Banned' && (
                                                                    <button onClick={async (e) => { e.stopPropagation(); await patchOrganizerMutation({ id: org.id, kyc_status: 'Banned' }); refreshVendors(); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <Bell size={16} /> Ban User
                                                                    </button>
                                                                )}
                                                                {org.kyc_status !== 'Rejected' && (
                                                                    <button onClick={async (e) => { e.stopPropagation(); await patchOrganizerMutation({ id: org.id, kyc_status: 'Rejected' }); refreshVendors(); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <X size={16} /> Reject User
                                                                    </button>
                                                                )}
                                                                <div style={{ borderTop: `1px solid ${t.border}`, margin: "4px 0" }}></div>
                                                                <button onClick={async (e) => { e.stopPropagation(); removeOrganizerMutation({ id: org.id }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                    <Trash2 size={16} /> Delete User
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}



                    {["service_active", "service_banned"].includes(activeTab) && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "4px", height: "24px", background: ACCENT_GRADIENT, borderRadius: "2px" }}></div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                                        {activeTab === "service_active" ? "Active Service Providers" : "Banned Service Providers"}
                                    </h3>
                                    <span style={{ fontSize: "12px", background: `${ACCENT_BLUE}15`, color: ACCENT_BLUE, padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                                        {(activeTab === "service_active" ? serviceActive : serviceBanned).length} Total
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center", background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: "6px 12px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                    <span style={{ fontSize: "12px", color: t.textSub, fontWeight: 600 }}>Filter:</span>
                                    <select 
                                        value={serviceCategoryFilter}
                                        onChange={(e) => setServiceCategoryFilter(e.target.value)}
                                        style={{ padding: "6px 10px", borderRadius: "8px", border: "none", background: "transparent", color: t.textMain, fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
                                    >
                                        <option value="all">All Categories</option>
                                        {Array.from(new Set(serviceProvidersArr.map(s => s.category || s.kyc_details?.category).filter(Boolean))).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ overflowX: "auto", paddingBottom: "160px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeTab === "service_active" ? serviceActive : serviceBanned).map((org) => (
                                            <tr key={org.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>
                                                    {org.business_name || org.name || "Unnamed"}
                                                </td>
                                                <td style={{ padding: "12px" }}>{org.profiles?.email || org.email || org.id?.slice(0, 8)}</td>
                                                <td style={{ padding: "12px" }}>{org.category || "Professional Service"}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        {activeTab === "service_active" && (
                                                            <button onClick={() => supabase.from('vendors').update({ kyc_status: "Banned", is_approved: false }).eq('id', org.id)} style={{ padding: "6px 12px", borderRadius: "6px", background: "#ef444415", color: "#ef4444", border: "none", cursor: "pointer", fontWeight: 600 }}>Ban</button>
                                                        )}
                                                        {activeTab === "service_banned" && (
                                                            <button onClick={() => supabase.from('vendors').update({ kyc_status: "Active", is_approved: true }).eq('id', org.id)} style={{ padding: "6px 12px", borderRadius: "6px", background: "#22c55e15", color: "#22c55e", border: "none", cursor: "pointer", fontWeight: 600 }}>Activate</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {((activeTab === "service_active" ? serviceActive : serviceBanned).length === 0) && 
                                   <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No users found</div>}
                            </div>
                        </div>
                    )}


                    {activeTab === "partner_requests" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: 900, color: t.textMain }}>Partner Requests</h3>
                            </div>
                             <AdminPartnerRequestsTable t={t} router={router} theme={theme} />
                        </div>
                    )}

                    {activeTab === "send_notif" && (
                        <div style={{ maxWidth: "800px" }}>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Broadcast Notification</h2>
                                <p style={{ fontSize: "14px", color: t.textSub, margin: 0 }}>Send email and system notifications to organisers on your platform</p>
                            </div>

                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Select Target Audience</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                                            {[
                                                { id: 'all', label: 'All Organisers', count: mappedOrganizers.length },
                                                { id: 'active', label: 'Active Only', count: mappedOrganizers.filter(o => o.status === 'Active').length },
                                                { id: 'pending', label: 'KYC Pending', count: mappedOrganizers.filter(o => ["KYC Pending", "Pending", "Submitted"].includes(o.status)).length }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setNotificationForm({ ...notificationForm, target: opt.id })}
                                                    style={{
                                                        padding: "16px",
                                                        borderRadius: "12px",
                                                        border: `2px solid ${notificationForm.target === opt.id ? "#3b82f6" : t.border}`,
                                                        backgroundColor: notificationForm.target === opt.id ? "#3b82f610" : "transparent",
                                                        color: notificationForm.target === opt.id ? "#3b82f6" : t.textSub,
                                                        textAlign: "left",
                                                        cursor: "pointer",
                                                        transition: "0.2s"
                                                    }}>
                                                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{opt.label}</p>
                                                    <p style={{ margin: "4px 0 0", fontSize: "11px", opacity: 0.8 }}>{opt.count} Recipients</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Email Subject</label>
                                        <input
                                            type="text"
                                            placeholder="Enter notification subject..."
                                            value={notificationForm.subject}
                                            onChange={(e) => setNotificationForm({ ...notificationForm, subject: e.target.value })}
                                            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "14px" }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Notification Message</label>
                                        <textarea
                                            placeholder="Write your message here... You can use HTML formatting."
                                            rows={8}
                                            value={notificationForm.message}
                                            onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                                            style={{ width: "100%", padding: "16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "14px", resize: "vertical", fontFamily: "inherit" }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", backgroundColor: "#fef9c330", borderRadius: "10px", border: "1px solid #fde04730" }}>
                                        <Shield size={18} color="#eab308" />
                                        <p style={{ margin: 0, fontSize: "12px", color: "#eab308" }}>Notifications will be sent via the SMTP server configured in Email Settings.</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!notificationForm.subject || !notificationForm.message) {
                                                showToast("Please fill in both subject and message.", "warning");
                                                return;
                                            }
                                            const targetCount = notificationForm.target === 'all' ? mappedOrganizers.length :
                                                notificationForm.target === 'active' ? mappedOrganizers.filter(o => o.status === 'Active').length :
                                                    mappedOrganizers.filter(o => ["KYC Pending", "Pending", "Submitted"].includes(o.status)).length;

                                            await sendNotificationMutation({
                                                subject: notificationForm.subject,
                                                message: notificationForm.message,
                                                target: notificationForm.target
                                            });

                                            showToast(`Broadcast initiated! Notifications saved to history and sent to ${targetCount} recipients.`, "success");
                                            setNotificationForm({ subject: "", message: "", target: "all" });
                                        }}
                                        style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "14px", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "0.2s" }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
                                        onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}>
                                        <Mail size={18} /> Send Broadcast Notification
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === "payment_settings" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Payment Gateway Integration</h2>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Configure and manage your platform's payment processing methods</p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                                {[
                                    { name: "Stripe", desc: "Global payments, Cards, Apple Pay", color: "#6366f1" },
                                    { name: "PayPal", desc: "Global payments, Wallet, PayPal Credit", color: "#003087" },
                                    { name: "Razorpay", desc: "Cards, UPI, Netbanking (India)", color: "#339af0" },
                                    { name: "PayU", desc: "Enterprise checkout & UPI solutions", color: "#a4c639" },
                                    { name: "PhonePe", desc: "Direct UPI & merchant payments", color: "#6739b7" },
                                    { name: "Paytm", desc: "Wallet, UPI & Netbanking payments", color: "#00b9f1" }
                                ].map((gw) => {
                                    const config = rawPaymentGateways.find(g => g.name === gw.name) || { is_enabled: false, config: {} };
                                    const isConnected = config.is_enabled && (config.config?.apiKey || "").trim().length > 0;
                                    const status = isConnected ? "Connected" : "Inactive";
                                    return (
                                        <div key={gw.name} style={{
                                            backgroundColor: theme === 'light' ? '#ffffff' : t.cardBg,
                                            padding: "20px",
                                            borderRadius: "12px",
                                            border: `1px solid ${t.border}`,
                                            display: "flex",
                                            flexDirection: "column",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                            transition: "0.2s",
                                            cursor: "default"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                                <div style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    backgroundColor: `${gw.color}20`,
                                                    borderRadius: "10px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}>
                                                    <CreditCard size={20} color={gw.color} />
                                                </div>
                                                <span style={{
                                                    fontSize: "10px",
                                                    fontWeight: 700,
                                                    padding: "3px 8px",
                                                    borderRadius: "20px",
                                                    backgroundColor: status === 'Connected' ? '#22c55e20' : '#f1f5f9',
                                                    color: status === 'Connected' ? '#22c55e' : '#64748b'
                                                }}>{status.toUpperCase()}</span>
                                            </div>
                                            <h4 style={{ fontSize: "15px", fontWeight: 700, color: t.textMain, margin: "0 0 6px 0" }}>{gw.name}</h4>
                                            <p style={{ fontSize: "12px", color: t.textSub, margin: "0 0 16px 0", lineHeight: "1.4" }}>{gw.desc}</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = rawPaymentGateways.find(g => g.name === gw.name);
                                                    setPaymentGatewayConfig(current || { name: gw.name, is_enabled: false, config: {}, test_mode: true });
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "8px",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${t.border}`,
                                                    backgroundColor: "transparent",
                                                    color: t.textMain,
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "0.2s"
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = t.bg; }}
                                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                            >
                                                Configure Settings
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Convenience Fee & GST — Admin only; organiser receives only base ticket amount */}
                            <div style={{ marginTop: "32px", padding: "24px", backgroundColor: theme === 'light' ? '#f8fafc' : t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: "0 0 8px 0" }}>Convenience Fee & GST</h3>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: "0 0 20px 0" }}>Only admins can change these. Customer pays: Ticket price + Convenience Fee + GST = Total. Organiser wallet is credited only the base ticket amount.</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Convenience fee</label>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <select
                                                value={localFeeSettings.convenienceFeeType}
                                                onChange={(e) => setLocalFeeSettings(f => ({ ...f, convenienceFeeType: e.target.value }))}
                                                style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "13px" }}
                                            >
                                                <option value="percent">Percent (%)</option>
                                                <option value="fixed">Fixed (₹)</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="0"
                                                step={localFeeSettings.convenienceFeeType === "percent" ? 0.5 : 1}
                                                value={localFeeSettings.convenienceFeeValue}
                                                onChange={(e) => setLocalFeeSettings(f => ({ ...f, convenienceFeeValue: parseFloat(e.target.value) || 0 }))}
                                                style={{ width: "80px", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "13px" }}
                                            />
                                            <span style={{ fontSize: "13px", color: t.textSub }}>{localFeeSettings.convenienceFeeType === "percent" ? "%" : "₹"}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>GST (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={localFeeSettings.gstPercent}
                                            onChange={(e) => setLocalFeeSettings(f => ({ ...f, gstPercent: parseFloat(e.target.value) || 0 }))}
                                            style={{ width: "80px", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "13px" }}
                                        />
                                        <span style={{ fontSize: "13px", color: t.textSub, marginLeft: "4px" }}>%</span>
                                    </div>

                                    <button
                                        onClick={handleSaveFees}
                                        disabled={isSavingFees}
                                        style={{
                                            padding: "10px 24px",
                                            borderRadius: "10px",
                                            background: "linear-gradient(135deg, #FF1CF7 0%, #00E0FF 100%)",
                                            color: "white",
                                            border: "none",
                                            cursor: isSavingFees ? "not-allowed" : "pointer",
                                            fontWeight: 700,
                                            fontSize: "13px",
                                            opacity: isSavingFees ? 0.7 : 1,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                            transition: "all 0.3s ease",
                                            marginLeft: "auto"
                                        }}
                                        onMouseOver={(e) => { 
                                           if(!isSavingFees) {
                                               e.currentTarget.style.transform = "translateY(-2px)";
                                               e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
                                           }
                                        }}
                                        onMouseOut={(e) => { 
                                           if(!isSavingFees) {
                                               e.currentTarget.style.transform = "translateY(0)";
                                               e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                           }
                                        }}
                                    >
                                        {isSavingFees ? "Saving..." : "Save Settings"}
                                    </button>
                                </div>
                            </div>

                            {/* Payment gateway config modal */}
                            {paymentGatewayConfig && (
                                <div
                                    style={{
                                        position: "fixed",
                                        inset: 0,
                                        backgroundColor: "rgba(0,0,0,0.5)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 9999,
                                        padding: "20px"
                                    }}
                                    onClick={() => setPaymentGatewayConfig(null)}
                                >
                                    <div
                                        style={{
                                            backgroundColor: t.cardBg,
                                            borderRadius: "12px",
                                            border: `1px solid ${t.border}`,
                                            padding: "24px",
                                            maxWidth: "440px",
                                            width: "100%",
                                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                            <h3 style={{ fontSize: "18px", fontWeight: 700, color: t.textMain, margin: 0 }}>Configure {paymentGatewayConfig.name}</h3>
                                            <button type="button" onClick={() => setPaymentGatewayConfig(null)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub, padding: "4px" }}><X size={20} /></button>
                                        </div>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}>
                                            <input type="checkbox" checked={!!paymentGatewayConfig.isEnabled} onChange={(e) => setPaymentGatewayConfig({ ...paymentGatewayConfig, isEnabled: e.target.checked })} />
                                            <span style={{ fontSize: "14px", fontWeight: 600, color: t.textMain }}>Enable this gateway</span>
                                        </label>
                                        <div style={{ marginBottom: "12px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: t.textMain }}>
                                                {paymentGatewayConfig.name === "PayPal" ? "Client ID" : "API Key / Publishable Key"}
                                            </label>
                                            <input
                                                type="password"
                                                placeholder={paymentGatewayConfig.name === "PayPal" ? "Enter Client ID" : "pk_live_... or key id"}
                                                value={paymentGatewayConfig.config?.apiKey || ""}
                                                onChange={(e) => setPaymentGatewayConfig({ ...paymentGatewayConfig, config: { ...paymentGatewayConfig.config, apiKey: e.target.value } })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "13px" }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: "12px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: t.textMain }}>
                                                {paymentGatewayConfig.name === "PayPal" ? "Secret Key / App Secret" : "Secret Key"}
                                            </label>
                                            <input
                                                type="password"
                                                placeholder={paymentGatewayConfig.name === "PayPal" ? "Enter Secret Key" : "sk_live_... or secret"}
                                                value={paymentGatewayConfig.config?.secretKey || ""}
                                                onChange={(e) => setPaymentGatewayConfig({ ...paymentGatewayConfig, config: { ...paymentGatewayConfig.config, secretKey: e.target.value } })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "13px" }}
                                            />
                                        </div>
                                        {paymentGatewayConfig.name === "Stripe" && (
                                            <div style={{ marginBottom: "12px" }}>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: t.textMain }}>Webhook Secret (optional)</label>
                                                <input
                                                    type="password"
                                                    placeholder="whsec_..."
                                                    value={paymentGatewayConfig.config?.webhookSecret || ""}
                                                    onChange={(e) => setPaymentGatewayConfig({ ...paymentGatewayConfig, config: { ...paymentGatewayConfig.config, webhookSecret: e.target.value } })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "13px" }}
                                                />
                                            </div>
                                        )}
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                                            <button type="button" onClick={() => setPaymentGatewayConfig(null)} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, cursor: "pointer", fontSize: "14px" }}>Cancel</button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (paymentGatewayConfig._id) {
                                                        await patchPaymentGatewayMutation({
                                                            id: paymentGatewayConfig._id,
                                                            isEnabled: paymentGatewayConfig.isEnabled,
                                                            config: paymentGatewayConfig.config,
                                                            testMode: paymentGatewayConfig.testMode
                                                        });
                                                    } else {
                                                        await addPaymentGatewayMutation({
                                                            name: paymentGatewayConfig.name,
                                                            isEnabled: paymentGatewayConfig.isEnabled,
                                                            config: paymentGatewayConfig.config,
                                                            testMode: paymentGatewayConfig.testMode
                                                        });
                                                    }
                                                    setPaymentGatewayConfig(null);
                                                }}
                                                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Save</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "ticket_settings" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Ticket & Notifications</h2>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Configure ticket image/PDF format, company branding, and how tickets are sent (SMS, Email, WhatsApp PDF) after booking.</p>
                            </div>

                            <div style={{ backgroundColor: theme === "light" ? "#fff" : t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: "0 0 16px 0" }}>Company branding (on ticket)</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Company name</label>
                                        <input
                                            type="text"
                                            value={ticketSettings.companyName || ""}
                                            onChange={(e) => updateTicketSettingsMutation({ ...ticketSettings, companyName: e.target.value })}
                                            placeholder="book my ticket"
                                            style={{ width: "100%", maxWidth: "400px", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Logo URL (optional)</label>
                                        <input
                                            type="url"
                                            value={ticketSettings.logoUrl || ""}
                                            onChange={(e) => updateTicketSettingsMutation({ ...ticketSettings, logoUrl: e.target.value })}
                                            placeholder="https://..."
                                            style={{ width: "100%", maxWidth: "400px", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Support / website URL</label>
                                        <input
                                            type="url"
                                            value={ticketSettings.supportUrl || ""}
                                            onChange={(e) => updateTicketSettingsMutation({ ...ticketSettings, supportUrl: e.target.value })}
                                            placeholder="https://www.bookmyticket.com"
                                            style={{ width: "100%", maxWidth: "400px", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: theme === "light" ? "#fff" : t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: "0 0 16px 0" }}>Important information (on ticket)</h3>
                                <textarea
                                    value={ticketSettings.importantInfo || ""}
                                    onChange={(e) => updateTicketSettingsMutation({ ...ticketSettings, importantInfo: e.target.value })}
                                    placeholder="Terms, entry instructions, contact info..."
                                    rows={5}
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px", resize: "vertical" }}
                                />
                            </div>

                            <div style={{ backgroundColor: theme === "light" ? "#fff" : t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: "0 0 16px 0" }}>Ticket sending workflow</h3>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: "0 0 16px 0" }}>When a booking is confirmed, customers can use these options. Enable or disable each channel.</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                                        <input type="checkbox" checked={!!ticketSettings.sendViaEmail} onChange={(e) => updateTicketSettingsMutation({ ...ticketSettings, sendViaEmail: e.target.checked })} />
                                        <span style={{ fontSize: "14px", fontWeight: 600, color: t.textMain }}>Send ticket to Email</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                                        <input type="checkbox" checked={!!ticketSettings.sendViaSms} onChange={(e) => updateTicketSettingsMutation({ ...ticketSettings, sendViaSms: e.target.checked })} />
                                        <span style={{ fontSize: "14px", fontWeight: 600, color: t.textMain }}>Send SMS (mobile)</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                                        <input type="checkbox" checked={!!ticketSettings.sendPdfWhatsApp} onChange={(e) => updateTicketSettingsMutation({ ...ticketSettings, sendPdfWhatsApp: e.target.checked })} />
                                        <span style={{ fontSize: "14px", fontWeight: 600, color: t.textMain }}>Download ticket PDF (share to WhatsApp)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "comm_hub" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Communication Hub</h2>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Manage SMS, WhatsApp, and Security/OTP configurations.</p>
                            </div>

                            <div style={{ display: "grid", gap: "24px" }}>
                                {/* SMS Gateway Section */}
                                <div style={{ backgroundColor: theme === "light" ? "#fff" : t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#3b82f615", color: "#3b82f6" }}>
                                                <Smartphone size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: 0 }}>SMS Gateway Configuration</h3>
                                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Manage Twilio or Fast2SMS integration</p>
                                            </div>
                                        </div>
                                        <div onClick={() => {
                                            const set = localCommSettings.find(s => s.key === 'sms_settings');
                                            updateLocalSetting('sms_settings', 'enabled', !set.value.enabled);
                                        }} style={{ width: "40px", height: "20px", borderRadius: "20px", backgroundColor: localCommSettings.find(s => s.key === 'sms_settings')?.value.enabled ? "#3b82f6" : "#cbd5e1", position: "relative", cursor: "pointer", transition: "0.2s" }}>
                                            <div style={{ position: "absolute", top: "2px", left: localCommSettings.find(s => s.key === 'sms_settings')?.value.enabled ? "22px" : "2px", width: "16px", height: "16px", backgroundColor: "#fff", borderRadius: "50%", transition: "0.2s" }}></div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Provider</label>
                                            <select 
                                                value={localCommSettings.find(s => s.key === 'sms_settings')?.value.provider || "twilio"}
                                                onChange={(e) => updateLocalSetting('sms_settings', 'provider', e.target.value)}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                            >
                                                <option value="twilio">Twilio (Recommended)</option>
                                                <option value="fast2sms">Fast2SMS (Legacy)</option>
                                            </select>
                                        </div>

                                        {localCommSettings.find(s => s.key === 'sms_settings')?.value.provider === 'twilio' ? (
                                            <>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Account SID</label>
                                                    <input 
                                                        type="text"
                                                        value={localCommSettings.find(s => s.key === 'sms_settings')?.value.accountSid || ""}
                                                        onChange={(e) => updateLocalSetting('sms_settings', 'accountSid', e.target.value)}
                                                        placeholder="AC..."
                                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Auth Token</label>
                                                    <input 
                                                        type="password"
                                                        value={localCommSettings.find(s => s.key === 'sms_settings')?.value.authToken || ""}
                                                        onChange={(e) => updateLocalSetting('sms_settings', 'authToken', e.target.value)}
                                                        placeholder="Enter Twilio Auth Token"
                                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                    />
                                                </div>
                                                <div style={{ gridColumn: "span 2" }}>
                                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>From Phone Number</label>
                                                    <input 
                                                        type="text"
                                                        value={localCommSettings.find(s => s.key === 'sms_settings')?.value.fromNumber || ""}
                                                        onChange={(e) => updateLocalSetting('sms_settings', 'fromNumber', e.target.value)}
                                                        placeholder="+1..."
                                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>API Key</label>
                                                    <input 
                                                        type="password"
                                                        value={localCommSettings.find(s => s.key === 'sms_settings')?.value.apiKey || ""}
                                                        onChange={(e) => updateLocalSetting('sms_settings', 'apiKey', e.target.value)}
                                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Sender ID</label>
                                                    <input 
                                                        type="text"
                                                        value={localCommSettings.find(s => s.key === 'sms_settings')?.value.senderId || ""}
                                                        onChange={(e) => updateLocalSetting('sms_settings', 'senderId', e.target.value)}
                                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <button onClick={handleSaveComm} style={{ gridColumn: "span 2", padding: "10px", borderRadius: "8px", border: "none", background: "#000", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Save & Refresh</button>
                                    </div>
                                </div>

                                {/* WhatsApp Section */}
                                <div style={{ backgroundColor: theme === "light" ? "#fff" : t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "24px" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#25d36615", color: "#25d366" }}>
                                                <MessageSquare size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: 0 }}>WhatsApp Business API</h3>
                                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Automated WhatsApp notifications</p>
                                            </div>
                                        </div>
                                        <div onClick={() => {
                                            const set = localCommSettings.find(s => s.key === 'whatsapp');
                                            updateLocalSetting('whatsapp', 'enabled', !set.value.enabled);
                                        }} style={{ width: "40px", height: "20px", borderRadius: "20px", backgroundColor: localCommSettings.find(s => s.key === 'whatsapp')?.value.enabled ? "#25d366" : "#cbd5e1", position: "relative", cursor: "pointer", transition: "0.2s" }}>
                                            <div style={{ position: "absolute", top: "2px", left: localCommSettings.find(s => s.key === 'whatsapp')?.value.enabled ? "22px" : "2px", width: "16px", height: "16px", backgroundColor: "#fff", borderRadius: "50%", transition: "0.2s" }}></div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                        {localCommSettings.find(s => s.key === 'whatsapp')?.value.provider === 'meta' && (
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>API Key / Token</label>
                                                <input 
                                                    type="password"
                                                    value={localCommSettings.find(s => s.key === 'whatsapp')?.value.apiKey || ""}
                                                    onChange={(e) => updateLocalSetting('whatsapp', 'apiKey', e.target.value)}
                                                    placeholder="WhatsApp Business Token"
                                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                />
                                            </div>
                                        )}
                                        {localCommSettings.find(s => s.key === 'whatsapp')?.value.provider === 'twilio' && (
                                            <>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Account SID</label>
                                                    <input 
                                                        type="text"
                                                        value={localCommSettings.find(s => s.key === 'whatsapp')?.value.accountSid || ""}
                                                        onChange={(e) => updateLocalSetting('whatsapp', 'accountSid', e.target.value)}
                                                        placeholder="AC..."
                                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Auth Token</label>
                                                    <input 
                                                        type="password"
                                                        value={localCommSettings.find(s => s.key === 'whatsapp')?.value.authToken || ""}
                                                        onChange={(e) => updateLocalSetting('whatsapp', 'authToken', e.target.value)}
                                                        placeholder="Enter Twilio Auth Token"
                                                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Provider</label>
                                            <select 
                                                value={localCommSettings.find(s => s.key === 'whatsapp')?.value.provider || "meta"}
                                                onChange={(e) => updateLocalSetting('whatsapp', 'provider', e.target.value)}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                            >
                                                <option value="meta">Meta Cloud API (Official)</option>
                                                <option value="twilio">Twilio</option>
                                                <option value="fast2sms">Fast2SMS (Unofficial/Beta)</option>
                                                <option value="bridge">Custom Bridge (Selenium)</option>
                                                <option value="gupshup">Gupshup</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Sender Number / ID</label>
                                            <input 
                                                type="text"
                                                value={localCommSettings.find(s => s.key === 'whatsapp')?.value.senderNumber || ""}
                                                onChange={(e) => updateLocalSetting('whatsapp', 'senderNumber', e.target.value)}
                                                placeholder={localCommSettings.find(s => s.key === 'whatsapp')?.value.provider === 'meta' ? "Phone ID" : "+1..."}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                            />
                                            <p style={{ fontSize: "10px", color: t.textSub, marginTop: "4px" }}>
                                                {localCommSettings.find(s => s.key === 'whatsapp')?.value.provider === 'meta' ? "💡 Use the 'Phone Number ID' from Meta dashboard." : "💡 Enter the Twilio number or Phone number with country code."}
                                            </p>
                                        </div>
                                        {localCommSettings.find(s => s.key === 'whatsapp')?.value.provider === 'fast2sms' && (
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Fast2SMS Template ID (Message ID)</label>
                                                <input 
                                                    type="text"
                                                    value={localCommSettings.find(s => s.key === 'whatsapp')?.value.templateId || ""}
                                                    onChange={(e) => updateLocalSetting('whatsapp', 'templateId', e.target.value)}
                                                    placeholder="Enter the approved Template ID from Fast2SMS"
                                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                />
                                            </div>
                                        )}
                                        </div>
                                    </div>

                                {/* OTP Section */}
                                <div style={{ backgroundColor: theme === "light" ? "#fff" : t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                                            <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#f59e0b15", color: "#f59e0b" }}>
                                                <Lock size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: 0 }}>Security / OTP Policy</h3>
                                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Phone verification during signup</p>
                                            </div>
                                        </div>
                                        <div onClick={() => {
                                            const set = localCommSettings.find(s => s.key === 'otp_settings');
                                            updateLocalSetting('otp_settings', 'enabled', !set.value.enabled);
                                        }} style={{ width: "40px", height: "20px", borderRadius: "20px", backgroundColor: localCommSettings.find(s => s.key === 'otp_settings')?.value.enabled ? "#f59e0b" : "#cbd5e1", position: "relative", cursor: "pointer", transition: "0.2s" }}>
                                            <div style={{ position: "absolute", top: "2px", left: localCommSettings.find(s => s.key === 'otp_settings')?.value.enabled ? "22px" : "2px", width: "16px", height: "16px", backgroundColor: "#fff", borderRadius: "50%", transition: "0.2s" }}></div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>OTP Expiry (seconds)</label>
                                            <input 
                                                type="number"
                                                value={localCommSettings.find(s => s.key === 'otp_settings')?.value.expirySeconds || 300}
                                                onChange={(e) => updateLocalSetting('otp_settings', 'expirySeconds', parseInt(e.target.value))}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                            />
                                        </div>
                                        <div style={{ flex: 1.5, padding: "16px", borderRadius: "12px", backgroundColor: "#fef3c7", border: "1px solid #fde68a" }}>
                                            <p style={{ margin: 0, fontSize: "12px", color: "#92400e", fontWeight: "bold" }}>When enabled, users must prove their phone number identity before their account is finalized.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "email_settings" && (
                        <div style={{ maxWidth: "850px", animation: "fadeIn 0.5s ease-out" }}>
                            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>Email Settings</h2>
                                    <p style={{ fontSize: "14px", color: t.textSub, margin: 0 }}>Manage your organization's email delivery infrastructure and authentication.</p>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        onClick={handleSaveEmail}
                                        disabled={isSavingEmail}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "10px 20px",
                                            borderRadius: "10px",
                                            backgroundColor: ACCENT_BLUE,
                                            color: "white",
                                            border: "none",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            cursor: isSavingEmail ? "not-allowed" : "pointer",
                                            opacity: isSavingEmail ? 0.7 : 1,
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        {isSavingEmail ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                                        {isSavingEmail ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>

                            {/* Provider Selection Card */}
                            <div style={{ 
                                backgroundColor: t.cardBg, 
                                padding: "24px", 
                                borderRadius: "16px", 
                                border: `1px solid ${t.border}`, 
                                marginBottom: "24px",
                                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: `${ACCENT_BLUE}15`, color: ACCENT_BLUE }}>
                                            <Globe size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: 0 }}>Email Provider</h3>
                                            <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>Choose how you want to send outgoing emails.</p>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button 
                                            onClick={() => setLocalEmailSettings(s => ({ ...s, provider: "SMTP" }))}
                                            style={{ 
                                                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "none", transition: "0.2s",
                                                backgroundColor: localEmailSettings.provider === "SMTP" ? "#000" : t.bg,
                                                color: localEmailSettings.provider === "SMTP" ? "#fff" : t.textSub,
                                                boxShadow: localEmailSettings.provider === "SMTP" ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
                                            }}
                                        >
                                            SMTP
                                        </button>
                                        <button 
                                            onClick={() => setLocalEmailSettings(s => ({ ...s, provider: "MICROSOFT_365" }))}
                                            style={{ 
                                                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "none", transition: "0.2s",
                                                backgroundColor: localEmailSettings.provider === "MICROSOFT_365" ? "#ec4899" : t.bg,
                                                color: localEmailSettings.provider === "MICROSOFT_365" ? "#fff" : t.textSub,
                                                boxShadow: localEmailSettings.provider === "MICROSOFT_365" ? "0 4px 12px rgba(236,72,153,0.3)" : "none"
                                            }}
                                        >
                                            MICROSOFT 365 (GRAPH)
                                        </button>
                                    </div>
                                </div>

                                {localEmailSettings.provider === "MICROSOFT_365" && (
                                    <div style={{ animation: "slideDown 0.3s ease-out" }}>
                                        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: "20px", display: "flex", gap: "12px" }}>
                                            <Info size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1e40af" }}>Recommended: Microsoft 365 (Graph API)</p>
                                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#3b82f6", lineHeight: "1.5" }}>
                                                    Uses modern OAuth2 authentication which is more secure and reliable than SMTP. 
                                                    Requires an Azure App Registration with <code style={{ backgroundColor: "#dbeafe", padding: "2px 4px", borderRadius: "4px" }}>Mail.Send</code> permissions.
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Tenant ID</label>
                                                <input
                                                    type="text"
                                                    value={localEmailSettings.microsoft365?.tenantId || ""}
                                                    onChange={(e) => setLocalEmailSettings({ 
                                                        ...localEmailSettings, 
                                                        microsoft365: { ...localEmailSettings.microsoft365, tenantId: e.target.value } 
                                                    })}
                                                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Client ID</label>
                                                <input
                                                    type="text"
                                                    value={localEmailSettings.microsoft365?.clientId || ""}
                                                    onChange={(e) => setLocalEmailSettings({ 
                                                        ...localEmailSettings, 
                                                        microsoft365: { ...localEmailSettings.microsoft365, clientId: e.target.value } 
                                                    })}
                                                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Client Secret</label>
                                                <input
                                                    type="password"
                                                    value={localEmailSettings.microsoft365?.clientSecret || ""}
                                                    onChange={(e) => setLocalEmailSettings({ 
                                                        ...localEmailSettings, 
                                                        microsoft365: { ...localEmailSettings.microsoft365, clientSecret: e.target.value } 
                                                    })}
                                                    placeholder="••••••••••••••••"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: "12px", backgroundColor: theme === 'light' ? '#f8fafc' : '#0f172a' }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{ 
                                                    padding: "6px 12px", 
                                                    borderRadius: "20px", 
                                                    fontSize: "12px", 
                                                    fontWeight: 700,
                                                    backgroundColor: localEmailSettings.microsoft365?.status === "Connected" ? "#dcfce7" : "#fee2e2",
                                                    color: localEmailSettings.microsoft365?.status === "Connected" ? "#16a34a" : "#dc2626",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}>
                                                    {localEmailSettings.microsoft365?.status === "Connected" ? <CheckCircle size={14} /> : <X size={14} />}
                                                    {localEmailSettings.microsoft365?.status === "Connected" ? "CONNECTED" : "NOT CONNECTED"}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleValidateM365}
                                                disabled={isValidatingM365}
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${ACCENT_BLUE}`,
                                                    backgroundColor: "transparent",
                                                    color: ACCENT_BLUE,
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    cursor: isValidatingM365 ? "not-allowed" : "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px"
                                                }}
                                            >
                                                {isValidatingM365 ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                                                {isValidatingM365 ? "Validating..." : "Validate Connection"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {localEmailSettings.provider === "SMTP" && (
                                    <div style={{ animation: "slideDown 0.3s ease-out" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>SMTP Host</label>
                                                <input
                                                    type="text"
                                                    value={localEmailSettings.host || ""}
                                                    onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, host: e.target.value })}
                                                    placeholder="smtp.example.com"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>SMTP Port</label>
                                                <input
                                                    type="number"
                                                    value={localEmailSettings.port || ""}
                                                    onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, port: e.target.value })}
                                                    placeholder="587"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>SMTP Username</label>
                                                <input
                                                    type="text"
                                                    value={localEmailSettings.user || ""}
                                                    onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, user: e.target.value })}
                                                    placeholder="hello@provider.com"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>SMTP Password</label>
                                                <input
                                                    type="password"
                                                    value={localEmailSettings.pass || ""}
                                                    onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, pass: e.target.value })}
                                                    placeholder="••••••••••••••••"
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                                />
                                            </div>
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Encryption Security</label>
                                                <select
                                                    value={localEmailSettings.encryption || "TLS"}
                                                    onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, encryption: e.target.value })}
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none", appearance: "none" }}
                                                >
                                                    <option value="TLS">STARTTLS (Usually Port 587)</option>
                                                    <option value="SSL">SSL/TLS (Usually Port 465)</option>
                                                    <option value="NONE">None (Not Recommended)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sender Details Card */}
                            <div style={{ 
                                backgroundColor: t.cardBg, 
                                padding: "24px", 
                                borderRadius: "16px", 
                                border: `1px solid ${t.border}`, 
                                marginBottom: "24px",
                                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                    <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#fef2f2", color: "#ef4444" }}>
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: 0 }}>Sender Information</h3>
                                        <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>This is how your emails will appear in correctly in the recipient's inbox.</p>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>From Email Address</label>
                                        <input
                                            type="email"
                                            value={localEmailSettings.from}
                                            onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, from: e.target.value })}
                                            placeholder="hello@bookmyticket.net"
                                            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                        />
                                        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: t.textSub }}>Must be a verified sender in your provider.</p>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>From Display Name</label>
                                        <input
                                            type="text"
                                            value={localEmailSettings.fromName}
                                            onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, fromName: e.target.value })}
                                            placeholder="BookMyTicket"
                                            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                        />
                                        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: t.textSub }}>E.g. BookMyTicket Support</p>
                                    </div>
                                </div>
                            </div>

                            {/* Test Email Card */}
                            <div style={{ 
                                backgroundColor: t.cardBg, 
                                padding: "24px", 
                                borderRadius: "16px", 
                                border: `1px solid ${t.border}`,
                                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                    <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#f0fdf4", color: "#22c55e" }}>
                                        <Send size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: 0 }}>Test Connection</h3>
                                        <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>Send a test email to verify your settings are correct.</p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "12px" }}>
                                    <input
                                        type="email"
                                        value={testEmailRecipient}
                                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                                        placeholder="Enter recipient email address"
                                        style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", outline: "none" }}
                                    />
                                    <button 
                                        onClick={async () => {
                                            if (!testEmailRecipient) {
                                                showToast("Please enter a recipient email.", "warning");
                                                return;
                                            }
                                            setIsSendingTestEmail(true);
                                            try {
                                                const { data: { session } } = await supabase.auth.getSession();
                                                const { _id, _creationTime, updatedAt, ...sanitizedSettings } = localEmailSettings;
                                                const res = await fetch('/api/admin/action', {
                                                    method: 'POST',
                                                    headers: { 
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${session?.access_token}`
                                                    },
                                                    body: JSON.stringify({
                                                        action: 'send-test-email',
                                                        data: {
                                                            to: testEmailRecipient,
                                                            subject: "Test Email from BookMyTicket Admin",
                                                            html: "<h1>Connection Test Successful!</h1><p>Your email settings are working perfectly. 🎉</p><p>Sent via: <strong>" + localEmailSettings.provider + "</strong></p>",
                                                            settings: sanitizedSettings
                                                        }
                                                    })
                                                });
                                                const result = await res.json();
                                                if (res.ok && result.success) {
                                                    showToast("Test email sent successully!", "success");
                                                } else {
                                                    showToast("Failed to send test email: " + (result.error || "Unknown error"), "error");
                                                }
                                            } catch (err) {
                                                showToast("Error: " + err.message, "error");
                                            } finally {
                                                setIsSendingTestEmail(false);
                                            }
                                        }}
                                        disabled={isSendingTestEmail}
                                        style={{
                                            padding: "10px 24px",
                                            borderRadius: "10px",
                                            backgroundColor: theme === 'light' ? '#0f172a' : '#fff',
                                            color: theme === 'light' ? '#fff' : '#0f172a',
                                            border: "none",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            cursor: isSendingTestEmail ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            transition: "0.2s"
                                        }}
                                    >
                                        {isSendingTestEmail ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
                                        {isSendingTestEmail ? "Sending..." : "Send Test Email"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "email_templates" && (
                        <EmailCommSystem t={t} theme={theme} />
                    )}
                    {activeTab === "disclaimer_settings" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Legal Disclaimer & Policies</h2>
                                <p style={{ fontSize: "14px", color: t.textSub, margin: 0 }}>Configure platform-wide legal text and booking-related disclaimers</p>
                            </div>

                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                            <div style={{ backgroundColor: "#3b82f620", padding: "8px", borderRadius: "8px" }}><Ticket size={18} color="#3b82f6" /></div>
                                            <label style={{ fontSize: "15px", fontWeight: 700, color: t.textMain }}>Booking Header Disclaimer</label>
                                        </div>
                                        <textarea
                                            value={disclaimerContent.booking_header}
                                            onChange={(e) => updatePolicies({ ...policiesArr[0], booking_header: e.target.value })}
                                            rows={3}
                                            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "14px", lineHeight: "1.6" }}
                                        />
                                        <p style={{ margin: "6px 0 0", fontSize: "11px", color: t.textSub }}>Displayed at the top of the event booking page.</p>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                            <div style={{ backgroundColor: "#22c55e20", padding: "8px", borderRadius: "8px" }}><CreditCard size={18} color="#22c55e" /></div>
                                            <label style={{ fontSize: "15px", fontWeight: 700, color: t.textMain }}>Payment Terms Disclaimer</label>
                                        </div>
                                        <textarea
                                            value={disclaimerContent.payment_terms}
                                            onChange={(e) => updatePolicies({ ...policiesArr[0], payment_terms: e.target.value })}
                                            rows={3}
                                            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "14px", lineHeight: "1.6" }}
                                        />
                                        <p style={{ margin: "6px 0 0", fontSize: "11px", color: t.textSub }}>Shown above the 'Pay Now' button during checkout.</p>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: t.textMain }}>Event Content Policy</label>
                                            <textarea
                                                value={disclaimerContent.event_disclaimer}
                                                onChange={(e) => updatePolicies({ ...policiesArr[0], event_disclaimer: e.target.value })}
                                                rows={5}
                                                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", lineHeight: "1.5" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: t.textMain }}>Cancellation & Refund Policy</label>
                                            <textarea
                                                value={disclaimerContent.cancellation_policy}
                                                onChange={(e) => updatePolicies({ ...policiesArr[0], cancellation_policy: e.target.value })}
                                                rows={5}
                                                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", lineHeight: "1.5" }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ mt: "8px" }}>
                                        <button
                                            onClick={() => showToast("Legal policies updated successfully!", "success")}
                                            style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "0.2s", width: "100%" }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
                                            onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}>
                                            Save All Policy Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === "maintenance" && (
                        <div style={{ maxWidth: "800px" }}>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>System Maintenance</h2>
                                <p style={{ fontSize: "14px", color: t.textSub, margin: 0 }}>Control global platform access and maintenance notifications</p>
                            </div>

                            <div style={{ backgroundColor: t.cardBg, borderRadius: "20px", border: `1px solid ${t.border}`, overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
                                <div style={{ padding: "32px", borderBottom: `1px solid ${t.border}`, background: maintenanceConfig.maintenance_mode ? 'linear-gradient(135deg, #fee2e2 0%, #fff 100%)' : 'transparent' }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                            <div style={{ 
                                                width: "56px", 
                                                height: "56px", 
                                                borderRadius: "16px", 
                                                backgroundColor: maintenanceConfig.maintenance_mode ? "#ef4444" : "#f1f5f9", 
                                                color: maintenanceConfig.maintenance_mode ? "#fff" : "#64748b",
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                boxShadow: maintenanceConfig.maintenance_mode ? "0 10px 15px -3px rgba(239, 68, 68, 0.3)" : "none",
                                                transition: "0.3s"
                                            }}>
                                                <AlertTriangle size={28} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain, margin: 0 }}>Maintenance Mode</h3>
                                                <p style={{ fontSize: "13px", color: t.textSub, margin: "2px 0 0" }}>
                                                    {maintenanceConfig.maintenance_mode 
                                                        ? "Platform is currently restricted to Admin users only." 
                                                        : "Platform is live and accessible to all users."}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                const newState = !maintenanceConfig.maintenance_mode;
                                                try {
                                                    await setMaintenanceConfig({ ...maintenanceConfig, maintenance_mode: newState });
                                                    showToast(`Maintenance mode ${newState ? 'enabled' : 'disabled'}`, "success");
                                                } catch (err) {
                                                    showToast("Failed to update maintenance state", "error");
                                                }
                                            }}
                                            style={{
                                                width: "64px",
                                                height: "32px",
                                                borderRadius: "16px",
                                                backgroundColor: maintenanceConfig.maintenance_mode ? "#ef4444" : "#e2e8f0",
                                                border: "none",
                                                cursor: "pointer",
                                                position: "relative",
                                                transition: "all 0.3s ease",
                                                boxShadow: maintenanceConfig.maintenance_mode ? "inset 0 2px 4px rgba(0,0,0,0.1)" : "none"
                                            }}
                                        >
                                            <div style={{
                                                position: "absolute",
                                                top: "4px",
                                                left: maintenanceConfig.maintenance_mode ? "36px" : "4px",
                                                width: "24px",
                                                height: "24px",
                                                borderRadius: "50%",
                                                backgroundColor: "#fff",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                                            }} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: "32px" }}>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "12px" }}>
                                        Maintenance Message
                                    </label>
                                    <textarea
                                        value={maintenanceConfig.maintenance_message}
                                        onChange={(e) => setMaintenanceConfig({ ...maintenanceConfig, maintenance_message: e.target.value })}
                                        rows={4}
                                        placeholder="Enter the message users will see during maintenance..."
                                        style={{ 
                                            width: "100%", 
                                            padding: "16px", 
                                            borderRadius: "16px", 
                                            border: `2px solid ${t.border}`, 
                                            backgroundColor: theme === 'light' ? '#fff' : '#0f172a', 
                                            color: t.textMain, 
                                            fontSize: "14px", 
                                            lineHeight: "1.6",
                                            outline: "none",
                                            transition: "border-color 0.2s",
                                            resize: "none"
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                        onBlur={(e) => e.target.style.borderColor = t.border}
                                    />
                                    <p style={{ marginTop: "12px", fontSize: "12px", color: t.textSub, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Info size={14} />
                                        This message will be displayed on the animated maintenance page.
                                    </p>

                                    <div style={{ marginTop: "32px", padding: "20px", borderRadius: "16px", backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                                        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Shield size={16} /> Access Rules
                                        </h4>
                                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#64748b", display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <li><strong>Admins:</strong> Have full bypass and can access all pages.</li>
                                            <li><strong>Organisers & Partners:</strong> Redirected to maintenance page.</li>
                                            <li><strong>Public Users:</strong> Redirected to maintenance page.</li>
                                            <li><strong>Login Page:</strong> Remains accessible so admins can sign in.</li>
                                        </ul>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            try {
                                                await setMaintenanceConfig(maintenanceConfig);
                                                showToast("Maintenance settings saved!", "success");
                                            } catch (err) {
                                                showToast("Error saving settings", "error");
                                            }
                                        }}
                                        style={{ 
                                            marginTop: "32px",
                                            width: "100%",
                                            padding: "14px",
                                            borderRadius: "14px",
                                            backgroundColor: "#0f172a",
                                            color: "#fff",
                                            fontSize: "15px",
                                            fontWeight: 700,
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "0.2s",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px"
                                        }}
                                        onMouseOver={(e) => e.target.style.transform = "translateY(-1px)"}
                                        onMouseOut={(e) => e.target.style.transform = "none"}
                                    >
                                        <Save size={18} />
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "sso_settings" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>SSO Configuration</h2>
                                <p style={{ fontSize: "14px", color: t.textSub, margin: 0 }}>Configure and manage Single Sign-On authentication methods</p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {/* Facebook Login Card */}
                                <div style={{
                                    backgroundColor: theme === 'light' ? '#ffffff' : t.cardBg,
                                    padding: "20px 24px",
                                    borderRadius: "12px",
                                    border: `1px solid ${t.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            backgroundColor: "#1877F2",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                        }}>
                                            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>f</span>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: "0 0 2px 0" }}>Facebook Login</h3>
                                            <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>Configure Facebook OAuth2 single sign-on</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <span style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            padding: "4px 10px",
                                            borderRadius: "20px",
                                            backgroundColor: ssoConfigs.facebook ? "#dcfce7" : "#fef3c7",
                                            color: ssoConfigs.facebook ? "#16a34a" : "#d97706",
                                            border: `1px solid ${ssoConfigs.facebook ? "#bbf7d0" : "#fde68a"}`,
                                            transition: "0.3s"
                                        }}>{ssoConfigs.facebook ? "Enabled" : "Disabled"}</span>
                                        <div
                                            onClick={() => updateSsoSettings({
                                                id: ssoSettingsArr[0]?.id,
                                                facebook_enabled: !ssoConfigs.facebook,
                                                google_enabled: ssoConfigs.google,
                                                facebook_config: ssoConfigs.facebookConfig || {},
                                                google_config: ssoConfigs.googleConfig || {}
                                            })}
                                            style={{
                                                position: "relative",
                                                width: "44px",
                                                height: "20px",
                                                backgroundColor: ssoConfigs.facebook ? "#22c55e" : "#e2e8f0",
                                                borderRadius: "20px",
                                                cursor: "pointer",
                                                transition: "0.3s"
                                            }}
                                        >
                                            <div style={{
                                                width: "16px",
                                                height: "16px",
                                                backgroundColor: "#fff",
                                                borderRadius: "50%",
                                                position: "absolute",
                                                left: ssoConfigs.facebook ? "22px" : "2px",
                                                top: "2px",
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                                transition: "0.3s"
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Google Workspace Card */}
                                <div style={{
                                    backgroundColor: theme === 'light' ? '#ffffff' : t.cardBg,
                                    padding: "20px 24px",
                                    borderRadius: "12px",
                                    border: `1px solid ${t.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            backgroundColor: "#fff",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: `1px solid ${t.border}`,
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                        }}>
                                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4285F4" }}>G</div>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, margin: "0 0 2px 0" }}>Google Workspace</h3>
                                            <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>Configure Google Workspace single sign-on</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <span style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            padding: "4px 10px",
                                            borderRadius: "20px",
                                            backgroundColor: ssoConfigs.google ? "#dcfce7" : "#fef3c7",
                                            color: ssoConfigs.google ? "#16a34a" : "#d97706",
                                            border: `1px solid ${ssoConfigs.google ? "#bbf7d0" : "#fde68a"}`,
                                            transition: "0.3s"
                                        }}>{ssoConfigs.google ? "Enabled" : "Disabled"}</span>
                                        <div
                                            onClick={() => updateSsoSettings({
                                                id: ssoSettingsArr[0]?.id,
                                                facebook_enabled: ssoConfigs.facebook,
                                                google_enabled: !ssoConfigs.google,
                                                facebook_config: ssoConfigs.facebookConfig || {},
                                                google_config: ssoConfigs.googleConfig || {}
                                            })}
                                            style={{
                                                position: "relative",
                                                width: "44px",
                                                height: "20px",
                                                backgroundColor: ssoConfigs.google ? "#22c55e" : "#e2e8f0",
                                                borderRadius: "20px",
                                                cursor: "pointer",
                                                transition: "0.3s"
                                            }}
                                        >
                                            <div style={{
                                                width: "16px",
                                                height: "16px",
                                                backgroundColor: "#fff",
                                                borderRadius: "50%",
                                                position: "absolute",
                                                left: ssoConfigs.google ? "22px" : "2px",
                                                top: "2px",
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                                transition: "0.3s"
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Note */}
                                <div style={{
                                    marginTop: "16px",
                                    padding: "16px 20px",
                                    borderRadius: "8px",
                                    backgroundColor: theme === 'light' ? "#f0f9ff" : "#0c4a6e30",
                                    border: `1px solid ${theme === 'light' ? "#bae6fd" : "#0369a1"}`,
                                    fontSize: "13px",
                                    lineHeight: "1.5",
                                    color: theme === 'light' ? "#0369a1" : "#7dd3fc"
                                }}>
                                    <span style={{ fontWeight: 700 }}>Security Note:</span> SSO authentication methods use industry-standard OAuth 2.0 and OpenID Connect protocols. All authentication flows are secured with CSRF tokens and follow cybersecurity best practices.
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "subscribers" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Newsletter Subscribers</h3>
                                    <p style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Manage and view all users who signed up for your website newsletter.</p>
                                </div>
                            </div>
                            <SubscribersTable t={t} theme={theme} />
                        </div>
                    )}

                    {activeTab === "comm_hub" && (
                        <EmailCommSystem t={t} theme={theme} />
                    )}


                    {activeTab === "api_settings" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div>
                                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>API Configuration</h2>
                                    <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Generate and manage API keys for external application integration</p>
                                </div>
                                <button
                                    onClick={() => createApiKey({ name: "New App Key", key_value: `ak_${Math.random().toString(36).substr(2, 9)}...` })}
                                    style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    + Generate New Key
                                </button>
                            </div>

                            <div style={{ backgroundColor: theme === 'light' ? '#ffffff' : t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', borderBottom: `1px solid ${t.border}` }}>
                                            <th style={{ padding: "12px 16px", textAlign: "left", width: "30%", color: t.textSub, fontWeight: 600 }}>Label</th>
                                            <th style={{ padding: "12px 16px", textAlign: "left", width: "40%", color: t.textSub, fontWeight: 600 }}>API Key</th>
                                            <th style={{ padding: "12px 16px", textAlign: "left", width: "15%", color: t.textSub, fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px 16px", textAlign: "right", color: t.textSub, fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apiKeysArr.map((item, i) => (
                                            <tr key={item.id} style={{ borderBottom: i === apiKeysArr.length - 1 ? 'none' : `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px 16px", fontWeight: 600, color: t.textMain }}>
                                                    {item.label}
                                                </td>
                                                <td style={{ padding: "12px 16px", fontFamily: "monospace", color: t.textSub }}>{item.key}</td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: item.status === "Active" ? "#22c55e20" : "#ef444420", color: item.status === "Active" ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{item.status.toUpperCase()}</span>
                                                </td>
                                                <td style={{ padding: "12px 16px", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                    <button
                                                        onClick={() => toggleApiKeyStatus({ id: item.id, status: item.status === "Active" ? "Revoked" : "Active" })}
                                                        style={{ background: "none", border: "none", color: item.status === "Active" ? "#ef4444" : "#22c55e", cursor: "pointer", fontSize: "12px" }}
                                                    >
                                                        {item.status === "Active" ? "Revoke" : "Activate"}
                                                    </button>
                                                    <button
                                                        onClick={() => removeApiKey({ id: item.id })}
                                                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", opacity: 0.6 }}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{
                                marginTop: "24px",
                                padding: "16px",
                                borderRadius: "8px",
                                border: `1px solid ${t.border}`,
                                backgroundColor: theme === 'light' ? '#f0f9ff' : '#0c4a6e30',
                                borderLeft: "4px solid #3b82f6",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                            }}>
                                <Code size={20} color="#3b82f6" />
                                <p style={{ margin: 0, fontSize: "12px", color: theme === 'light' ? '#0369a1' : '#7dd3fc' }}>
                                    Need help integrating? Check out our <a href="#" style={{ color: "#3b82f6", fontWeight: 700, textDecoration: "none" }}>API Documentation</a> for guides and code samples.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === "meta_management" && (
                        <SeoAnalyticsAdmin 
                            t={t} 
                            theme={theme} 
                            config={seoAnalyticsConfig} 
                            setConfig={setSeoAnalyticsConfig} 
                        />
                    )}


                    {activeTab === "gst" && (
                        <GstPortal t={t} theme={theme} />
                    )}
                    {activeTab === "pages" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Manage Site Pages</h3>
                                <button
                                    onClick={() => { setPageModal("create"); setPageForm({ title: "", slug: "", content: "", showInFooter: true }); }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}
                                >
                                    <Plus size={18} /> Add New Page
                                </button>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Title</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Slug</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Footer</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pages.map((page) => (
                                            <tr key={page.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{page.title}</td>
                                                <td style={{ padding: "12px", color: t.textSub }}>/p/{page.slug}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{
                                                        padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                                                        backgroundColor: page.showInFooter ? "#22c55e15" : "#f1f5f9",
                                                        color: page.showInFooter ? "#22c55e" : "#64748b"
                                                    }}>
                                                        {page.showInFooter ? "VISIBLE" : "HIDDEN"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button onClick={() => {
                                                            setPageForm({
                                                                id: page.id,
                                                                title: page.title || "",
                                                                slug: page.slug || "",
                                                                content: page.content || "",
                                                                showInFooter: !!page.showInFooter,
                                                                order: page.order || 0
                                                            });
                                                            setPageModal("edit");
                                                        }} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#3b82f6", cursor: "pointer" }}><Edit size={14} /></button>
                                                        <button onClick={() => setPageToDelete(page.id)} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pageModal && (
                                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}>
                                    <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", width: "600px", border: `1px solid ${t.border}`, maxHeight: "90vh", overflowY: "auto" }}>
                                        <h3 style={{ marginBottom: "20px" }}>{pageModal === "create" ? "Add New Page" : "Edit Page"}</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Title</label>
                                                <input
                                                    type="text"
                                                    value={pageForm.title}
                                                    onChange={(e) => setPageForm({ ...pageForm, title: e.target.value, slug: pageModal === "create" ? e.target.value.toLowerCase().replace(/\s+/g, '-') : pageForm.slug })}
                                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Slug</label>
                                                <input
                                                    type="text"
                                                    value={pageForm.slug}
                                                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Content (HTML)</label>
                                                <textarea
                                                    rows={10}
                                                    value={pageForm.content}
                                                    onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontFamily: "monospace" }}
                                                />
                                            </div>
                                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                <input type="checkbox" checked={pageForm.showInFooter} onChange={(e) => setPageForm({ ...pageForm, showInFooter: e.target.checked })} />
                                                <span style={{ fontSize: "13px" }}>Show in Footer</span>
                                            </label>
                                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                                <button onClick={handleSavePage} style={{ flex: 1, padding: "10px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600 }}>Save Page</button>
                                                <button onClick={() => setPageModal(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: "none", color: t.textMain }}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pageToDelete && (
                                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1002 }}>
                                    <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", width: "400px", border: `1px solid ${t.border}` }}>
                                        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: t.textMain }}>Confirm Deletion</h3>
                                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: t.textSub }}>Are you sure you want to permanently delete this page? This cannot be undone.</p>
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                            <button onClick={() => setPageToDelete(null)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: t.border, color: t.textMain, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                                            <button onClick={() => handleDeletePage(pageToDelete)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete Page</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {activeTab === "admin_management" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Team Management</h3>
                                <button 
                                    onClick={() => {
                                        setNewAdmin({ fullName: '', username: '', email: '', password: '', role: 'Admin' });
                                        setAdminModal({ mode: "create" });
                                    }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "10px", background: ACCENT_GRADIENT, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "14px", boxShadow: "0 10px 24px rgba(236,72,153,0.18)" }}
                                >
                                    <Plus size={18} /> Add New Admin
                                </button>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Full Name</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Username</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Role</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Last Login</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(adminsArr) ? adminsArr : []).map((adm) => (
                                            <tr key={adm.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{adm.profiles?.full_name || "—"}</td>
                                                <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>{adm.profiles?.username || "—"}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{adm.profiles?.email || "—"}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#3b82f615", color: "#3b82f6", fontWeight: 600 }}>{adm.role.toUpperCase()}</span>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <button 
                                                        onClick={() => updateAdminStatus({ id: adm.id, status: adm.status === "Active" ? "Inactive" : "Active" })}
                                                        style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: adm.status === "Active" ? "#22c55e15" : "#f1f5f9", color: adm.status === "Active" ? "#22c55e" : "#64748b", border: "none", cursor: "pointer", fontWeight: 600 }}
                                                    >
                                                        {adm.status?.toUpperCase() || "ACTIVE"}
                                                    </button>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "12px", color: t.textSub }}>
                                                    {adm.lastLogin ? new Date(adm.lastLogin).toLocaleString() : "Never logged in"}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <button onClick={async () => { deleteAdmin({ id: adm.id }) }} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", opacity: 0.7 }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.7}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {adminsArr.length === 0 && (
                                            <tr><td colSpan="7" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No administrative accounts found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "ad_popups" && (
                        <div style={{ maxWidth: "900px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                                <div>
                                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Customer Ad Popups</h2>
                                    <p style={{ fontSize: "14px", color: t.textSub, margin: 0 }}>Manage cookie-based advertisement popups shown to customers on web and mobile</p>
                                </div>
                                <button onClick={() => { setAdPopupForm({ title: "", description: "", imageUrl: "", redirectUrl: "", redirectType: "url", redirectId: "", ctaText: "Book Now", bgColor: "", badgeText: "", isActive: true, showEveryMinutes: 30, sortOrder: 0 }); setAdPopupEditingId(null); setAdPopupImageFile(null); setShowAdPopupForm(true); }} style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Plus size={16} /> New Ad Popup
                                </button>
                            </div>

                            {showAdPopupForm && (
                                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, marginBottom: "20px" }}>{adPopupEditingId ? "Edit Ad Popup" : "Create New Ad Popup"}</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        {[{k:"title",l:"Title *",ph:"e.g. 🎉 Exclusive Offer"},{k:"description",l:"Description",ph:"Short promo text"},{k:"ctaText",l:"CTA Button Text",ph:"e.g. Book Now"},{k:"badgeText",l:"Badge Label",ph:"e.g. 🔥 Limited Offer"},{k:"bgColor",l:"Background Color",ph:"e.g. #f84464 or gradient CSS"}].map(({k,l,ph}) => (
                                            <div key={k} style={k==="description" || k==="bgColor" ? { gridColumn: "1 / -1" } : {}}>
                                                <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>{l}</label>
                                                <input value={adPopupForm[k]} onChange={e => setAdPopupForm({...adPopupForm, [k]: e.target.value})} placeholder={ph} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box" }} />
                                            </div>
                                        ))}

                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>Redirect Type</label>
                                            <select value={adPopupForm.redirectType} onChange={e => setAdPopupForm({...adPopupForm, redirectType: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box" }}>
                                                <option value="url">External URL</option>
                                                <option value="event">Internal Event</option>
                                                <option value="service">Internal Service</option>
                                                <option value="turf">Internal Turf</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>{adPopupForm.redirectType === 'url' ? "URL" : "Item ID (UUID)"}</label>
                                            <input value={adPopupForm.redirectId} onChange={e => setAdPopupForm({...adPopupForm, redirectId: e.target.value})} placeholder={adPopupForm.redirectType === 'url' ? "https://..." : "Paste ID here"} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box" }} />
                                        </div>
                                        
                                        <div style={{ gridColumn: "1 / -1" }}>
                                            <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>Legacy Redirect URL (Fallback)</label>
                                            <input value={adPopupForm.redirectUrl} onChange={e => setAdPopupForm({...adPopupForm, redirectUrl: e.target.value})} placeholder="https://..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box" }} />
                                        </div>

                                        <div style={{ gridColumn: "1 / -1", background: t.sidebarBorder, padding: "16px", borderRadius: "8px", border: `1px dashed ${t.border}` }}>
                                            <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>Image (URL or Upload)</label>
                                            <input value={adPopupForm.imageUrl} onChange={e => setAdPopupForm({...adPopupForm, imageUrl: e.target.value})} placeholder="https://... (banner image URL)" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box", marginBottom: "10px" }} />
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <input type="file" accept="image/*" onChange={e => setAdPopupImageFile(e.target.files[0])} style={{ fontSize: "13px", color: t.textSub }} />
                                                {adPopupImageFile && <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>File queued for upload</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>Show Every (minutes)</label>
                                            <input type="number" min="1" value={adPopupForm.showEveryMinutes} onChange={e => setAdPopupForm({...adPopupForm, showEveryMinutes: Number(e.target.value)})} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>Sort Order</label>
                                            <input type="number" value={adPopupForm.sortOrder} onChange={e => setAdPopupForm({...adPopupForm, sortOrder: Number(e.target.value)})} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box" }} />
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "22px" }}>
                                            <input type="checkbox" id="adactive" checked={adPopupForm.isActive} onChange={e => setAdPopupForm({...adPopupForm, isActive: e.target.checked})} />
                                            <label htmlFor="adactive" style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, cursor: "pointer" }}>Active (show to customers)</label>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                        <button onClick={handleSaveAdPopup} disabled={adPopupSaving} style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer", opacity: adPopupSaving ? 0.7 : 1 }}>{adPopupSaving ? "Saving..." : "Save Popup"}</button>
                                        <button onClick={() => { setShowAdPopupForm(false); setAdPopupEditingId(null); setAdPopupImageFile(null); }} style={{ background: t.border, color: t.textMain, border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {allAdPopups.length === 0 ? (
                                    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "40px", textAlign: "center", color: t.textSub, fontSize: "14px" }}>
                                        <Megaphone size={32} style={{ opacity: 0.3, marginBottom: "12px" }} />
                                        <p style={{ margin: 0 }}>No ad popups yet. Create your first one above.</p>
                                    </div>
                                ) : allAdPopups.map(popup => (
                                    <div key={popup._id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                                        {popup.imageUrl ? (
                                            <img src={popup.imageUrl} alt={popup.title} style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} onError={e => { e.target.style.display='none'; }} />
                                        ) : (
                                            <div style={{ width: "80px", height: "60px", borderRadius: "8px", background: popup.bgColor || "linear-gradient(135deg,#f84464,#c026d3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🎉</div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                <span style={{ fontSize: "15px", fontWeight: 700, color: t.textMain }}>{popup.title}</span>
                                                {popup.badgeText && <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", borderRadius: "10px", padding: "2px 8px", fontWeight: 700 }}>{popup.badgeText}</span>}
                                            </div>
                                            {popup.description && <p style={{ fontSize: "13px", color: t.textSub, margin: "0 0 6px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{popup.description}</p>}
                                            <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: t.textSub }}>
                                                <span>⏱ Every {popup.showEveryMinutes} min</span>
                                                {popup.ctaText && <span>🔗 {popup.ctaText}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                                            <button onClick={() => toggleAdPopup({ id: popup.id, is_active: !popup.is_active })} style={{ background: popup.is_active ? "#dcfce7" : "#f1f5f9", color: popup.is_active ? "#16a34a" : t.textSub, border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                                {popup.is_active ? "✓ Active" : "Inactive"}
                                            </button>
                                            <button onClick={() => handleEditAdPopup(popup)} style={{ background: t.activeLink, color: t.activeText, border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteAdPopup(popup.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "meetings" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Global Meetings</h3>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <div style={{ position: "relative" }}>
                                        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub }} />
                                        <input 
                                            type="text" 
                                            placeholder="Search meetings..." 
                                            style={{ padding: "10px 12px 10px 36px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "13px", width: "240px" }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ overflowX: "auto" }}>
                                <AdminMeetingsTable t={t} router={router} />
                            </div>
                        </div>
                    )}

                    {(["dashboard", "branding", "categories", "subnav", "events_settings", "event_partners", "pages", "sections", "all_org", "active_org", "banned_org", "email_unverified", "mobile_unverified", "kyc_unverified", "kyc_pending", "kyc_verified", "with_balance", "org_requests", "partner_requests", "service_active", "service_banned", "send_notif", "payment_settings", "ticket_settings", "comm_hub", "email_settings", "email_templates", "disclaimer_settings", "sso_settings", "api_settings", "meta_management", "all_events", "customers", "bookings", "all_turfs", "turf_active", "turf_banned", "turf_bookings", "pool_bookings", "gst", "promotions", "financials", "support_tickets", "branding_partners", "hero", "video", "video_banner", "mobile_banners", "site_branding", "memories", "copyright", "meeting_settings", "admin_management", "ad_popups", "meetings", "checkout_footer"].includes(activeTab)) ? null : (
                        <div style={{ backgroundColor: t.cardBg, padding: "60px 24px", textAlign: "center", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                            <Settings color={t.textSub} size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain }}>{activeTab.replace(/_/g, ' ').toUpperCase()}</h2>
                            <p style={{ color: t.textSub, marginTop: "8px", maxWidth: "350px", margin: "8px auto", fontSize: "14px" }}>This management module is currently being configured. You will be able to manage these settings shortly.</p>
                            <button onClick={() => setActiveTab("dashboard")} style={{ marginTop: "24px", padding: "10px 20px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Return to Dashboard</button>
                        </div>
                    )}


                    {/* Admin Creation Modal */}
                    {adminModal && (
                        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4000, padding: "20px" }}>
                            <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "480px", borderRadius: "24px", border: `1px solid ${t.border}`, padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Add Team Member</h2>
                                    <button onClick={() => setAdminModal(null)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={24} /></button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Full Name</label>
                                        <input type="text" value={newAdmin.fullName} onChange={e=>setNewAdmin({...newAdmin, fullName: e.target.value})} placeholder="e.g. John Developer" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "16px" }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Username</label>
                                            <input type="text" value={newAdmin.username} onChange={e=>setNewAdmin({...newAdmin, username: e.target.value})} placeholder="john_dev" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Role</label>
                                            <select value={newAdmin.role} onChange={e=>setNewAdmin({...newAdmin, role: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}>
                                                <option value="Admin">Admin</option>
                                                <option value="Developer">Developer</option>
                                                <option value="Tester">Tester</option>
                                                <option value="Support">Support</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Email Address</label>
                                        <input type="email" value={newAdmin.email} onChange={e=>setNewAdmin({...newAdmin, email: e.target.value})} placeholder="john@example.com" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>Login Password</label>
                                        <input type="password" value={newAdmin.password} onChange={e=>setNewAdmin({...newAdmin, password: e.target.value})} placeholder="••••••••" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }} />
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if (!newAdmin.fullName || !newAdmin.username || !newAdmin.password) {
                                                return;
                                            }
                                            try {
                                                const hashed = await hashPassword(newAdmin.password);
                                                await createAdmin({ ...newAdmin, password: hashed });
                                                setAdminModal(null);
                                                setNewAdmin({ fullName: '', username: '', email: '', password: '', role: 'Admin' });
                                            } catch (e) {
                                                console.error("Create admin error:", e.message);
                                            }
                                        }}
                                        style={{ width: "100%", padding: "14px", borderRadius: "12px", background: ACCENT_GRADIENT, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", marginTop: "12px" }}
                                    >
                                        Create Admin Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Organiser Approval Modal */}
                    {showApprovalModal && selectedRequestForApproval && (
                        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" }}>
                            <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "450px", borderRadius: "24px", border: `1px solid ${t.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", padding: "32px", position: "relative" }}>
                                <button onClick={() => setShowApprovalModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={20} /></button>

                                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                    <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#22c55e15", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                                        <CheckCircle size={32} />
                                    </div>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, marginBottom: "8px" }}>Approve Organiser</h2>
                                    <p style={{ color: t.textSub, fontSize: "14px" }}>Reviewing request from <strong>{selectedRequestForApproval.firstName} {selectedRequestForApproval.lastName}</strong> ({selectedRequestForApproval.email})</p>
                                </div>

                                <div style={{ spaceY: "20px" }}>
                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Set Manual Password (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="Leave blank for autogenerated password"
                                            value={manualApprovalPassword}
                                            onChange={(e) => setManualApprovalPassword(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                borderRadius: "12px",
                                                border: `1px solid ${t.border}`,
                                                backgroundColor: t.bg,
                                                color: t.textMain,
                                                fontSize: "14px",
                                                outline: "none"
                                            }}
                                        />
                                        <p style={{ fontSize: "12px", color: t.textSub, marginTop: "8px", lineHeight: "1.4" }}>
                                            If left blank, the system will generate a secure temporary password and show it to you on the next screen.
                                        </p>
                                    </div>

                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <button
                                            onClick={() => setShowApprovalModal(false)}
                                            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, background: "none", color: t.textMain, fontWeight: 600, cursor: "pointer" }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const tempPass = await approveOrganiserRequest({
                                                        id: selectedRequestForApproval.id,
                                                        password: manualApprovalPassword.trim() || undefined
                                                    });
                                                    setGeneratedTempPassword(tempPass);
                                                    setShowApprovalModal(false);
                                                    setShowTempPasswordModal(true);
                                                    setManualApprovalPassword("");
                                                    } catch (err) {
                                                        showToast("Error: " + err.message, "error");
                                                    }
                                            }}
                                            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", fontWeight: 600, cursor: "pointer" }}
                                        >
                                            Confirm Approval
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showTempPasswordModal && (
                        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "40px", borderRadius: "20px", width: "450px", border: `1px solid ${t.border}`, textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                                <div style={{ backgroundColor: "#22c55e", color: "#fff", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 16px rgba(34, 197, 94, 0.2)" }}>
                                    <CheckCircle size={32} />
                                </div>
                                <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, marginBottom: "12px" }}>Request Approved!</h2>
                                <p style={{ color: t.textSub, marginBottom: "32px", fontSize: "15px", lineHeight: "1.5" }}>
                                    The organiser account has been successfully created.
                                    Please share this temporary password with the applicant so they can log in.
                                </p>

                                <div style={{
                                    backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b',
                                    padding: "24px",
                                    borderRadius: "16px",
                                    border: `2px dashed ${t.border}`,
                                    position: "relative",
                                    marginBottom: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <span style={{
                                        fontSize: "28px",
                                        fontWeight: 800,
                                        letterSpacing: "4px",
                                        color: "#3b82f6",
                                        fontFamily: "monospace"
                                    }}>{generatedTempPassword}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedTempPassword);
                                            showToast("Password copied to clipboard!", "success");
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: "-12px",
                                            right: "12px",
                                            backgroundColor: "#1e1b4b",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "20px",
                                            padding: "6px 14px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                                        }}
                                    >
                                        COPY
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowTempPasswordModal(false)}
                                    style={{
                                        width: "100%",
                                        padding: "16px",
                                        backgroundColor: "#1e1b4b",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Confirm & Close
                                </button>
                            </div>
                        </div>
                    )}

                    {categoryModal && (
                        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }} onClick={closeCategoryModal}>
                            <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "450px", borderRadius: "16px", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: `1px solid ${t.border}`, position: "relative" }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain }}>{categoryModal === "edit" ? "Edit Category" : "Add New Category"}</h3>
                                    <button type="button" onClick={closeCategoryModal} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub }}><X size={20} /></button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Category Name</label>
                                        <input type="text" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().trim().replace(/\s+/g, "-") }))} placeholder="e.g. Concert" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px", fontWeight: 500 }} />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.5px" }}>URL Slug</label>
                                        <input type="text" value={categoryForm.slug} onChange={e => setCategoryForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. concert" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px", fontWeight: 500 }} />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Icon (Emoji)</label>
                                        <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm(f => ({ ...f, icon: e.target.value || "📁" }))} placeholder="🎫" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px", fontWeight: 500 }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                        <button type="button" onClick={closeCategoryModal} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>Cancel</button>
                                        <button type="button" onClick={handleSaveCategory} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>{categoryModal === "edit" ? "Update Category" : "Save Category"}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedKycOrg && selectedKycOrg.kycDetails && (
                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                            <div style={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', padding: "32px", borderRadius: "16px", width: "100%", maxWidth: "800px", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: `1px solid ${t.border}`, paddingBottom: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f9731615", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={20} /></div>
                                        <div>
                                            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: t.textMain }}>KYC Verification Review</h3>
                                            <p style={{ fontSize: "12px", color: t.textSub, margin: "4px 0 0" }}>Organiser: <span style={{ fontWeight: 600, color: t.textMain }}>{selectedKycOrg.username}</span> ({selectedKycOrg.email})</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedKycOrg(null)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer", padding: "4px" }}><X size={20} /></button>
                                </div>

                                <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
                                    {/* Section 1: Org Details */}
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>Organization & Tax Details</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px", backgroundColor: t.cardBg, padding: "20px", borderRadius: "8px", border: `1px solid ${t.border}` }}>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Category</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.category}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Full Name</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.fullName}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>PAN Number</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.panCard || selectedKycOrg.kycDetails.panNumber || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>GSTIN</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.gstin || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Mobile Number</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.mobile}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>City</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.city}</p></div>
                                        <div style={{ gridColumn: "span 2" }}><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Address</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.address || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Designation</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.designation}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Has ITR (2 years)?</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.itr === "Yes" || selectedKycOrg.kycDetails.hasITR ? "Yes" : "No"}</p></div>
                                        {(selectedKycOrg.kycDetails.website || selectedKycOrg.kycDetails.websiteLink) && <div style={{ gridColumn: "span 2" }}><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Website</p><a href={selectedKycOrg.kycDetails.website || selectedKycOrg.kycDetails.websiteLink} target="_blank" style={{ fontSize: "14px", fontWeight: 600, color: "#3b82f6", margin: 0, textDecoration: "none" }}>{selectedKycOrg.kycDetails.website || selectedKycOrg.kycDetails.websiteLink}</a></div>}
                                    </div>

                                    {/* Section: Bank Details */}
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>Bank Account Details</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px", backgroundColor: t.cardBg, padding: "20px", borderRadius: "8px", border: `1px solid #3b82f630`, borderLeft: "4px solid #3b82f6" }}>
                                        <div style={{ gridColumn: "span 2" }}><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Beneficiary Name</p><p style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.beneficiaryName || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Bank Name</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.bankName || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Account Type</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.accountType || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Account Number</p><p style={{ fontSize: "14px", fontWeight: 700, color: "#3b82f6", margin: 0, letterSpacing: "1px" }}>{selectedKycOrg.kycDetails.accountNumber || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>IFSC Code</p><p style={{ fontSize: "14px", fontWeight: 700, color: "#3b82f6", margin: 0 }}>{selectedKycOrg.kycDetails.ifscCode || "N/A"}</p></div>
                                    </div>

                                    {/* Section 2: Documents */}
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>Uploaded Documents</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
                                        <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "8px", border: `1px solid ${t.border}`, textAlign: "center" }}>
                                            <h5 style={{ fontSize: "12px", color: t.textSub, margin: "0 0 12px" }}>PAN Card</h5>
                                            <div style={{ width: "100%", height: "100px", backgroundColor: theme === 'light' ? "#f1f5f9" : "#1e293b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {selectedKycOrg.kycDetails.panFile ? <ImageIcon size={32} color={t.textSub} /> : <span style={{ fontSize: "11px", color: "#ef4444" }}>Missing</span>}
                                            </div>
                                            {selectedKycOrg.kycDetails.panFile && <button style={{ marginTop: "12px", padding: "6px 12px", fontSize: "11px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>View File</button>}
                                        </div>
                                        <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "8px", border: `1px solid ${t.border}`, textAlign: "center" }}>
                                            <h5 style={{ fontSize: "12px", color: t.textSub, margin: "0 0 12px" }}>Cancelled Cheque</h5>
                                            <div style={{ width: "100%", height: "100px", backgroundColor: theme === 'light' ? "#f1f5f9" : "#1e293b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {selectedKycOrg.kycDetails.chequeFile ? <ImageIcon size={32} color={t.textSub} /> : <span style={{ fontSize: "11px", color: "#ef4444" }}>Missing</span>}
                                            </div>
                                            {selectedKycOrg.kycDetails.chequeFile && <button style={{ marginTop: "12px", padding: "6px 12px", fontSize: "11px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>View File</button>}
                                        </div>
                                        <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "8px", border: `1px solid ${t.border}`, textAlign: "center" }}>
                                            <h5 style={{ fontSize: "12px", color: t.textSub, margin: "0 0 12px" }}>Aadhar Card</h5>
                                            <div style={{ width: "100%", height: "100px", backgroundColor: theme === 'light' ? "#f1f5f9" : "#1e293b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {selectedKycOrg.kycDetails.aadharFile ? <ImageIcon size={32} color={t.textSub} /> : <span style={{ fontSize: "11px", color: "#ef4444" }}>Missing</span>}
                                            </div>
                                            {selectedKycOrg.kycDetails.aadharFile && <button style={{ marginTop: "12px", padding: "6px 12px", fontSize: "11px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>View File</button>}
                                        </div>
                                    </div>

                                    {/* Section 3: Declarations */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: selectedKycOrg.kycDetails.agreementAccepted ? "#22c55e10" : "#ef444410", padding: "16px", borderRadius: "8px", border: `1px solid ${selectedKycOrg.kycDetails.agreementAccepted ? '#22c55e' : '#ef4444'}` }}>
                                        {selectedKycOrg.kycDetails.agreementAccepted ? <CheckCircle size={20} color="#22c55e" /> : <AlertCircle size={20} color="#ef4444" />}
                                        <div>
                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: t.textMain }}>Host Agreement & GST Declaration</p>
                                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: t.textSub }}>{selectedKycOrg.kycDetails.agreementAccepted ? "Digitally accepted by organiser during submission." : "Organiser did not correctly accept the agreements."}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "16px", marginTop: "24px", paddingTop: "24px", borderTop: `1px solid ${t.border}` }}>
                                    <button
                                        onClick={async () => {
                                            patchOrganizerMutation({ id: selectedKycOrg.id, kyc_status: 'Rejected' });
                                            setSelectedKycOrg(null);
                                        }}
                                        style={{ flex: 1, padding: "14px", borderRadius: "8px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444", fontWeight: 600, cursor: "pointer" }}>
                                        Reject Application
                                    </button>
                                    <button
                                        onClick={() => {
                                            patchOrganizerMutation({ id: selectedKycOrg.id, kyc_status: 'Approved' });
                                            setSelectedKycOrg(null);
                                        }}
                                        style={{ flex: 2, padding: "14px", borderRadius: "8px", backgroundColor: "#22c55e", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                        <CheckCircle size={18} /> Approve KYC
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Organizer Modal */}
                    {isEditModalOpen && editingOrg && (
                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                            <div style={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', padding: "32px", borderRadius: "16px", width: "100%", maxWidth: "500px", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: t.textMain }}>Edit Organiser Profile</h3>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={20} /></button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "8px" }}>Full Name</label>
                                        <input
                                            type="text"
                                            value={editingOrg.username}
                                            onChange={(e) => setEditingOrg({ ...editingOrg, username: e.target.value })}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "8px" }}>Email / User ID</label>
                                        <input
                                            type="email"
                                            value={editingOrg.email}
                                            disabled
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#0f172a', color: t.textSub, cursor: "not-allowed" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "8px" }}>Wallet Balance (₹)</label>
                                        <input
                                            type="number"
                                            value={parseFloat(String(editingOrg.balance).replace(/[^\d.-]/g, ''))}
                                            onChange={(e) => setEditingOrg({ ...editingOrg, balance: `₹${e.target.value}` })}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "8px" }}>Status (Active/Inactive)</label>
                                        <select
                                            value={editingOrg.status}
                                            onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value })}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Banned">Banned</option>
                                            <option value="Rejected">Rejected</option>
                                            <option value="KYC Completed">KYC Completed</option>
                                            <option value="Submitted">Submitted (Under Review)</option>
                                            <option value="KYC Pending">KYC Pending</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                    <button
                                        onClick={async () => {
                                            const balance = parseFloat(String(editingOrg.balance).replace(/[^\d.-]/g, ''));
                                            await patchOrganizerMutation({
                                                id: editingOrg.id,
                                                business_name: editingOrg.username,
                                                wallet_balance: isNaN(balance) ? 0 : balance,
                                                kyc_status: editingOrg.status
                                            });
                                            setIsEditModalOpen(false);
                                        }}
                                        style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "mobile_banners" && <MobileBannersAdmin theme={theme} t={t} />}

                    {partnerModal && (
                        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }} onClick={closePartnerModal}>
                            <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "500px", borderRadius: "20px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: `1px solid ${t.border}`, position: "relative" }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "22px", fontWeight: 800, color: t.textMain }}>{partnerModal === "edit" ? "Edit Partner" : "Add New Partner"}</h3>
                                    <button type="button" onClick={closePartnerModal} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub }}><X size={24} /></button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Partner Name</label>
                                        <input type="text" value={partnerForm.name} onChange={e => setPartnerForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Red Bull" style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px", fontWeight: 500 }} />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Logo URL</label>
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <input type="text" value={partnerForm.logo} onChange={e => setPartnerForm(f => ({ ...f, logo: e.target.value }))} placeholder="https://logo.url/img.png" style={{ flex: 1, padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px", fontWeight: 500 }} />
                                            <label style={{ padding: "14px 20px", backgroundColor: t.border, borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}>
                                                <Upload size={18} />
                                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setPartnerForm({ ...partnerForm, logo: ev.target.result });
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Website URL (optional)</label>
                                        <input type="text" value={partnerForm.url} onChange={e => setPartnerForm(f => ({ ...f, url: e.target.value }))} placeholder="https://redbull.com" style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px", fontWeight: 500 }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                                        <button type="button" onClick={closePartnerModal} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, cursor: "pointer", fontWeight: 700, fontSize: "16px" }}>Cancel</button>
                                        <button type="button" onClick={handleSavePartner} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "16px" }}>{partnerModal === "edit" ? "Update Partner" : "Save Partner"}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}


