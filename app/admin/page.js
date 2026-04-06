/* eslint-disable */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import AdminCheckoutFooter from "@/app/admin/components/AdminCheckoutFooter";
import MobileBannersAdmin from "@/app/admin/components/MobileBannersAdmin";
import { MoreVertical, Briefcase, LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles, CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2, Mail, Lock, CreditCard, Code, Globe, Shield, FileText, Megaphone, Tag, LayoutGrid, Calendar, ShoppingCart, UserCircle, Gift, Send, BarChart3, Archive, MessageCircle, Upload, Edit, Search, AlertCircle, ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { HOME_EVENTS, HERO_BANNER_SLIDES } from "@/app/data/homeEvents";
import { eventMatchesCategory } from "@/app/utils/categoryMatch";
import { hashPassword } from "@/app/utils/hashPassword";

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

const useConvexConfig = (key, initialValue, allConfig) => {
    const setConfigMutation = useMutation(api.systemConfig.setConfig);

    // `getAllConfig` returns an object map: { [key]: value }
    const rawValue = allConfig && typeof allConfig === "object" ? allConfig[key] : undefined;

    let currentValue = initialValue;
    if (rawValue !== undefined) {
        try {
            // Values are stored as JSON via `setConfig`, but fall back gracefully
            currentValue = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
        } catch (e) {
            console.error(`Error parsing config for ${key}`, e);
            currentValue = rawValue;
        }
    }

    const setValue = (newValue) => {
        const valueToSave = typeof newValue === "function" ? newValue(currentValue) : newValue;
        setConfigMutation({ key, value: JSON.stringify(valueToSave) });
    };

    return [currentValue, setValue];
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
    return (
        <ErrorBoundary>
            <AdminHomePage />
        </ErrorBoundary>
    );
}

const AdminMeetingsTable = ({ t, router }) => {
    const meetings = useQuery(api.meetings.listAll);
    const deleteMeeting = useMutation(api.meetings.deleteMeeting);

    if (meetings === undefined) return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading meetings...</div>;
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
                    <tr key={meeting._id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#3b82f620", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                                    <Video size={20} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: "14px", color: t.textMain }}>{meeting.title}</p>
                                    <p style={{ fontSize: "12px", color: t.textSub, margin: "2px 0 0" }}>ID: {meeting.meetingLink}</p>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: t.textMain }}>{meeting.creatorId}</div>
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
                            <div style={{ fontSize: "12px", color: t.textSub }}>{new Date(meeting.createdAt).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button 
                                    onClick={() => {
                                        const url = meeting.meetingLink && meeting.meetingLink.startsWith("http") ? meeting.meetingLink : `/${meeting.meetingLink}`;
                                        window.open(url, '_blank');
                                    }}
                                    style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: "#3b82f6", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Join
                                </button>
                                <button 
                                    onClick={() => { if(confirm("Delete this meeting?")) deleteMeeting({ meetingId: meeting._id }); }}
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

function AdminHomePage() {
    const { user, loading, logout } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== "admin")) {
            router.push("/signin?redirect=/admin");
        }
    }, [user, loading, router]);

    const handleLogout = () => {
        router.push("/signin");
        setTimeout(() => logout(), 100);
    };
    const [activeTab, setActiveTab] = useState("dashboard");
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const dropdownRef = React.useRef(null);

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
    const [isOrganizersOpen, setIsOrganizersOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedRequestForApproval, setSelectedRequestForApproval] = useState(null);
    const [generatedTempPassword, setGeneratedTempPassword] = useState("");
    const [manualApprovalPassword, setManualApprovalPassword] = useState("");
    const [isHomeSettingsOpen, setIsHomeSettingsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGrowthOpen, setIsGrowthOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [openRequestActionId, setOpenRequestActionId] = useState(null);
    // Payment gateways: which config modal is open + saved configs per gateway
    const [paymentGatewayConfig, setPaymentGatewayConfig] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [categories, setCategories] = useState([]);
    const [eventPartners, setEventPartners] = useState([]);
    const allConfig = useQuery(api.systemConfig.getAllConfig);

    const rawPaymentGateways = useQuery(api.paymentGateways.list);
    const convexPaymentGateways = rawPaymentGateways || [];
    const addPaymentGatewayMutation = useMutation(api.paymentGateways.add);
    const patchPaymentGatewayMutation = useMutation(api.paymentGateways.patch);
    const removePaymentGatewayMutation = useMutation(api.paymentGateways.remove);

    // Seed default gateways if empty
    useEffect(() => {
        if (rawPaymentGateways !== undefined && rawPaymentGateways.length === 0 && allConfig !== undefined) {
            const defaults = [
                { name: "Stripe", isEnabled: true, config: { apiKey: "", secretKey: "", webhookSecret: "", mode: "test" }, testMode: true },
                { name: "PayPal", isEnabled: false, config: { apiKey: "", secretKey: "", mode: "test" }, testMode: true },
                { name: "Razorpay", isEnabled: false, config: { apiKey: "", secretKey: "", mode: "test" }, testMode: true },
                { name: "PayU", isEnabled: false, config: { apiKey: "", secretKey: "", mode: "test" }, testMode: true },
                { name: "PhonePe", isEnabled: false, config: { apiKey: "", secretKey: "", mode: "test" }, testMode: true },
                { name: "Paytm", isEnabled: false, config: { apiKey: "", secretKey: "", mode: "test" }, testMode: true }
            ];
            defaults.forEach(d => addPaymentGatewayMutation(d));
        }
    }, [convexPaymentGateways, addPaymentGatewayMutation, allConfig]);

    // Fee Settings
    const convexFeeSettings = useQuery(api.feeSettings.get);
    const updateFeeSettingsMutation = useMutation(api.feeSettings.update);

    const feeSettings = useMemo(() => convexFeeSettings || {
        convenienceFeeType: "percent",
        convenienceFeeValue: 5,
        gstPercent: 18
    }, [convexFeeSettings]);

    // New Convex settings
    const convexTicketSettings = useQuery(api.ticketSettings.get);
    const updateTicketSettingsMutation = useMutation(api.ticketSettings.update);

    const convexEmailSettings = useQuery(api.emailSettings.get);
    const updateEmailSettingsMutation = useMutation(api.emailSettings.update);

    const convexSeoSettings = useQuery(api.seoSettings.get);
    const updateSeoSettingsMutation = useMutation(api.seoSettings.update);

    const rawEmailTemplates = useQuery(api.emailTemplates.list);
    const convexEmailTemplates = rawEmailTemplates || [];
    const addEmailTemplateMutation = useMutation(api.emailTemplates.add);
    const patchEmailTemplateMutation = useMutation(api.emailTemplates.patch);
    const removeEmailTemplateMutation = useMutation(api.emailTemplates.remove);

    const convexPolicies = useQuery(api.policies.get);
    const updatePoliciesMutation = useMutation(api.policies.update);

    const convexSsoSettings = useQuery(api.ssoSettings.get);
    const updateSsoSettingsMutation = useMutation(api.ssoSettings.update);

    const sendEmailAction = useAction(api.emailActions.sendEmail);

    const convexCategories = useQuery(api.homeSettings.getCategories) || [];

    // Pages management
    const convexPages = useQuery(api.pages.list) || [];
    const createPageMutation = useMutation(api.pages.create);
    const updatePageMutation = useMutation(api.pages.update);
    const deletePageMutation = useMutation(api.pages.remove);

    // Recent Memories management
    const memories = useQuery(api.memories.getMemories) || [];
    const createMemoryMutation = useMutation(api.memories.createMemory);
    const deleteMemoryMutation = useMutation(api.memories.deleteMemory);
    const [memoryForm, setMemoryForm] = useState({ imageUrl: "", altText: "" });
    const [isUploading, setIsUploading] = useState(false);

    // Banner Ads management
    const bannerRequests = useQuery(api.banners.getPendingRequests) || [];
    const allBanners = useQuery(api.banners.getAllBanners) || [];
    const approveBannerMutation = useMutation(api.banners.approveBanner);
    const deleteBannerMutation = useMutation(api.banners.deleteBanner);
    const [approvingBanner, setApprovingBanner] = useState(null);
    const [bannerImage, setBannerImage] = useState("");

    const handleUploadMemory = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/memories/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setMemoryForm({ ...memoryForm, imageUrl: data.imageUrl });
            } else {
                alert("Upload failed: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Upload error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveMemory = async () => {
        if (!memoryForm.imageUrl || !memoryForm.altText) {
            alert("Please provide both an image and alt text.");
            return;
        }
        await createMemoryMutation({
            imageUrl: memoryForm.imageUrl,
            altText: memoryForm.altText,
        });
        setMemoryForm({ imageUrl: "", altText: "" });
    };

    const handleDeleteMemory = async (id) => {
        console.log("Attempting to delete memory with ID:", id);
        if (confirm("Are you sure you want to delete this memory?")) {
            try {
                await deleteMemoryMutation({ id });
                console.log("Memory deleted successfully");
            } catch (err) {
                console.error("Error deleting memory:", err);
                alert("Failed to delete memory. Check console for details.");
            }
        }
    };

    // Seed defaults for new tables
    useEffect(() => {
        if (allConfig === undefined) return;

        if (allConfig["admin_video_banner"] === undefined) {
            setConfigMutation({
                key: "admin_video_banner", value: JSON.stringify({
                    videoUrl: "/bookmyticket/videoplayback.mp4",
                    title1: "Discover Your Next",
                    title2: "Unforgettable Experience",
                    subtitle: "Explore concerts, shows, nightlife, and exclusive experiences happening around you.",
                    categories: ["Concert", "Sports", "Musics", "Live Shows", "Comedy Show"]
                })
            });
        }

        if (allConfig["admin_footer_copyright"] === undefined) {
            setConfigMutation({
                key: "admin_footer_copyright", value: JSON.stringify({
                    copyrightText: "© Copyright 2026 – Nexvant Technologies. All Rights Reserved.",
                    privacyUrl: "#",
                    termsUrl: "#"
                })
            });
        }

        if (convexTicketSettings === null) {
            updateTicketSettingsMutation({
                companyName: "book my ticket",
                logoUrl: "",
                importantInfo: "We are book my ticket and we are dedicated to selling tickets for the best events. book my ticket is not the event organizer and is not responsible for event conditions, safety, rescheduling, or cancellations. Present this ticket (printed or on your phone) with a valid ID at the venue. Do not share this ticket with others. For support, visit our website.",
                supportUrl: "https://www.bookmyticket.net",
                sendViaEmail: true,
                sendViaSms: true,
                sendPdfWhatsApp: true,
                autoApprove: true,
                notifyOrganiser: true,
                notifyUser: true,
                invoicePrefix: "BMT-"
            });
        }

        if (convexEmailSettings === null) {
            updateEmailSettingsMutation({
                host: "smtp.mailtrap.io",
                port: 2525,
                user: "api",
                pass: "",
                from: "noreply@bookmyticket.net",
                fromName: "Ticketing Tool",
                encryption: "None",
                authMethod: "Basic Authentication"
            });
        }

        if (convexSeoSettings === null) {
            updateSeoSettingsMutation({
                globalTitle: "BookMyTicket - Best Event Ticketing Platform",
                globalKeywords: "tickets, events, concerts, sports, theater",
                globalDescription: "Book tickets for your favorite events, concerts, movies and more.",
                metaAdsCode: "<!-- Meta Ad Pixel Code -->\n<script>!function(f,b,e,v,n,t,s)...</script>"
            });
        }

        if (convexPolicies === null) {
            updatePoliciesMutation({
                bookingHeader: "Disclaimer: All ticket bookings are final. Please review event details, date, and venue carefully before payment.",
                paymentTerms: "By proceeding with the payment, you agree to our Terms of Service and Privacy Policy. Platform fees and taxes are non-refundable.",
                eventDisclaimer: "Organizers are solely responsible for event content, performance, and management. BookMyTicket is only a ticketing platform.",
                cancellationPolicy: "Refunds are subject to individual event organizer policies. If an event is cancelled, refunds will be processed within 7-10 business days."
            });
        }

        if (convexSsoSettings === null) {
            updateSsoSettingsMutation({
                facebookEnabled: false,
                googleEnabled: false,
                facebookConfig: {},
                googleConfig: {}
            });
        }

        if (rawEmailTemplates !== undefined && rawEmailTemplates.length === 0) {
            const defaults = [
                { identifier: "booking", name: "Ticket Booking Confirmation", subject: "Your Tickets for {{event_name}}", body: "Hello {{user_name}},\n\nYour tickets for {{event_name}} are confirmed.\n\nDate: {{event_date}}\nVenue: {{event_venue}}\n\nDownload your ticket here: {{ticket_url}}\n\nThank you for booking with us!", autoSend: true },
                { identifier: "canceled", name: "Ticket Booking Canceled", subject: "Booking Canceled: {{event_name}}", body: "Hello {{user_name}},\n\nYour booking for {{event_name}} has been canceled.\n\nRefund details: {{refund_info}}\n\nWe hope to see you again soon.", autoSend: true },
                { identifier: "registration", name: "User Registration", subject: "Welcome to BookMyTicket!", body: "Welcome to BookMyTicket!\n\nYour account has been successfully created.\n\nStart exploring events here: {{site_url}}", autoSend: true },
                { identifier: "organiser_welcome", name: "New Organiser Welcome & Credentials", subject: "Your Organiser Account is Ready!", body: "Congratulations!\n\nYour organiser account is ready.\n\nLogin: {{login_url}}\nUsername: {{email}}\nPassword: {{password}}", autoSend: true },
                { identifier: "otp", name: "OTP Verification", subject: "{{otp}} is your verification code", body: "Your verification code is: {{otp}}\n\nDo not share this code with anyone.", autoSend: true },
            ];
            defaults.forEach(d => addEmailTemplateMutation(d));
        }

        if (convexPages !== undefined && convexPages.length === 0) {
            const defaults = [
                { title: "About Us", slug: "about-us", content: "<h1>About Us</h1><p>Welcome to BookMyTicket. We are committed to creating a platform where business leaders, innovators, and professionals can come together to exchange ideas and experience unforgettable events.</p>", showInFooter: true, order: 0 },
                { title: "Privacy Policy", slug: "privacy-policy", content: "<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we handle your personal data.</p>", showInFooter: true, order: 1 },
                { title: "Terms of Service", slug: "terms-of-service", content: "<h1>Terms of Service</h1><p>By using our service, you agree to these terms.</p>", showInFooter: true, order: 2 },
                { title: "Event Listing", slug: "event-listing", content: "<h1>Event Listing</h1><p>Check out our latest event listings.</p>", showInFooter: true, order: 3 },
                { title: "Pricing Plan", slug: "pricing-plan", content: "<h1>Pricing Plan</h1><p>View our event pricing plans.</p>", showInFooter: true, order: 4 },
                { title: "Contact Us", slug: "contact-us", content: "<h1>Contact Us</h1><p>Get in touch with us at hello@bookmyticket.net</p>", showInFooter: true, order: 5 },
            ];
            defaults.forEach(d => createPageMutation(d));
        }

        if (allConfig["internal_meeting_portal_enabled"] === undefined) {
            setConfigMutation({ key: "internal_meeting_portal_enabled", value: JSON.stringify(true) });
        }
    }, [allConfig, convexTicketSettings, convexEmailSettings, convexSeoSettings, convexPolicies, convexSsoSettings, convexEmailTemplates, convexPages, updateTicketSettingsMutation, updateEmailSettingsMutation, updateSeoSettingsMutation, updatePoliciesMutation, updateSsoSettingsMutation, addEmailTemplateMutation, createPageMutation]);

    // Fallback settings for stable UI
    const ticketSettings = useMemo(() => convexTicketSettings || {
        companyName: "book my ticket",
        logoUrl: "",
        importantInfo: "",
        supportUrl: "",
        sendViaEmail: true,
        sendViaSms: true,
        sendPdfWhatsApp: true,
        autoApprove: true,
        notifyOrganiser: true,
        notifyUser: true,
        invoicePrefix: "BMT-"
    }, [convexTicketSettings]);

    const emailSettings = useMemo(() => convexEmailSettings || {
        host: "smtp.mailtrap.io",
        port: 2525,
        user: "api",
        pass: "",
        from: "noreply@bookmyticket.com",
        fromName: "Ticketing Tool",
        encryption: "None",
        authMethod: "Basic Authentication"
    }, [convexEmailSettings]);

    // Site Branding
    const convexSiteBranding = useQuery(api.siteBranding.get);
    const updateSiteBrandingMutation = useMutation(api.siteBranding.update);

    const siteBranding = useMemo(() => convexSiteBranding || {
        name: "book my ticket",
        logoColor: "#111111",
        logoUrl: "/logo.png"
    }, [convexSiteBranding]);

    const [localBranding, setLocalBranding] = useState({ name: "book my ticket", logoColor: "#111111", logoUrl: "/logo.png" });

    useEffect(() => {
        if (convexSiteBranding) {
            setLocalBranding(convexSiteBranding);
        }
    }, [convexSiteBranding]);

    const metaSettings = useMemo(() => ({
        global: {
            title: convexSeoSettings?.globalTitle || "BookMyTicket - Best Event Ticketing Platform",
            keywords: convexSeoSettings?.globalKeywords || "tickets, events, concerts, sports, theater",
            description: convexSeoSettings?.globalDescription || "Book tickets for your favorite events, concerts, movies and more.",
            metaAdsCode: convexSeoSettings?.metaAdsCode || ""
        }
    }), [convexSeoSettings]);

    const disclaimerContent = useMemo(() => ({
        booking_header: convexPolicies?.bookingHeader || "",
        payment_terms: convexPolicies?.paymentTerms || "",
        event_disclaimer: convexPolicies?.eventDisclaimer || "",
        cancellation_policy: convexPolicies?.cancellationPolicy || ""
    }), [convexPolicies]);

    const ssoConfigs = useMemo(() => ({
        facebook: !!convexSsoSettings?.facebookEnabled,
        google: !!convexSsoSettings?.googleEnabled
    }), [convexSsoSettings]);

    const emailTemplates = convexEmailTemplates;

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
                await createPageMutation({ ...pageForm, order: convexPages.length });
            } else if (pageModal === "edit" && pageForm._id) {
                await updatePageMutation({
                    id: pageForm._id,
                    title: pageForm.title,
                    slug: pageForm.slug,
                    content: pageForm.content,
                    showInFooter: pageForm.showInFooter,
                });
            }
            setPageModal(null);
            setPageForm({ title: "", slug: "", content: "", showInFooter: true, order: 0 });
        } catch (e) {
            alert("Error saving page: " + e.message);
        }
    };

    const handleDeletePage = async (id) => {
        try {
            await deletePageMutation({ id });
            setPageToDelete(null);
        } catch(e) {
            alert("Error deleting page: " + e.message);
        }
    };

    const [videoBannerConfig, setVideoBannerConfig] = useConvexConfig("admin_video_banner", {
        videoUrl: "/bookmyticket/videoplayback.mp4",
        title1: "Discover Your Next",
        title2: "Unforgettable Experience",
        subtitle: "Explore concerts, shows, nightlife, and exclusive experiences happening around you.",
        categories: ["Concert", "Sports", "Musics", "Live Shows", "Comedy Show"]
    }, allConfig);

    const [footerCopyrightConfig, setFooterCopyrightConfig] = useConvexConfig("admin_footer_copyright", {
        copyrightText: "© Copyright 2026 – Nexvant Technologies. All Rights Reserved.",
        privacyUrl: "#",
        termsUrl: "#"
    }, allConfig);
    
    const [internalMeetingEnabled, setInternalMeetingEnabled] = useConvexConfig("internal_meeting_portal_enabled", true, allConfig);

    // Bookings (ticket orders) — sync with homepage/organiser events
    const [bookings, setBookings] = useState([]);
    // Customers — loaded directly from Convex users table (see convexUsers below)
    // Promotions: coupon codes & BOGO — backed by Convex promotions table
    const convexPromotions = useQuery(api.promotions.list) || [];
    const createPromotionMutation = useMutation(api.promotions.create);
    const removePromotionMutation = useMutation(api.promotions.remove);
    const [newPromo, setNewPromo] = useState({ code: "", type: "percent", value: "", validUntil: "", bogo: false });

    const handleCreatePromotion = async () => {
        if (!newPromo.code) return;
        await createPromotionMutation({
            code: newPromo.code,
            type: newPromo.type,
            value: newPromo.value || "10",
            bogo: newPromo.bogo,
            validUntil: newPromo.validUntil || "2026-12-31",
            usage: 0,
            active: true,
        });
        setNewPromo({ code: "", type: "percent", value: "", validUntil: "", bogo: false });
    };

    // Archive: hide events from main list
    const [archivedHomeIds, setArchivedHomeIds] = useConvexConfig("admin_archived_home_ids", [], allConfig);
    // Event-specific meta
    const [eventMetaOverrides, setEventMetaOverrides] = useConvexConfig("admin_event_meta_overrides", {}, allConfig);

    const [organizers, setOrganizers] = useState([]);
    const convexOrganizers = useQuery(api.organisers.list) || [];
    const createOrganizerMutation = useMutation(api.organisers.create);
    const patchOrganizerMutation = useMutation(api.organisers.patch);
    const removeOrganizerMutation = useMutation(api.organisers.remove);
    const [selectedKycOrg, setSelectedKycOrg] = useState(null);
    const isProfService = (cat) => {
        const c = String(cat || "").trim().toLowerCase();
        const serviceKeywords = ["mehandi", "mehendi", "photograph", "makeup", "artist", "personal service", "studio", "decorator", "catering"];
        return serviceKeywords.some(keyword => c.includes(keyword));
    };

    const mappedOrganizers = useMemo(() => {
        return convexOrganizers
            .filter(o => {
                const cat = o.category || o.kycDetails?.category;
                return !isProfService(cat);
            })
            .map(o => ({
                id: o._id,
                username: o.name,
                email: o.userId,
                status: o.kycStatus || "Active",
                category: o.category || o.kycDetails?.category || "Event Organiser",
                balance: `₹${o.walletBalance || 0}`,
                kycDetails: o.kycDetails
            }));
    }, [convexOrganizers]);

    // Redundant serviceKyc memos removed as per simplified workflow.


    const organiserKycVerified = useMemo(() => {
        return convexOrganizers.filter(o => {
            const cat = o.category || o.kycDetails?.category;
            return !isProfService(cat) && o.kycStatus === "Submitted";
        });
    }, [convexOrganizers]);



    const convexOrganiserRequests = useQuery(api.organiserRequests.list) || [];
    const updateOrganiserRequestStatusMutation = useMutation(api.organiserRequests.updateStatus);
    const approveOrganiserRequestMutation = useMutation(api.organisers.approveRequest);

    const serviceRequests = useMemo(() => {
        return convexOrganiserRequests.filter(req => 
            isProfService(req.category) && req.status === "Pending"
        );
    }, [convexOrganiserRequests]);

    const serviceActive = useMemo(() => {
        return convexOrganizers.filter(o => 
            isProfService(o.category || o.kycDetails?.category) && 
            o.kycStatus !== "Banned"
        );
    }, [convexOrganizers]);

    const serviceBanned = useMemo(() => {
        return convexOrganizers.filter(o => 
            isProfService(o.category || o.kycDetails?.category) && 
            o.kycStatus === "Banned"
        );
    }, [convexOrganizers]);

    const [events, setEvents] = useState([]);

    // Home Settings
    const convexHomeSections = useQuery(api.homeSettings.getHomeSections);
    const updateHomeSectionsMutation = useMutation(api.homeSettings.updateHomeSections);
    const homeSectionsOrder = useMemo(() => convexHomeSections?.order || [
        "Hero Banner", "Sub Navigation", "Featured Events", "Coming Soon", "Spotlight", "Top Hand-picked"
    ], [convexHomeSections]);

    const convexBannerSlides = useQuery(api.homeSettings.getBannerSlides) || [];
    const addBannerSlideMutation = useMutation(api.homeSettings.addBannerSlide);
    const updateBannerSlideMutation = useMutation(api.homeSettings.updateBannerSlide);
    const removeBannerSlideMutation = useMutation(api.homeSettings.removeBannerSlide);
    const slides = useMemo(() => convexBannerSlides.length > 0 ? convexBannerSlides : HERO_BANNER_SLIDES.map((s, i) => ({ id: s.id ?? i + 1, img: s.img || "", title: s.title || "", sub: s.sub || "", alt: s.title || `Slide ${i + 1}`, url: s.link || "" })), [convexBannerSlides]);

    const convexEventPartners = useQuery(api.homeSettings.getEventPartners) || [];
    const addEventPartnerMutation = useMutation(api.homeSettings.addEventPartner);
    const removeEventPartnerMutation = useMutation(api.homeSettings.removeEventPartner);
    const [categoryModal, setCategoryModal] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", icon: "📁" });
    const [supportTickets, setSupportTickets] = useState([]);
    const convexSupportTickets = useQuery(api.supportTickets.list) || [];
    const updateTicketMutation = useMutation(api.supportTickets.updateStatus);
    const removeTicketMutation = useMutation(api.supportTickets.remove);

    const mappedSupportTickets = useMemo(() => {
        return convexSupportTickets.map(t => ({
            id: t._id,
            subject: t.issue.split('\n')[0],
            status: t.status,
            createdAt: t._creationTime,
            adminNotes: t.adminNotes || "",
            updatedAt: t.updatedAt,
            organiserName: t.userId,
        }));
    }, [convexSupportTickets]);


    // Combined events: homepage + organiser (Admin + Home integration); exclude archived
    const allEvents = useMemo(() => {
        const organiserList = (Array.isArray(events) ? events : []).filter(e => !e.archived);
        const homeList = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).filter(e => !archivedHomeIds.includes(e.id));
        return [
            ...homeList.map(e => ({ ...e, source: "home" })),
            ...organiserList.map((e, index) => ({
                ...e,
                id: e.id || e._id || `temp-${index}`,
                title: e.title || "Event",
                category: e.category || "Others",
                type: e.type || "Paid",
                source: "organiser"
            }))
        ];
    }, [events, archivedHomeIds]);

    const convexEvents = useQuery(api.events.getActiveEvents) || [];
    const convexBookings = useQuery(api.bookings.getBookings) || [];
    const convexUsers = useQuery(api.users.list) || [];
    const dashboardStats = useQuery(api.analytics.getDashboardStats);
    const admins = useQuery(api.admins.list) || [];
    const allBrandingKYC = useQuery(api.branding.listAllKYC) || [];
    const verifyKYCMutation = useMutation(api.branding.verifyKYC);

    const deleteEventMutation = useMutation(api.events.deleteEvent);
    const updateEventMutation = useMutation(api.events.updateEvent);
    const setConfigMutation = useMutation(api.systemConfig.setConfig);
    const createAdminMutation = useMutation(api.admins.create);
    const updateAdminStatusMutation = useMutation(api.admins.updateStatus);
    const deleteAdminMutation = useMutation(api.admins.remove);

    // Ad Popups
    const allAdPopups = useQuery(api.adPopups.getAllAdPopups) || [];
    const createAdPopupMutation = useMutation(api.adPopups.createAdPopup);
    const updateAdPopupMutation = useMutation(api.adPopups.updateAdPopup);
    const toggleAdPopupMutation = useMutation(api.adPopups.toggleAdPopup);
    const deleteAdPopupMutation = useMutation(api.adPopups.deleteAdPopup);
    const generateUploadUrlMutation = useMutation(api.adPopups.generateUploadUrl);
    
    const [adPopupForm, setAdPopupForm] = useState({
        title: "", description: "", imageUrl: "",
        redirectUrl: "", ctaText: "Book Now",
        bgColor: "", badgeText: "",
        isActive: true, showEveryMinutes: 30,
    });
    const [adPopupEditingId, setAdPopupEditingId] = useState(null);
    const [adPopupImageFile, setAdPopupImageFile] = useState(null);
    const [adPopupSaving, setAdPopupSaving] = useState(false);
    const [showAdPopupForm, setShowAdPopupForm] = useState(false);

    const handleSaveAdPopup = async () => {
        if (!adPopupForm.title) { alert("Title is required"); return; }
        setAdPopupSaving(true);
        try {
            let finalImageUrl = adPopupForm.imageUrl;
            if (adPopupImageFile) {
                const uploadUrl = await generateUploadUrlMutation();
                const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": adPopupImageFile.type }, body: adPopupImageFile });
                const { storageId } = await result.json();
                finalImageUrl = storageId;
            }

            if (adPopupEditingId) {
                await updateAdPopupMutation({ id: adPopupEditingId, ...adPopupForm, imageUrl: finalImageUrl });
            } else {
                await createAdPopupMutation({ ...adPopupForm, imageUrl: finalImageUrl });
            }
            
            setAdPopupForm({ title: "", description: "", imageUrl: "", redirectUrl: "", ctaText: "Book Now", bgColor: "", badgeText: "", isActive: true, showEveryMinutes: 30 });
            setAdPopupEditingId(null);
            setAdPopupImageFile(null);
            setShowAdPopupForm(false);
        } catch(e) { alert("Error saving popup: " + e.message); }
        finally { setAdPopupSaving(false); }
    };

    const handleEditAdPopup = (popup) => {
        setAdPopupForm({
            title: popup.title || "", description: popup.description || "",
            imageUrl: popup.storageId || popup.imageUrl || "",
            redirectUrl: popup.redirectUrl || "", ctaText: popup.ctaText || "",
            bgColor: popup.bgColor || "", badgeText: popup.badgeText || "",
            isActive: popup.isActive, showEveryMinutes: popup.showEveryMinutes || 30,
        });
        setAdPopupEditingId(popup._id);
        setAdPopupImageFile(null);
        setShowAdPopupForm(true);
    };

    const handleDeleteAdPopup = async (id) => {
        if (!confirm("Delete this popup?")) return;
        try {
            await deleteAdPopupMutation({ id });
        } catch(e) {
            alert("Error deleting popup: " + e.message);
        }
    };

    const [adminModal, setAdminModal] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ fullName: '', username: '', email: '', password: '', role: 'Admin' });

    // Premium Branding Banners Pricing
    const convexBrandingPrices = useQuery(api.branding.getConfigPrices);
    const updateBrandingPricingMutation = useMutation(api.branding.updatePricing);
    const [brandingPricing, setBrandingPricing] = useState({ monthlyPrice: 999, yearlyPrice: 9999 });

    useEffect(() => {
        if (convexBrandingPrices) setBrandingPricing(convexBrandingPrices);
    }, [convexBrandingPrices]);

    const handleSaveBrandingPricing = async () => {
        try {
            await updateBrandingPricingMutation(brandingPricing);
            alert("Premium Banner Pricing updated successfully!");
        } catch (e) {
            alert("Error updating pricing");
        }
    };

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "categories") setActiveTab("categories");
    }, [searchParams]);

    // Sync events from Convex
    useEffect(() => {
        if (convexEvents.length > 0) {
            setEvents(convexEvents.map(e => ({ ...e, id: e._id, source: "organiser" })));
        }
    }, [convexEvents]);

    // Sync bookings from Convex
    useEffect(() => {
        if (convexBookings.length > 0) {
            setBookings(convexBookings.map(b => ({ ...b, id: b._id })));
        }
    }, [convexBookings]);



    const [newOrg, setNewOrg] = useState({ username: "", password: "", email: "" });
    const [notificationForm, setNotificationForm] = useState({ subject: "", message: "", target: "all" });
    const [openActionDropdown, setOpenActionDropdown] = useState(null);


    const rawApiKeys = useQuery(api.apiKeys.list);
    const convexApiKeys = rawApiKeys || [];
    const createApiKeyMutation = useMutation(api.apiKeys.create);
    const toggleApiKeyStatusMutation = useMutation(api.apiKeys.toggleStatus);
    const removeApiKeyMutation = useMutation(api.apiKeys.remove);

    // Sync categories from Convex
    useEffect(() => {
        if (convexCategories.length > 0) {
            setCategories(convexCategories.map(c => ({ ...c, id: c._id })));
        }
    }, [convexCategories]);

    // Sync event partners from Convex
    useEffect(() => {
        if (convexEventPartners.length > 0) {
            setEventPartners(convexEventPartners.map(p => ({ ...p, id: p._id })));
        }
    }, [convexEventPartners]);

    // Seed default API keys if empty
    useEffect(() => {
        if (rawApiKeys !== undefined && rawApiKeys.length === 0 && allConfig !== undefined) {
            const defaults = [
                { label: "Production Mobile App", key: "ak_live_724819...9238" },
                { label: "Staging Environment", key: "ak_test_123891...0841" }
            ];
            defaults.forEach(d => createApiKeyMutation(d));
        }
    }, [rawApiKeys, createApiKeyMutation, allConfig]);
    const [localEmailSettings, setLocalEmailSettings] = useState({
        host: "",
        port: 0,
        user: "",
        pass: "",
        from: "",
        fromName: "",
        encryption: "None",
        authMethod: "Basic Authentication"
    });

    useEffect(() => {
        if (convexEmailSettings) {
            setLocalEmailSettings({
                ...convexEmailSettings,
                host: convexEmailSettings.host || "",
                port: convexEmailSettings.port || 0,
                user: convexEmailSettings.user || "",
                pass: convexEmailSettings.pass || "",
                fromName: convexEmailSettings.fromName || "",
                encryption: convexEmailSettings.encryption || "None",
                authMethod: convexEmailSettings.authMethod || "Basic Authentication"
            });
        }
    }, [convexEmailSettings]);

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

    const addSlide = () => {
        const newId = slides.length > 0 ? Math.max(...slides.map(s => s.id)) + 1 : 1;
        setSlides([...slides, {
            id: newId,
            img: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=1200&h=480&fit=crop",
            title: "",
            sub: "",
            alt: `Slide ${newId}`,
            url: ""
        }]);
    };

    const removeSlide = (id) => {
        setSlides(slides.filter(s => s.id !== id));
    };

    const updateSlide = (id, field, value) => {
        setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Figtree', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
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
                    margin-left: 250px;
                    flex: 1;
                    padding: 32px;
                    min-width: 0;
                    transition: margin-left 0.3s ease;
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
                    padding: 24px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .widget-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }
                .section-card {
                    background-color: ${t.cardBg};
                    border-radius: 16px;
                    border: 1px solid ${t.border};
                    padding: 24px;
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
                    padding: 12px 16px;
                    background-color: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
                    color: ${t.textSub};
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid ${t.border};
                }
                td {
                    padding: 16px;
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
            <aside className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl shadow-slate-200/50 flex flex-col flex-shrink-0`}>
                {/* Header */}
                <div className="h-20 flex items-center px-6 border-b border-slate-50 bg-white">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/20">
                            B
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent italic tracking-tighter">
                            BookMyTicket
                        </span>
                    </div>
                </div>
                
                {/* Side Sub-Header (Service Role) */}
                <div className="px-6 py-6 bg-slate-50 border-b border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                        <Sparkles size={40} className="text-pink-500" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">Admin Portal</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Super Admin</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {/* Render Helper */}
                    {(() => {
                        const SidebarItem = ({ id, label, icon: Icon, onClick, active }) => (
                            <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-400 group relative ${ active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.02]' }`}>
                                <Icon size={18} className={active ? 'text-pink-500' : 'text-slate-300 group-hover:text-slate-900'} strokeWidth={active ? 3 : 2} />
                                <span className={`text-[11px] uppercase tracking-widest ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
                                {active && <div className="absolute right-4 w-1 h-4 bg-pink-500 rounded-full"></div>}
                            </button>
                        );
                        const SidebarGroupTitle = ({ title }) => (
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 mb-3 px-4">{title}</p>
                        );
                        const SidebarSubItem = ({ id, label, onClick, active }) => (
                            <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 pl-10 rounded-2xl transition-all duration-300 group ${ active ? 'bg-pink-50 text-pink-600 font-black scale-[1.01]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800' }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-pink-500' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
                                <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
                            </button>
                        );

                        return (
                            <>
                                <SidebarGroupTitle title="Home" />
                                <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
                                <SidebarItem id="banner_ads" label="Banner Ads" icon={Megaphone} active={activeTab === "banner_ads"} onClick={() => setActiveTab("banner_ads")} />
                                
                                <div onClick={() => setIsHomeSettingsOpen(!isHomeSettingsOpen)} className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-400 group cursor-pointer ${ isHomeSettingsOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' }`}>
                                    <div className="flex items-center space-x-3">
                                        <Globe size={18} className="text-slate-300 group-hover:text-slate-900" strokeWidth={2} />
                                        <span className="text-[11px] uppercase tracking-widest font-bold">Home Page Setup</span>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isHomeSettingsOpen ? 'rotate-180 text-pink-500' : 'text-slate-300'}`} />
                                </div>
                                {isHomeSettingsOpen && (
                                    <div className="mt-1 space-y-1">
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
                                            { label: "Meeting Settings", id: "meeting_settings" }
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={() => setActiveTab(sub.id)} />
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
                                
                                <div onClick={() => setIsOrganizersOpen(!isOrganizersOpen)} className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-400 group cursor-pointer ${ isOrganizersOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' }`}>
                                    <div className="flex items-center space-x-3">
                                        <Users size={18} className="text-slate-300 group-hover:text-slate-900" strokeWidth={2} />
                                        <span className="text-[11px] uppercase tracking-widest font-bold">Organizers</span>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isOrganizersOpen ? 'rotate-180 text-pink-500' : 'text-slate-300'}`} />
                                </div>
                                {isOrganizersOpen && (
                                    <div className="mt-1 space-y-1">
                                        {[
                                            { label: "All Organizers", id: "all_org" },
                                            { label: "KYC Pending", id: "kyc_pending" },
                                            { label: "KYC Verified", id: "kyc_verified" },
                                            { label: "Banned", id: "banned_org" },
                                            { label: "Organiser Requests", id: "org_requests" },
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={() => setActiveTab(sub.id)} />
                                        ))}
                                    </div>
                                )}

                                <div onClick={() => setIsServicesOpen(!isServicesOpen)} className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-400 group cursor-pointer ${ isServicesOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' }`}>
                                    <div className="flex items-center space-x-3">
                                        <Briefcase size={18} className="text-slate-300 group-hover:text-slate-900" strokeWidth={2} />
                                        <span className="text-[11px] uppercase tracking-widest font-bold">Services</span>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isServicesOpen ? 'rotate-180 text-pink-500' : 'text-slate-300'}`} />
                                </div>
                                {isServicesOpen && (
                                    <div className="mt-1 space-y-1">
                                        {[
                                            { label: "Professional Service Requests", id: "service_requests" },
                                            { label: "Active Users", id: "service_active" },
                                            { label: "Banned Users", id: "service_banned" },
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={() => setActiveTab(sub.id)} />
                                        ))}
                                    </div>
                                )}

                                <SidebarGroupTitle title="Growth" />
                                <div onClick={() => setIsGrowthOpen(!isGrowthOpen)} className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-400 group cursor-pointer ${ isGrowthOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' }`}>
                                    <div className="flex items-center space-x-3">
                                        <Gift size={18} className="text-slate-300 group-hover:text-slate-900" strokeWidth={2} />
                                        <span className="text-[11px] uppercase tracking-widest font-bold">Growth</span>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isGrowthOpen ? 'rotate-180 text-pink-500' : 'text-slate-300'}`} />
                                </div>
                                {isGrowthOpen && (
                                    <div className="mt-1 space-y-1">
                                        {[
                                            { label: "Promotions", id: "promotions" },
                                            { label: "Push Notifications", id: "send_notif" },
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={() => setActiveTab(sub.id)} />
                                        ))}
                                    </div>
                                )}

                                <SidebarGroupTitle title="Reports" />
                                <SidebarItem id="support_tickets" label="Support Tickets" icon={MessageCircle} active={activeTab === "support_tickets"} onClick={() => setActiveTab("support_tickets")} />
                                <SidebarItem id="branding_partners" label="Branding Partners" icon={Shield} active={activeTab === "branding_partners"} onClick={() => setActiveTab("branding_partners")} />
                                <SidebarItem id="pages" label="Pages" icon={FileText} active={activeTab === "pages"} onClick={() => setActiveTab("pages")} />
                                <SidebarItem id="ad_popups" label="Ad Popups" icon={Megaphone} active={activeTab === "ad_popups"} onClick={() => setActiveTab("ad_popups")} />
                                <SidebarItem id="checkout_footer" label="Checkout Footer" icon={LayoutGrid} active={activeTab === "checkout_footer"} onClick={() => setActiveTab("checkout_footer")} />

                                <SidebarGroupTitle title="Administration" />
                                <SidebarItem id="admin_management" label="Team Management" icon={Shield} active={activeTab === "admin_management"} onClick={() => setActiveTab("admin_management")} />

                                <SidebarGroupTitle title="System" />
                                <div onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-400 group cursor-pointer ${ isSettingsOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' }`}>
                                    <div className="flex items-center space-x-3">
                                        <Settings size={18} className="text-slate-300 group-hover:text-slate-900" strokeWidth={2} />
                                        <span className="text-[11px] uppercase tracking-widest font-bold">Settings</span>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isSettingsOpen ? 'rotate-180 text-pink-500' : 'text-slate-300'}`} />
                                </div>
                                {isSettingsOpen && (
                                    <div className="mt-1 space-y-1">
                                        {[
                                            { label: "API Keys", id: "api_settings" },
                                            { label: "Payments", id: "payment_settings" },
                                            { label: "Emails", id: "email_settings" },
                                            { label: "SEO & Meta", id: "meta_management" },
                                            { label: "Email Templates", id: "email_templates" },
                                            { label: "Disclaimers", id: "disclaimer_settings" },
                                            { label: "SSO Config", id: "sso_settings" },
                                            { label: "Tickets & Notifs", id: "ticket_settings" }
                                        ].map(sub => (
                                            <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} onClick={() => setActiveTab(sub.id)} />
                                        ))}
                                    </div>
                                )}
                            </>
                        );
                    })()}

                </nav>

                {/* Footer - Profile Minimal */}
                <div className="p-6 border-t border-slate-50 bg-slate-50/50 mt-auto">
                    <div className="bg-white rounded-[1.5rem] p-4 mb-4 flex items-center space-x-3 border border-slate-100 shadow-sm group cursor-pointer hover:border-pink-500/30 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center text-pink-500 border border-pink-200 overflow-hidden shadow-inner">
                            A
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight italic">Admin User</p>
                            <p className="text-[9px] font-black text-slate-300 truncate uppercase tracking-[0.2em] mt-0.5">Verified</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-400 transition-all duration-500 shadow-sm"
                    >
                        <LogOut size={14} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                
                {/* Top Header */}
                <header className="h-20 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between px-8 lg:px-12">
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
                <main style={{ padding: "32px" }}>
                    {activeTab === "dashboard" && (
                        <>
                            {/* Welcome Banner */}
                            <div style={{ 
                                background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                borderRadius: "24px",
                                padding: "40px",
                                marginBottom: "32px",
                                position: "relative",
                                overflow: "hidden",
                                border: `1px solid ${t.border}`,
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)"
                            }}>
                                <div style={{ position: "relative", zIndex: 2 }}>
                                    <h2 style={{ fontSize: "36px", fontWeight: 900, color: t.textMain, marginBottom: "12px", letterSpacing: "-0.03em" }}>Welcome back, Admin! 👋</h2>
                                    <p style={{ fontSize: "16px", color: t.textSub, maxWidth: "500px", lineHeight: "1.6", fontWeight: 500 }}>
                                        Here's what's happening with your platform today. You have pending ad requests and thousands of active events.
                                    </p>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                        <button onClick={() => setActiveTab("org_requests")} style={{ padding: "14px 28px", borderRadius: "14px", background: ACCENT_GRADIENT, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 20px -5px rgba(59, 130, 246, 0.4)", transition: "all 0.2s" }}>View Requests</button>
                                        <button onClick={() => setActiveTab("all_events")} style={{ padding: "14px 28px", borderRadius: "14px", background: theme === 'dark' ? "rgba(255,255,255,0.05)" : "#fff", color: t.textMain, border: `1px solid ${t.border}`, fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}>Manage Events</button>
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
                                    { label: "Bookings", value: dashboardStats ? dashboardStats.totalBookings.toString() : "…", icon: ShoppingCart, color: "#06b6d4", trend: "+14.2%" }
                                ].map((stat, i) => (
                                    <div key={i} className="widget-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                                                <stat.icon size={24} />
                                            </div>
                                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e", backgroundColor: "#f0fdf4", padding: "4px 8px", borderRadius: "6px" }}>{stat.trend}</span>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: t.textSub }}>{stat.label}</p>
                                            <h3 style={{ margin: "4px 0 0 0", fontSize: "28px", fontWeight: 800, color: t.textMain, letterSpacing: "-0.5px" }}>{stat.value}</h3>
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
                                                alert("Please fill in all fields.");
                                                return;
                                            }
                                            try {
                                                await createAdminMutation(newAdmin);
                                                alert("Admin account created successfully!");
                                                setAdminModal(null);
                                                setNewAdmin({ fullName: '', username: '', email: '', password: '', role: 'Admin' });
                                            } catch (err) {
                                                alert("Error creating admin: " + err.message);
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
                                                const formData = new FormData();
                                                formData.append("file", file);
                                                try {
                                                    const res = await fetch("/api/memories/upload", { method: "POST", body: formData });
                                                    const data = await res.json();
                                                    if (data.success) setBannerImage(data.imageUrl);
                                                } catch (err) { alert("Upload failed"); }
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
                                            if (!bannerImage) { alert("Please upload an image"); return; }
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
                                                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#22c55e15", color: "#22c55e" }}>ACTIVE</span>
                                                </td>
                                                <td style={{ padding: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                    {ev.source === "organiser" && (
                                                        <>
                                                            <button style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>Edit</button>
                                                            <button onClick={() => setEvents(events.map(x => x.id === ev.id ? { ...x, archived: true } : x))} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}><Archive size={14} /> Archive</button>
                                                            <button style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
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
                                        {convexUsers.length > 0 ? convexUsers.map((c) => (
                                            <tr key={c._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{c.name}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{c.email}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ padding: "2px 8px", borderRadius: "6px", backgroundColor: "#22c55e22", color: "#22c55e", fontSize: "11px", fontWeight: 700 }}>{c.role || "user"}</span>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                                                <td style={{ padding: "12px" }}><button style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>View history</button></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No customers yet. Registered users will appear here.</td></tr>
                                        )}
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
                                        {convexPromotions.length > 0 ? convexPromotions.map((p) => (
                                            <tr key={p._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 700 }}>{p.code}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{p.type === "percent" ? "Percent" : "Fixed"}</td>
                                                <td style={{ padding: "12px" }}>{p.type === "percent" ? p.value + "%" : "₹" + p.value}</td>
                                                <td style={{ padding: "12px" }}>{p.bogo ? "Yes" : "No"}</td>
                                                <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>{p.validUntil}</td>
                                                <td style={{ padding: "12px" }}>{p.usage || 0}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ marginRight: "8px", padding: "2px 8px", borderRadius: "6px", backgroundColor: p.active ? "#22c55e22" : "#ef444422", color: p.active ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: 700 }}>{p.active ? "Active" : "Inactive"}</span>
                                                    <button onClick={() => removePromotionMutation({ id: p._id })} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>Delete</button>
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
                                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: t.textSub }}>Summary</h4>
                                <p style={{ margin: "4px 0", fontSize: "14px" }}>Total events: <strong>{allEvents.length}</strong></p>
                                <p style={{ margin: "4px 0", fontSize: "14px" }}>Total bookings: <strong>{bookings.length}</strong></p>
                                <p style={{ margin: "4px 0", fontSize: "14px" }}>Total revenue (sample): <strong>₹0</strong></p>
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
                                                        <button style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", marginRight: "12px" }}>Edit</button>
                                                        <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
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
                                {supportTickets.length === 0 ? (
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
                                    <div key={slide.id} style={{ border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden", backgroundColor: t.bg }}>
                                        <div style={{ position: "relative", height: "150px" }}>
                                            <img src={slide.img || "/banner-hero-events.png"} alt={slide.alt || "Slide"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <button onClick={() => removeSlide(slide.id)} style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                                        </div>
                                        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <label style={{ fontSize: "11px", color: t.textSub, marginBottom: "-4px" }}>Image URL</label>
                                            <input
                                                type="text"
                                                placeholder="Slide Image URL"
                                                value={slide.img || ""}
                                                onChange={(e) => updateSlide(slide.id, 'img', e.target.value)}
                                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "12px" }}
                                            />
                                            <label style={{ fontSize: "11px", color: t.textSub, marginBottom: "-4px" }}>Title</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Live Concerts"
                                                value={slide.title || ""}
                                                onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "12px" }}
                                            />
                                            <label style={{ fontSize: "11px", color: t.textSub, marginBottom: "-4px" }}>Subtitle</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Book your favourite artists"
                                                value={slide.sub || ""}
                                                onChange={(e) => updateSlide(slide.id, 'sub', e.target.value)}
                                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "12px" }}
                                            />
                                            <label style={{ fontSize: "11px", color: t.textSub, marginBottom: "-4px" }}>Alt Text (accessibility)</label>
                                            <input
                                                type="text"
                                                placeholder="Alt Text"
                                                value={slide.alt || ""}
                                                onChange={(e) => updateSlide(slide.id, 'alt', e.target.value)}
                                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "12px" }}
                                            />
                                            <label style={{ fontSize: "11px", color: t.textSub, marginBottom: "-4px" }}>Target URL (optional)</label>
                                            <input
                                                type="text"
                                                placeholder="/events or full URL"
                                                value={slide.url || ""}
                                                onChange={(e) => updateSlide(slide.id, 'url', e.target.value)}
                                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "12px" }}
                                            />
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
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setActiveTab("dashboard")}
                                    style={{ padding: "8px 16px", backgroundColor: "#334155", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px" }}>Event Partners Logos</h3>
                                        <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>Manage the "Our Event Partners" section logos on the homepage.</p>
                                    </div>
                                    <button
                                        onClick={() => setEventPartners([...eventPartners, { id: Date.now(), name: "New Partner", logo: "", eventCount: 0 }])}
                                        style={{ padding: "8px 16px", background: ACCENT_GRADIENT, backgroundColor: ACCENT_PINK, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 10px 24px rgba(236,72,153,0.12)" }}>
                                        <Plus size={18} /> Add Partner
                                    </button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {eventPartners.map(partner => (
                                        <div key={partner.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: `1px solid ${t.border}`, borderRadius: "8px", backgroundColor: t.bg }}>
                                            <div style={{ width: "64px", height: "64px", borderRadius: "8px", backgroundColor: "#f1f5f9", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                                                {partner.logo ? (
                                                    <img src={partner.logo} alt={partner.name} style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", backgroundColor: "transparent" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Logo URL"
                                                        value={partner.logo}
                                                        onChange={(e) => setEventPartners(eventPartners.map(p => p.id === partner.id ? { ...p, logo: e.target.value } : p))}
                                                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain }}
                                                    />
                                                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 12px", backgroundColor: t.border, color: t.textMain, borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                                                        <Upload size={14} /> Upload Image
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            style={{ display: "none" }}
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (ev) => setEventPartners(eventPartners.map(p => p.id === partner.id ? { ...p, logo: ev.target.result } : p));
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <button onClick={() => setEventPartners(eventPartners.filter(p => p.id !== partner.id))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "8px" }}><Trash2 size={20} /></button>
                                        </div>
                                    ))}
                                    {eventPartners.length === 0 && (
                                        <p style={{ textAlign: "center", padding: "24px", color: t.textSub }}>No partners added. Click the button to add one.</p>
                                    )}
                                </div>
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
                                        <div key={memory._id} style={{ border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden", backgroundColor: theme === "light" ? "#f8fafc" : "#1e293b", position: "relative" }}>
                                            <div style={{ height: "160px", width: "100%" }}>
                                                <img src={memory.imageUrl} alt={memory.altText} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                            <div style={{ padding: "12px" }}>
                                                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: t.textMain }}>{memory.altText}</p>
                                                <p style={{ margin: "4px 0 0", fontSize: "11px", color: t.textSub }}>Added {new Date(memory.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMemory(memory._id)}
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
                                    onClick={() => alert('Sub navigation menu is auto-saved to backend.')}
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
                                    onClick={() => alert('Video Banner menu is saved seamlessly to the frontend via Convex Config!')}
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
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <input
                                                type="text"
                                                placeholder="e.g. /logo.png or https://..."
                                                value={localBranding.logoUrl || ""}
                                                onChange={(e) => setLocalBranding({ ...localBranding, logoUrl: e.target.value })}
                                                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Logomark Color</label>
                                        <input
                                            type="color"
                                            value={localBranding.logoColor || "#111111"}
                                            onChange={(e) => setLocalBranding({ ...localBranding, logoColor: e.target.value })}
                                            style={{ width: "60px", height: "40px", padding: "2px", borderRadius: "4px", border: "none", cursor: "pointer" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Public Site URL (for Emails)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. https://bookmyticket.in"
                                            value={localBranding.siteUrl || ""}
                                            onChange={(e) => setLocalBranding({ ...localBranding, siteUrl: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                        <p style={{ fontSize: "11px", color: t.textSub, marginTop: "4px", marginBottom: 0 }}>This is used to construct full image URLs in transactional emails.</p>
                                    </div>
                                    <button 
                                        onClick={async (e) => {
                                            const btn = e.target;
                                            const originalText = btn.innerText;
                                            btn.innerText = "Saving...";
                                            try {
                                                let finalUrl = localBranding.logoUrl || "";
                                                // Auto-fix the URL if the user typed the server path
                                                if (finalUrl.includes("public/")) {
                                                    finalUrl = "/" + finalUrl.split("public/")[1];
                                                }
                                                setLocalBranding({ ...localBranding, logoUrl: finalUrl });
                                                
                                                let finalSiteUrl = localBranding.siteUrl || "";
                                                if (finalSiteUrl.endsWith("/")) {
                                                    finalSiteUrl = finalSiteUrl.slice(0, -1);
                                                }
                                                setLocalBranding(prev => ({ ...prev, siteUrl: finalSiteUrl }));

                                                await updateSiteBrandingMutation({ name: localBranding.name || "", logoColor: localBranding.logoColor || "#111111", logoUrl: finalUrl, siteUrl: finalSiteUrl });
                                                
                                                btn.innerText = "Saved!";
                                                setTimeout(() => { btn.innerText = originalText; }, 2000);
                                            } catch(err) {
                                                alert("Error saving: " + err.message);
                                                btn.innerText = originalText;
                                            }
                                        }}
                                        style={{ padding: "12px 24px", borderRadius: "8px", background: ACCENT_GRADIENT, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", marginTop: "10px", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                                    >
                                        Save Branding Info
                                    </button>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Logo Preview</label>
                                    <div style={{ padding: "40px", border: `2px dashed ${t.border}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', overflow: "hidden" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            {localBranding.logoUrl ? (
                                                <img
                                                    key={`img-${localBranding.logoUrl}`}
                                                    src={localBranding.logoUrl}
                                                    alt="Logo URL missing or invalid"
                                                    style={{
                                                        height: "80px",
                                                        objectFit: "contain",
                                                        filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none'
                                                    }}
                                                    onLoad={(e) => { 
                                                        e.target.style.display = 'block'; 
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'; 
                                                    }}
                                                    onError={(e) => { 
                                                        e.target.style.display = 'none'; 
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; 
                                                    }}
                                                />
                                            ) : null}
                                            <div key={`fallback-${localBranding.logoUrl}`} style={{ display: localBranding.logoUrl ? "none" : "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "48px", height: "48px", background: `linear-gradient(135deg, ${localBranding.logoColor}, #3b82f6)`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 15px rgba(37, 99, 235, 0.3)" }}>
                                                    <Ticket color="#fff" size={28} />
                                                </div>
                                                <span style={{ fontSize: "24px", fontWeight: 800, color: t.textMain }}>{localBranding.name}</span>
                                            </div>
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
                                            <tr key={kyc._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ fontWeight: 700 }}>{kyc.orgName}</div>
                                                    <div style={{ fontSize: "11px", color: t.textSub }}>ID: {kyc.brandId.slice(-8)}</div>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>
                                                    {kyc.city}, {kyc.state}
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>
                                                    <div>GST: {kyc.gstNumber}</div>
                                                    <div>PAN: {kyc.panNumber}</div>
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
                                                                onClick={() => verifyKYCMutation({ brandId: kyc.brandId, status: "Verified" })}
                                                                style={{ padding: "6px 12px", backgroundColor: "#22c55e", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => verifyKYCMutation({ brandId: kyc.brandId, status: "Rejected" })}
                                                                style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: "12px", color: t.textSub }}>Processed</span>
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
                                                if (activeTab === "all_org" || activeTab === "active_org") return ["Active", "KYC Completed", "KYC Verified"].includes(org.status);
                                                if (activeTab === "banned_org") return org.status === "Banned";
                                                if (activeTab === "kyc_pending") return ["KYC Pending", "Start Onboarding"].includes(org.status);
                                                if (activeTab === "kyc_verified") return org.status === "Submitted" || org.status === "Pending";
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
                                                                (org.status === 'Active' || org.status === 'KYC Completed') ? '#22c55e15' :
                                                                    org.status === 'Banned' ? '#ef444415' :
                                                                        (org.status === 'Submitted' || org.status === 'Pending') ? '#3b82f615' :
                                                                        (org.status === 'KYC Pending' || org.status === 'Start Onboarding') ? '#f9731615' : '#64748b15',
                                                            color:
                                                                (org.status === 'Active' || org.status === 'KYC Completed') ? '#22c55e' :
                                                                    org.status === 'Banned' ? '#ef4444' :
                                                                        (org.status === 'Submitted' || org.status === 'Pending') ? '#3b82f6' :
                                                                        (org.status === 'KYC Pending' || org.status === 'Start Onboarding') ? '#f97316' : t.textSub
                                                        }}>
                                                            {org.status === 'Submitted' || org.status === 'Pending' ? 'UNDER REVIEW' : 
                                                             org.status === 'KYC Pending' || org.status === 'Start Onboarding' ? 'KYC PENDING' : 
                                                             org.status === 'KYC Completed' ? 'ACTIVE' : org.status.toUpperCase()}
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
                                                                {(org.status === 'KYC Pending' || org.status === 'Pending' || org.status === 'Submitted' || org.status === 'Start Onboarding') && (
                                                                    <>
                                                                        <button onClick={() => { setSelectedKycOrg(org); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                            <FileText size={16} /> View KYC
                                                                        </button>

                                                                        <button onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            patchOrganizerMutation({ id: org.id, kycStatus: 'KYC Completed' });
                                                                            setOpenActionDropdown(null);
                                                                        }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#22c55e", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                            <CheckCircle size={16} /> Approve KYC
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {org.status === 'Active' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); patchOrganizerMutation({ id: org.id, kycStatus: 'Banned' }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#f97316", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <Bell size={16} /> Ban User
                                                                    </button>
                                                                )}
                                                                {org.status === 'Banned' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); patchOrganizerMutation({ id: org.id, kycStatus: 'Active' }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#22c55e", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <CheckCircle size={16} /> Unban User
                                                                    </button>
                                                                )}
                                                                <button onClick={(e) => { e.stopPropagation(); patchOrganizerMutation({ id: org.id, kycStatus: 'Rejected' }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                    <X size={16} /> Reject User
                                                                </button>
                                                                <div style={{ borderTop: `1px solid ${t.border}`, margin: "4px 0" }}></div>
                                                                <button onClick={(e) => { e.stopPropagation(); if (confirm("Are you sure you want to delete this organiser?")) { removeOrganizerMutation({ id: org.id }); setOpenActionDropdown(null); } }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
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

                    {activeTab === "org_requests" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, minHeight: "600px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: 900, color: t.textMain }}>Event Organiser Requests</h3>
                            </div>
                            <div style={{ overflowX: "auto", paddingBottom: "160px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Phone</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Remarks</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {convexOrganiserRequests.filter(req => !isProfService(req.category)).map((req) => (
                                            <tr key={req._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600, color: t.textMain }}>{req.firstName} {req.lastName}</td>
                                                <td style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>{req.email}</td>
                                                <td style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>{req.phone}</td>
                                                <td style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>{req.category}</td>
                                                <td style={{ padding: "12px", color: t.textSub, fontSize: "13px", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={req.remarks}>{req.remarks}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "20px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        backgroundColor:
                                                            req.status === 'Approved' ? '#22c55e15' :
                                                                req.status === 'Rejected' ? '#ef444415' : '#f9731615',
                                                        color:
                                                            req.status === 'Approved' ? '#22c55e' :
                                                                req.status === 'Rejected' ? '#ef4444' : '#f97316'
                                                    }}>
                                                        {req.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px", position: "relative" }}>
                                                    <button onClick={() => { setSelectedRequestForApproval(req); setShowApprovalModal(true); }} style={{ padding: "6px 12px", borderRadius: "6px", background: "#22c55e15", color: "#22c55e", border: "none", cursor: "pointer", fontWeight: 600 }}>Approve</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {convexOrganiserRequests.length === 0 && (
                                    <div style={{ padding: "24px", textAlign: "center", color: t.textSub, fontSize: "14px" }}>No requests found.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "service_requests" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, minHeight: "600px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: 900, color: t.textMain }}>Professional Service Requests</h3>
                            </div>
                            <div style={{ overflowX: "auto", paddingBottom: "160px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Phone</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {convexOrganiserRequests.filter(req => isProfService(req.category)).map((req) => (
                                            <tr key={req._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600, color: t.textMain }}>{req.firstName} {req.lastName}</td>
                                                <td style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>{req.email}</td>
                                                <td style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>{req.category}</td>
                                                <td style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>{req.phone}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "20px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        backgroundColor:
                                                            req.status === 'Approved' ? '#22c55e15' :
                                                                req.status === 'Rejected' ? '#ef444415' : '#f9731615',
                                                        color:
                                                            req.status === 'Approved' ? '#22c55e' :
                                                                req.status === 'Rejected' ? '#ef4444' : '#f97316'
                                                    }}>
                                                        {req.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {req.status === 'Pending' && (
                                                        <button onClick={() => { setSelectedRequestForApproval(req); setShowApprovalModal(true); }} style={{ padding: "6px 12px", borderRadius: "6px", background: "#22c55e15", color: "#22c55e", border: "none", cursor: "pointer", fontWeight: 600 }}>Approve</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {convexOrganiserRequests.filter(req => isProfService(req.category)).length === 0 && (
                                    <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No professional service requests found.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {["service_active", "service_banned"].includes(activeTab) && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, minHeight: "600px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                                    {activeTab === "service_active" ? "Active Service Providers" : "Banned Service Providers"}
                                </h3>
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
                                            <tr key={org._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{org.name}</td>
                                                <td style={{ padding: "12px" }}>{org.userId}</td>
                                                <td style={{ padding: "12px" }}>{org.category || org.kycDetails?.category}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        {activeTab === "service_active" && (
                                                            <button onClick={() => patchOrganizerMutation({ id: org._id, kycStatus: "Banned" })} style={{ padding: "6px 12px", borderRadius: "6px", background: "#ef444415", color: "#ef4444", border: "none", cursor: "pointer", fontWeight: 600 }}>Ban</button>
                                                        )}
                                                        {activeTab === "service_banned" && (
                                                            <button onClick={() => patchOrganizerMutation({ id: org._id, kycStatus: "Active" })} style={{ padding: "6px 12px", borderRadius: "6px", background: "#22c55e15", color: "#22c55e", border: "none", cursor: "pointer", fontWeight: 600 }}>Activate</button>
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
                                            if (!notificationForm.subject || !notificationForm.message) return alert("Please fill in both subject and message.");
                                            const targetCount = notificationForm.target === 'all' ? mappedOrganizers.length :
                                                notificationForm.target === 'active' ? mappedOrganizers.filter(o => o.status === 'Active').length :
                                                    mappedOrganizers.filter(o => ["KYC Pending", "Pending", "Submitted"].includes(o.status)).length;

                                            await sendNotificationMutation({
                                                subject: notificationForm.subject,
                                                message: notificationForm.message,
                                                target: notificationForm.target
                                            });

                                            alert(`Broadcast initiated! Notifications saved to history and sent to ${targetCount} recipients.`);
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
                                    const config = convexPaymentGateways.find(g => g.name === gw.name) || { isEnabled: false, config: {} };
                                    const isConnected = config.isEnabled && (config.config?.apiKey || "").trim().length > 0;
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
                                                    const current = convexPaymentGateways.find(g => g.name === gw.name);
                                                    setPaymentGatewayConfig(current || { name: gw.name, isEnabled: false, config: {}, testMode: true });
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
                                                value={feeSettings.convenienceFeeType}
                                                onChange={(e) => setFeeSettings(f => ({ ...f, convenienceFeeType: e.target.value }))}
                                                style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "13px" }}
                                            >
                                                <option value="percent">Percent (%)</option>
                                                <option value="fixed">Fixed (₹)</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="0"
                                                step={feeSettings.convenienceFeeType === "percent" ? 0.5 : 1}
                                                value={feeSettings.convenienceFeeValue}
                                                onChange={(e) => setFeeSettings(f => ({ ...f, convenienceFeeValue: parseFloat(e.target.value) || 0 }))}
                                                style={{ width: "80px", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "13px" }}
                                            />
                                            <span style={{ fontSize: "13px", color: t.textSub }}>{feeSettings.convenienceFeeType === "percent" ? "%" : "₹"}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: t.textSub, marginBottom: "6px" }}>GST (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={feeSettings.gstPercent}
                                            onChange={(e) => setFeeSettings(f => ({ ...f, gstPercent: parseFloat(e.target.value) || 0 }))}
                                            style={{ width: "80px", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "13px" }}
                                        />
                                        <span style={{ fontSize: "13px", color: t.textSub, marginLeft: "4px" }}>%</span>
                                    </div>
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

                    {activeTab === "email_settings" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Email Settings</h2>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Configure SMTP and IMAP settings for email notifications and ticket creation</p>
                            </div>

                            <div style={{ backgroundColor: theme === 'light' ? '#ffffff' : t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)" }}>
                                <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: "16px", marginBottom: "20px" }}>
                                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>SMTP Settings (Outgoing Email)</h3>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div style={{ position: "relative" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>SMTP Host <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <div style={{ position: "relative" }}>
                                            <Globe size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub, opacity: 0.7 }} />
                                            <input
                                                type="text"
                                                value={localEmailSettings.host}
                                                onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, host: e.target.value })}
                                                placeholder="smtp.office365.com"
                                                style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>SMTP Port <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input
                                            type="text"
                                            value={localEmailSettings.port}
                                            onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, port: e.target.value })}
                                            placeholder="587"
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                        />
                                    </div>

                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Encryption <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <select
                                            value={localEmailSettings.encryption}
                                            onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, encryption: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none", cursor: "pointer" }}
                                        >
                                            <option value="TLS">TLS (Required for Office365)</option>
                                            <option value="SSL">SSL</option>
                                            <option value="None">None</option>
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Authentication Method</label>
                                        <select
                                            value={localEmailSettings.authMethod}
                                            onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, authMethod: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none", cursor: "pointer" }}
                                        >
                                            <option value="App Password">App Password</option>
                                            <option value="Basic Authentication">Basic Authentication</option>
                                            <option value="None">None</option>
                                        </select>
                                    </div>

                                    <div style={{ position: "relative" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Username <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <div style={{ position: "relative" }}>
                                            <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub, opacity: 0.7 }} />
                                            <input
                                                type="text"
                                                value={localEmailSettings.user}
                                                onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, user: e.target.value })}
                                                placeholder="your-email@example.com"
                                                style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Password <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <div style={{ position: "relative" }}>
                                            <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub, opacity: 0.7 }} />
                                            <input
                                                type="password"
                                                value={localEmailSettings.pass}
                                                onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, pass: e.target.value })}
                                                placeholder="••••••••"
                                                style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>From Email <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input
                                            type="text"
                                            value={localEmailSettings.from}
                                            onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, from: e.target.value })}
                                            placeholder="noreply@example.com"
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>From Name <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input
                                            type="text"
                                            value={localEmailSettings.fromName}
                                            onChange={(e) => setLocalEmailSettings({ ...localEmailSettings, fromName: e.target.value })}
                                            placeholder="Ticketing Tool"
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                        />
                                    </div>

                                    <div style={{ gridColumn: "span 2", marginTop: "12px", display: "flex", gap: "12px" }}>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const { _id, _creationTime, updatedAt, ...rest } = localEmailSettings;
                                                    await updateEmailSettingsMutation({
                                                        ...rest,
                                                        id: _id,
                                                        port: parseInt(localEmailSettings.port) || 0
                                                    });
                                                    alert("Settings saved successfully!");
                                                } catch (err) {
                                                    alert("Error saving settings: " + err.message);
                                                }
                                            }}
                                            style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"} onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}>
                                            Save Email Settings
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!localEmailSettings.user) {
                                                    alert("Please set a recipient/username first.");
                                                    return;
                                                }
                                                const { _id, _creationTime, updatedAt, ...rest } = localEmailSettings;
                                                const result = await sendEmailAction({
                                                    to: localEmailSettings.user,
                                                    subject: "Test Email from BookMyTicket Admin",
                                                    html: "<h1>SMTP Configuration Test</h1><p>If you are reading this, your SMTP settings are working correctly! 🎉</p>",
                                                    settings: {
                                                        ...rest,
                                                        port: parseInt(localEmailSettings.port) || 0
                                                    }
                                                });
                                                if (result.success) {
                                                    alert(`Test email sent successfully!\n\nMessage ID: ${result.messageId}\n\nResponse: ${result.response}\n\nPlease check your inbox/spam folder.`);
                                                } else {
                                                    alert("Error sending test email: " + result.error);
                                                }
                                            }}
                                            style={{ backgroundColor: "#fff", color: "#3b82f6", border: "1px solid #3b82f6", padding: "10px 22px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}>
                                            Send Test Mail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "email_templates" && (
                        <div style={{ maxWidth: "1000px" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>Email Templates</h2>
                                <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Manage the content and auto-send behavior of system-generated emails</p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
                                {/* Left Side: Template List */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {emailTemplates.map(tmp => (
                                        <div
                                            key={tmp.id}
                                            onClick={() => setActiveTemplate(tmp)}
                                            style={{
                                                padding: "16px",
                                                borderRadius: "12px",
                                                border: `1.5px solid ${activeTemplate?.id === tmp.id ? "#3b82f6" : t.border}`,
                                                backgroundColor: activeTemplate?.id === tmp.id ? "#3b82f610" : t.cardBg,
                                                cursor: "pointer",
                                                transition: "0.2s"
                                            }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <h4 style={{ margin: 0, fontSize: "14px", color: t.textMain }}>{tmp.name}</h4>
                                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: tmp.autoSend ? "#22c55e" : "#cbd5e1" }}></div>
                                            </div>
                                            <p style={{ margin: "4px 0 0", fontSize: "11px", color: t.textSub }}>Subject: {tmp.subject.substring(0, 30)}...</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Right Side: Editor */}
                                <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                    {editingTemplate ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Edit {editingTemplate.name}</h3>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <span style={{ fontSize: "12px", color: t.textSub }}>Auto-send:</span>
                                                    <button
                                                        onClick={() => setEditingTemplate({ ...editingTemplate, autoSend: !editingTemplate.autoSend })}
                                                        style={{
                                                            width: "44px", height: "22px", borderRadius: "11px",
                                                            backgroundColor: editingTemplate.autoSend ? "#3b82f6" : "#cbd5e1",
                                                            border: "none", cursor: "pointer", position: "relative", transition: "0.3s"
                                                        }}>
                                                        <div style={{
                                                            position: "absolute", top: "2px", left: editingTemplate.autoSend ? "24px" : "2px",
                                                            width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "0.3s"
                                                        }} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Email Subject</label>
                                                <input
                                                    type="text"
                                                    value={editingTemplate.subject}
                                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none" }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Message Content (HTML Supported)</label>
                                                <textarea
                                                    rows={10}
                                                    placeholder="HTML content here..."
                                                    value={editingTemplate.body}
                                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", fontFamily: "monospace" }}
                                                />
                                            </div>

                                            <div style={{ display: "flex", gap: "10px", padding: "12px", backgroundColor: "#3b82f610", borderRadius: "8px", border: "1px solid #3b82f630" }}>
                                                <Code size={16} color="#3b82f6" />
                                                <div style={{ fontSize: "11px", color: "#3b82f6" }}>
                                                    <strong>Available Variables:</strong> {"{{event_name}}, {{user_name}}, {{ticket_id}}, {{booking_date}}, {{otp}}"}
                                                </div>
                                            </div>

                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await patchEmailTemplateMutation({
                                                            id: editingTemplate._id,
                                                            subject: editingTemplate.subject,
                                                            body: editingTemplate.body,
                                                            autoSend: editingTemplate.autoSend,
                                                            name: editingTemplate.name,
                                                            identifier: editingTemplate.identifier
                                                        });
                                                        alert("Template saved successfully!");
                                                    } catch (err) {
                                                        console.error("Failed to save template:", err);
                                                        alert("Error saving template.");
                                                    }
                                                }}
                                                style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"} onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}>
                                                Save Template Changes
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                            <Mail size={48} color={t.textSub} style={{ opacity: 0.2, marginBottom: "16px" }} />
                                            <p style={{ color: t.textSub, fontSize: "14px" }}>Select a template to edit</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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
                                            onChange={(e) => updatePoliciesMutation({ ...convexPolicies, bookingHeader: e.target.value })}
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
                                            onChange={(e) => updatePoliciesMutation({ ...convexPolicies, paymentTerms: e.target.value })}
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
                                                onChange={(e) => updatePoliciesMutation({ ...convexPolicies, eventDisclaimer: e.target.value })}
                                                rows={5}
                                                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", lineHeight: "1.5" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: t.textMain }}>Cancellation & Refund Policy</label>
                                            <textarea
                                                value={disclaimerContent.cancellation_policy}
                                                onChange={(e) => updatePoliciesMutation({ ...convexPolicies, cancellationPolicy: e.target.value })}
                                                rows={5}
                                                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", lineHeight: "1.5" }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ mt: "8px" }}>
                                        <button
                                            onClick={() => alert("Legal policies updated successfully!")}
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
                                            onClick={() => updateSsoSettingsMutation({
                                                id: convexSsoSettings?._id,
                                                facebookEnabled: !ssoConfigs.facebook,
                                                googleEnabled: ssoConfigs.google,
                                                facebookConfig: ssoConfigs.facebookConfig || {},
                                                googleConfig: ssoConfigs.googleConfig || {}
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
                                            onClick={() => updateSsoSettingsMutation({
                                                id: convexSsoSettings?._id,
                                                facebookEnabled: ssoConfigs.facebook,
                                                googleEnabled: !ssoConfigs.google,
                                                facebookConfig: ssoConfigs.facebookConfig || {},
                                                googleConfig: ssoConfigs.googleConfig || {}
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

                    {activeTab === "api_settings" && (
                        <div style={{ maxWidth: "850px" }}>
                            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div>
                                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, margin: "0 0 4px 0" }}>API Configuration</h2>
                                    <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Generate and manage API keys for external application integration</p>
                                </div>
                                <button
                                    onClick={() => createApiKeyMutation({ label: "New App Key", key: `ak_${Math.random().toString(36).substr(2, 9)}...` })}
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
                                        {convexApiKeys.map((item, i) => (
                                            <tr key={item._id} style={{ borderBottom: i === convexApiKeys.length - 1 ? 'none' : `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px 16px", fontWeight: 600, color: t.textMain }}>
                                                    {item.label}
                                                </td>
                                                <td style={{ padding: "12px 16px", fontFamily: "monospace", color: t.textSub }}>{item.key}</td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: item.status === "Active" ? "#22c55e20" : "#ef444420", color: item.status === "Active" ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{item.status.toUpperCase()}</span>
                                                </td>
                                                <td style={{ padding: "12px 16px", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                    <button
                                                        onClick={() => toggleApiKeyStatusMutation({ id: item._id, status: item.status === "Active" ? "Revoked" : "Active" })}
                                                        style={{ background: "none", border: "none", color: item.status === "Active" ? "#ef4444" : "#22c55e", cursor: "pointer", fontSize: "12px" }}
                                                    >
                                                        {item.status === "Active" ? "Revoke" : "Activate"}
                                                    </button>
                                                    <button
                                                        onClick={() => removeApiKeyMutation({ id: item._id })}
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                    <Globe size={20} color="#3b82f6" />
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Global SEO & Meta Ads</h3>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Global Site Title</label>
                                            <input
                                                type="text"
                                                value={metaSettings.global.title}
                                                onChange={(e) => updateSeoSettingsMutation({
                                                    ...convexSeoSettings,
                                                    globalTitle: e.target.value,
                                                    globalKeywords: convexSeoSettings?.globalKeywords || "",
                                                    globalDescription: convexSeoSettings?.globalDescription || "",
                                                    metaAdsCode: convexSeoSettings?.metaAdsCode || ""
                                                })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Global Keywords (Comma separated)</label>
                                            <textarea
                                                value={metaSettings.global.keywords}
                                                onChange={(e) => updateSeoSettingsMutation({
                                                    ...convexSeoSettings,
                                                    globalKeywords: e.target.value,
                                                    globalTitle: convexSeoSettings?.globalTitle || "",
                                                    globalDescription: convexSeoSettings?.globalDescription || "",
                                                    metaAdsCode: convexSeoSettings?.metaAdsCode || ""
                                                })}
                                                rows={3}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Global Meta Description</label>
                                            <textarea
                                                value={metaSettings.global.description}
                                                onChange={(e) => updateSeoSettingsMutation({
                                                    ...convexSeoSettings,
                                                    globalDescription: e.target.value,
                                                    globalTitle: convexSeoSettings?.globalTitle || "",
                                                    globalKeywords: convexSeoSettings?.globalKeywords || "",
                                                    metaAdsCode: convexSeoSettings?.metaAdsCode || ""
                                                })}
                                                rows={3}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Meta Ads / Tracking Pixels (Head Scripts)</label>
                                        <textarea
                                            value={metaSettings.global.metaAdsCode}
                                            onChange={(e) => updateSeoSettingsMutation({
                                                ...convexSeoSettings,
                                                metaAdsCode: e.target.value,
                                                globalTitle: convexSeoSettings?.globalTitle || "",
                                                globalKeywords: convexSeoSettings?.globalKeywords || "",
                                                globalDescription: convexSeoSettings?.globalDescription || ""
                                            })}
                                            rows={12}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontFamily: "monospace", fontSize: "12px" }}
                                            placeholder="Paste your Meta Pixel or Ad scripts here..."
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        updateSeoSettingsMutation({
                                            ...convexSeoSettings,
                                            globalTitle: metaSettings.global.title,
                                            globalKeywords: metaSettings.global.keywords,
                                            globalDescription: metaSettings.global.description,
                                            metaAdsCode: metaSettings.global.metaAdsCode
                                        });
                                        alert("Global Meta Settings Saved!");
                                    }}
                                    style={{ marginTop: "20px", backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                                    Save Global Settings
                                </button>
                            </div>

                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                    <Megaphone size={20} color="#f97316" />
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Event-Specific Meta Ads Management</h3>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Event Title</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Category</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Meta Keywords</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Meta Ad ID / Tracking</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allEvents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: t.textSub, fontSize: "14px" }}>No events yet. Add events on the Homepage data or create them in the Organiser panel.</td>
                                                </tr>
                                            ) : allEvents.map((ev) => {
                                                const isOrganiser = ev.source === "organiser";
                                                const keywords = isOrganiser ? (ev.meta?.keywords ?? "") : (eventMetaOverrides[ev.id]?.keywords ?? "");
                                                const adsId = isOrganiser ? (ev.meta?.adsId ?? "") : (eventMetaOverrides[ev.id]?.adsId ?? "");
                                                return (
                                                    <tr key={(ev.id ?? "") + (ev.source || "")} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                        <td style={{ padding: "12px", fontWeight: 600 }}>{ev.title}</td>
                                                        <td style={{ padding: "12px" }}>
                                                            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#3b82f615", color: "#3b82f6" }}>{ev.category || "—"}</span>
                                                        </td>
                                                        <td style={{ padding: "12px" }}>
                                                            <input
                                                                type="text"
                                                                value={keywords}
                                                                onChange={(e) => isOrganiser
                                                                    ? setEvents(events.map(event => event.id === ev.id ? { ...event, meta: { ...(event.meta || {}), keywords: e.target.value } } : event))
                                                                    : setEventMetaOverrides(prev => ({ ...prev, [ev.id]: { ...(prev[ev.id] || {}), keywords: e.target.value } }))}
                                                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontSize: "12px" }}
                                                                placeholder="Keywords for SEO/ads"
                                                            />
                                                        </td>
                                                        <td style={{ padding: "12px" }}>
                                                            <input
                                                                type="text"
                                                                value={adsId}
                                                                onChange={(e) => isOrganiser
                                                                    ? setEvents(events.map(event => event.id === ev.id ? { ...event, meta: { ...(event.meta || {}), adsId: e.target.value } } : event))
                                                                    : setEventMetaOverrides(prev => ({ ...prev, [ev.id]: { ...(prev[ev.id] || {}), adsId: e.target.value } }))}
                                                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontSize: "12px" }}
                                                                placeholder="Pixel ID or Ad Set ID"
                                                            />
                                                        </td>
                                                        <td style={{ padding: "12px" }}>
                                                            <button
                                                                onClick={() => alert(`Meta Ads updated for ${ev.title}`)}
                                                                style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                                                                Update
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
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
                                        {convexPages.map((page) => (
                                            <tr key={page._id} style={{ borderBottom: `1px solid ${t.border}` }}>
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
                                                                _id: page._id,
                                                                title: page.title || "",
                                                                slug: page.slug || "",
                                                                content: page.content || "",
                                                                showInFooter: !!page.showInFooter,
                                                                order: page.order || 0
                                                            });
                                                            setPageModal("edit");
                                                        }} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#3b82f6", cursor: "pointer" }}><Edit size={14} /></button>
                                                        <button onClick={() => setPageToDelete(page._id)} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
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
                                        {(Array.isArray(admins) ? admins : []).map((adm) => (
                                            <tr key={adm._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontWeight: 600 }}>{adm.fullName}</td>
                                                <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>{adm.username}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{adm.email}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#3b82f615", color: "#3b82f6", fontWeight: 600 }}>{adm.role.toUpperCase()}</span>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <button 
                                                        onClick={() => updateAdminStatusMutation({ id: adm._id, status: adm.status === "Active" ? "Inactive" : "Active" })}
                                                        style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: adm.status === "Active" ? "#22c55e15" : "#f1f5f9", color: adm.status === "Active" ? "#22c55e" : "#64748b", border: "none", cursor: "pointer", fontWeight: 600 }}
                                                    >
                                                        {adm.status?.toUpperCase() || "ACTIVE"}
                                                    </button>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "12px", color: t.textSub }}>
                                                    {adm.lastLogin ? new Date(adm.lastLogin).toLocaleString() : "Never logged in"}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <button onClick={() => { if(confirm("Delete this admin account?")) deleteAdminMutation({ id: adm._id }) }} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", opacity: 0.7 }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.7}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {admins.length === 0 && (
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
                                <button onClick={() => { setAdPopupForm({ title: "", description: "", imageUrl: "", redirectUrl: "", ctaText: "Book Now", bgColor: "", badgeText: "", isActive: true, showEveryMinutes: 30 }); setAdPopupEditingId(null); setAdPopupImageFile(null); setShowAdPopupForm(true); }} style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Plus size={16} /> New Ad Popup
                                </button>
                            </div>

                            {showAdPopupForm && (
                                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, marginBottom: "20px" }}>{adPopupEditingId ? "Edit Ad Popup" : "Create New Ad Popup"}</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        {[{k:"title",l:"Title *",ph:"e.g. 🎉 Exclusive Offer"},{k:"description",l:"Description",ph:"Short promo text"},{k:"redirectUrl",l:"Redirect URL",ph:"https://..."},{k:"ctaText",l:"CTA Button Text",ph:"e.g. Book Now"},{k:"badgeText",l:"Badge Label",ph:"e.g. 🔥 Limited Offer"},{k:"bgColor",l:"Background Color",ph:"e.g. #f84464 or gradient CSS"}].map(({k,l,ph}) => (
                                            <div key={k} style={k==="description" || k==="bgColor" ? { gridColumn: "1 / -1" } : {}}>
                                                <label style={{ fontSize: "13px", fontWeight: 600, color: t.textSub, display: "block", marginBottom: "6px" }}>{l}</label>
                                                <input value={adPopupForm[k]} onChange={e => setAdPopupForm({...adPopupForm, [k]: e.target.value})} placeholder={ph} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", boxSizing: "border-box" }} />
                                            </div>
                                        ))}

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
                                            <button onClick={() => toggleAdPopupMutation({ id: popup._id, isActive: !popup.isActive })} style={{ background: popup.isActive ? "#dcfce7" : "#f1f5f9", color: popup.isActive ? "#16a34a" : t.textSub, border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                                {popup.isActive ? "✓ Active" : "Inactive"}
                                            </button>
                                            <button onClick={() => handleEditAdPopup(popup)} style={{ background: t.activeLink, color: t.activeText, border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteAdPopup(popup._id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
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

                    {(["dashboard", "branding", "categories", "subnav", "events_settings", "event_partners", "pages", "sections", "all_org", "active_org", "banned_org", "email_unverified", "mobile_unverified", "kyc_unverified", "kyc_pending", "with_balance", "org_requests", "send_notif", "payment_settings", "ticket_settings", "email_settings", "email_templates", "disclaimer_settings", "sso_settings", "api_settings", "meta_management", "all_events", "customers", "bookings", "promotions", "financials", "support_tickets", "hero", "video", "admin_management", "ad_popups", "meetings"].includes(activeTab)) ? null : (
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
                                                await createAdminMutation({ ...newAdmin, password: hashed });
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
                                                    const tempPass = await approveOrganiserRequestMutation({
                                                        id: selectedRequestForApproval._id,
                                                        password: manualApprovalPassword.trim() || undefined
                                                    });
                                                    setGeneratedTempPassword(tempPass);
                                                    setShowApprovalModal(false);
                                                    setShowTempPasswordModal(true);
                                                    setManualApprovalPassword("");
                                                } catch (err) {
                                                    alert("Error: " + err.message);
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
                                            alert("Password copied to clipboard!");
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

                    {categoryModal === "add" && (
                        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }} onClick={() => setCategoryModal(null)}>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", width: "380px", border: `1px solid ${t.border}` }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Create a Category</h3>
                                    <button type="button" onClick={() => setCategoryModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub }}><X size={20} /></button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: t.textMain }}>Name</label>
                                        <input type="text" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().trim().replace(/\s+/g, "-") }))} placeholder="e.g. Concert" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: t.textMain }}>Slug</label>
                                        <input type="text" value={categoryForm.slug} onChange={e => setCategoryForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. concert" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: t.textMain }}>Icon (emoji)</label>
                                        <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm(f => ({ ...f, icon: e.target.value || "📁" }))} placeholder="🎫" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#fff" : "#1e293b", color: t.textMain, fontSize: "14px" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                        <button type="button" onClick={() => setCategoryModal(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                                        <button type="button" onClick={() => { const name = (categoryForm.name || "").trim(); const slug = (categoryForm.slug || name.toLowerCase().replace(/\s+/g, "-")).trim(); if (!name) return; const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1; setCategories([...categories, { id: newId, name, slug: slug || "category", count: 0, icon: categoryForm.icon || "📁" }]); setCategoryForm({ name: "", slug: "", icon: "📁" }); setCategoryModal(null); }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
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
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>PAN Number</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.panNumber}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>GSTIN</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.gstin || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Mobile Number</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.mobile}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>City</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.city}</p></div>
                                        <div style={{ gridColumn: "span 2" }}><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Address</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.address || "N/A"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Designation</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.designation}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Has ITR (2 years)?</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.hasITR ? "Yes" : "No"}</p></div>
                                        {selectedKycOrg.kycDetails.websiteLink && <div style={{ gridColumn: "span 2" }}><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Website</p><a href={selectedKycOrg.kycDetails.websiteLink} target="_blank" style={{ fontSize: "14px", fontWeight: 600, color: "#3b82f6", margin: 0, textDecoration: "none" }}>{selectedKycOrg.kycDetails.websiteLink}</a></div>}
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
                                        onClick={() => {
                                            if (confirm("Are you sure you want to REJECT this KYC application?")) {
                                                patchOrganizerMutation({ id: selectedKycOrg.id, kycStatus: 'Rejected' });
                                                setSelectedKycOrg(null);
                                            }
                                        }}
                                        style={{ flex: 1, padding: "14px", borderRadius: "8px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444", fontWeight: 600, cursor: "pointer" }}>
                                        Reject Application
                                    </button>
                                    <button
                                        onClick={() => {
                                            patchOrganizerMutation({ id: selectedKycOrg.id, kycStatus: 'Active' });
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
                                </div>
                                <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                    <button
                                        onClick={async () => {
                                            const balance = parseFloat(String(editingOrg.balance).replace(/[^\d.-]/g, ''));
                                            await patchOrganizerMutation({
                                                id: editingOrg.id,
                                                name: editingOrg.username,
                                                walletBalance: isNaN(balance) ? 0 : balance
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

                    {activeTab === "checkout_footer" && <AdminCheckoutFooter theme={theme} t={t} />}
                    {activeTab === "mobile_banners" && <MobileBannersAdmin theme={theme} t={t} />}

                </main>
            </div>
        </div>
    );
}


