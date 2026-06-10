/* eslint-disable */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery, useSupabaseMutation, useSupabaseConfig } from "@/hooks/useSupabase";
import GstPortal from "@/app/admin/components/GstPortal";
import { useAuth } from "@/components/AuthContext";
import AdminCheckoutFooter from "@/app/admin/components/AdminCheckoutFooter";
import MobileBannersAdmin from "@/app/admin/components/MobileBannersAdmin";
import AdminServiceRequestsTable from "@/app/admin/components/AdminServiceRequestsTable";
import AdminOrgRequestsTable from "@/app/admin/components/AdminOrgRequestsTable";
import AdminKycReview from "@/app/admin/components/AdminKycReview";
import AdminDigiLockerKYC from "@/app/admin/components/AdminDigiLockerKYC";
import EmailCommSystem from "@/app/admin/components/EmailCommSystem";
import SeoAnalyticsAdmin from "@/app/admin/components/SeoAnalyticsAdmin";
import CareersAdmin from "@/app/admin/components/CareersAdmin";
import CareersBannerSettings from "@/app/admin/components/CareersBannerSettings";
import AdminContactInquiries from "@/app/admin/components/AdminContactInquiries";
import RevenueDashboard from "@/app/admin/components/RevenueDashboard";
import GstAuditDashboard from "@/app/admin/components/GstAuditDashboard";
import SubscriptionPackagesAdmin from "@/app/admin/components/SubscriptionPackagesAdmin";
import ScannerMonitor from "@/app/admin/components/ScannerMonitor";
import FraudDashboard from "@/app/admin/components/FraudDashboard";
import FlashAdmin from "@/app/admin/components/FlashAdmin";
import ComplianceCMS from "@/app/admin/components/ComplianceCMS";
import PushCenter from "@/app/admin/components/PushCenter";
import FinanceCrossVerificationAdmin from "@/app/admin/components/FinanceCrossVerificationAdmin";
import EmailDashboard from "@/app/admin/components/EmailDashboard";
import EmailSettingsAdmin from "@/app/admin/components/EmailSettingsAdmin";
import SocialMediaManagement from "@/app/admin/components/SocialMediaManagement";
import AdminEventApprovalQueue from "@/app/admin/components/AdminEventApprovalQueue";
import OrganizerReportsAdmin from "@/app/admin/components/OrganizerReportsAdmin";
import UserRegistrationAnalytics from "@/app/admin/components/UserRegistrationAnalytics";
import AdminEventPublishing from "@/app/admin/components/AdminEventPublishing";
import ProfessionalServicesAdmin from "@/app/admin/components/ProfessionalServicesAdmin";
import DirectOnboardingAdmin from "@/app/admin/components/DirectOnboardingAdmin";
import AdminRevenueCommissionDashboard from "@/app/admin/components/AdminRevenueCommissionDashboard";
import AdminCancellationRequests from "@/app/admin/components/AdminCancellationRequests";
import RewardsManagement from "@/app/admin/components/RewardsManagement";
import SponsorsPartnersAdmin from "@/app/admin/components/SponsorsPartnersAdmin";
import { 
    MoreVertical, Zap, Briefcase, LayoutDashboard, Settings, Video, Image as ImageIcon, 
    Sparkles, CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2, Mail, Lock, 
    CreditCard, Code, Globe, Shield, FileText, Megaphone, Tag, LayoutGrid, Calendar, 
    Wallet, UserCheck, TrendingUp, Handshake,
    ShoppingCart, UserCircle, Gift, Send, BarChart3, Archive, MessageCircle, Upload, 
    Edit, Search, AlertCircle, ChevronDown, ChevronRight, LogOut, Activity, RefreshCw, 
    AlertTriangle, Info, Smartphone, MessageSquare, Landmark, Ban, Sun, Moon, Filter, 
    Building2, Cpu, ExternalLink, Eye, Layout, Settings2, ShieldCheck, Slash, ArrowRight, 
    User, Phone, Star, Trophy, Timer, Key, Layers, ShoppingBag, Utensils, Car, ShieldAlert, Download
} from "lucide-react";
import { HOME_EVENTS, HERO_BANNER_SLIDES } from "@/app/data/homeEvents";
import { eventMatchesCategory } from "@/app/utils/categoryMatch";
import { hashPassword } from "@/app/utils/hashPassword";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

const SERVICE_CATEGORIES = ["Mehendi Artist", "Mehandi Artist", "Photographer/Studio", "Makeup Artist", "Personal Service", "Artist"];
const EMPTY_ARRAY = Object.freeze([]);
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
const GroupTitle = ({ title, t, isOpen, onClick }) => (
    <div 
        onClick={onClick} 
        className={`mx-3 px-4 py-3.5 mt-2 flex items-center justify-between cursor-pointer transition-all duration-300 rounded-xl group relative overflow-hidden ${
            isOpen 
                ? 'bg-gradient-to-r from-pink-50/80 to-purple-50/80 shadow-sm border border-pink-100/50' 
                : 'hover:bg-slate-50'
        }`}
    >
        {/* Dynamic Left Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-300 ${
            isOpen 
                ? 'bg-gradient-to-b from-pink-500 to-purple-500 opacity-100' 
                : 'bg-pink-400 opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100'
        }`} />
        
        {/* Typography */}
        <p className={`text-[11px] font-black uppercase tracking-[0.2em] ml-1 transition-colors duration-300 ${
            isOpen 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600' 
                : 'text-slate-500 group-hover:text-slate-800'
        }`}>
            {title}
        </p>
        
        {/* Enclosed Chevron Micro-animation */}
        <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
            isOpen ? 'bg-white shadow-sm' : 'bg-transparent group-hover:bg-white group-hover:shadow-sm'
        }`}>
            <ChevronDown 
                size={14} 
                className={`transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-pink-500' : 'text-slate-400 group-hover:text-pink-400'
                }`} 
            />
        </div>
    </div>
);
const NavLink = ({ id, label, icon: Icon, active, setActiveTab, setIsSidebarOpen }) => (
    <div 
        className={`sidebar-item-new ${active ? 'active' : ''}`} 
        onClick={() => {
            setActiveTab(id);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 10 }}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span>{label}</span>
    </div>
);


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
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><RefreshCw className="animate-spin text-pink-500" size={40} /></div>}>
                <AdminHomePage />
            </React.Suspense>
        </ErrorBoundary>
    );
}

const AdminReviewsTable = ({ t, theme }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('reviews')
                .select('*, profiles:user_id(full_name), events:event_id(title)')
                .order('created_at', { ascending: false });
            setReviews(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const toggleApproval = async (id, currentStatus) => {
        try {
            const { error } = await supabase.from('reviews').update({ is_approved: !currentStatus }).eq('id', id);
            if (error) throw error;
            showToast(currentStatus ? "Review Hidden" : "Review Approved", "success");
            fetchReviews();
        } catch (err) {
            showToast("Failed to update review", "error");
        }
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading reviews...</div>;
    
    return (
        <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>User / Event</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Rating</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Content</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reviews.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No reviews found.</td></tr>
                    ) : reviews.map((r) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                            <td style={{ padding: "12px" }}>
                                <div style={{ fontWeight: 700, color: t.textMain }}>{r.profiles?.full_name || 'Anonymous'}</div>
                                <div style={{ fontSize: "11px", color: t.textSub }}>{r.events?.title || 'Unknown Event'}</div>
                            </td>
                            <td style={{ padding: "12px", fontWeight: 800, color: "#eab308" }}>⭐ {r.rating}/5</td>
                            <td style={{ padding: "12px" }}>
                                <div style={{ fontWeight: 600, color: t.textMain, fontSize: "13px" }}>{r.title}</div>
                                <div style={{ fontSize: "12px", color: t.textSub, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.content}</div>
                            </td>
                            <td style={{ padding: "12px" }}>
                                <span className={`badge ${r.is_approved ? 'badge-green' : 'badge-red'}`}>
                                    {r.is_approved ? 'APPROVED' : 'HIDDEN'}
                                </span>
                            </td>
                            <td style={{ padding: "12px" }}>
                                <button onClick={() => toggleApproval(r.id, r.is_approved)} style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: r.is_approved ? "#ef4444" : "#10b981", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                                    {r.is_approved ? 'Hide' : 'Approve'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const SubscribersTable = ({ t, theme }) => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const fetchSubscribers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/subscribers');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSubscribers(data.data || []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this subscriber?")) return;
        try {
            const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showToast("Subscriber removed successfully", "success");
            fetchSubscribers();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    if (error) return <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>Error loading subscribers: {error.message}</div>;
    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading subscribers...</div>;
    
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
                    <tr key={subs.id} style={{ backgroundColor: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}`, boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)" }}>
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
                                onClick={() => handleDelete(subs.id)}
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

    const displayBookings = (bookings || []).filter(b => {
        if (b.status === "pending") {
            const diff = Date.now() - new Date(b.created_at).getTime();
            return diff < (24 * 60 * 60 * 1000); // 24 Hours
        }
        return true;
    });

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
                {displayBookings.map((booking) => (
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
    const { data: bookings = [], loading, refresh } = useSupabaseQuery('pool_bookings', (q) => q.select('*, swimming_pools(name, city), profiles:user_id(full_name, phone)').order('created_at', { ascending: false }));
    const [updateStatus] = useSupabaseMutation('pool_bookings', 'update', (q, p) => q.eq('id', p.id));
    const { showToast } = useToast();

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading pool requests...</div>;
    if (bookings.length === 0) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No pool service requests found.</div>;

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateStatus({ id, status: newStatus });
            showToast(`Request ${newStatus.toLowerCase()} successfully`, "success");
            refresh();
        } catch (err) {
            showToast("Error updating status: " + err.message, "error");
        }
    };

    const displayBookings = (bookings || []).filter(b => {
        if (b.status === "Pending") {
            const diff = Date.now() - new Date(b.created_at).getTime();
            return diff < (24 * 60 * 60 * 1000); // 24 Hours
        }
        return true;
    });

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
                {displayBookings.map((booking) => (
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

const CustomSelect = ({ value, onChange, options = [], placeholder = 'Select option...', theme, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (!isOpen) setSearchTerm('');
    }, [isOpen]);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `1.5px solid ${t.border}`,
                    backgroundColor: theme === 'light' ? '#fff' : '#1e293b',
                    color: selectedOption ? t.textMain : t.textSub,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {selectedOption?.icon && <selectedOption.icon size={16} style={{ color: '#8b5cf6' }} />}
                    <span>{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', color: t.textSub }} />
            </div>

            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        borderRadius: '12px',
                        border: `1.5px solid ${t.border}`,
                        backgroundColor: theme === 'light' ? '#fff' : '#0f172a',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.15)',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ padding: '2px' }} onClick={e => e.stopPropagation()}>
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Type to search..."
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${t.border}`,
                                    backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b',
                                    color: t.textMain,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {filteredOptions.length === 0 ? (
                                <div style={{ padding: '10px 14px', fontSize: '12px', color: t.textSub, textAlign: 'center' }}>
                                    No matches found
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = opt.value === value;
                                    return (
                                        <div
                                            key={opt.value}
                                            onClick={() => {
                                                onChange(opt.value);
                                                setIsOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: isSelected ? 800 : 600,
                                                color: isSelected ? '#fff' : t.textMain,
                                                backgroundColor: isSelected ? '#8b5cf6' : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#1e293b';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            {opt.icon && <opt.icon size={15} style={{ color: isSelected ? '#fff' : '#8b5cf6' }} />}
                                            <span>{opt.label}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const CouponManager = ({ t, theme }) => {
    const [subTab, setSubTab] = useState('legacy'); // 'legacy', 'partners', 'campaigns', 'mappings', 'inventory', 'ledger'
    const { data: coupons = [], loading: legacyLoading, refresh: refreshLegacy } = useSupabaseQuery('coupons', q => q.order('created_at', { ascending: false }));
    const [upsertCoupon] = useSupabaseMutation('coupons', 'upsert');
    const [deleteCoupon] = useSupabaseMutation('coupons', 'delete', (q, p) => q.eq('id', p.id));
    const { showToast } = useToast();
    
    // Legacy Coupons State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ code: '', type: 'percent', value: '', min_tickets: 1, usage_limit_per_user: 1, expiry_date: '', is_active: true });
    const [editingId, setEditingId] = useState(null);

    // Partner Rewards State
    const [partners, setPartners] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [events, setEvents] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [redemptionLogs, setRedemptionLogs] = useState([]);
    const [loadingRewards, setLoadingRewards] = useState(false);

    // Forms State
    const [partnerForm, setPartnerForm] = useState({ name: '', logo_url: '', category: 'Shopping', description: '', contact_name: '', contact_email: '' });
    const [campaignForm, setCampaignForm] = useState({ partner_id: '', campaign_name: '', offer_title: '', offer_description: '', terms: '', redeem_url: '', start_date: '', end_date: '' });
    const [mappingForm, setMappingForm] = useState({ event_id: '', campaign_id: '', allocation_limit: 100, is_enabled: true });
    const [inventoryForm, setInventoryForm] = useState({ campaign_id: '', codesText: '' });
    const categoryOptions = useMemo(() => [
        { value: 'Shopping', label: 'Shopping / retail', icon: ShoppingBag },
        { value: 'Food & Dining', label: 'Food & Dining', icon: Utensils },
        { value: 'Travel', label: 'Travel & Cabs', icon: Car },
        { value: 'Entertainment', label: 'Entertainment', icon: Sparkles },
        { value: 'Health', label: 'Health & Wellness', icon: Activity }
    ], []);

    const partnerOptions = useMemo(() => partners.map(p => ({
        value: p.id,
        label: p.name,
        icon: Gift
    })), [partners]);

    const campaignOptions = useMemo(() => campaigns.map(c => ({
        value: c.id,
        label: `${c.partnerName} - ${c.campaign_name}`,
        icon: Gift
    })), [campaigns]);

    const eventOptions = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return events
            .filter(ev => {
                if (ev.status === 'expired') return false;
                if (ev.date) {
                    const evDate = new Date(ev.date);
                    if (evDate < today) return false;
                }
                return true;
            })
            .map(ev => ({
                value: ev.id,
                label: ev.title,
                icon: Ticket
            }));
    }, [events]);

    useEffect(() => {
        if (subTab !== 'legacy') {
            loadRewardsData();
        }
    }, [subTab]);

    const loadRewardsData = async () => {
        setLoadingRewards(true);
        try {
            // Load Partners
            const pRes = await fetch('/api/admin/partners');
            const pData = await pRes.json();
            if (pData.success) {
                setPartners(pData.partners || []);
                // Flat map campaigns
                const allCamps = (pData.partners || []).reduce((acc, curr) => {
                    return [...acc, ...(curr.partner_campaigns || []).map(c => ({ ...c, partnerName: curr.name }))];
                }, []);
                setCampaigns(allCamps);
            }

            // Load Events
            const { data: evs } = await supabase.from('events').select('id, title, status, date').eq('publish_status', 'published');
            setEvents(evs || []);

            // Load Mappings
            const { data: maps } = await supabase
                .from('event_coupon_mapping')
                .select('*, partner_campaigns(*), events(title)');
            setMappings(maps || []);

            // Load Rewards Ledger
            const { data: logs } = await supabase
                .from('user_coupon_rewards')
                .select('*, profiles(full_name, email), coupon_inventory(coupon_code, partner_campaigns(campaign_name, offer_title, partners(name)))')
                .order('unlocked_at', { ascending: false });
            setRedemptionLogs(logs || []);

        } catch (err) {
            console.error("Error loading rewards admin data:", err);
            showToast("Failed to load rewards data", "error");
        } finally {
            setLoadingRewards(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                code: formData.code.toUpperCase(),
                value: parseFloat(formData.value),
                min_tickets: parseInt(formData.min_tickets),
                usage_limit_per_user: parseInt(formData.usage_limit_per_user),
                expiry_date: formData.expiry_date || null
            };
            if (editingId) payload.id = editingId;
            
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.success) {
                showToast(`Coupon ${editingId ? 'updated' : 'created'} successfully`, "success");
                setShowModal(false);
                setEditingId(null);
                setFormData({ code: '', type: 'percent', value: '', min_tickets: 1, usage_limit_per_user: 1, expiry_date: '', is_active: true });
                refreshLegacy();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast("Error saving coupon: " + err.message, "error");
        }
    };

    const handleCreatePartner = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/partners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partnerForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast("Partner onboarded successfully!", "success");
                setPartnerForm({ name: '', logo_url: '', category: 'Shopping', description: '', contact_name: '', contact_email: '' });
                loadRewardsData();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/partner-campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast("Campaign created successfully!", "success");
                setCampaignForm({ partner_id: '', campaign_name: '', offer_title: '', offer_description: '', terms: '', redeem_url: '', start_date: '', end_date: '' });
                loadRewardsData();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const handleCreateMapping = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/event-mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappingForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast("Event rewards campaign mapping saved!", "success");
                setMappingForm({ event_id: '', campaign_id: '', allocation_limit: 100, is_enabled: true });
                loadRewardsData();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const handleImportInventory = async (e) => {
        e.preventDefault();
        try {
            const codes = inventoryForm.codesText
                .split(/[\n,]+/)
                .map(c => c.trim())
                .filter(c => c.length > 0);

            if (codes.length === 0) {
                showToast("Please enter at least one coupon code", "warning");
                return;
            }

            const res = await fetch('/api/admin/coupon-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaign_id: inventoryForm.campaign_id,
                    coupons: codes
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Successfully imported ${data.count} coupon codes!`, "success");
                setInventoryForm({ campaign_id: '', codesText: '' });
                loadRewardsData();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    return (
        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", border: `1px solid ${t.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
            
            {/* Header Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: `1px solid ${t.border}`, paddingBottom: '20px' }}>
                <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: t.textMain, letterSpacing: '-0.02em', margin: 0 }}>Advanced Promotional Ledger</h3>
                    <p style={{ fontSize: '12px', color: t.textSub, marginTop: '4px' }}>Control direct checkout discounts and post-booking partner rewards.</p>
                </div>
            </div>

            {/* Inner Tabs Row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {[
                    { id: 'legacy', label: 'Legacy Cart Coupons', icon: Tag },
                    { id: 'partners', label: 'Onboard Brands', icon: Briefcase },
                    { id: 'campaigns', label: 'Reward Campaigns', icon: Gift },
                    { id: 'mappings', label: 'Event Mappings', icon: Layers },
                    { id: 'inventory', label: 'Inventory Import', icon: Upload },
                    { id: 'ledger', label: 'Redemption Ledger', icon: BarChart3 }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = subTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setSubTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                background: isActive ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' : (theme === 'light' ? '#f1f5f9' : '#1e293b'),
                                color: isActive ? '#fff' : t.textSub,
                                transition: 'all 0.2s',
                                boxShadow: isActive ? '0 4px 15px rgba(236,72,153,0.2)' : 'none'
                            }}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Legacy Tab View */}
            {subTab === 'legacy' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button 
                            onClick={() => { setEditingId(null); setFormData({ code: '', type: 'percent', value: '', min_tickets: 1, usage_limit_per_user: 1, expiry_date: '', is_active: true }); setShowModal(true); }}
                            style={{ padding: "10px 20px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: '0 4px 12px rgba(236,72,153,0.2)' }}
                        >
                            <Plus size={18} /> Create Cart Coupon
                        </button>
                    </div>

                    <div className="table-container">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Code</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Discount</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Conditions</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Status</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No coupons found.</td></tr>
                                ) : coupons.map((c) => (
                                    <tr key={c.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                        <td style={{ padding: "14px", fontWeight: 800, color: t.textMain }}>{c.code}</td>
                                        <td style={{ padding: "14px" }}>
                                            <span style={{ padding: "4px 8px", backgroundColor: "#ec489915", color: "#ec4899", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                                                {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px", fontSize: "12px", color: t.textSub }}>
                                            <div>Min Tickets: {c.min_tickets}</div>
                                            <div>Limit/User: {c.usage_limit_per_user}</div>
                                            {c.expiry_date && <div>Expires: {new Date(c.expiry_date).toLocaleDateString()}</div>}
                                        </td>
                                        <td style={{ padding: "14px" }}>
                                            <span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>
                                                {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px" }}>
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <button onClick={() => { setEditingId(c.id); setFormData({ ...c, expiry_date: c.expiry_date ? new Date(c.expiry_date).toISOString().split('T')[0] : '' }); setShowModal(true); }} style={{ color: t.textSub, background: "none", border: "none", cursor: "pointer" }}><Edit size={16} /></button>
                                                <button onClick={() => deleteCoupon({ id: c.id }).then(() => refreshLegacy())} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Partners Onboarding View */}
            {subTab === 'partners' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                    <form onSubmit={handleCreatePartner} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: theme === 'light' ? '#f8fafc' : '#111827', padding: '24px', borderRadius: '20px', border: `1px solid ${t.border}` }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: t.textMain, margin: '0 0 8px' }}>Onboard Brand Partner</h4>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Brand Name</label>
                            <input required value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} placeholder="e.g. Swiggy" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Logo URL</label>
                            <input value={partnerForm.logo_url} onChange={e => setPartnerForm({...partnerForm, logo_url: e.target.value})} placeholder="https://..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Category</label>
                            <CustomSelect 
                                value={partnerForm.category} 
                                onChange={val => setPartnerForm({...partnerForm, category: val})} 
                                options={categoryOptions}
                                placeholder="Select Category"
                                theme={theme}
                                t={t}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Description</label>
                            <textarea value={partnerForm.description} onChange={e => setPartnerForm({...partnerForm, description: e.target.value})} placeholder="Brief brand overview" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, height: '70px', resize: 'none' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Contact Name</label>
                                <input value={partnerForm.contact_name} onChange={e => setPartnerForm({...partnerForm, contact_name: e.target.value})} placeholder="POC Name" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Contact Email</label>
                                <input value={partnerForm.contact_email} onChange={e => setPartnerForm({...partnerForm, contact_email: e.target.value})} placeholder="poc@brand.com" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                            </div>
                        </div>
                        <button type="submit" style={{ padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", color: "#fff", border: "none", fontWeight: 800, textTransform: "uppercase", cursor: "pointer", marginTop: '8px' }}>
                            Onboard Brand
                        </button>
                    </form>

                    <div className="table-container">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Partner</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Category</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Contact info</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Campaigns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partners.length === 0 ? (
                                    <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No partners onboarded yet.</td></tr>
                                ) : partners.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                        <td style={{ padding: "14px", fontWeight: 800, color: t.textMain }}>{p.name}</td>
                                        <td style={{ padding: "14px" }}>
                                            <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#3b82f615', color: '#3b82f6', fontSize: '11px', fontWeight: 800 }}>{p.category}</span>
                                        </td>
                                        <td style={{ padding: "14px", fontSize: "12px", color: t.textSub }}>
                                            <div>{p.contact_name || 'No POC'}</div>
                                            <div>{p.contact_email || 'No Email'}</div>
                                        </td>
                                        <td style={{ padding: "14px", fontSize: "13px", fontWeight: 700, color: t.textMain }}>
                                            {p.partner_campaigns?.length || 0} active
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Campaign Creator View */}
            {subTab === 'campaigns' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                    <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: theme === 'light' ? '#f8fafc' : '#111827', padding: '24px', borderRadius: '20px', border: `1px solid ${t.border}` }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: t.textMain, margin: '0 0 8px' }}>Launch Reward Campaign</h4>
                        
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Select Partner</label>
                            <CustomSelect 
                                value={campaignForm.partner_id} 
                                onChange={val => setCampaignForm({...campaignForm, partner_id: val})} 
                                options={partnerOptions}
                                placeholder="Choose partner..."
                                theme={theme}
                                t={t}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Campaign Name</label>
                            <input required value={campaignForm.campaign_name} onChange={e => setCampaignForm({...campaignForm, campaign_name: e.target.value})} placeholder="e.g. Swiggy Super Food Fest 2026" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Offer Headline / Title</label>
                            <input required value={campaignForm.offer_title} onChange={e => setCampaignForm({...campaignForm, offer_title: e.target.value})} placeholder="e.g. Flat Rs.150 OFF on orders above Rs.399" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Offer Description</label>
                            <textarea value={campaignForm.offer_description} onChange={e => setCampaignForm({...campaignForm, offer_description: e.target.value})} placeholder="Enter description details..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, height: '60px', resize: 'none' }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Redeem Redirect URL</label>
                            <input required value={campaignForm.redeem_url} onChange={e => setCampaignForm({...campaignForm, redeem_url: e.target.value})} placeholder="https://..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Start Date</label>
                                <input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm({...campaignForm, start_date: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>End Date</label>
                                <input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm({...campaignForm, end_date: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                            </div>
                        </div>
                        <button type="submit" style={{ padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", color: "#fff", border: "none", fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>
                            Launch Campaign
                        </button>
                    </form>

                    <div className="table-container">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Campaign Name</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Brand</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Offer Details</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Validity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.length === 0 ? (
                                    <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No reward campaigns defined yet.</td></tr>
                                ) : campaigns.map((c) => (
                                    <tr key={c.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                        <td style={{ padding: "14px", fontWeight: 800, color: t.textMain }}>{c.campaign_name}</td>
                                        <td style={{ padding: "14px", fontSize: "13px", fontWeight: 700, color: t.textMain }}>{c.partnerName}</td>
                                        <td style={{ padding: "14px", fontSize: "12px", color: t.textSub }}>
                                            <div style={{ fontWeight: 800, color: t.textMain }}>{c.offer_title}</div>
                                            <div style={{ fontSize: '11px', marginTop: '2px' }}>{c.redeem_url}</div>
                                        </td>
                                        <td style={{ padding: "14px", fontSize: "12px", color: t.textSub }}>
                                            <div>Start: {c.start_date ? new Date(c.start_date).toLocaleDateString() : 'N/A'}</div>
                                            <div>End: {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'N/A'}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Event mappings view */}
            {subTab === 'mappings' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                    <form onSubmit={handleCreateMapping} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: theme === 'light' ? '#f8fafc' : '#111827', padding: '24px', borderRadius: '20px', border: `1px solid ${t.border}` }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: t.textMain, margin: '0 0 8px' }}>Map Rewards to Event Tickets</h4>
                        
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Select Premium Event</label>
                            <CustomSelect 
                                value={mappingForm.event_id} 
                                onChange={val => setMappingForm({...mappingForm, event_id: val})} 
                                options={eventOptions}
                                placeholder="Choose event..."
                                theme={theme}
                                t={t}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Select Reward Campaign</label>
                            <CustomSelect 
                                value={mappingForm.campaign_id} 
                                onChange={val => setMappingForm({...mappingForm, campaign_id: val})} 
                                options={campaignOptions}
                                placeholder="Choose campaign..."
                                theme={theme}
                                t={t}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Allocation Count Limit</label>
                            <input type="number" required value={mappingForm.allocation_limit} onChange={e => setMappingForm({...mappingForm, allocation_limit: parseInt(e.target.value)})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain }} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                            <input type="checkbox" checked={mappingForm.is_enabled} onChange={e => setMappingForm({...mappingForm, is_enabled: e.target.checked})} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: t.textMain }}>Enable Allocations</span>
                        </label>
                        <button type="submit" style={{ padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", color: "#fff", border: "none", fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>
                            Save Event Reward Mapping
                        </button>
                    </form>

                    <div className="table-container">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Event</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Mapped Campaign</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Allocation Limit</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mappings.length === 0 ? (
                                    <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No event-campaign mappings saved yet.</td></tr>
                                ) : mappings.map((m) => (
                                    <tr key={m.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                        <td style={{ padding: "14px", fontWeight: 800, color: t.textMain }}>{m.events?.title || 'Unknown Event'}</td>
                                        <td style={{ padding: "14px", fontSize: "13px", fontWeight: 700, color: t.textMain }}>{m.partner_campaigns?.campaign_name || 'Unknown Campaign'}</td>
                                        <td style={{ padding: "14px", fontSize: "13px", color: t.textMain }}>{m.allocation_limit} max</td>
                                        <td style={{ padding: "14px" }}>
                                            <span className={`badge ${m.is_enabled ? 'badge-green' : 'badge-red'}`}>
                                                {m.is_enabled ? 'ACTIVE' : 'MUTED'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Inventory Import View */}
            {subTab === 'inventory' && (
                <div style={{ maxWidth: '650px', margin: '0 auto' }}>
                    <form onSubmit={handleImportInventory} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: theme === 'light' ? '#f8fafc' : '#111827', padding: '32px', borderRadius: '24px', border: `1px solid ${t.border}` }}>
                        <h4 style={{ fontSize: '18px', fontWeight: 900, color: t.textMain, margin: 0 }}>Bulk Partner Coupon Code Loader</h4>
                        <p style={{ fontSize: '12px', color: t.textSub, margin: 0 }}>Select a campaign and paste unique vendor coupon codes to hydrate the reward bank inventory pool.</p>
                        
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Select Reward Campaign</label>
                            <CustomSelect 
                                value={inventoryForm.campaign_id} 
                                onChange={val => setInventoryForm({...inventoryForm, campaign_id: val})} 
                                options={campaignOptions}
                                placeholder="Choose campaign..."
                                theme={theme}
                                t={t}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Enter Coupon Codes (One per line or comma-separated)</label>
                            <textarea required value={inventoryForm.codesText} onChange={e => setInventoryForm({...inventoryForm, codesText: e.target.value})} placeholder="FLIPKART500&#10;FLIPKART1000&#10;FLIPKART2000..." style={{ width: "100%", padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, height: '180px', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.5 }} />
                        </div>
                        <button type="submit" style={{ padding: "16px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", color: "#fff", border: "none", fontWeight: 800, textTransform: "uppercase", cursor: "pointer", letterSpacing: '0.5px' }}>
                            Bulk Hydrate Reward Inventory
                        </button>
                    </form>
                </div>
            )}

            {/* Ledger View */}
            {subTab === 'ledger' && (
                <div>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                        <div style={{ flex: 1, padding: '20px', background: theme === 'light' ? '#f8fafc' : '#111827', borderRadius: '16px', border: `1px solid ${t.border}` }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase', marginBottom: '4px' }}>Total Unlocked Coupons</div>
                            <div style={{ fontSize: '26px', fontWeight: 900, color: t.textMain }}>{redemptionLogs.length}</div>
                        </div>
                        <div style={{ flex: 1, padding: '20px', background: theme === 'light' ? '#f8fafc' : '#111827', borderRadius: '16px', border: `1px solid ${t.border}` }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase', marginBottom: '4px' }}>Redeemed / Used Coupons</div>
                            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>{redemptionLogs.filter(l => l.reward_status === 'redeemed').length}</div>
                        </div>
                        <div style={{ flex: 1, padding: '20px', background: theme === 'light' ? '#f8fafc' : '#111827', borderRadius: '16px', border: `1px solid ${t.border}` }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase', marginBottom: '4px' }}>Active Conversion Rate</div>
                            <div style={{ fontSize: '26px', fontWeight: 900, color: '#8b5cf6' }}>
                                {redemptionLogs.length > 0 
                                    ? ((redemptionLogs.filter(l => l.reward_status === 'redeemed').length / redemptionLogs.length) * 100).toFixed(1) + '%' 
                                    : '0%'}
                            </div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Customer</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Brand & Campaign</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Coupon Code</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Unlocked Date</th>
                                    <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {redemptionLogs.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No coupon rewards unlocked or logged yet.</td></tr>
                                ) : redemptionLogs.map((l) => {
                                    const inv = l.coupon_inventory || {};
                                    const camp = inv.partner_campaigns || {};
                                    const part = camp.partners || {};
                                    
                                    return (
                                        <tr key={l.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                            <td style={{ padding: "14px", fontSize: "13px" }}>
                                                <div style={{ fontWeight: 800, color: t.textMain }}>{l.profiles?.full_name || 'Guest User'}</div>
                                                <div style={{ fontSize: '11px', color: t.textSub }}>{l.profiles?.email}</div>
                                            </td>
                                            <td style={{ padding: "14px", fontSize: "13px" }}>
                                                <div style={{ fontWeight: 800, color: t.textMain }}>{part.name}</div>
                                                <div style={{ fontSize: '11px', color: t.textSub }}>{camp.campaign_name}</div>
                                            </td>
                                            <td style={{ padding: "14px", fontWeight: 800, fontFamily: 'monospace', color: t.textMain }}>
                                                {inv.coupon_code || 'N/A'}
                                            </td>
                                            <td style={{ padding: "14px", fontSize: "12px", color: t.textSub }}>
                                                {new Date(l.unlocked_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "14px" }}>
                                                <span className={`badge ${l.reward_status === 'redeemed' ? 'badge-green' : 'badge-blue'}`}>
                                                    {l.reward_status?.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cart Coupon Creator modal (Legacy view modal) */}
            {showModal && subTab === 'legacy' && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                    <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "500px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: 800 }}>{editingId ? 'Edit' : 'New'} Coupon</h3>
                            <button onClick={() => setShowModal(false)} style={{ color: t.textSub, background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Coupon Code</label>
                                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', color: t.textMain }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Type</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', color: t.textMain }}>
                                        <option value="percent">Percent (%)</option>
                                        <option value="fixed">Fixed (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Value</label>
                                    <input required type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', color: t.textMain }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Min Tickets</label>
                                    <input required type="number" value={formData.min_tickets} onChange={e => setFormData({...formData, min_tickets: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', color: t.textMain }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Limit per User</label>
                                    <input required type="number" value={formData.usage_limit_per_user} onChange={e => setFormData({...formData, usage_limit_per_user: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', color: t.textMain }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: t.textSub, marginBottom: "6px", textTransform: "uppercase" }}>Expiry Date</label>
                                <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', color: t.textMain }} />
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                <span style={{ fontSize: "13px", fontWeight: 700 }}>Active</span>
                            </label>
                            <button type="submit" style={{ marginTop: "12px", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", color: "#fff", border: "none", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>
                                {editingId ? 'Update' : 'Create'} Coupon
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};;


const PayoutRequestsTable = ({ t, theme }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/withdraw-requests');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch withdraw requests');
            }
            const enriched = await response.json();
            setRequests(enriched || []);
        } catch (err) {
            console.error("Fetch requests error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    // const [updateStatus] = useSupabaseMutation('withdraw_requests', 'update', (q, p) => q.eq('id', p.id));
    const [addTransaction] = useSupabaseMutation('wallet_transactions', 'insert');
    const { showToast } = useToast();
    const refresh = fetchRequests;

    const handleAction = async (request, newStatus) => {
        try {
            if (newStatus === 'approved') {
                const response = await fetch('/api/admin/withdraw-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: request.id, status: 'approved' })
                });
                if (!response.ok) throw new Error("Failed to update status");

                await supabase.from('wallet_transactions')
                    .update({ description: 'Withdrawal Completed' })
                    .eq('reference_id', request.id);

                showToast("Payout marked as approved", "success");
            } else if (newStatus === 'rejected') {
                const response = await fetch('/api/admin/withdraw-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: request.id, status: 'rejected' })
                });
                if (!response.ok) throw new Error("Failed to update status");

                // Refund to appropriate wallet
                if (request.provider_id && request.wallet_table && request.wallet_col) {
                    const { data: walletData } = await supabase
                        .from(request.wallet_table)
                        .select('balance')
                        .eq(request.wallet_col, request.provider_id)
                        .single();
                    
                    if (walletData) {
                        await supabase
                            .from(request.wallet_table)
                            .update({ balance: walletData.balance + request.amount })
                            .eq(request.wallet_col, request.provider_id);
                    }
                }

                await addTransaction({
                    provider_id: request.provider_id,
                    provider_type: request.requester_type === 'organiser' ? 'organiser' : 'service',
                    amount: request.amount,
                    type: 'credit',
                    description: `Payout Rejected - Refunded`,
                    reference_id: request.id
                });

                showToast("Payout rejected and funds refunded", "info");
            }
            refresh();
        } catch (err) {
            showToast("Action failed: " + err.message, "error");
        }
    };

    const stats = useMemo(() => {
        const pending = requests.filter(r => r.status === 'pending').reduce((acc, r) => acc + (r.amount || 0), 0);
        const approved = requests.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.amount || 0), 0);
        const total = requests.filter(r => r.status === 'paid' || r.status === 'processed').reduce((acc, r) => acc + (r.amount || 0), 0);
        return { pending, approved, total, count: requests.length };
    }, [requests]);

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading payout requests...</div>;

    return (
        <div className="space-y-6">
            {/* Analytics Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <div style={{ padding: "24px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
                    <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pending Payouts</p>
                    <p style={{ fontSize: "24px", fontWeight: 900, color: "#f59e0b", marginTop: "8px" }}>₹{stats.pending.toLocaleString()}</p>
                </div>
                <div style={{ padding: "24px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
                    <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Approved (Unpaid)</p>
                    <p style={{ fontSize: "24px", fontWeight: 900, color: "#3b82f6", marginTop: "8px" }}>₹{stats.approved.toLocaleString()}</p>
                </div>
                <div style={{ padding: "24px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
                    <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Disbursed</p>
                    <p style={{ fontSize: "24px", fontWeight: 900, color: "#10b981", marginTop: "8px" }}>₹{stats.total.toLocaleString()}</p>
                </div>
                <div style={{ padding: "24px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
                    <p style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Requests</p>
                    <p style={{ fontSize: "24px", fontWeight: 900, color: "#1e293b", marginTop: "8px" }}>{stats.count}</p>
                </div>
            </div>

            <div className="table-container" style={{ backgroundColor: "#fff", borderRadius: "24px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Organiser</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Requested Amount</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Wallet Balance</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No payout requests found.</td></tr>
                    ) : requests.map((req) => (
                        <tr key={req.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                            <td style={{ padding: "12px" }}>
                                <div style={{ fontWeight: 700, color: t.textMain }}>
                                    {req.requester_name}
                                </div>
                                <div style={{ fontSize: "11px", color: t.textSub }}>{new Date(req.created_at).toLocaleString()}</div>
                                {req.bank_details && (
                                    <div style={{ marginTop: "4px", padding: "4px 8px", backgroundColor: "#f8fafc", borderRadius: "4px", fontSize: "10px", color: "#64748b", border: "1px solid #e2e8f0" }}>
                                        <span style={{ fontWeight: 800, color: "#475569" }}>{req.bank_details.payment_type?.toUpperCase()}:</span> {req.bank_details.account_number || req.bank_details.upi_id} ({req.bank_details.ifsc_code || 'UPI'})
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: "12px", fontWeight: 800, color: "#ec4899" }}>₹{Number(req.amount).toFixed(2)}</td>
                            <td style={{ padding: "12px", color: t.textMain, fontWeight: 600 }}>₹{Number(req.current_balance || 0).toFixed(2)}</td>
                            <td style={{ padding: "12px" }}>
                                <span className={`badge ${req.status === 'approved' ? 'badge-green' : req.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                                    {req.status.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: "12px" }}>
                                {req.status === 'pending' && (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button onClick={() => handleAction(req, 'approved')} style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "#10b981", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Approve</button>
                                        <button onClick={() => handleAction(req, 'rejected')} style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "#ef4444", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Reject</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    );
};


function AdminHomePage() {
    const { user, loading, logout } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [isMainGroupOpen, setIsMainGroupOpen] = useState(false);
    const [isPartnersGroupOpen, setIsPartnersGroupOpen] = useState(false);
    const [isServicesGroupOpen, setIsServicesGroupOpen] = useState(false);
    const [isGrowthGroupOpen, setIsGrowthGroupOpen] = useState(false);
    const [isFinanceGroupOpen, setIsFinanceGroupOpen] = useState(false);
    const [isSecurityGroupOpen, setIsSecurityGroupOpen] = useState(false);
    const [isReportsGroupOpen, setIsReportsGroupOpen] = useState(false);
    const [isSettingsGroupOpen, setIsSettingsGroupOpen] = useState(false);

    // Admin Security Gate: Support all administrative roles
    const adminRoles = useMemo(() => ["admin", "super_admin", "system_admin", "finance_admin", "moderator", "support_admin"], []);
    
    useEffect(() => {
        if (!loading && (!user || !adminRoles.includes(user.role?.toLowerCase()))) {
            router.push("/signin?redirect=/admin");
        }
    }, [user, loading, router, adminRoles]);

    useEffect(() => {
        if (!user || !adminRoles.includes(user.role)) return;

        const channel = supabase
            .channel('new-applicants')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_applications' }, payload => {
                showToast(`New Application from ${payload.new.name}!`, "info");
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleLogout = () => {
        logout();
    };
    const rawTab = searchParams.get("tab") || "dashboard";
    const aliases = useMemo(() => ({
        'users': 'customers',
        'organisers': 'all_org',
        'providers': 'service_active',
        'vendors': 'service_active',
        'kyc': 'partner_requests',
        'fraud-monitoring': 'fraud_dashboard',
        'analytics': 'financials',
        'all_org': 'all_org',
        'active_org': 'active_org',
        'kyc_pending': 'kyc_pending',
        'banned_org': 'banned_org',
        'service_active': 'service_active',
        'revenue': 'revenue',
        'payments': 'revenue'
    }), []);
    const activeTab = aliases[rawTab] || rawTab;
    const setActiveTab = (tabId) => {
        const canonicalTab = aliases[tabId] || tabId;
        router.push(`/admin?tab=${encodeURIComponent(canonicalTab)}`);
    };

    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Auto-expand sidebar categories based on active tab
    useEffect(() => {
        const homeTabs = ["hero", "mobile_banners", "video_banner", "site_branding", "events_settings", "event_partners", "memories", "sections", "copyright", "meeting_settings", "maintenance", "checkout_footer", "subnav"];
        const organizerTabs = ["all_org", "active_org", "kyc_verified", "kyc_pending", "banned_org"];
        const serviceTabs = ["all_turfs", "turf_bookings", "pool_bookings", "service_active", "service_banned"];
        const growthTabs = ["promotions", "send_notif", "email_broadcast", "comm_hub", "rewards_vouchers"];
        const settingTabs = ["api_settings", "payment_settings", "fee_settings", "email_settings", "meta_management", "email_templates", "disclaimer_settings", "sso_settings", "ticket_settings", "comm_hub", "terms_settings", "social_media_settings"];
        const careerTabs = ["careers_admin", "careers_banner"];

        if (homeTabs.includes(activeTab)) setIsHomeSettingsOpen(true);
        if (organizerTabs.includes(activeTab)) setIsOrganizersOpen(true);
        if (serviceTabs.includes(activeTab)) setIsServicesOpen(true);
        if (growthTabs.includes(activeTab)) setIsGrowthOpen(true);
        if (settingTabs.includes(activeTab)) setIsSettingsOpen(true);
        if (careerTabs.includes(activeTab)) setIsCareersOpen(true);
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
    const [adminSession, setAdminSession] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setAdminSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setAdminSession(session));
        return () => subscription.unsubscribe();
    }, []);

    const [showSsoModal, setShowSsoModal] = useState(false);
    const [ssoEditingType, setSsoEditingType] = useState(""); // "google" | "facebook"
    const [ssoForm, setSsoForm] = useState({ clientId: "", clientSecret: "" });
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
    // Careers Data
    const { data: jobApplicants = EMPTY_ARRAY } = useSupabaseQuery('job_applications', (q) => q.eq('status', 'new'), []);
    const newApplicantsCount = jobApplicants.length;

    const [isCareersOpen, setIsCareersOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [openRequestActionId, setOpenRequestActionId] = useState(null);
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [turfBookings, setTurfBookings] = useState([]);
    const [paymentGatewayConfig, setPaymentGatewayConfig] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
    const [newManualPassword, setNewManualPassword] = useState("");
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [eventPartners, setEventPartners] = useState([]);
    const [partnerModal, setPartnerModal] = useState(null); // 'add' | 'edit'
    const [editingPartner, setEditingPartner] = useState(null);
    const [partnerForm, setPartnerForm] = useState({ name: "", logo: "", url: "" });
    const initialVideoConfig = useMemo(() => ({
        key: 'admin_video_banner',
        videoUrl: "/bookmyticket/videoplayback.mp4",
        title1: "Discover Your Next",
        title2: "Unforgettable Experience",
        subtitle: "Explore concerts, shows, nightlife, and exclusive experiences happening around you.",
    }), []);
    const [videoBannerConfig, setVideoBannerConfig] = useSupabaseConfig("system_config", initialVideoConfig);

    const initialMaintenanceConfig = useMemo(() => ({
        key: 'maintenance_mode',
        maintenance_mode: false,
        maintenance_message: "We're upgrading your experience. Please check back soon!"
    }), []);
    const [maintenanceConfig, setMaintenanceConfig] = useSupabaseConfig("system_config", initialMaintenanceConfig);

    const initialSeoConfig = useMemo(() => ({
        key: 'seo_analytics',
        ga_id: "G-XXXXXXXXXX",
        ga_enabled: false,
        city_seo_overrides: {},
        backlink_tracking: [],
        sitemap_last_ping: null
    }), []);
    const [seoAnalyticsConfig, setSeoAnalyticsConfig] = useSupabaseConfig("system_config", initialSeoConfig);


    const { data: rawPaymentGateways = EMPTY_ARRAY, loading: gatewaysLoading } = useSupabaseQuery('payment_gateways', q => q, [], { realtime: true });
    const [addPaymentGateway] = useSupabaseMutation('payment_gateways', 'insert');
    const [patchPaymentGateway] = useSupabaseMutation('payment_gateways', 'update', (q, p) => q.eq('id', p.id));
    const [removePaymentGateway] = useSupabaseMutation('payment_gateways', 'delete', (q, p) => q.eq('id', p.id));

    // Sync turf bookings from Supabase
    const { data: turfBookingsArr = EMPTY_ARRAY } = useSupabaseQuery('turf_bookings', q => q, [], { realtime: false });
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedLedgerOrg, setSelectedLedgerOrg] = useState(null);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [eventEditForm, setEventEditForm] = useState(null);
    useEffect(() => {
        if (turfBookingsArr.length > 0) {
            setTurfBookings(turfBookingsArr);
        }
    }, [turfBookingsArr]);

    const hasSeededGatewaysRef = React.useRef(false);

    // Seed default gateways if empty
    useEffect(() => {
        if (activeTab === "payment_settings" && !gatewaysLoading && rawPaymentGateways.length === 0 && !hasSeededGatewaysRef.current) {
            hasSeededGatewaysRef.current = true;
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
    }, [activeTab, rawPaymentGateways, gatewaysLoading]);

    // Fee Settings
    const { data: feeSettingsArr = EMPTY_ARRAY } = useSupabaseQuery('fee_settings', q => q, [], { realtime: false });
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
    const { data: ticketSettingsArr = EMPTY_ARRAY } = useSupabaseQuery('ticket_settings', q => q, [], { realtime: false });
    const [updateTicketSettings] = useSupabaseMutation('ticket_settings', 'update', (q, p) => q.eq('id', p.id));

    const { data: emailSettingsArr = EMPTY_ARRAY } = useSupabaseQuery('email_settings', q => q, [], { realtime: false });
    const [updateEmailSettings] = useSupabaseMutation('email_settings', 'update', (q, p) => q.eq('id', p.id));

    const { data: seoSettingsArr = EMPTY_ARRAY } = useSupabaseQuery('seo_settings', q => q, [], { realtime: false });
    const [updateSeoSettings] = useSupabaseMutation('seo_settings', 'update', (q, p) => q.eq('id', p.id));

    const { data: emailTemplates = EMPTY_ARRAY } = useSupabaseQuery('email_templates', q => q, [], { realtime: false });
    const [addEmailTemplate] = useSupabaseMutation('email_templates', 'upsert');
    const [patchEmailTemplate] = useSupabaseMutation('email_templates', 'update', (q, p) => q.eq('id', p.id));
    const [removeEmailTemplate] = useSupabaseMutation('email_templates', 'delete', (q, p) => q.eq('id', p.id));

    const hasSeededEmailTemplatesRef = React.useRef(false);

    // Seed default email templates if empty
    useEffect(() => {
        if (activeTab === "email_templates" && emailTemplates !== undefined && emailTemplates.length === 0 && !hasSeededEmailTemplatesRef.current) {
            hasSeededEmailTemplatesRef.current = true;
            const defaults = [
                { identifier: "booking", name: "Ticket Booking Confirmation", subject: "Tickets Confirmed: {{eventName}}! 🎉", body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #f84464, #c026d3); padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }
        .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 30px; }
        .detail-item { margin-bottom: 15px; }
        .detail-item:last-child { margin-bottom: 0; }
        .detail-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; display: block; }
        .detail-value { font-size: 16px; font-weight: 700; color: #0f172a; }
        .btn-container { text-align: center; margin-top: 30px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f84464, #c026d3); color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 20px rgba(248, 68, 100, 0.2); }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background-color: #fafbfc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Confirmed! 🎉</h1>
            <p>Get ready for an amazing experience</p>
        </div>
        <div class="content">
            <div class="greeting">Hello {{name}},</div>
            <p>Your tickets for <strong>{{eventName}}</strong> have been successfully confirmed. We are thrilled to have you!</p>
            
            <div class="details-box">
                <div class="detail-item">
                    <span class="detail-label">Event Name</span>
                    <span class="detail-value">{{eventName}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Event Date & Time</span>
                    <span class="detail-value">{{date}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ticket Code</span>
                    <span class="detail-value">{{ticketNumber}}</span>
                </div>
            </div>

            <p>Please keep this email safe. You can view your digital pass and QR code using the link below. Present it at the venue gates for seamless entry.</p>
            
            <div class="btn-container">
                <a href="https://bookmyticket.net/tickets/{{ticketNumber}}" class="btn">View Digital Ticket</a>
            </div>
        </div>
        <div class="footer">
            &copy; 2026 BookMyTicket. All rights reserved.<br>
            For support or queries, contact us at support@bookmyticket.net.
        </div>
    </div>
</body>
</html>`, auto_send: true },
                { identifier: "canceled", name: "Ticket Booking Canceled", subject: "Booking Canceled: {{eventName}}", body: "Hello {{name}},\n\nYour booking for {{eventName}} has been canceled.\n\nRefund details: {{refund_info}}\n\nWe hope to see you again soon.", auto_send: true },
                { identifier: "welcome_registration", name: "User Registration", subject: "Welcome to BookMyTicket! 🎉", body: "Welcome to BookMyTicket!\n\nYour account has been successfully created.\n\nStart exploring events here: https://bookmyticket.net", auto_send: true },
                { identifier: "otp", name: "OTP Verification", subject: "{{otp}} is your verification code", body: "Your verification code is: {{otp}}\n\nDo not share this code with anyone. Valid for 5 minutes.", auto_send: true },
            ];
            defaults.forEach(d => addEmailTemplate({ ...d, template_key: d.identifier, subject_template: d.subject, html_content: d.body }, { onConflict: 'template_key' }).catch(e => console.log('Email template seed skipped:', e.message)));
        }
    }, [activeTab, emailTemplates]);

    const { data: commSettingsArr = EMPTY_ARRAY, refresh: refreshComm } = useSupabaseQuery('communicationSettings');
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

    const { data: policiesArr = EMPTY_ARRAY } = useSupabaseQuery('policies', q => q, [], { realtime: false });
    const [updatePolicies] = useSupabaseMutation('policies', 'update', (q, p) => q.eq('id', p.id));

    // ── Local buffer so copy-paste isn't interrupted by DB re-renders ──
    const [localPolicies, setLocalPolicies] = useState({
        booking_header: "",
        payment_terms: "",
        event_disclaimer: "",
        cancellation_policy: ""
    });
    const [isSavingPolicies, setIsSavingPolicies] = useState(false);

    // Sync local state when DB data arrives (initial load only)
    useEffect(() => {
        if (policiesArr[0]) {
            setLocalPolicies({
                booking_header: policiesArr[0].booking_header || "",
                payment_terms: policiesArr[0].payment_terms || "",
                event_disclaimer: policiesArr[0].event_disclaimer || "",
                cancellation_policy: policiesArr[0].cancellation_policy || ""
            });
        }
    }, [policiesArr[0]?.id]);  // only re-sync when the record itself changes, not on every field update

    const { data: ssoSettingsArr = EMPTY_ARRAY } = useSupabaseQuery('sso_settings', q => q, [], { realtime: true });
    const [updateSsoSettings] = useSupabaseMutation('sso_settings', 'upsert');

    const { data: homeCategoriesArr = EMPTY_ARRAY } = useSupabaseQuery('categories');
    const [addCategory] = useSupabaseMutation('categories', 'insert');
    const [patchCategory] = useSupabaseMutation('categories', 'update', (q, p) => q.eq('id', p.id));
    const [removeCategory] = useSupabaseMutation('categories', 'delete', (q, p) => q.eq('id', p.id));

    const { data: homePartnersArr = EMPTY_ARRAY } = useSupabaseQuery('home_partners');
    const [addEventPartner] = useSupabaseMutation('home_partners', 'insert');
    const [patchEventPartner] = useSupabaseMutation('home_partners', 'update', (q, p) => q.eq('id', p.id));
    const [removeEventPartner] = useSupabaseMutation('home_partners', 'delete', (q, p) => q.eq('id', p.id));

    const { data: homeSlidesArr = EMPTY_ARRAY } = useSupabaseQuery('home_slides', q => q, [], { realtime: false });
    const [addBannerSlide] = useSupabaseMutation('home_slides', 'insert');
    const [updateBannerSlide] = useSupabaseMutation('home_slides', 'update', (q, p) => q.eq('id', p.id));
    const [removeBannerSlide] = useSupabaseMutation('home_slides', 'delete', (q, p) => q.eq('id', p.id));

    // Pages management
    const { data: pages = EMPTY_ARRAY } = useSupabaseQuery('pages', q => q, [], { realtime: false });
    const [createPage] = useSupabaseMutation('pages', 'insert');
    const [updatePage] = useSupabaseMutation('pages', 'update', (q, p) => q.eq('id', p.id));
    const [deletePage] = useSupabaseMutation('pages', 'delete', (q, p) => q.eq('id', p.id));

    // Recent Memories management
    const { data: memories = EMPTY_ARRAY } = useSupabaseQuery('memories');
    const [createMemory] = useSupabaseMutation('memories', 'insert');
    const [updateMemory] = useSupabaseMutation('memories', 'update', (q, p) => q.eq('id', p.id));
    const [deleteMemory] = useSupabaseMutation('memories', 'delete', (q, p) => q.eq('id', p.id));

    // Consolidated remaining queries
    const { data: bannerRequests = EMPTY_ARRAY } = useSupabaseQuery('banners', (q) => q.eq('status', 'Pending'));
    const { data: allBanners = EMPTY_ARRAY } = useSupabaseQuery('banners');
    const { data: allBrandingKYC = EMPTY_ARRAY } = useSupabaseQuery('brand_kyc');
    const [verifyKYCMutation] = useSupabaseMutation('brand_kyc', 'update', (q, p) => q.eq('id', p.id));
    const { data: siteBrandingArr = EMPTY_ARRAY } = useSupabaseQuery('site_branding', q => q, [], { realtime: false });
    const initialNavConfig = useMemo(() => ({
        key: 'admin_navigation_config',
        items: [
            { id: 1, label: "Home", icon: "🏠", order: 0 },
            { id: 2, label: "Events", icon: "🎫", order: 1 },
            { id: 3, label: "Services", icon: "🛠️", order: 2 },
            { id: 4, label: "Security", icon: "🛡️", order: 3 },
            { id: 5, label: "Live Gate", icon: "⚡", order: 4 },
            { id: 6, label: "Campaigns", icon: "🔥", order: 5 }
        ]
    }), []);
    const [subnavConfig, setSubnavConfig] = useSupabaseConfig("system_config", initialNavConfig);
    const subnavItems = subnavConfig.items || [];
    const { data: promotionsArr = EMPTY_ARRAY } = useSupabaseQuery('promotions');
    
    // Structured User Management: Reverted to verified production tables
    const { data: organisersData = EMPTY_ARRAY, refresh: refreshVendors } = useSupabaseQuery('organisers', (q) => q.select('*, profiles:organisers_id_fkey(email, full_name)'));
    
    // Merge for backward compatibility in Admin Panel
    const organisersArr = useMemo(() => {
        return organisersData;
    }, [organisersData]);

    const { data: serviceProvidersArr = EMPTY_ARRAY, refresh: refreshServiceProviders } = useSupabaseQuery('vendors', (q) => q.select('*, profiles:vendors_id_fkey(email, full_name)'));
    const [updateVendorMutation] = useSupabaseMutation('vendors', 'update', (q, p) => q.eq('id', p.id));
    const [removeVendor] = useSupabaseMutation('vendors', 'delete', (q, p) => q.eq('id', p.id));
    const { data: homeSectionsArr = EMPTY_ARRAY } = useSupabaseQuery('home_sections');
    const { data: supportTicketsArr = EMPTY_ARRAY } = useSupabaseQuery('support_tickets');
    const { data: usersArr = EMPTY_ARRAY } = useSupabaseQuery('profiles');
    const { data: adminsArr = EMPTY_ARRAY } = useSupabaseQuery('admins', q => q.select('*, profiles:id (full_name, email, username)'));
    const { data: kycData = EMPTY_ARRAY } = useSupabaseQuery('kyc_details', (q) => q.order('updated_at', { ascending: false }));
    const { data: paymentsArr = EMPTY_ARRAY } = useSupabaseQuery('payments', (q) => q.order('created_at', { ascending: false }));
    const { data: gstReportsArr = EMPTY_ARRAY } = useSupabaseQuery('gst_reports', (q) => q.order('created_at', { ascending: false }));
    const { data: flashDealsArr = EMPTY_ARRAY } = useSupabaseQuery('flash_deals', (q) => q.order('created_at', { ascending: false }));
    const { data: fraudAlertsArr = EMPTY_ARRAY } = useSupabaseQuery('fraud_alerts', (q) => q.order('created_at', { ascending: false }));
    const { data: scannerLogsArr = EMPTY_ARRAY } = useSupabaseQuery('scanner_logs', (q) => q.order('scanned_at', { ascending: false }));
    const { data: allAdPopups = EMPTY_ARRAY } = useSupabaseQuery('ad_popups', q => q.order('id', { ascending: true }), [], { realtime: false });
    // 1. Consolidated Platform Data Fetching
    const { data: physicalEvents = EMPTY_ARRAY } = useSupabaseQuery('events', (q) => q.order('created_at', { ascending: false }));
    const { data: tournamentEvents = EMPTY_ARRAY } = useSupabaseQuery('tournament_events', (q) => q.order('created_at', { ascending: false }));
    const { data: marathonEvents = EMPTY_ARRAY } = useSupabaseQuery('marathon_events', (q) => q.order('created_at', { ascending: false }));

    // 2. Merge all events for the main dashboard and management view
    const eventsArr = useMemo(() => {
        const merged = [
            ...physicalEvents.map(e => ({ ...e, event_category: 'Physical' })),
            ...tournamentEvents.map(e => ({ ...e, event_category: 'Tournament', title: e.event_name })),
            ...marathonEvents.map(e => ({ ...e, event_category: 'Marathon' }))
        ];
        return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [physicalEvents, tournamentEvents, marathonEvents]);

    const { data: bookingsRaw = EMPTY_ARRAY } = useSupabaseQuery('bookings', (q) => q.select('*, profiles(full_name, email)'));
    
    // Resolve event titles for bookings across multiple master tables
    const bookingsArr = useMemo(() => {
        return bookingsRaw.map(b => {
            // Find the event title from our merged events array
            const linkedEvent = eventsArr.find(e => e.id === b.event_id);
            return {
                ...b,
                event_title: linkedEvent?.title || linkedEvent?.event_name || "Unknown Event",
                events: { title: linkedEvent?.title || linkedEvent?.event_name || "Unknown Event" } // Maintain compat with existing UI
            };
        });
    }, [bookingsRaw, eventsArr]);
    const { data: apiKeysArr = EMPTY_ARRAY } = useSupabaseQuery('api_keys', q => q, [], { realtime: false });
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
    const [updateSiteBranding] = useSupabaseMutation('site_branding', 'upsert');

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
            const b = siteBrandingArr[0];
            setLocalBranding({
                ...b,
                sponsor_logo_1_url: b.sponsor_logo_1,
                sponsor_logo_2_url: b.sponsor_logo_2,
                partner_logo_1_url: b.partner_logo_1,
                partner_logo_2_url: b.partner_logo_2,
            });
        }
    }, [siteBrandingArr]);

    const handleDeleteLogo = (type) => {
        setLocalBranding(prev => ({
            ...prev,
            [`${type}_url`]: null
        }));
    };

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

            setLocalBranding(prev => ({ ...prev, [`${type}_url`]: publicUrl }));
            showToast(`${type.replace('_', ' ')} uploaded successfully!`, "success");
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


    const initialFooterConfig = useMemo(() => ({
        key: 'admin_footer_copyright',
        copyrightText: "© Copyright 2026 – Nexvant Technologies. All Rights Reserved.",
        privacyUrl: "#",
        termsUrl: "#"
    }), []);
    const [footerCopyrightConfig, setFooterCopyrightConfig] = useSupabaseConfig("system_config", initialFooterConfig);
    
    const initialMeetingConfig = useMemo(() => ({
        key: 'internal_meeting_portal_enabled',
        value: true
    }), []);
    const [internalMeetingEnabled, setInternalMeetingEnabled] = useSupabaseConfig("system_config", initialMeetingConfig);

    const { data: contactDataArr = EMPTY_ARRAY, loading: contactLoading, error: contactError, refresh: refreshContact } = useSupabaseQuery('contact_settings');
    const [upsertContactSettings, { loading: upsertingContact }] = useSupabaseMutation('contact_settings', 'upsert');
    const [localContact, setLocalContact] = useState(null);

    useEffect(() => {
        if (contactDataArr?.[0]) {
            setLocalContact(contactDataArr[0]);
        } else if (!contactLoading && contactDataArr.length === 0 && !localContact) {
            setLocalContact({
                id: 1,
                header_title: "Get in Support",
                header_description: "Have a general question for us? We're here to help with any inquiries about our services.",
                support_email: "support@bookmyticket.net",
                support_phone: "+91 90420 29927",
                sales_india: "+91 97907 62727",
                sales_uae: "+971 55 747 2927",
                sales_singapore: "+60 14-210 7199",
                address_line1: "4th Floor, Ramani's West Gate,",
                address_line2: "No: 402C, Viswanathapuram,",
                address_line3: "Thudiyalur, Coimbatore, Tamil Nadu",
                address_pincode: "641034",
                hours_mon_fri: "9:30 AM - 6:30 PM IST",
                hours_sat: "9:30 AM - 1:30 PM IST",
                hours_sun: "We're offline ( Day Off )",
                social_linkedin: "#",
                social_instagram: "#",
                social_facebook: "#",
                social_twitter: "#"
            });
        }
    }, [contactDataArr, contactLoading]);

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
    const initialArchivedIds = useMemo(() => ({ key: 'admin_archived_home_ids', value: [] }), []);
    const [archivedHomeIds, setArchivedHomeIds] = useSupabaseConfig("system_config", initialArchivedIds);
    const initialMetaOverrides = useMemo(() => ({ key: 'admin_event_meta_overrides', value: {} }), []);
    const [eventMetaOverrides, setEventMetaOverrides] = useSupabaseConfig("system_config", initialMetaOverrides);
    const initialGlobalFeeSettings = useMemo(() => ({
        key: 'global_fee_settings',
        value: {
            default_fee_type: "percentage",
            default_fee_value: 5,
            default_gst_percent: 18,
            enable_gst: true,
            gst_apply_on: "fee_only"
        }
    }), []);
    const [feeSettingsConfig, setFeeSettingsConfig] = useSupabaseConfig("system_config", initialGlobalFeeSettings);

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
                email: o.kyc_details?.email || o.profiles?.email || "No Email",
                status: o.kyc_status || "NOT STARTED",
                category: o.category || o.kyc_details?.category || "Event Organiser",
                balance: `₹${(o.wallet_balance || 0).toFixed(2)}`,
                kycDetails: o.kyc_details,
                kyc_status: o.kyc_status || "NOT STARTED",
                platform_fee_percent: o.platform_fee_percent || 7.00,
                payout_fee_flat: o.payout_fee_flat || 10.00
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
    // Normalize DB rows (image_url, subtitle, link, sort_order) → local state (img, sub, url, order)
    const normalizeSlide = (s, i) => ({
        id: s.id,
        img: s.image_url || s.img || "",
        title: s.title || "",
        sub: s.subtitle || s.sub || "",
        url: s.link || s.url || "",
        order: s.sort_order ?? s.order ?? i
    });
    useEffect(() => {
        if (homeSlidesArr.length > 0) {
            setSlides(homeSlidesArr.map(normalizeSlide));
        } else if (slides.length === 0) {
            setSlides(HERO_BANNER_SLIDES.map((s, i) => normalizeSlide({ ...s, image_url: s.img, subtitle: s.sub, link: s.link, sort_order: i }, i)));
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
            ...homeList.map(e => ({ ...e, source: "home", event_category: "Standard" })),
            ...organiserList.map((e, index) => ({
                ...e,
                id: e.id || `temp-${index}`,
                title: e.title || "Event",
                category: e.category || "Others",
                type: e.type || "Paid",
                source: "organiser",
                event_category: "Standard"
            }))
        ];
    }, [eventsArr, archivedHomeIds]);
    const dashboardStats = useMemo(() => {
        const revSum = (paymentsArr || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const platformRev = (paymentsArr || []).reduce((acc, curr) => acc + (Number(curr.platform_fee) || 0), 0);
        
        return {
            totalEvents: (eventsArr || []).length || 0,
            activeTournaments: (tournamentEvents || []).length || 0,
            pendingKyc: (kycData || []).filter(k => k.status === 'Pending').length || 0,
            totalVendors: (serviceProvidersArr || []).length || 0,
            totalRevenue: platformRev || 0,
            grossVolume: revSum || 0,
            totalBookings: (bookingsArr || []).length || 0,
            totalUsers: (usersArr || []).length || 0
        };
    }, [eventsArr, tournamentEvents, kycData, serviceProvidersArr, paymentsArr, bookingsArr, usersArr]);

    const [updatePhysicalEvent] = useSupabaseMutation('events', 'update', (q, p) => q.eq('id', p.id));
    const [updateTournamentEvent] = useSupabaseMutation('tournament_events', 'update', (q, p) => q.eq('id', p.id));
    const [updateMarathonEvent] = useSupabaseMutation('marathon_events', 'update', (q, p) => q.eq('id', p.id));

    const handlePlatformEventUpdate = async (event, updates) => {
        try {
            if (event.event_category === 'Tournament') {
                await updateTournamentEvent({ id: event.id, ...updates });
            } else if (event.event_category === 'Marathon') {
                await updateMarathonEvent({ id: event.id, ...updates });
            } else {
                await updatePhysicalEvent({ id: event.id, ...updates });
            }
            showToast("Event updated successfully", "success");
        } catch (err) {
            showToast("Failed to update event: " + err.message, "error");
        }
    };

    const [deleteEvent] = useSupabaseMutation('events', 'delete', (q, p) => q.eq('id', p.id));
    
    const [adminEventToDelete, setAdminEventToDelete] = useState(null);
    const [adminDeletionProgress, setAdminDeletionProgress] = useState(null);

    const executeAdminEventDeletion = async (event, type) => {
        if (!event) return;
        
        try {
            if (type === "soft") {
                setAdminDeletionProgress(["Archiving Event..."]);
                await handlePlatformEventUpdate(event, { status: "ARCHIVED" });
                setAdminDeletionProgress(prev => [...prev, "Completed"]);
                setTimeout(() => {
                    setAdminEventToDelete(null);
                    setAdminDeletionProgress(null);
                    showToast("Event softly deleted (Archived)", "success");
                }, 1500);
                return;
            }

            // Hard Delete
            setAdminDeletionProgress(["Permanently Deleting Event...", "Removing Dependencies..."]);
            if (event.event_category === 'Tournament') {
                await supabase.from("tournament_events").delete().eq("id", event.id);
            } else if (event.event_category === 'Marathon') {
                await supabase.from("marathon_config").delete().eq("id", event.id);
            } else {
                await supabase.from("bookings").delete().eq("event_id", event.id);
            }
            setAdminDeletionProgress(prev => [...prev, "Removing from Database..."]);
            await deleteEvent({ id: event.id });
            
            setAdminDeletionProgress(prev => [...prev, "Completed"]);
            setTimeout(() => {
                setAdminEventToDelete(null);
                setAdminDeletionProgress(null);
                showToast("Event permanently deleted", "success");
            }, 1500);
        } catch (err) {
            console.error("Delete error:", err);
            setAdminDeletionProgress(null);
            showToast("Failed to delete event: " + err.message, "error");
        }
    };

    const [createAdmin] = useSupabaseMutation('admins', 'insert');
    const [updateAdminStatus] = useSupabaseMutation('admins', 'update', (q, p) => q.eq('id', p.id));
    const [deleteAdmin] = useSupabaseMutation('admins', 'delete', (q, p) => q.eq('id', p.id));

    const stats = useMemo(() => {
        return {
            totalUsers: usersArr.length,
            totalOrganisers: organisersArr.length,
            totalEvents: eventsArr.length,
            totalBookings: bookingsArr.length,
            totalRevenue: bookingsArr.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0),
            pendingKyc: (kycData || []).filter(k => k.status === 'Pending').length || 0,
            activeTournaments: tournamentEvents.length,
            totalVendors: serviceProvidersArr.length
        };
    }, [usersArr, organisersArr, eventsArr, bookingsArr, tournamentEvents, serviceProvidersArr]);

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
    const initialBrandingPricing = useMemo(() => ({
        key: 'branding_pricing',
        monthlyPrice: 999,
        yearlyPrice: 9999
    }), []);
    const [brandingPricingConfig, setBrandingPricingConfig] = useSupabaseConfig("system_config", initialBrandingPricing);
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

    // Tab sync effect removed as activeTab is now derived directly from searchParams

    // Sync events from Supabase
    useEffect(() => {
        if (eventsArr.length > 0) {
            setEvents(eventsArr.map(e => ({ ...e, source: "organiser" })));
        }
    }, [eventsArr]);

    // Sync bookings from Supabase
    useEffect(() => {
        if (bookingsArr.length > 0) {
            // Filter out pending bookings older than 24h
            const activeBookings = bookingsArr.filter(b => {
                if (b.status === "Pending") {
                    const diff = Date.now() - new Date(b.created_at).getTime();
                    return diff < (24 * 60 * 60 * 1000);
                }
                return true;
            }).map(b => ({
                ...b,
                eventName: b.events?.title || b.eventName || "Untitled Event",
                customerName: b.profiles?.full_name || "Guest User",
                customerEmail: b.profiles?.email || b.customer_email || b.customerEmail || "No Email"
            }));
            setBookings(activeBookings);
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

    const hasSeededApiKeysRef = React.useRef(false);

    // Seed default API keys if empty
    useEffect(() => {
        if (activeTab === "api_settings" && apiKeysArr.length === 0 && !hasSeededApiKeysRef.current) {
            hasSeededApiKeysRef.current = true;
            const defaults = [
                { name: "Production Mobile App", key_value: "ak_live_724819...9238" },
                { name: "Staging Environment", key_value: "ak_test_123891...0841" }
            ];
            defaults.forEach(d => createApiKey(d).catch(e => console.log('API key seed skipped:', e.message)));
        }
    }, [activeTab, apiKeysArr]);
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
        const fetchEmailSettings = async () => {
            try {
                const res = await fetch('/api/admin/email-settings');
                const { data: dbSettings } = await res.json();
                if (dbSettings) {
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
            } catch (err) {
                console.error("Failed to load email settings", err);
            }
        };
        fetchEmailSettings();
    }, []);

    const handleSaveEmail = async () => {
        setIsSavingEmail(true);
        try {
            const dbPayload = {
                id: localEmailSettings.id || undefined,
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

            const response = await fetch('/api/admin/email-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload)
            });

            if (!response.ok) throw new Error("Failed to save via API");
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
                    provider: "MICROSOFT_365",
                    microsoft365: { ...s.microsoft365, status: "Connected" } 
                }));
            } else {
                showToast("Connection failed: " + (result?.error || "Unknown error"), "error");
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
            bg: "#f3f4f6",
            sidebar: "#ffffff",
            header: "rgba(255, 255, 255, 0.8)",
            textMain: "#1f2937",
            textSub: "#6b7280",
            cardBg: "#ffffff",
            border: "#e5e7eb",
            activeLink: "#ec4899",
            activeText: "#ffffff",
            sidebarBorder: "#f3f4f6"
        },
        dark: {
            bg: "#0b0f19",
            sidebar: "#111827",
            header: "rgba(17, 24, 39, 0.8)",
            textMain: "#f9fafb",
            textSub: "#9ca3af",
            cardBg: "#1f2937",
            border: "#374151",
            activeLink: "#ec4899",
            activeText: "#ffffff",
            sidebarBorder: "#1f2937"
        }
    };

    const ACCENT_PINK = "#ec4899";
    const ACCENT_PURPLE = "#8b5cf6";
    const ACCENT_BLUE = "#3b82f6";
    const ACCENT_GRADIENT = `linear-gradient(135deg, ${ACCENT_PINK} 0%, ${ACCENT_PURPLE} 100%)`;

    const t = colors[theme] || colors.dark;

    // Map local state → DB column names before writing
    const toDbSlide = (slide, index) => ({
        image_url: slide.img || "",
        title: slide.title || "",
        subtitle: slide.sub || "",
        link: slide.url || "",
        sort_order: slide.order ?? index,
        is_active: true
    });

    const addSlide = async () => {
        try {
            const { data } = await addBannerSlide({
                image_url: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=1200&h=480&fit=crop",
                title: "New Slide",
                subtitle: "Subtitle here",
                link: "",
                sort_order: slides.length,
                is_active: true
            });
            if (data?.[0]) {
                setSlides(prev => [...prev, { id: data[0].id, img: data[0].image_url, title: data[0].title, sub: data[0].subtitle, url: data[0].link, order: data[0].sort_order }]);
            }
            showToast("Slide added", "success");
        } catch (err) {
            showToast("Error adding slide: " + (err?.message || err), "error");
        }
    };

    // UUID v4 regex — static fallback slides have integer IDs and must not hit Supabase
    const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));

    const removeSlide = async (id) => {
        // Static fallback slides (integer IDs) don't exist in DB — just remove from UI
        if (!isUUID(id)) {
            setSlides(prev => prev.filter(s => s.id !== id));
            showToast("Slide removed", "success");
            return;
        }
        try {
            await removeBannerSlide({ id });
            setSlides(prev => prev.filter(s => s.id !== id));
            showToast("Slide removed", "success");
        } catch (err) {
            showToast("Error removing slide: " + (err?.message || err), "error");
        }
    };

    const handleSaveSlide = async (slide) => {
        try {
            if (slide.id && isUUID(slide.id)) {
                await updateBannerSlide({ id: slide.id, ...toDbSlide(slide) });
                showToast("Slide updated", "success");
            } else if (slide.id && !isUUID(slide.id)) {
                // Static slide — persist it to DB as a new record
                const { data } = await addBannerSlide({ ...toDbSlide(slide) });
                if (data?.[0]) {
                    setSlides(prev => prev.map(s => s.id === slide.id
                        ? { ...s, id: data[0].id }
                        : s
                    ));
                }
                showToast("Slide saved to database", "success");
            } else {
                showToast("Slide not persisted yet.", "warning");
            }
        } catch (err) {
            showToast("Error updating slide: " + (err?.message || err), "error");
        }
    };

    const updateSlideLocal = (id, field, value) => {
        setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const [slideUploading, setSlideUploading] = useState({});
    const [slideDragOver, setSlideDragOver] = useState({});
    const [slideImgBroken, setSlideImgBroken] = useState({});

    // Resize + compress an image file to fit within bannerMaxW×bannerMaxH using Canvas API
    // Crop-to-fill: resize image to exactly BANNER_W × BANNER_H (like CSS object-fit: cover)
    // This guarantees every uploaded slide fills the banner with no letterboxing.
    const BANNER_W = 1200;
    const BANNER_H = 400;

    const compressImage = (file, quality = 0.88) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = (ev) => {
                const img = new window.Image();
                img.onerror = reject;
                img.onload = () => {
                    const { width: sw, height: sh } = img;

                    // Scale so the image COVERS the target box (same as CSS cover)
                    const scale = Math.max(BANNER_W / sw, BANNER_H / sh);
                    const scaledW = sw * scale;
                    const scaledH = sh * scale;

                    // Centre-crop offsets
                    const ox = (scaledW - BANNER_W) / 2;
                    const oy = (scaledH - BANNER_H) / 2;

                    const canvas = document.createElement('canvas');
                    canvas.width  = BANNER_W;
                    canvas.height = BANNER_H;
                    const ctx = canvas.getContext('2d');

                    // Fill white background (for PNGs with transparency)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, BANNER_W, BANNER_H);

                    // Draw scaled + cropped image
                    ctx.drawImage(img, -ox, -oy, scaledW, scaledH);

                    canvas.toBlob(
                        (blob) => blob ? resolve(blob) : reject(new Error('Canvas conversion failed')),
                        'image/jpeg',
                        quality
                    );
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

    const uploadSlideImage = async (slideId, file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('Please select a valid image file.', 'error'); return; }

        setSlideUploading(prev => ({ ...prev, [slideId]: true }));
        try {
            // Compress & resize to ≤ 1500×480 JPEG before uploading
            const compressed = await compressImage(file);
            const fileName = `hero-slides/slide-${slideId}-${Date.now()}.jpg`;
            const { error: upErr } = await supabase.storage
                .from('branding')
                .upload(fileName, compressed, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true });
            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName);

            updateSlideLocal(slideId, 'img', publicUrl);
            setSlideImgBroken(p => { const n = { ...p }; delete n[slideId]; return n; });
            showToast('Image uploaded!', 'success');
        } catch (err) {
            showToast('Upload failed: ' + err.message, 'error');
        } finally {
            setSlideUploading(prev => ({ ...prev, [slideId]: false }));
        }
    };

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: t.bg }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                
                * { font-family: 'Outfit', sans-serif; }

                .main-content {
                    flex: 1;
                    padding: 32px;
                    overflow-y: auto;
                    position: relative;
                    z-index: 1;
                    scroll-behavior: smooth;
                }

                .premium-glass {
                    background: ${theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)'};
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid ${theme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
                }

                .sidebar-item-new {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    margin: 4px 12px;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 14px;
                    font-weight: 600;
                    color: ${t.textSub};
                    border: 1px solid transparent;
                }

                .sidebar-item-new:hover {
                    background-color: ${t.activeLink}10;
                    color: ${t.activeLink};
                    transform: translateX(4px);
                }

                .sidebar-item-new.active {
                    background: ${ACCENT_GRADIENT} !important;
                    color: #fff !important;
                    box-shadow: 0 10px 20px -5px ${ACCENT_PINK}40 !important;
                    opacity: 1 !important;
                }

                .status-badge {
                    padding: 4px 10px;
                    border-radius: 100px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .card-premium {
                    background: ${t.cardBg};
                    border-radius: 24px;
                    border: 1px solid ${t.border};
                    padding: 24px;
                    transition: all 0.3s ease;
                }

                .card-premium:hover {
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05);
                    transform: translateY(-2px);
                }

                /* Custom Scrollbar */
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: ${t.textSub}; }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Sidebar Overlay (mobile) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 w-72 border-r transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col flex-shrink-0`} style={{ backgroundColor: t.sidebar, borderColor: t.sidebarBorder }}>
                {/* Brand Logo Area */}
                <div className="h-24 flex items-center px-8 border-b" style={{ borderColor: t.sidebarBorder }}>
                    <div className="flex items-center cursor-pointer group" onClick={() => setActiveTab("dashboard")}>
                        <img 
                            src="/logo.png" 
                            alt="BookMyTicket" 
                            className="h-14 w-auto object-contain hover:scale-105 transition-transform" 
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    {/* Navigation Groups */}
                    <div className="space-y-1">
                        <GroupTitle title="Main" t={t} isOpen={isMainGroupOpen} onClick={() => setIsMainGroupOpen(!isMainGroupOpen)} />
                        {isMainGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                {[
                                    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
                                    { id: "analytics", label: "Insights", icon: BarChart3, alias: "financials" },
                                    { id: "all_events", label: "Physical Events", icon: Calendar },
                                    { id: "event_reviews", label: "Event Approvals", icon: ShieldAlert },
                                    { id: "tournaments", label: "Tournaments", icon: Trophy },
                                    { id: "marathons", label: "Marathons", icon: Timer },
                                    { id: "bookings", label: "Ticket Orders", icon: ShoppingCart },
                                    { id: "users", label: "Users & Profiles", icon: Users, alias: "customers" }
                                ].map(item => (
                                    <NavLink 
                                        key={item.id}
                                        id={item.id} 
                                        label={item.label} 
                                        icon={item.icon} 
                                        active={activeTab === item.id || activeTab === item.alias} 
                                        setActiveTab={setActiveTab}
                                        router={router}
                                        setIsSidebarOpen={setIsSidebarOpen}
                                    />
                                ))}
                            </div>
                        )}
                        
                        <GroupTitle title="Partners" t={t} isOpen={isPartnersGroupOpen} onClick={() => setIsPartnersGroupOpen(!isPartnersGroupOpen)} />
                        {isPartnersGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <NavLink id="admin_onboarding" label="Onboarding Center" icon={UserCheck} active={activeTab === "admin_onboarding"} setActiveTab={setActiveTab} router={router} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="org_requests" label="Organiser Requests" icon={Briefcase} active={activeTab === "org_requests"} setActiveTab={setActiveTab} router={router} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="digilocker_kyc_review" label="DigiLocker KYC" icon={ShieldCheck} active={activeTab === "digilocker_kyc_review"} setActiveTab={setActiveTab} router={router} setIsSidebarOpen={setIsSidebarOpen} />
                                <div 
                                    className={`sidebar-item-new ${["organisers", "all_org", "active_org", "kyc_verified", "kyc_pending", "kyc_unverified", "banned_org"].includes(activeTab) ? 'active' : ''}`} 
                                    onClick={() => setIsOrganizersOpen(!isOrganizersOpen)}
                                >
                                    <Users size={20} />
                                    <span>Organisers</span>
                                    <ChevronDown size={14} className={`ml-auto transition-transform ${isOrganizersOpen ? 'rotate-180' : ''}`} />
                                </div>
                                {isOrganizersOpen && (
                                    <div className="ml-8 mr-4 mt-1 flex flex-col gap-1">
                                        {[
                                            { id: 'all_org', label: 'All Partners' },
                                            { id: 'active_org', label: 'Active Only' },
                                            { id: 'banned_org', label: 'Banned' }
                                        ].map(sub => (
                                            <div key={sub.id} className={`px-4 py-2 rounded-lg text-[13px] font-bold cursor-pointer transition-colors ${activeTab === sub.id ? 'text-pink-500 bg-pink-50' : 'text-slate-500 hover:text-pink-400'}`} onClick={() => { setActiveTab(sub.id); }}>
                                                {sub.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <GroupTitle title="Services" t={t} isOpen={isServicesGroupOpen} onClick={() => setIsServicesGroupOpen(!isServicesGroupOpen)} />
                        {isServicesGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <NavLink id="professional_services_mgmt" label="Pro Services Publish" icon={Briefcase} active={activeTab === "professional_services_mgmt"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="service_requests" label="Service Requests" icon={Briefcase} active={activeTab === "service_requests"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="providers" label="Service Providers" icon={Briefcase} active={activeTab === "providers" || activeTab === "service_active"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="turf_partners" label="Turf Booking" icon={Landmark} active={activeTab === "turf_partners"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="pool_bookings" label="Pool Requests" icon={Smartphone} active={activeTab === "pool_bookings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="meetings" label="Meeting Hub" icon={Video} active={activeTab === "meetings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                            </div>
                        )}

                        <GroupTitle title="Growth" t={t} isOpen={isGrowthGroupOpen} onClick={() => setIsGrowthGroupOpen(!isGrowthGroupOpen)} />
                        {isGrowthGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <NavLink id="coupons" label="Advanced Coupons" icon={Tag} active={activeTab === "coupons"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="promotions" label="Promotional Hub" icon={Sparkles} active={activeTab === "promotions"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="rewards_vouchers" label="Rewards & Vouchers" icon={Gift} active={activeTab === "rewards_vouchers"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="sponsors_partners" label="Sponsors & Partners" icon={Handshake} active={activeTab === "sponsors_partners"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="banner_ads" label="Marketing Banners" icon={Megaphone} active={activeTab === "banner_ads"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="hero" label="Hero Banner" icon={ImageIcon} active={activeTab === "hero"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="video_banner" label="Video Banner" icon={Video} active={activeTab === "video_banner"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="mobile_banners" label="Mobile Banners" icon={Smartphone} active={activeTab === "mobile_banners"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="memories" label="Recent Memories" icon={ImageIcon} active={activeTab === "memories"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="email_broadcast" label="Newsletter Hub" icon={Mail} active={activeTab === "email_broadcast"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="subscribers" label="Subscriber Base" icon={Users} active={activeTab === "subscribers"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="send_notif" label="Push Notifications" icon={Send} active={activeTab === "send_notif"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                            </div>
                        )}

                        <GroupTitle title="Finance" t={t} isOpen={isFinanceGroupOpen} onClick={() => setIsFinanceGroupOpen(!isFinanceGroupOpen)} />
                        {isFinanceGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <NavLink id="admin_revenue_dashboard" label="Commission Board" icon={Wallet} active={activeTab === "admin_revenue_dashboard"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="payments" label="Revenue Ledger" icon={BarChart3} active={activeTab === "payments" || activeTab === "revenue"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="settlement_verification" label="Settlement Audit" icon={FileText} active={activeTab === "settlement_verification"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="payout_requests" label="Payouts" icon={CreditCard} active={activeTab === "payout_requests"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="gst" label="Tax Audits" icon={FileText} active={activeTab === "gst"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="subscriptions" label="Staff Subscriptions" icon={Zap} active={activeTab === "subscriptions"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                            </div>
                        )}
                        
                        <GroupTitle title="Security & Monitoring" t={t} isOpen={isSecurityGroupOpen} onClick={() => setIsSecurityGroupOpen(!isSecurityGroupOpen)} />
                        {isSecurityGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <NavLink id="fraud_monitoring" label="Fraud Detection" icon={ShieldCheck} active={activeTab === "fraud_monitoring" || activeTab === "fraud_dashboard"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="scanner_monitor" label="Scanner Analytics" icon={Activity} active={activeTab === "scanner_monitor"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="audit_logs" label="Audit Logs" icon={Archive} active={activeTab === "audit_logs"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="email_logs" label="Email Engine" icon={Mail} active={activeTab === "email_logs"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="cancellations" label="Cancellation Queue" icon={AlertCircle} active={activeTab === "cancellations"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                            </div>
                        )}

                        <GroupTitle title="Reports" t={t} isOpen={isReportsGroupOpen} onClick={() => setIsReportsGroupOpen(!isReportsGroupOpen)} />
                        {isReportsGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <NavLink id="organizer_reports" label="Organizer Reports" icon={TrendingUp} active={activeTab === "organizer_reports"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="user_analytics" label="User Registration Stats" icon={Users} active={activeTab === "user_analytics"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="support_tickets" label="Ticket System" icon={MessageCircle} active={activeTab === "support_tickets"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="contact_inquiries" label="Inquiry Inbox" icon={Mail} active={activeTab === "contact_inquiries"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="branding_partners" label="Brand Requests" icon={Briefcase} active={activeTab === "branding_partners"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="pages" label="Pages" icon={FileText} active={activeTab === "pages"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="compliance_cms" label="Compliance CMS" icon={ShieldCheck} active={activeTab === "compliance_cms"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="sections" label="Site Sections" icon={LayoutGrid} active={activeTab === "sections"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                            </div>
                        )}

                        <GroupTitle title="Settings" t={t} isOpen={isSettingsGroupOpen} onClick={() => setIsSettingsGroupOpen(!isSettingsGroupOpen)} />
                        {isSettingsGroupOpen && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <NavLink id="admin_management" label="Team Management" icon={Shield} active={activeTab === "admin_management"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="careers_management" label="Careers Management" icon={Briefcase} active={activeTab === "careers_management"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="site_branding" label="Branding & Logos" icon={Sparkles} active={activeTab === "site_branding"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="events_settings" label="Site Config" icon={Settings} active={activeTab === "events_settings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="payment_settings" label="Payment Gateway" icon={CreditCard} active={activeTab === "payment_settings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="fee_settings" label="Revenue & Fees" icon={BarChart3} active={activeTab === "fee_settings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="social_media_settings" label="Social Community" icon={Globe} active={activeTab === "social_media_settings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="api_settings" label="API Gateway" icon={Code} active={activeTab === "api_settings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="meta_management" label="Meta / SEO" icon={Globe} active={activeTab === "meta_management"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="contact_settings" label="Contact Settings" icon={Phone} active={activeTab === "contact_settings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                                <NavLink id="email_settings" label="Email Settings" icon={Mail} active={activeTab === "email_settings"} setActiveTab={setActiveTab} setIsSidebarOpen={setIsSidebarOpen} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / User Profile */}
                <div className="p-6 border-t" style={{ borderColor: t.sidebarBorder }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=Admin+User&background=ec4899&color=fff" alt="" />
                        </div>
                        <div className="flex-1 min-width-0">
                            <p className="text-sm font-bold truncate" style={{ color: t.textMain }}>Admin User</p>
                            <p className="text-[10px] font-extrabold text-pink-500 uppercase">Platform Owner</p>
                        </div>
                        <button 
                            onClick={() => logout()} 
                            className="p-2.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 group/logout"
                            title="Sign Out"
                        >
                            <LogOut size={20} className="group-hover/logout:rotate-12 transition-transform" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-transparent">
                
                {/* Unified Top Header */}
                <header className="h-20 sticky top-0 z-40 border-b flex items-center justify-between px-8 lg:px-12 backdrop-blur-xl bg-white/70" style={{ borderColor: t.border }}>
                    <div className="flex items-center space-x-8">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-xl lg:hidden transition-all border bg-white"
                            style={{ color: t.textSub, borderColor: t.border }}
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-0.5">
                                <div className="w-1.5 h-5 bg-pink-500 rounded-full"></div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase italic" style={{ color: t.textMain }}>
                                    {activeTab.replace(/_/g, ' ')}
                                </h1>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50" style={{ color: t.textSub }}>
                                Central Intelligence Node
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="hidden sm:flex items-center gap-2 p-1 bg-slate-100 rounded-full px-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${theme === 'light' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400'}`} onClick={() => setTheme('light')}>
                                <Sun size={14} />
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${theme === 'dark' ? 'bg-slate-800 text-pink-500 shadow-sm' : 'text-slate-400'}`} onClick={() => setTheme('dark')}>
                                <Moon size={14} />
                            </div>
                        </div>

                        <button className="relative p-2.5 rounded-xl border bg-white transition-all hover:shadow-lg" style={{ color: t.textSub, borderColor: t.border }}>
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse border-2 border-white"></span>
                        </button>
                        
                        <div className="hidden md:flex items-center space-x-4 pl-6 border-l" style={{ borderColor: t.border }}>
                            <div className="text-right">
                                <p className="text-xs font-black uppercase tracking-tight" style={{ color: t.textMain }}>Admin User</p>
                                <p className="text-[9px] font-bold text-pink-500 uppercase tracking-widest">Platform Core</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white shadow-xl shadow-slate-200">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === "dashboard" && (
                        <div className="space-y-10">
                            {/* Welcome Banner */}
                            <div className="premium-glass p-10 rounded-[32px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[80px] -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] -ml-32 -mb-32"></div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight mb-3" style={{ color: t.textMain }}>Welcome back, Admin! 👋</h2>
                                        <p className="text-lg font-medium max-w-xl opacity-70" style={{ color: t.textSub }}>
                                            Your platform is thriving today. You have <span className="text-pink-500 font-bold">12 new partner requests</span> and <span className="text-purple-500 font-bold">850+ active events</span> currently live.
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setActiveTab("partner_requests")} className="px-6 py-3 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/20 hover:scale-105 transition-all">Review Partners</button>
                                        <button onClick={() => setActiveTab("all_events")} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-black/20 hover:scale-105 transition-all">View Analytics</button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Platform Revenue", value: dashboardStats ? `₹${Number(dashboardStats.totalRevenue).toLocaleString()}` : "₹0", icon: Landmark, color: "#ec4899", trend: "+14.5%" },
                                    { label: "Active Events", value: dashboardStats ? dashboardStats.totalEvents : "0", icon: Calendar, color: "#8b5cf6", trend: "+5.2%" },
                                    { label: "Total Bookings", value: dashboardStats ? dashboardStats.totalBookings : "0", icon: ShoppingCart, color: "#3b82f6", trend: "+12.1%" },
                                    { label: "Growth Customers", value: dashboardStats ? dashboardStats.totalUsers : "0", icon: Users, color: "#10b981", trend: "+22.4%" }
                                ].map((stat, i) => (
                                    <div key={i} className="card-premium relative group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`, boxShadow: `0 8px 20px -4px ${stat.color}40` }}>
                                                <stat.icon size={24} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">{stat.trend}</span>
                                                <span className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-tighter">vs last month</span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold opacity-50 mb-1 uppercase tracking-widest" style={{ color: t.textSub }}>{stat.label}</p>
                                        <h3 className="text-2xl font-black tracking-tight" style={{ color: t.textMain }}>{stat.value}</h3>
                                        
                                        {/* Subtle Sparkline Placeholder */}
                                        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500 w-[70%]" style={{ backgroundColor: stat.color }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === "all_events" && (
                        <div className="px-8 py-6">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "20px" }}>
                                <div>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, letterSpacing: "-0.02em", margin: 0 }}>Events Directory</h3>
                                    <p style={{ color: t.textSub, fontSize: "14px", marginTop: "4px" }}>Manage both Homepage and Organiser-published events</p>
                                </div>
                                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                                        <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black uppercase">All Events</button>
                                        <button className="px-4 py-1.5 text-slate-400 rounded-lg text-[10px] font-black uppercase hover:text-slate-900 transition-all">Drafts</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {allEvents.map((ev) => (
                                    <div key={ev.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform overflow-hidden">
                                            {ev.banner || ev.img ? <img src={ev.banner || ev.img} className="w-full h-full object-cover" /> : <Calendar size={32} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-md">{ev.category}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">{ev.status || 'Active'}</span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900">{ev.title}</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1">{ev.organiser_name || ev.venue || "Public Event"}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handlePlatformEventUpdate(ev, { spotlight: !ev.spotlight })}
                                                className={`p-2.5 rounded-xl transition-all border ${ev.spotlight ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-amber-500'}`}
                                                title="Spotlight Event"
                                            >
                                                <Zap size={18} fill={ev.spotlight ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={() => handlePlatformEventUpdate(ev, { is_exclusive: !ev.is_exclusive })}
                                                className={`p-2.5 rounded-xl transition-all border ${ev.is_exclusive ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-pink-500'}`}
                                                title="Exclusive Event"
                                            >
                                                <Star size={18} fill={ev.is_exclusive ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={() => { setEventEditForm(ev); setShowEditEventModal(true); }}
                                                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-black/10"
                                                title="Edit Event"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            {(ev.banner || ev.img) && (
                                                <a 
                                                    href={ev.banner || ev.img} 
                                                    download={`poster-${ev.id}.jpg`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center justify-center"
                                                    title="Download Poster"
                                                >
                                                    <Download size={18} />
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => setAdminEventToDelete(ev)}
                                                className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center"
                                                title="Delete Event"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "tournaments" && (
                        <div className="px-8 py-6">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tournament Arena</h3>
                                    <p className="text-sm text-slate-500 font-bold">Manage sports trophies and team registrations</p>
                                </div>
                                <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-100">
                                    {tournamentEvents.length} Active Trophies
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {tournamentEvents.length > 0 ? tournamentEvents.map((te) => (
                                    <div key={te.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                            <Trophy size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-md">{te.sport_type}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">{te.status}</span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900">{te.event_name}</h4>
                                            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400">
                                                <span className="flex items-center gap-1"><Users size={14} /> Team Size: {te.min_team_size}-{te.max_team_size}</span>
                                                <span className="flex items-center gap-1"><Landmark size={14} /> {te.venue_name || "TBA"}</span>
                                                <span className="flex items-center gap-1 text-pink-500 font-black">₹{te.registration_fee} / Team</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handlePlatformEventUpdate({ ...te, event_category: 'Tournament' }, { spotlight: !te.spotlight })}
                                                className={`p-2.5 rounded-xl transition-all border ${te.spotlight ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-amber-500'}`}
                                            >
                                                <Zap size={18} fill={te.spotlight ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={() => handlePlatformEventUpdate({ ...te, event_category: 'Tournament' }, { is_exclusive: !te.is_exclusive })}
                                                className={`p-2.5 rounded-xl transition-all border ${te.is_exclusive ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-pink-500'}`}
                                            >
                                                <Star size={18} fill={te.is_exclusive ? "currentColor" : "none"} />
                                            </button>
                                            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all uppercase tracking-widest">Manage Brackets</button>
                                            <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                        <Trophy size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
                                        <p className="text-slate-400 font-black uppercase tracking-widest">No tournaments found in database</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "marathons" && (
                        <div className="px-8 py-6">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Marathon Control</h3>
                                    <p className="text-sm text-slate-500 font-bold">Runner registrations and race categories</p>
                                </div>
                                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-100">
                                    {marathonEvents.length} Active Races
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {marathonEvents.length > 0 ? marathonEvents.map((me) => (
                                    <div key={me.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                            <Timer size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-black text-slate-900">{me.title}</h4>
                                            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400">
                                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(me.event_date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1"><Landmark size={14} /> {me.city || "Various Locations"}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handlePlatformEventUpdate({ ...me, event_category: 'Marathon' }, { spotlight: !me.spotlight })}
                                                className={`p-2.5 rounded-xl transition-all border ${me.spotlight ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-amber-500'}`}
                                            >
                                                <Zap size={18} fill={me.spotlight ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={() => handlePlatformEventUpdate({ ...me, event_category: 'Marathon' }, { is_exclusive: !me.is_exclusive })}
                                                className={`p-2.5 rounded-xl transition-all border ${me.is_exclusive ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-pink-500'}`}
                                            >
                                                <Star size={18} fill={me.is_exclusive ? "currentColor" : "none"} />
                                            </button>
                                            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all uppercase tracking-widest">View Runners</button>
                                            <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                        <Timer size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
                                        <p className="text-slate-400 font-black uppercase tracking-widest">No marathon events found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === "contact_inquiries" && (
                        <div className="px-8 lg:px-12 py-8">
                            <AdminContactInquiries t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "revenue" && (
                        <div className="px-8 lg:px-12 py-8">
                            <RevenueDashboard t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "scanner_monitor" && (
                        <div className="px-8 lg:px-12 py-8">
                            <ScannerMonitor t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "fraud_dashboard" && (
                        <div className="px-8 lg:px-12 py-8">
                            <FraudDashboard t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "cancellations" && (
                        <div className="px-8 lg:px-12 py-8 bg-slate-50 min-h-screen">
                            <AdminCancellationRequests t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "admin_events_mgmt" && (
                        <div className="px-8 lg:px-12 py-8 bg-slate-50 min-h-screen">
                            <AdminEventPublishing t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "organizer_reports" && (
                        <div className="px-8 lg:px-12 py-8 bg-slate-50 min-h-screen">
                            <OrganizerReportsAdmin t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "user_analytics" && (
                        <div className="px-8 lg:px-12 py-8 bg-slate-50 min-h-screen">
                            <UserRegistrationAnalytics t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "professional_services_mgmt" && (
                        <div className="px-8 lg:px-12 py-8 bg-slate-50 min-h-screen">
                            <ProfessionalServicesAdmin t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "admin_onboarding" && (
                        <div className="px-8 lg:px-12 py-8 bg-slate-50 min-h-screen">
                            <DirectOnboardingAdmin t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "admin_revenue_dashboard" && (
                        <div className="px-8 lg:px-12 py-8 bg-slate-50 min-h-screen">
                            <AdminRevenueCommissionDashboard t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "flash_deals" && (
                        <div className="px-8 lg:px-12 py-8">
                            <FlashAdmin t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "send_notif" && (
                        <div className="px-8 lg:px-12 py-8">
                            <PushCenter t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "financials" && (
                        <div className="px-8 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header & Exports */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1.5">Fiscal Intelligence</h2>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Revenue & Audit Control</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (!bookingsArr.length) { showToast("No data to export", "error"); return; }
                                            const headers = ["ID", "Event", "Customer", "Amount", "Status", "Date"];
                                            const rows = bookingsArr.map(b => [b.id.slice(0,8), b.events?.title || "N/A", b.profiles?.full_name || "Guest", b.total_amount, b.status, new Date(b.created_at).toLocaleDateString()]);
                                            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
                                            const link = document.createElement("a");
                                            link.href = encodeURI(csvContent);
                                            link.download = `Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`;
                                            document.body.appendChild(link); link.click(); document.body.removeChild(link);
                                            showToast("Excel Export Complete", "success");
                                        }}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                    >
                                        <Archive size={14} /> Export Excel
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const { jsPDF } = await import("jspdf");
                                                const doc = new jsPDF();
                                                doc.setFontSize(20); doc.text("REVENUE REPORT", 105, 20, { align: "center" });
                                                doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: "center" });
                                                let y = 50;
                                                bookingsArr.slice(0, 20).forEach((b, i) => {
                                                    doc.text(`${i+1}. ${b.events?.title || 'Event'} - ₹${b.total_amount} (${b.status})`, 20, y);
                                                    y += 10;
                                                });
                                                doc.save("Revenue_Summary.pdf");
                                                showToast("PDF Export Complete", "success");
                                            } catch (e) { showToast("PDF Export Failed", "error"); }
                                        }}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                    >
                                        <FileText size={14} /> Export PDF
                                    </button>
                                </div>
                            </div>

                            {/* Core Stats Card */}
                            <div className="bg-slate-950 text-white rounded-[24px] p-6 shadow-2xl border border-white/5 relative overflow-hidden mb-6">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Activity size={20} /></div>
                                            <div>
                                                <h2 className="text-xl font-black tracking-tighter uppercase italic leading-none mb-1">Fiscal Forensics</h2>
                                                <p className="text-white/30 text-[8px] font-black uppercase tracking-[0.2em]">Platform Integrity Monitor</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Optimal</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: "Gross Yield", val: dashboardStats ? `₹${Number(dashboardStats.totalRevenue).toLocaleString()}` : "₹0.00", sub: "Platform Wide", color: "#10b981" },
                                            { label: "Escrow Shard", val: "₹0.00", sub: "Unsettled", color: "#3b82f6" },
                                            { label: "Operating Margin", val: "+0.0%", sub: "Net Efficiency", color: "#ec4899" }
                                        ].map((s, i) => (
                                            <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">{s.label}</p>
                                                <p className="text-2xl font-black tracking-tighter italic mb-0.5 text-white">{s.val}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{s.sub}</span>
                                                    <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full group-hover:w-full transition-all duration-1000" style={{ backgroundColor: s.color, width: '35%' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Intelligence Matrix */}
                            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><BarChart3 size={16} /></div>
                                        <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase">Revenue Intelligence Matrix</h3>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/30">
                                                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                                                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Event Asset</th>
                                                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Entity</th>
                                                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Yield</th>
                                                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {bookingsArr.length === 0 ? (
                                                <tr><td colSpan="6" className="p-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">Synchronizing Financial Data...</td></tr>
                                            ) : bookingsArr.slice(0, 10).map((b, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 text-[10px] font-bold text-slate-400">#{b.id.slice(0, 8)}</td>
                                                    <td className="p-4 text-[11px] font-black text-slate-900 uppercase italic truncate max-w-[200px]">{b.events?.title || "N/A"}</td>
                                                    <td className="p-4 text-[11px] font-bold text-slate-600">{b.profiles?.full_name || "Guest"}</td>
                                                    <td className="p-4 text-[12px] font-black text-pink-500">₹{Number(b.total_amount).toLocaleString()}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-[10px] font-bold text-slate-400">{new Date(b.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeTab === "gst" && (
                        <div className="px-8 py-8">
                            <GstPortal t={t} theme={theme} />
                        </div>
                    )}
                    {activeTab === "subscriptions" && (
                        <div className="px-8 py-8">
                            <SubscriptionPackagesAdmin t={t} theme={theme} />
                        </div>
                    )}





                    {activeTab === "banner_ads" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 px-8 lg:px-12 py-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1.5">Creative Studio</h2>
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Inventory & Placement Control</p>
                                </div>
                                <button className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                    Guidelines
                                </button>
                            </div>

                            {/* Pending Requests Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-2 h-6 bg-pink-500 rounded-full" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Pending Approvals ({bannerRequests.length})</h3>
                                </div>
                                
                                {bannerRequests.length === 0 ? (
                                    <div className="bg-white/50 backdrop-blur-xl rounded-[32px] p-12 border border-slate-100 text-center">
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No pending ad requests found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {bannerRequests.map((req) => (
                                            <div key={req._id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
                                                            <User size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Advertiser ID</p>
                                                            <p className="text-sm font-black text-slate-900">{req.userId}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        Review Pending
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Package</p>
                                                        <p className="text-xs font-bold text-slate-700">Premium Hero Banner</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Submission Date</p>
                                                        <p className="text-xs font-bold text-slate-700">{new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <a href={req.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 font-bold text-xs hover:underline truncate">
                                                        <ExternalLink size={14} /> {req.link || "No Target URL"}
                                                    </a>
                                                    <button
                                                        onClick={() => setApprovingBanner(req)}
                                                        className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shrink-0"
                                                    >
                                                        Review & Upload <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Inventory Grid */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Inventory ({allBanners.filter(b => b.status !== "pending").length})</h3>
                                    </div>
                                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                        View Archived
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {allBanners.filter(b => b.status !== "pending").map((banner) => (
                                        <div key={banner._id} className="group relative bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
                                            {/* Preview Container */}
                                            <div className="aspect-[21/9] relative overflow-hidden bg-slate-100">
                                                <img 
                                                    src={banner.imageUrl} 
                                                    alt="Banner" 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                
                                                <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                    <button 
                                                        onClick={() => deleteBannerMutation({ id: banner._id })}
                                                        className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                <div className="absolute bottom-4 left-6 translate-y-[10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border ${
                                                        banner.endDate > Date.now() 
                                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                                        : "bg-red-500/20 text-red-400 border-red-500/30"
                                                    }`}>
                                                        {banner.endDate > Date.now() ? "Live Now" : "Expired"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        <p className="text-[11px] font-bold text-slate-600">
                                                            {new Date(banner.startDate).toLocaleDateString()} — {new Date(banner.endDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${banner.endDate > Date.now() ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                                        style={{ 
                                                            width: banner.endDate > Date.now() 
                                                                ? `${Math.min(100, Math.max(0, ((Date.now() - banner.startDate) / (banner.endDate - banner.startDate)) * 100))}%` 
                                                                : '100%' 
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Event Deletion Modal */}
                    {adminEventToDelete && (
                        <div className="modal-backdrop" onClick={() => setAdminEventToDelete(null)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                            <div className="org-modal" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: t.bg, width: "100%", maxWidth: "500px", borderRadius: "24px", overflow: "hidden", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
                                <div style={{ padding: "32px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0, fontStyle: "italic" }}>
                                        Delete Event (Admin)
                                    </h2>
                                    <button onClick={() => { setAdminEventToDelete(null); setAdminDeletionProgress(null); }} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}>
                                        <X size={24} />
                                    </button>
                                </div>
                                <div style={{ padding: "32px" }}>
                                    <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: t.cardBg, borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "8px" }}>{adminEventToDelete.title || adminEventToDelete.event_name}</div>
                                        <div style={{ fontSize: "12px", color: t.textSub }}>{new Date(adminEventToDelete.created_at).toLocaleDateString()}</div>
                                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444", marginTop: "8px" }}>Admin Override Mode</div>
                                    </div>

                                    {adminDeletionProgress ? (
                                        <div style={{ padding: "16px", backgroundColor: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                            <h4 style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 800, color: t.textMain, textTransform: "uppercase" }}>Deletion Progress</h4>
                                            {adminDeletionProgress.map((step, idx) => (
                                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: t.textSub, marginBottom: "8px" }}>
                                                    <CheckCircle size={14} color="#10b981" />
                                                    {step}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ color: t.textSub, fontSize: "14px", marginBottom: "24px" }}>
                                                Select deletion type. Soft delete archives the event, Hard delete permanently removes it.
                                            </p>
                                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                                <button onClick={() => setAdminEventToDelete(null)} style={{ padding: "12px 24px", borderRadius: "12px", background: t.cardBg, color: t.textMain, border: `1px solid ${t.border}`, fontWeight: 700, cursor: "pointer" }}>
                                                    Cancel
                                                </button>
                                                <button onClick={() => executeAdminEventDeletion(adminEventToDelete, "soft")} style={{ padding: "12px 24px", borderRadius: "12px", background: "#f59e0b", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                                    Archive (Soft Delete)
                                                </button>
                                                <button onClick={() => executeAdminEventDeletion(adminEventToDelete, "hard")} style={{ padding: "12px 24px", borderRadius: "12px", background: "#ef4444", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                                    Hard Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
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

                    {activeTab === "coupons" && (
                        <CouponManager t={t} theme={theme} />
                    )}

                    {activeTab === "settlement_verification" && (
                        <FinanceCrossVerificationAdmin t={t} theme={theme} />
                    )}

                    {activeTab === "exclusive_settings" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Exclusive Events Management</h3>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Event Title</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allEvents.filter(e => e.is_exclusive).map((ev) => (
                                            <tr key={ev.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 700, color: t.textMain }}>{ev.title}</td>
                                                <td style={{ padding: "12px", fontSize: "12px" }}>{ev.category}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#f59e0b15", color: "#f59e0b", fontWeight: 800 }}>EXCLUSIVE</span>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <button 
                                                        onClick={() => updateEvent({ id: ev.id, is_exclusive: false })}
                                                        style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
                                                    >
                                                        Remove Exclusive
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {allEvents.filter(e => e.is_exclusive).length === 0 && (
                                            <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No exclusive events found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {activeTab === "bookings" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight" style={{ color: t.textMain }}>Ticket Orders</h3>
                                    <p className="text-sm font-medium opacity-60" style={{ color: t.textSub }}>Monitor and manage real-time event registrations</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Search order ID, email, event..." 
                                            className="w-80 pl-12 pr-6 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <button className="p-3.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all">
                                        <Filter size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {bookings.length > 0 ? bookings.map((b) => (
                                    <div key={b.id} className="card-premium flex flex-col md:flex-row items-center gap-6 group">
                                        {/* Avatar / Icon */}
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-all flex-shrink-0">
                                            <Ticket size={28} strokeWidth={2.5} />
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xs font-black text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md uppercase tracking-wider">#{String(b.id).slice(-8).toUpperCase()}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date().toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="text-lg font-black truncate mb-1" style={{ color: t.textMain }}>{b.eventName}</h4>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                    <User size={14} className="text-pink-500" /> {b.customerName}
                                                </p>
                                                <p className="text-[11px] font-bold text-slate-400 pl-5 uppercase tracking-tighter">
                                                    {b.customerEmail}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Meta Stats */}
                                        <div className="flex items-center gap-12 flex-shrink-0">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tickets</p>
                                                <p className="text-lg font-black" style={{ color: t.textMain }}>{b.ticketCount || 1}</p>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Amount</p>
                                                <p className="text-xl font-black text-pink-600">₹{Number(b.totalPrice || 0).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Status & Action */}
                                        <div className="flex items-center gap-6 pl-6 border-l border-slate-100 flex-shrink-0">
                                            <span className="status-badge bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                {b.status || "Confirmed"}
                                            </span>
                                            <button 
                                                onClick={() => showToast(`Viewing Order Details: #${String(b.id).slice(-8).toUpperCase()} for ${b.customerEmail}`, "info")}
                                                className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            >
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ShoppingCart size={40} className="text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-black mb-2" style={{ color: t.textMain }}>No bookings found</h3>
                                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">Orders from homepage and organiser events will appear here once customers start purchasing tickets.</p>
                                    </div>
                                )}
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
                                            <tr key={org.id} style={{ backgroundColor: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}`, boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)" }}>
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

                    {activeTab === "providers" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 lg:px-0">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Service Network</h2>
                                    <p className="text-sm text-slate-500 font-medium">Manage professional service providers, turf owners, and specialized vendors.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 pb-20 px-4 lg:px-0">
                                {serviceActive.map((org) => (
                                    <div key={org.id} className="group relative bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200 transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-900 rounded-[20px] flex items-center justify-center text-white shadow-lg group-hover:bg-indigo-600 group-hover:scale-105 transition-all duration-500 shrink-0">
                                                <Briefcase size={24} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-1 truncate">{org.business_name || org.name}</h4>
                                                <p className="text-xs font-bold text-slate-400 truncate">{org.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <button onClick={() => setActiveTab("turf_partners")} className="px-8 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all whitespace-nowrap">Manage Assets</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(activeTab === "users" || activeTab === "customers") && (
                        <div className="px-8 lg:px-12 py-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            {/* Header & Stats Shunts */}
                            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-12">
                                <div>
                                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">Customer CRM</h2>
                                    <p className="text-xs text-slate-400 font-black uppercase tracking-[0.4em] mb-8">Global User Identity & Audit Protocol</p>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                                            <input 
                                                type="text" 
                                                placeholder="Identify user by name, email, or shard..." 
                                                className="pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 w-full md:w-[450px] shadow-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {[
                                        { label: "Total Base", val: usersArr.length, color: "#3b82f6" },
                                        { label: "New Leads", val: "+24", color: "#10b981" },
                                        { label: "Hot Shards", val: "12", color: "#f59e0b" }
                                    ].map((s, i) => (
                                        <div key={i} className="px-8 py-6 bg-white rounded-[24px] border border-slate-100 shadow-sm min-w-[140px]">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                                            <p className="text-2xl font-black text-slate-900 italic tracking-tight" style={{ color: s.color }}>{s.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Table Shunt */}
                            <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity Matrix</th>
                                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Shard</th>
                                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role Status</th>
                                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nexus Join</th>
                                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action Protocol</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(() => {
                                                const customersOnly = usersArr.filter(c => !c.role || c.role === "user");
                                                return customersOnly.length > 0 ? customersOnly.map((c) => (
                                                    <tr key={c.id} className="group hover:bg-slate-50/80 transition-all cursor-default">
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                                    {(c.username || c.full_name || "U").charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">{c.username || c.full_name || "Nexus User"}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {c.id.slice(0, 8)}...</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-3 text-slate-600">
                                                                <Mail size={14} className="text-blue-500" />
                                                                <p className="text-sm font-bold">{c.email || "shard@nexus.io"}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <span className="px-5 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                                {c.role || "user"}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <p className="text-sm font-black text-slate-900 italic tracking-tight">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "—"}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Authorized Access</p>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <button className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:translate-x-2 transition-transform">
                                                                View Audit <ArrowRight size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-10 py-24 text-center">
                                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200"><Users size={32} /></div>
                                                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No User Shards Detected</p>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "rewards_vouchers" && (
                        <RewardsManagement />
                    )}

                    {activeTab === "sponsors_partners" && (
                        <SponsorsPartnersAdmin />
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



                    {activeTab === "contact_settings" && (
                        contactLoading ? (
                            <div className="flex items-center justify-center p-20">
                                <RefreshCw className="animate-spin text-pink-500" size={40} />
                            </div>
                        ) : localContact && (
                        <div className="px-8 lg:px-12 py-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Node Configuration</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Global Contact & Support Infrastructure</p>
                                </div>
                                <button 
                                    disabled={upsertingContact}
                                    onClick={async () => {
                                        try {
                                            await upsertContactSettings({ ...localContact, id: 1 });
                                            await refreshContact();
                                            showToast("Support Node Synchronized", "success");
                                        } catch (err) {
                                            showToast("Sync Failed: " + (err.message || "Permission Denied"), "error");
                                        }
                                    }}
                                    className={`px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] italic shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${upsertingContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Save size={16} className={upsertingContact ? 'animate-spin' : ''} /> 
                                    {upsertingContact ? 'Synchronizing...' : 'Sync Configuration'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Header & General */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                        <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-2">Main Header</h4>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Page Title</label>
                                            <input 
                                                type="text" 
                                                value={localContact.header_title || ""} 
                                                onChange={(e) => setLocalContact({...localContact, header_title: e.target.value})}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-pink-500/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sub-description</label>
                                            <textarea 
                                                rows={2}
                                                value={localContact.header_description || ""} 
                                                onChange={(e) => setLocalContact({...localContact, header_description: e.target.value})}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-pink-500/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">General Support</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Email</label>
                                                <input 
                                                    type="email" 
                                                    value={localContact.support_email || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, support_email: e.target.value})}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-pink-500/10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Phone</label>
                                                <input 
                                                    type="text" 
                                                    value={localContact.support_phone || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, support_phone: e.target.value})}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-pink-500/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-6 rounded-3xl space-y-4 text-white">
                                        <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-2">International Sales</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">India</label>
                                                <input 
                                                    type="text" 
                                                    value={localContact.sales_india || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, sales_india: e.target.value})}
                                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-xs focus:ring-2 focus:ring-pink-500/10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">UAE</label>
                                                <input 
                                                    type="text" 
                                                    value={localContact.sales_uae || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, sales_uae: e.target.value})}
                                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-xs focus:ring-2 focus:ring-pink-500/10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Singapore</label>
                                                <input 
                                                    type="text" 
                                                    value={localContact.sales_singapore || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, sales_singapore: e.target.value})}
                                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-xs focus:ring-2 focus:ring-pink-500/10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Address & Social */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                        <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-2">Office Address</h4>
                                        <div className="space-y-3">
                                            <input 
                                                type="text" placeholder="Line 1"
                                                value={localContact.address_line1 || ""} 
                                                onChange={(e) => setLocalContact({...localContact, address_line1: e.target.value})}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                            />
                                            <input 
                                                type="text" placeholder="Line 2"
                                                value={localContact.address_line2 || ""} 
                                                onChange={(e) => setLocalContact({...localContact, address_line2: e.target.value})}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                            />
                                            <div className="grid grid-cols-3 gap-3">
                                                <input 
                                                    type="text" placeholder="Line 3"
                                                    value={localContact.address_line3 || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, address_line3: e.target.value})}
                                                    className="col-span-2 w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                                />
                                                <input 
                                                    type="text" placeholder="PIN"
                                                    value={localContact.address_pincode || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, address_pincode: e.target.value})}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 space-y-4">
                                        <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-2">Business Hours</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-24 text-[9px] font-black text-slate-400 uppercase">Mon - Fri</span>
                                                <input 
                                                    type="text" 
                                                    value={localContact.hours_mon_fri || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, hours_mon_fri: e.target.value})}
                                                    className="flex-1 p-3 bg-white border border-orange-100 rounded-xl font-bold text-slate-900 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-24 text-[9px] font-black text-slate-400 uppercase">Saturday</span>
                                                <input 
                                                    type="text" 
                                                    value={localContact.hours_sat || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, hours_sat: e.target.value})}
                                                    className="flex-1 p-3 bg-white border border-orange-100 rounded-xl font-bold text-slate-900 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-24 text-[9px] font-black text-slate-400 uppercase">Sunday</span>
                                                <input 
                                                    type="text" 
                                                    value={localContact.hours_sun || ""} 
                                                    onChange={(e) => setLocalContact({...localContact, hours_sun: e.target.value})}
                                                    className="flex-1 p-3 bg-white border border-orange-100 rounded-xl font-bold text-slate-900 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Social Links</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['linkedin', 'instagram', 'facebook', 'twitter'].map(platform => (
                                                <div key={platform} className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest capitalize">{platform}</label>
                                                    <input 
                                                        type="text" 
                                                        value={localContact[`social_${platform}`] || ""} 
                                                        onChange={(e) => setLocalContact({...localContact, [`social_${platform}`]: e.target.value})}
                                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-pink-500/10"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Hero Banner Management</h3>
                                <button onClick={addSlide} className="tab-btn" style={{ padding: "8px 16px", background: ACCENT_GRADIENT, backgroundColor: ACCENT_PINK, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, boxShadow: "0 10px 24px rgba(236,72,153,0.12)" }}>
                                    <Plus size={18} /> Add New Slide
                                </button>
                            </div>

                            {/* Image Spec Callout */}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 18px", marginBottom: "24px", borderRadius: "12px", backgroundColor: theme === 'light' ? "#f0f9ff" : "#0c1a2e", border: "1px solid", borderColor: theme === 'light' ? "#bae6fd" : "#1e3a5f" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <ImageIcon size={18} color="#fff" />
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 800, color: theme === 'light' ? "#0369a1" : "#38bdf8" }}>Recommended Image Size</p>
                                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: t.textSub, lineHeight: 1.6 }}>
                                        <strong style={{ color: t.textMain }}>1200 × 400 px</strong> &nbsp;·&nbsp; Aspect ratio <strong style={{ color: t.textMain }}>3 : 1</strong> &nbsp;·&nbsp; Auto cropped &amp; compressed on upload<br />
                                        Format: <strong style={{ color: t.textMain }}>JPG / PNG / WebP</strong> &nbsp;·&nbsp; Any file size accepted &nbsp;·&nbsp; Landscape / wide images recommended
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
                                {slides.map((slide) => (
                                    <div key={slide.id} style={{ border: `1px solid ${t.border}`, borderRadius: "16px", overflow: "hidden", backgroundColor: t.cardBg, display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

                                        {/* ── Image Preview / Upload Zone ── */}
                                        <div
                                            style={{ position: "relative", height: "220px", backgroundColor: slideDragOver[slide.id] ? "#1e3a5f" : "#0f172a", cursor: "pointer", transition: "background 0.2s", border: slideDragOver[slide.id] ? "2px dashed #3b82f6" : "2px solid transparent" }}
                                            onDragOver={(e) => { e.preventDefault(); setSlideDragOver(p => ({ ...p, [slide.id]: true })); }}
                                            onDragLeave={() => setSlideDragOver(p => ({ ...p, [slide.id]: false }))}
                                            onDrop={(e) => { e.preventDefault(); setSlideDragOver(p => ({ ...p, [slide.id]: false })); const f = e.dataTransfer.files[0]; if (f) uploadSlideImage(slide.id, f); }}
                                            onClick={() => document.getElementById(`slide-upload-${slide.id}`)?.click()}
                                        >
                                            <input
                                                id={`slide-upload-${slide.id}`}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                style={{ display: "none" }}
                                                onChange={(e) => { const f = e.target.files[0]; if (f) uploadSlideImage(slide.id, f); }}
                                            />

                                            {(slide.img && !slideImgBroken[slide.id]) ? (
                                                <>
                                                    <img
                                                        src={slide.img}
                                                        alt={slide.title || "Slide"}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }}
                                                        onError={() => setSlideImgBroken(p => ({ ...p, [slide.id]: true }))}
                                                    />
                                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)", pointerEvents: "none" }} />
                                                    {/* Hover re-upload hint */}
                                                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", pointerEvents: "none" }}
                                                        className="slide-img-hover">
                                                    </div>
                                                    <div style={{ position: "absolute", bottom: "10px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: "8px", padding: "5px 10px", pointerEvents: "none" }}>
                                                        <Upload size={12} color="#fff" />
                                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>Click or drag to replace</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", border: "2px dashed rgba(255,255,255,0.15)", margin: "16px", borderRadius: "10px" }}>
                                                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Upload size={24} color="#60a5fa" />
                                                    </div>
                                                    <div style={{ textAlign: "center" }}>
                                                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#e2e8f0" }}>Click to upload image</p>
                                                        <p style={{ margin: "3px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>or drag &amp; drop here</p>
                                                        <p style={{ margin: "6px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>JPG · PNG · WebP · max 5 MB</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Uploading spinner overlay */}
                                            {slideUploading[slide.id] && (
                                                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", zIndex: 10 }}>
                                                    <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.2)", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Uploading…</span>
                                                </div>
                                            )}

                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }}
                                                style={{ position: "absolute", top: "10px", right: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", zIndex: 5 }}
                                            ><X size={14} /></button>
                                        </div>

                                        {/* ── Form Fields ── */}
                                        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <label style={{ fontSize: "10px", fontWeight: 800, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Live Concerts"
                                                    value={slide.title || ""}
                                                    onChange={(e) => updateSlideLocal(slide.id, 'title', e.target.value)}
                                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <label style={{ fontSize: "10px", fontWeight: 800, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Subtitle</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Book your favourite artists"
                                                    value={slide.sub || ""}
                                                    onChange={(e) => updateSlideLocal(slide.id, 'sub', e.target.value)}
                                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <label style={{ fontSize: "10px", fontWeight: 800, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Target URL <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}>(optional)</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="/events or https://..."
                                                    value={slide.url || ""}
                                                    onChange={(e) => updateSlideLocal(slide.id, 'url', e.target.value)}
                                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleSaveSlide(slide)}
                                                disabled={slideUploading[slide.id]}
                                                style={{ marginTop: "4px", padding: "11px", background: ACCENT_GRADIENT, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: slideUploading[slide.id] ? "not-allowed" : "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: slideUploading[slide.id] ? 0.6 : 1, letterSpacing: "0.03em" }}
                                            >
                                                <Save size={15} /> Save Slide
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
                                {subnavItems.map((item, idx) => (
                                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                                        <span style={{ fontSize: "20px" }}>{item.icon}</span>
                                        <input
                                            type="text"
                                            value={item.label}
                                            onChange={(e) => {
                                                const newItems = [...subnavItems];
                                                newItems[idx] = { ...item, label: e.target.value };
                                                setSubnavConfig({ ...subnavConfig, items: newItems });
                                            }}
                                            style={{ flex: 1, padding: "4px 8px", borderRadius: "4px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                        />
                                        <button onClick={() => setSubnavConfig({ ...subnavConfig, items: subnavItems.filter(si => si.id !== item.id) })} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setSubnavConfig({ 
                                        ...subnavConfig, 
                                        items: [...subnavItems, { id: Date.now(), label: "New Item", icon: "✨", order: subnavItems.length }] 
                                    })}
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
                                    
                                    <div style={{ backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', padding: "20px", borderRadius: "16px", border: `1px solid ${t.border}`, marginTop: "10px" }}>
                                        <h4 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Shield size={18} className="text-blue-500" />
                                            Official Partners & Sponsors
                                        </h4>
                                        
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                            {[
                                                { label: "Sponsor Logo 1", key: "sponsor_logo_1" },
                                                { label: "Sponsor Logo 2", key: "sponsor_logo_2" },
                                                { label: "Partner Logo 1", key: "partner_logo_1" },
                                                { label: "Partner Logo 2", key: "partner_logo_2" }
                                            ].map((item) => (
                                                <div key={item.key}>
                                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: t.textSub, textTransform: "uppercase" }}>{item.label}</label>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                        <div style={{ height: "60px", width: "100%", borderRadius: "8px", border: `1px dashed ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                                            {localBranding[`${item.key}_url`] ? (
                                                                <img src={localBranding[`${item.key}_url`]} alt="Preview" style={{ height: "100%", width: "100%", objectFit: "contain", padding: "4px" }} />
                                                            ) : (
                                                                <span style={{ fontSize: "10px", color: t.textSub, opacity: 0.5 }}>No Logo</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <label style={{ flex: 1, padding: "6px 12px", backgroundColor: t.header, borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 700, fontSize: "10px", color: t.textMain, border: `1px solid ${t.border}` }}>
                                                                <Upload size={12} /> Upload
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    style={{ display: "none" }} 
                                                                    onChange={(e) => handleBrandingUpload(e.target.files[0], item.key)}
                                                                />
                                                            </label>
                                                            {localBranding[`${item.key}_url`] && (
                                                                <button 
                                                                    onClick={() => handleDeleteLogo(item.key)}
                                                                    style={{ padding: "6px 12px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "6px", border: "1px solid #fee2e2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                    title="Remove Logo"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: "10px", color: t.textSub, marginTop: "12px", fontStyle: "italic" }}>* These logos will appear globally on all digital tickets.</p>
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
                                                    powered_by_link: localBranding.powered_by_link,
                                                    sponsor_logo_1: localBranding.sponsor_logo_1_url,
                                                    sponsor_logo_2: localBranding.sponsor_logo_2_url,
                                                    partner_logo_1: localBranding.partner_logo_1_url,
                                                    partner_logo_2: localBranding.partner_logo_2_url
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


                    {activeTab === "org_requests" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Event Organisers</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Partner Onboarding & Approval</p>
                            </div>
                             <AdminOrgRequestsTable t={t} />
                        </div>
                    )}

                    {activeTab === "kyc" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Organizer Verification Center</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Verification &amp; Compliance Audit</p>
                            </div>
                             <AdminKycReview t={t} />
                        </div>
                    )}

                    {activeTab === "digilocker_kyc_review" && (
                        <div style={{ padding: "24px" }}>
                            <AdminDigiLockerKYC adminSession={adminSession} />
                        </div>
                    )}

                    {activeTab === "service_requests" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Professional Services</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Service Provider Onboarding</p>
                            </div>
                             <AdminServiceRequestsTable t={t} />
                        </div>
                    )}

                    {activeTab === "email_logs" && (
                        <div className="px-8 py-6">
                            <EmailDashboard t={t} theme={theme} />
                        </div>
                    )}

                    {activeTab === "audit_logs" && (
                        <div className="p-12 text-center bg-white rounded-[48px] border-2 border-dashed border-slate-100 mx-8">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200"><Archive size={40} /></div>
                             <h3 className="text-2xl font-black text-slate-900 mb-2">Audit Logs Repository</h3>
                             <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto uppercase tracking-widest">Platform-wide action history and security logs will be archived here.</p>
                        </div>
                    )}
                    {(activeTab === "organisers" || ["all_org", "active_org", "banned_org", "kyc_pending", "kyc_verified", "with_balance", "email_unverified", "mobile_unverified", "kyc_unverified"].includes(activeTab)) && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 lg:px-0">
                            {/* Dashboard Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                                        {activeTab === "organisers" || activeTab === "all_org" ? "Partner Directory" :
                                         activeTab.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium">Oversee professional organizers and event management partners.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-pink-500 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search partners..."
                                            className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/20 w-full md:w-[280px] shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cards Feed */}
                            <div className="flex flex-col gap-4 pb-20">
                                {mappedOrganizers.filter(org => {
                                    if (activeTab === "organisers" || activeTab === "all_org") return true;
                                    if (activeTab === "active_org") return ["Active", "KYC Completed", "KYC Verified"].includes(org.status);
                                    if (activeTab === "banned_org") return ["Banned", "Rejected"].includes(org.status);
                                    if (activeTab === "kyc_pending") return ["KYC Pending", "Start Onboarding", "NOT STARTED", "Not Started"].includes(org.status);
                                    if (activeTab === "kyc_verified") return ["Submitted", "Under Review", "Pending"].includes(org.status);
                                    if (activeTab === "with_balance") return parseFloat(String(org.balance).replace(/[^\d.-]/g, '')) > 0;
                                    if (activeTab === "email_unverified") return String(org.id).length % 2 === 0;
                                    if (activeTab === "mobile_unverified") return String(org.id).length % 3 === 0;
                                    if (activeTab === "kyc_unverified") return !["KYC Pending", "Pending", "Submitted", "Active", "KYC Completed"].includes(org.status);
                                    return true;
                                }).map((org) => (
                                    <div key={org.id} className="group relative bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200 transition-all duration-300 flex flex-col md:flex-row items-center gap-6">
                                        {/* Main Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="overflow-hidden">
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-1 truncate">{org.username}</h4>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Mail size={12} />
                                                    <p className="text-[12px] font-bold truncate">{org.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics - Status & Balance */}
                                        <div className="flex items-center gap-10 px-10 border-x border-slate-50 flex-shrink-0">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap ${
                                                    (org.kyc_status === 'Active' || org.kyc_status === 'KYC Completed' || org.kyc_status === 'KYC Verified') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    (org.kyc_status === 'Banned' || org.kyc_status === 'Rejected') ? 'bg-red-50 text-red-600 border border-red-100' :
                                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                    {org.kyc_status?.toUpperCase() || 'NOT STARTED'}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Balance</p>
                                                <p className="text-base font-black text-slate-900">{org.balance}</p>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="flex items-center gap-6 flex-shrink-0">
                                            <button 
                                                onClick={() => { setSelectedLedgerOrg(org); setShowLedgerModal(true); }}
                                                className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2"
                                            >
                                                Financial Ledger <ArrowRight size={14} />
                                            </button>
                                            
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setOpenActionDropdown(openActionDropdown === org.id ? null : org.id)}
                                                    className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>
                                                
                                                {openActionDropdown === org.id && (
                                                    <div className="absolute right-0 top-14 w-56 bg-white rounded-[24px] border border-slate-100 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="p-2 space-y-1">
                                                            <button onClick={() => { setEditingOrg(org); setIsEditModalOpen(true); setOpenActionDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-widest transition-colors text-left">
                                                                <Edit size={16} /> Edit Profile
                                                            </button>
                                                            {(org.kyc_status === 'KYC Pending' || org.kyc_status === 'Pending' || org.kyc_status === 'Submitted' || org.kyc_status === 'Start Onboarding') && (
                                                                <>
                                                                    <button onClick={() => { setSelectedKycOrg(org); setOpenActionDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest transition-colors text-left">
                                                                        <FileText size={16} /> View Documents
                                                                    </button>
                                                                    <button onClick={() => { patchOrganizerMutation({ id: org.id, kyc_status: 'Approved' }); setOpenActionDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest transition-colors text-left">
                                                                        <CheckCircle size={16} /> Approve KYC
                                                                    </button>
                                                                </>
                                                            )}
                                                            {org.kyc_status === 'Approved' && (
                                                                <button onClick={() => { patchOrganizerMutation({ id: org.id, kyc_status: 'Active' }); setOpenActionDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest transition-colors text-left">
                                                                    <Zap size={16} /> Activate Account
                                                                </button>
                                                            )}
                                                            <button onClick={() => { patchOrganizerMutation({ id: org.id, kyc_status: org.kyc_status === 'Banned' ? 'Active' : 'Banned' }); setOpenActionDropdown(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors text-left ${org.kyc_status === 'Banned' ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-red-50 text-red-600'}`}>
                                                                {org.kyc_status === 'Banned' ? <CheckCircle size={16} /> : <Slash size={16} />} 
                                                                {org.kyc_status === 'Banned' ? 'Unrestrict' : 'Restrict Access'}
                                                            </button>
                                                            <button onClick={() => { setSelectedUserForPassword(org); setIsPasswordResetModalOpen(true); setOpenActionDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 text-amber-600 text-xs font-black uppercase tracking-widest transition-colors text-left">
                                                                <Key size={16} /> Password Settings
                                                            </button>
                                                            <div className="h-px bg-slate-50 my-1 mx-2" />
                                                            <button onClick={() => { removeOrganizerMutation({ id: org.id }); setOpenActionDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white text-red-500 text-xs font-black uppercase tracking-widest transition-all text-left">
                                                                <Trash2 size={16} /> Delete Partner
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}




                    {["service_active", "service_banned"].includes(activeTab) && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 lg:px-0">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                                        {activeTab === "service_active" ? "Service Network" : "Restricted Services"}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium">Manage professional service providers, turf owners, and specialized vendors.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                        <Filter size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                                        <select 
                                            value={serviceCategoryFilter}
                                            onChange={(e) => setServiceCategoryFilter(e.target.value)}
                                            className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer uppercase tracking-tighter"
                                        >
                                            <option value="all">Global Inventory</option>
                                            {Array.from(new Set(serviceProvidersArr.map(s => s.category || s.kyc_details?.category).filter(Boolean))).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 gap-4 pb-20 px-4 lg:px-0">
                                {(activeTab === "service_active" ? serviceActive : serviceBanned).map((org) => (
                                    <div key={org.id} className="group relative bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200 transition-all duration-500 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="w-16 h-16 bg-slate-900 rounded-[20px] flex items-center justify-center text-white shadow-lg group-hover:bg-indigo-600 transition-all shrink-0">
                                                <Briefcase size={24} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-xl font-black text-slate-900 tracking-tight truncate">
                                                        {org.business_name || org.name || "Unnamed Provider"}
                                                    </h4>
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        {org.category || "Professional"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Mail size={12} />
                                                        <p className="text-[11px] font-bold">
                                                            {org.profiles?.email || org.email || "No Contact Email"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${activeTab === 'service_active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {activeTab === 'service_active' ? 'Active' : 'Banned'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            {activeTab === "service_active" ? (
                                                <button 
                                                    onClick={() => updateVendorMutation({ id: org.id, kyc_status: "Banned", is_approved: false })} 
                                                    className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm whitespace-nowrap"
                                                >
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => updateVendorMutation({ id: org.id, kyc_status: "Active", is_approved: true })} 
                                                    className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm whitespace-nowrap"
                                                >
                                                    Activate
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={() => { setEditingVendor(org); setIsEditVendorModalOpen(true); }}
                                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                                                title="Edit Provider"
                                            >
                                                <Edit size={18} />
                                            </button>

                                            <button 
                                                onClick={() => { setSelectedUserForPassword(org); setIsPasswordResetModalOpen(true); }}
                                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shrink-0"
                                                title="Password Settings"
                                            >
                                                <Key size={18} />
                                            </button>
                                            
                                            <button 
                                                onClick={() => { if(confirm("Permanently remove this service provider?")) removeVendor({ id: org.id }); }}
                                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0"
                                                title="Delete Provider"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shrink-0">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {(activeTab === "service_active" ? serviceActive : serviceBanned).length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <Building2 size={40} />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">No professional partners in this category</p>
                                    </div>
                                )}
                            </div>
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
                                    { name: "Cashfree", desc: "UPI, Cards, EMI & Netbanking (India)", color: "#111827" },
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
                                            <input type="checkbox" checked={!!paymentGatewayConfig.is_enabled} onChange={(e) => setPaymentGatewayConfig({ ...paymentGatewayConfig, is_enabled: e.target.checked })} />
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
                                                    try {
                                                        if (paymentGatewayConfig.id) {
                                                            await patchPaymentGateway({
                                                                id: paymentGatewayConfig.id,
                                                                is_enabled: paymentGatewayConfig.is_enabled,
                                                                config: paymentGatewayConfig.config,
                                                                test_mode: paymentGatewayConfig.test_mode
                                                            });
                                                        } else {
                                                            await addPaymentGateway({
                                                                name: paymentGatewayConfig.name,
                                                                is_enabled: paymentGatewayConfig.is_enabled,
                                                                config: paymentGatewayConfig.config,
                                                                test_mode: paymentGatewayConfig.test_mode
                                                            });
                                                        }
                                                        setPaymentGatewayConfig(null);
                                                        showToast("Settings saved!", "success");
                                                    } catch (err) {
                                                        console.error("Save Error:", err);
                                                        showToast("Failed to save: " + err.message, "error");
                                                    }
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
                        <div style={{ width: "100%", animation: "fadeIn 0.5s ease-out" }}>
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

                    {(activeTab === "email_templates" || activeTab === "email_broadcast") && (
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
                                            value={localPolicies.booking_header}
                                            onChange={(e) => setLocalPolicies(p => ({ ...p, booking_header: e.target.value }))}
                                            rows={3}
                                            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "14px", lineHeight: "1.6", resize: "vertical", boxSizing: "border-box" }}
                                        />
                                        <p style={{ margin: "6px 0 0", fontSize: "11px", color: t.textSub }}>Displayed at the top of the event booking page.</p>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                            <div style={{ backgroundColor: "#22c55e20", padding: "8px", borderRadius: "8px" }}><CreditCard size={18} color="#22c55e" /></div>
                                            <label style={{ fontSize: "15px", fontWeight: 700, color: t.textMain }}>Payment Terms Disclaimer</label>
                                        </div>
                                        <textarea
                                            value={localPolicies.payment_terms}
                                            onChange={(e) => setLocalPolicies(p => ({ ...p, payment_terms: e.target.value }))}
                                            rows={3}
                                            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "14px", lineHeight: "1.6", resize: "vertical", boxSizing: "border-box" }}
                                        />
                                        <p style={{ margin: "6px 0 0", fontSize: "11px", color: t.textSub }}>Shown above the 'Pay Now' button during checkout.</p>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: t.textMain }}>Event Content Policy</label>
                                            <textarea
                                                value={localPolicies.event_disclaimer}
                                                onChange={(e) => setLocalPolicies(p => ({ ...p, event_disclaimer: e.target.value }))}
                                                rows={5}
                                                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", lineHeight: "1.5", resize: "vertical", boxSizing: "border-box" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: t.textMain }}>Cancellation &amp; Refund Policy</label>
                                            <textarea
                                                value={localPolicies.cancellation_policy}
                                                onChange={(e) => setLocalPolicies(p => ({ ...p, cancellation_policy: e.target.value }))}
                                                rows={5}
                                                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", lineHeight: "1.5", resize: "vertical", boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ mt: "8px" }}>
                                        <button
                                            onClick={async () => {
                                                setIsSavingPolicies(true);
                                                try {
                                                    await updatePolicies({ ...policiesArr[0], ...localPolicies });
                                                    showToast("Legal policies updated successfully!", "success");
                                                } catch (err) {
                                                    showToast("Failed to save policies: " + err.message, "error");
                                                } finally {
                                                    setIsSavingPolicies(false);
                                                }
                                            }}
                                            disabled={isSavingPolicies}
                                            style={{ backgroundColor: isSavingPolicies ? "#93c5fd" : "#3b82f6", color: "#fff", border: "none", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: isSavingPolicies ? "not-allowed" : "pointer", transition: "0.2s", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                                            onMouseOver={(e) => { if (!isSavingPolicies) e.currentTarget.style.backgroundColor = "#2563eb"; }}
                                            onMouseOut={(e) => { if (!isSavingPolicies) e.currentTarget.style.backgroundColor = "#3b82f6"; }}>
                                            {isSavingPolicies ? "Saving…" : "Save All Policy Changes"}
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
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header */}
                            <div className="px-4 lg:px-0">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Audience Matrix</h2>
                                <p className="text-sm text-slate-500 font-medium">Monitor and manage the global newsletter community and marketing reach.</p>
                            </div>

                            <div className="px-4 lg:px-0">
                                <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                                    <SubscribersTable t={t} theme={theme} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "reviews" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header */}
                            <div className="px-4 lg:px-0">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Review Moderation</h2>
                                <p className="text-sm text-slate-500 font-medium">Approve or hide user reviews across all events.</p>
                            </div>

                            <div className="px-4 lg:px-0">
                                <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                                    <AdminReviewsTable t={t} theme={theme} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "api_settings" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 lg:px-0">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Developer Console</h2>
                                    <p className="text-sm text-slate-500 font-medium">Generate secure API infrastructure for external platform integrations.</p>
                                </div>
                                <button
                                    onClick={() => createApiKey({ name: "New Integration", key_value: `ak_${Math.random().toString(36).substr(2, 9)}` })}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                                >
                                    <Zap size={18} /> Provision New Key
                                </button>
                            </div>

                            {/* Cards Feed */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 px-4 lg:px-0">
                                {apiKeysArr.map((item) => (
                                    <div key={item.id} className="group relative bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-500">
                                                    <Code size={28} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1 truncate">{item.name}</h4>
                                                    <p className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                        {item.status.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl mb-8 font-mono text-[10px] text-slate-500 break-all border border-slate-100">
                                            {item.key_value}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => toggleApiKeyStatus({ id: item.id, status: item.status === "Active" ? "Revoked" : "Active" })}
                                                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${item.status === 'Active' ? 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                                            >
                                                {item.status === "Active" ? "Revoke Access" : "Activate Key"}
                                            </button>
                                            <button 
                                                onClick={() => removeApiKey({ id: item.id })}
                                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {apiKeysArr.length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <Cpu size={40} />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">No API credentials provisioned</p>
                                    </div>
                                )}
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


                    {activeTab === "payout_requests" && (
                        <div className="px-8 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1.5">Treasury Ledger</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Approve professional payouts & settlements</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 border border-emerald-100">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Real-time Settlement Node</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payout Table Component */}
                            <PayoutRequestsTable t={t} theme={theme} />
                        </div>
                    )}

                    {activeTab === "social_media_settings" && <SocialMediaManagement />}
                    {activeTab === "fee_settings" && (
                        <div className="px-8 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header */}
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1.5">Fiscal Engine</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configure platform commissions & revenue rules</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Configuration Card */}
                                <div className="lg:col-span-8 bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-14 h-14 bg-indigo-500 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                            <Settings2 size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Platform Commission</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Default Policy</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fee Calculation Model</label>
                                            <select 
                                                value={feeSettingsConfig.default_fee_type}
                                                onChange={e => setFeeSettingsConfig({ ...feeSettingsConfig, default_fee_type: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-[24px] text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="percentage">Dynamic Percentage (%)</option>
                                                <option value="fixed">Flat Transaction Fee (₹)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Revenue Share Value</label>
                                            <div className="relative group">
                                                <input 
                                                    type="number"
                                                    value={feeSettingsConfig.default_fee_value}
                                                    onChange={e => setFeeSettingsConfig({ ...feeSettingsConfig, default_fee_value: Number(e.target.value) })}
                                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-[24px] text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                />
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-indigo-500 transition-colors">
                                                    {feeSettingsConfig.default_fee_type === 'percentage' ? '%' : '₹'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 group">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${feeSettingsConfig.enable_gst ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                                                    <CheckCircle size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Taxation (GST) Compliance</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Toggle real-time tax calculation</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={feeSettingsConfig.enable_gst} onChange={e => setFeeSettingsConfig({ ...feeSettingsConfig, enable_gst: e.target.checked })} className="sr-only peer" />
                                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>

                                        {feeSettingsConfig.enable_gst && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tax Rate (%)</label>
                                                    <input 
                                                        type="number"
                                                        value={feeSettingsConfig.default_gst_percent}
                                                        onChange={e => setFeeSettingsConfig({ ...feeSettingsConfig, default_gst_percent: Number(e.target.value) })}
                                                        className="w-full px-6 py-3.5 bg-white border-none rounded-2xl text-xs font-black text-slate-700 shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Application Surface</label>
                                                    <select 
                                                        value={feeSettingsConfig.gst_apply_on}
                                                        onChange={e => setFeeSettingsConfig({ ...feeSettingsConfig, gst_apply_on: e.target.value })}
                                                        className="w-full px-6 py-3.5 bg-white border-none rounded-2xl text-xs font-black text-slate-700 shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="fee_only">Platform Fee Layer Only</option>
                                                        <option value="ticket_only">Base Ticket Value Only</option>
                                                        <option value="both">Aggregate Total (Fee + Ticket)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end mt-10">
                                        <button 
                                            onClick={() => showToast("Global fiscal policies updated successfully!", "success")}
                                            className="px-10 py-4 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
                                        >
                                            Update Protocol <ShieldCheck size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Sidebar Info */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                                            <Zap size={24} />
                                        </div>
                                        <h4 className="text-xl font-black tracking-tight mb-4 leading-tight italic">Intelligence Node</h4>
                                        <p className="text-xs font-medium text-indigo-100 leading-relaxed mb-6">
                                            Platform fees are dynamically injected during checkout. Organiser-specific overrides will automatically bypass these global parameters.
                                        </p>
                                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-indigo-200">Active Strategy</p>
                                            <p className="text-sm font-bold">{feeSettingsConfig.default_fee_type === 'percentage' ? 'Profit Sharing Model' : 'Fixed Transaction Model'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[40px] border border-slate-100 p-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">Audit Trail</h4>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                                            All changes to the fiscal engine are logged for compliance. Last update performed by System Architect.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "compliance_cms" && (
                        <ComplianceCMS />
                    )}
                    {activeTab === "pages" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 lg:px-0">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Content Hub</h2>
                                    <p className="text-sm text-slate-500 font-medium">Draft, publish, and manage legal policies and information pages.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => { setPageModal("create"); setPageForm({ title: "", slug: "", content: "", showInFooter: true }); }}
                                        className="px-8 py-3 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                                    >
                                        <Plus size={18} /> New Page
                                    </button>
                                </div>
                            </div>

                            {/* Cards Feed */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 px-4 lg:px-0">
                                {pages.map((page) => (
                                    <div key={page.id} className="group relative bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-500">
                                                    <FileText size={28} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1 truncate">{page.title}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slug: /p/{page.slug}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Footer Visibility</p>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${page.showInFooter ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                                                    {page.showInFooter ? "Visible" : "Hidden"}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Character Count</p>
                                                <p className="text-xs font-black text-slate-700">{page.content?.length || 0} Chars</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => {
                                                    setPageForm({
                                                        id: page.id,
                                                        title: page.title || "",
                                                        slug: page.slug || "",
                                                        content: page.content || "",
                                                        showInFooter: !!page.showInFooter,
                                                        order: page.order || 0
                                                    });
                                                    setPageModal("edit");
                                                }}
                                                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <Edit size={14} /> Edit Content
                                            </button>
                                            <button 
                                                onClick={() => setPageToDelete(page.id)}
                                                className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {pages.length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <Layout size={40} />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">No custom pages found</p>
                                    </div>
                                )}
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

                    {activeTab === "careers_management" && (
                        <CareersAdmin t={t} theme={theme} />
                    )}

                    {activeTab === "careers_banner" && (
                        <CareersBannerSettings t={t} />
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
                        <div className="px-8 lg:px-12 py-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Customer Ad Popups</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cookie-based high-conversion promo matrix</p>
                                </div>
                                <button onClick={() => { setAdPopupForm({ title: "", description: "", imageUrl: "", redirectUrl: "", redirectType: "url", redirectId: "", ctaText: "Book Now", bgColor: "", badgeText: "", isActive: true, showEveryMinutes: 30, sortOrder: 0 }); setAdPopupEditingId(null); setAdPopupImageFile(null); setShowAdPopupForm(true); }} className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] italic shadow-xl shadow-pink-500/20 hover:scale-105 transition-all flex items-center gap-2">
                                    <Plus size={18} /> Deploy New Popup
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
                                <AdminMeetingsTable t={t} />
                            </div>
                        </div>
                    )}

                    {activeTab === "event_reviews" && (
                        <AdminEventApprovalQueue />
                    )}

                    {(["dashboard", "banner_ads", "revenue", "payout_requests", "fee_settings", "exclusive_settings", "email_broadcast", "careers", "subscribers", "subscriptions", "turf_partners", "turf_active", "turf_banned", "branding", "categories", "subnav", "events_settings", "event_partners", "pages", "compliance_cms", "sections", "all_org", "active_org", "banned_org", "email_unverified", "mobile_unverified", "kyc_unverified", "kyc_pending", "kyc_verified", "with_balance", "org_requests", "partner_requests", "service_active", "service_banned", "send_notif", "payment_settings", "ticket_settings", "comm_hub", "email_settings", "email_templates", "disclaimer_settings", "sso_settings", "api_settings", "meta_management", "all_events", "event_reviews", "tournaments", "marathons", "customers", "bookings", "all_turfs", "turf_active", "turf_banned", "turf_bookings", "pool_bookings", "gst", "coupons", "promotions", "financials", "support_tickets", "branding_partners", "hero", "video", "video_banner", "mobile_banners", "site_branding", "memories", "copyright", "meeting_settings", "admin_management", "ad_popups", "meetings", "checkout_footer", "careers_management", "careers_banner", "contact_inquiries", "contact_settings", "scanner_monitor", "fraud_dashboard", "flash_deals", "audit_logs", "settlement_verification", "email_logs", "kyc", "digilocker_kyc_review", "cancellations", "admin_events_mgmt", "organizer_reports", "user_analytics", "professional_services_mgmt", "admin_onboarding", "admin_revenue_dashboard", "social_media_settings", "rewards_vouchers"].includes(activeTab)) ? null : (
                        <div style={{ backgroundColor: t.cardBg, padding: "60px 24px", textAlign: "center", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain }}>{activeTab.replace(/_/g, ' ').toUpperCase()}</h2>
                            <p style={{ color: t.textSub, marginTop: "8px", maxWidth: "350px", margin: "8px auto", fontSize: "14px" }}>This management module is currently being configured. You will be able to manage these settings shortly.</p>
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

                    {isEditModalOpen && editingOrg && (
                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                            <div style={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "24px", fontWeight: 900, margin: 0, color: t.textMain }}>Edit Organiser Profile</h3>
                                        <p style={{ fontSize: "13px", color: t.textSub, marginTop: "4px" }}>Modify account details and specific fee structures</p>
                                    </div>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={20} /></button>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</label>
                                            <input
                                                type="text"
                                                value={editingOrg.username}
                                                onChange={(e) => setEditingOrg({ ...editingOrg, username: e.target.value })}
                                                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "14px", fontWeight: 500 }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email / User ID</label>
                                            <input
                                                type="email"
                                                value={editingOrg.email}
                                                disabled
                                                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#f8fafc' : '#0f172a', color: t.textSub, cursor: "not-allowed", fontSize: "14px" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Wallet Balance (₹)</label>
                                            <input
                                                type="number"
                                                value={parseFloat(String(editingOrg.balance).replace(/[^\d.-]/g, ''))}
                                                onChange={(e) => setEditingOrg({ ...editingOrg, balance: `₹${e.target.value}` })}
                                                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "14px", fontWeight: 500 }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</label>
                                            <select
                                                value={editingOrg.status}
                                                onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value })}
                                                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "14px", fontWeight: 500 }}
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

                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', border: `1px solid ${t.border}` }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#3b82f615", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><CreditCard size={16} /></div>
                                                <span style={{ fontWeight: 700, color: t.textMain }}>Financial Terms Overrides</span>
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "6px" }}>PLATFORM FEE (%)</label>
                                                        <input 
                                                            type="number"
                                                            value={editingOrg.platform_fee_percent}
                                                            onChange={e => setEditingOrg({ ...editingOrg, platform_fee_percent: parseFloat(e.target.value) })}
                                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", fontWeight: 700 }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "6px" }}>PAYOUT FLAT (₹)</label>
                                                        <input 
                                                            type="number"
                                                            value={editingOrg.payout_fee_flat}
                                                            onChange={e => setEditingOrg({ ...editingOrg, payout_fee_flat: parseFloat(e.target.value) })}
                                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, fontSize: "14px", fontWeight: 700 }}
                                                        />
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: "10px", color: t.textSub, margin: 0, fontStyle: "italic" }}>System defaults are 7% and ₹10 respectively. Changes here will override global fiscal rules for this partner.</p>
                                            </div>
                                            
                                            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "6px" }}>FEE VALUE</label>
                                                    <input 
                                                        type="number"
                                                        value={editingOrg.fee_config?.fee_value || 0}
                                                        onChange={e => setEditingOrg({ ...editingOrg, fee_config: { ...editingOrg.fee_config, fee_value: Number(e.target.value) } })}
                                                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                                    />
                                                </div>

                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <input 
                                                            type="checkbox" 
                                                            id="apply_gst_org"
                                                            checked={editingOrg.fee_config?.apply_gst || false}
                                                            onChange={e => setEditingOrg({ ...editingOrg, fee_config: { ...editingOrg.fee_config, apply_gst: e.target.checked } })}
                                                        />
                                                        <label htmlFor="apply_gst_org" style={{ fontSize: "12px", fontWeight: 600, color: t.textMain, cursor: "pointer" }}>Apply GST</label>
                                                    </div>
                                                    {editingOrg.fee_config?.apply_gst && (
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "6px" }}>GST (%)</label>
                                                            <input 
                                                                type="number"
                                                                value={editingOrg.fee_config?.gst_percent || 18}
                                                                onChange={e => setEditingOrg({ ...editingOrg, fee_config: { ...editingOrg.fee_config, gst_percent: Number(e.target.value) } })}
                                                                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {editingOrg.fee_config?.apply_gst && (
                                                    <div>
                                                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "6px" }}>APPLY GST ON</label>
                                                        <select 
                                                            value={editingOrg.fee_config?.gst_apply_on || 'fee_only'}
                                                            onChange={e => setEditingOrg({ ...editingOrg, fee_config: { ...editingOrg.fee_config, gst_apply_on: e.target.value } })}
                                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px" }}
                                                        >
                                                            <option value="fee_only">Platform Fee Only</option>
                                                            <option value="ticket_only">Ticket Price Only</option>
                                                            <option value="both">Both (Fee + Ticket)</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "16px", marginTop: "40px", paddingTop: "24px", borderTop: `1px solid ${t.border}` }}>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontWeight: 700, cursor: "pointer", fontSize: "16px" }}>Cancel</button>
                                    <button
                                        onClick={async () => {
                                            const balance = parseFloat(String(editingOrg.balance).replace(/[^\d.-]/g, ''));
                                            await approveOrganiserRequest({
                                                id: editingOrg.id,
                                                business_name: editingOrg.username,
                                                wallet_balance: isNaN(balance) ? 0 : balance,
                                                kyc_status: editingOrg.status,
                                                platform_fee_percent: editingOrg.platform_fee_percent,
                                                payout_fee_flat: editingOrg.payout_fee_flat
                                            });
                                            setIsEditModalOpen(false);
                                            showToast("Organiser profile updated!", "success");
                                        }}
                                        style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "16px", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}



                    {isEditVendorModalOpen && editingVendor && (
                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                            <div style={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "500px", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "24px", fontWeight: 900, margin: 0, color: t.textMain }}>Edit Service Provider</h3>
                                        <p style={{ fontSize: "13px", color: t.textSub, marginTop: "4px" }}>Modify business identity and service category</p>
                                    </div>
                                    <button onClick={() => setIsEditVendorModalOpen(false)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={20} /></button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Business Name</label>
                                        <input
                                            type="text"
                                            value={editingVendor.business_name || ""}
                                            onChange={(e) => setEditingVendor({ ...editingVendor, business_name: e.target.value })}
                                            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "14px", fontWeight: 500 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Service Category</label>
                                        <select
                                            value={editingVendor.category || ""}
                                            onChange={(e) => setEditingVendor({ ...editingVendor, category: e.target.value })}
                                            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "14px", fontWeight: 500 }}
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Mehendi Artist">Mehendi Artist</option>
                                            <option value="Photographer/Studio">Photographer/Studio</option>
                                            <option value="Makeup Artist">Makeup Artist</option>
                                            <option value="Personal Service">Personal Service</option>
                                            <option value="Artist">Artist</option>
                                            <option value="Turf Partner">Turf Partner</option>
                                        </select>
                                    </div>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                                        <button onClick={() => setIsEditVendorModalOpen(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                        <button
                                            onClick={async () => {
                                                await updateVendorMutation({
                                                    id: editingVendor.id,
                                                    business_name: editingVendor.business_name,
                                                    category: editingVendor.category
                                                });
                                                setIsEditVendorModalOpen(false);
                                                showToast("Service provider updated!", "success");
                                                if (refreshServiceProviders) refreshServiceProviders();
                                            }}
                                            style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isPasswordResetModalOpen && selectedUserForPassword && (
                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                            <div style={{ backgroundColor: theme === 'light' ? '#fff' : '#0f172a', padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "450px", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "20px", fontWeight: 900, margin: 0, color: t.textMain }}>Password Settings</h3>
                                        <p style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Manage access for {selectedUserForPassword.business_name || selectedUserForPassword.name}</p>
                                    </div>
                                    <button onClick={() => setIsPasswordResetModalOpen(false)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={20} /></button>
                                </div>
                                
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', border: `1px solid ${t.border}` }}>
                                        <h4 style={{ fontSize: "13px", fontWeight: 800, color: t.textMain, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Mail size={16} /> Send Reset Link</h4>
                                        <p style={{ fontSize: "11px", color: t.textSub, marginBottom: "16px" }}>Sends a secure recovery link to <strong>{selectedUserForPassword.profiles?.email || selectedUserForPassword.email}</strong> via Microsoft 365.</p>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const { data: { session } } = await supabase.auth.getSession();
                                                    const res = await fetch('/api/admin/action', {
                                                        method: 'POST',
                                                        headers: { 
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${session?.access_token || ""}`
                                                        },
                                                        body: JSON.stringify({ action: 'send-reset-link', data: { email: selectedUserForPassword.profiles?.email || selectedUserForPassword.email } })
                                                    });
                                                    if (!res.ok) {
                                                        const p = await res.json().catch(() => ({}));
                                                        throw new Error(p.error || "Failed to send link");
                                                    }
                                                    showToast("Reset link sent successfully!", "success");
                                                } catch (err) {
                                                    showToast(err.message, "error");
                                                }
                                            }}
                                            style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#4f46e5", color: "white", fontWeight: 700, border: "none", cursor: "pointer" }}
                                        >
                                            Send Recovery Email
                                        </button>
                                    </div>

                                    <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#fff' : '#0f172a', border: `1px solid ${t.border}` }}>
                                        <h4 style={{ fontSize: "13px", fontWeight: 800, color: t.textMain, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Lock size={16} /> Manual Override</h4>
                                        <p style={{ fontSize: "11px", color: t.textSub, marginBottom: "12px" }}>Directly set a new password. The user will be forced to change it on next login.</p>
                                        <input 
                                            type="text" 
                                            placeholder="Enter new password"
                                            value={newManualPassword}
                                            onChange={(e) => setNewManualPassword(e.target.value)}
                                            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", marginBottom: "12px" }}
                                        />
                                        <button 
                                            disabled={!newManualPassword}
                                            onClick={async () => {
                                                try {
                                                    const { data: { session } } = await supabase.auth.getSession();
                                                    const res = await fetch('/api/admin/action', {
                                                        method: 'POST',
                                                        headers: { 
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${session?.access_token || ""}`
                                                        },
                                                        body: JSON.stringify({ action: 'reset-password-manual', data: { userId: selectedUserForPassword.id, newPassword: newManualPassword } })
                                                    });
                                                    if (!res.ok) {
                                                        const p = await res.json().catch(() => ({}));
                                                        throw new Error(p.error || "Failed to reset password");
                                                    }
                                                    showToast("Password updated successfully!", "success");
                                                    setNewManualPassword("");
                                                    setIsPasswordResetModalOpen(false);
                                                } catch (err) {
                                                    showToast(err.message, "error");
                                                }
                                            }}
                                            style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#10b981", color: "white", fontWeight: 700, border: "none", cursor: "pointer", opacity: newManualPassword ? 1 : 0.5 }}
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "mobile_banners" && <MobileBannersAdmin theme={theme} t={t} />}

                    {activeTab === "bulk_discounts" && (
                        <BulkDiscountsAdmin />
                    )}


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
            {/* Financial Ledger Modal */}
            {showLedgerModal && selectedLedgerOrg && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[120] flex items-center justify-center p-6">
                    <div className="premium-glass max-w-4xl w-full rounded-[48px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-pink-500 rounded-[24px] flex items-center justify-center shadow-2xl shadow-pink-500/20">
                                    <BarChart3 size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">{selectedLedgerOrg.username}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Financial Intelligence Ledger</p>
                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                        <p className="text-pink-400 text-[10px] font-black uppercase tracking-widest">Live Sync Active</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowLedgerModal(false)}
                                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-white/80">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                <div className="p-6 bg-slate-900 rounded-[32px] text-white">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Available Balance</p>
                                    <p className="text-3xl font-black tracking-tighter italic">₹{selectedLedgerOrg.balance || '0.00'}</p>
                                </div>
                                <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total Inflow</p>
                                    <p className="text-3xl font-black tracking-tighter italic text-emerald-600">₹0.00</p>
                                </div>
                                <div className="p-6 bg-pink-50 rounded-[32px] border border-pink-100">
                                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2">Total Payouts</p>
                                    <p className="text-3xl font-black tracking-tighter italic text-pink-600">₹0.00</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Transaction Audit Trail</h3>
                                <div className="space-y-3">
                                    <div className="p-12 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Activity size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">No recent transactions detected for this partner node.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Shield size={16} className="text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted Financial Data</p>
                            </div>
                            <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-slate-900/10">
                                Export Full Ledger
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Inline Event Edit Modal */}
            {showEditEventModal && eventEditForm && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-6">
                    <div className="premium-glass max-w-xl w-full rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center">
                                    <Edit size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">Event Intelligence</h2>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Metadata Modification Node</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEditEventModal(false)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Title</label>
                                <input 
                                    type="text" 
                                    value={eventEditForm.title}
                                    onChange={(e) => setEventEditForm({ ...eventEditForm, title: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-bold"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</label>
                                    <input 
                                        type="date" 
                                        value={eventEditForm.date}
                                        onChange={(e) => setEventEditForm({ ...eventEditForm, date: e.target.value })}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                    <select 
                                        value={eventEditForm.category}
                                        onChange={(e) => setEventEditForm({ ...eventEditForm, category: e.target.value })}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-bold"
                                    >
                                        <option value="Concert">Concert</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Marathon">Marathon</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue / Location</label>
                                <input 
                                    type="text" 
                                    value={eventEditForm.venue || eventEditForm.location || ""}
                                    onChange={(e) => setEventEditForm({ ...eventEditForm, venue: e.target.value, location: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-bold"
                                />
                            </div>

                            <button 
                                onClick={async () => {
                                    await updateEvent(eventEditForm);
                                    showToast("Event intelligence updated successfully!", "success");
                                    setShowEditEventModal(false);
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                            >
                                Commit Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
