"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { MoreVertical, LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles, CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2, Mail, Lock, CreditCard, Code, Globe, Shield, FileText, Megaphone, Tag, LayoutGrid, Calendar, ShoppingCart, UserCircle, Gift, Send, BarChart3, Archive, MessageCircle, Upload } from "lucide-react";
import { HOME_EVENTS, HERO_BANNER_SLIDES } from "@/app/data/homeEvents";
import { eventMatchesCategory } from "@/app/utils/categoryMatch";

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

function AdminHomePage() {
    const { user, loading, logout } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== "admin")) {
            router.push("/signin");
        }
    }, [user, loading, router]);

    const handleLogout = () => {
        router.push("/signin");
        setTimeout(() => logout(), 100);
    };
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState("light");
    const [isOrganizersOpen, setIsOrganizersOpen] = useState(false);
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
                    copyrightText: "© Copyright 2026 – BookMyTicket. All Rights Reserved.",
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
                supportUrl: "https://www.bookmyticket.com",
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
                from: "noreply@bookmyticket.com"
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
                { title: "Contact Us", slug: "contact-us", content: "<h1>Contact Us</h1><p>Get in touch with us at hello@bookmyticket.in</p>", showInFooter: true, order: 5 },
            ];
            defaults.forEach(d => createPageMutation(d));
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
        from: "noreply@bookmyticket.com"
    }, [convexEmailSettings]);

    // Site Branding
    const convexSiteBranding = useQuery(api.siteBranding.get);
    const updateSiteBrandingMutation = useMutation(api.siteBranding.update);

    const siteBranding = useMemo(() => convexSiteBranding || {
        name: "book my ticket",
        logoColor: "#111111",
        logoUrl: "/logo.png"
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

    const handleSavePage = async () => {
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
    };

    const handleDeletePage = async (id) => {
        if (confirm("Are you sure you want to delete this page?")) {
            await deletePageMutation({ id });
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
        copyrightText: "© Copyright 2026 – BookMyTicket. All Rights Reserved.",
        privacyUrl: "#",
        termsUrl: "#"
    }, allConfig);

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
    const mappedOrganizers = useMemo(() => {
        return convexOrganizers.map(o => ({
            id: o._id,
            username: o.name,
            email: o.userId,
            status: o.kycStatus || "Active",
            balance: `₹${o.walletBalance || 0}`,
            kycDetails: o.kycDetails
        }));
    }, [convexOrganizers]);



    const convexOrganiserRequests = useQuery(api.organiserRequests.list) || [];
    const updateOrganiserRequestStatusMutation = useMutation(api.organiserRequests.updateStatus);
    const approveOrganiserRequestMutation = useMutation(api.organisers.approveRequest);

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

    const deleteEventMutation = useMutation(api.events.deleteEvent);
    const updateEventMutation = useMutation(api.events.updateEvent);
    const setConfigMutation = useMutation(api.systemConfig.setConfig);

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
    }, [convexApiKeys, createApiKeyMutation, allConfig]);



    const colors = {
        light: {
            bg: "#f0f4f8",
            sidebar: "#ffffff",
            header: "#ffffff",
            textMain: "#1e293b",
            textSub: "#64748b",
            cardBg: "#ffffff",
            border: "#e2e8f0",
            activeLink: "#e0f2fe",
            activeText: "#0369a1",
            sidebarBorder: "#f1f5f9"
        },
        dark: {
            bg: "#0f172a",
            sidebar: "#111827",
            header: "#111827",
            textMain: "#ffffff",
            textSub: "#cbd5e1", // Improved clarity from #94a3b8
            cardBg: "#1f2937",
            border: "#374151",
            activeLink: "#0ea5e920",
            activeText: "#38bdf8",
            sidebarBorder: "#1f2937"
        }
    };

    const t = colors[theme];

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
        <div className="admin-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                .admin-container { 
                    display: flex; 
                    min-height: 100vh; 
                    background-color: ${t.bg}; 
                    color: ${t.textMain};
                    font-family: 'Inter', sans-serif;
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
                }
                .main-content {
                    margin-left: 250px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .top-header {
                    height: 64px;
                    background-color: ${t.header};
                    border-bottom: 1px solid ${t.border};
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: 0 50px 50px 0;
                    margin-right: 16px;
                    transition: all 0.2s;
                    border: none;
                    background: none;
                    width: calc(100% - 16px);
                    color: ${t.textSub};
                    text-align: left;
                }
                .sidebar-item.active {
                    background-color: ${t.activeLink};
                    color: ${t.activeText};
                    font-weight: 600;
                    position: relative;
                }
                .sidebar-item.expanded-parent {
                    background-color: #6366f1;
                    color: #ffffff;
                    border-radius: 8px;
                    margin: 8px 12px;
                    width: calc(100% - 24px);
                }
                .submenu {
                    margin-left: 24px;
                    border-left: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 8px;
                }
                .active-sub {
                    color: ${t.activeText} !important;
                    background-color: ${t.activeLink};
                    border-radius: 4px;
                }
                .submenu-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 20px;
                    color: ${theme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)'};
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .submenu-item:hover {
                    color: ${theme === 'dark' ? '#ffffff' : '#000000'};
                    background-color: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
                }
                .badge-orange {
                    background-color: #f97316;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .badge-blue {
                    background-color: #3b82f6;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .dot-icon {
                    width: 6px;
                    height: 6px;
                    border: 1.5px solid currentColor;
                    border-radius: 50%;
                }
                .stat-card {
                    background-color: ${t.cardBg};
                    padding: 16px;
                    border-radius: 10px;
                    border: 1px solid ${t.border};
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                }
                .stat-icon-wrapper {
                   position: absolute;
                   right: 24px;
                   top: 24px;
                   width: 48px;
                   height: 48px;
                   border-radius: 10px;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                }
                .click-to-view {
                    font-size: 12px;
                    color: ${t.textSub};
                    margin-top: 16px;
                    cursor: pointer;
                }
                .section-header {
                    padding: 32px 20px 12px;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    font-weight: 800;
                    color: ${t.textMain};
                    opacity: 0.6;
                }
                @media (max-width: 1024px) {
                    .sidebar { transform: translateX(-100%); }
                    .sidebar.open { transform: translateX(0); }
                    .main-content { margin-left: 0; }
                }
            `}</style>

            <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* Sidebar Navigation */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "10px",
                        padding: '10px 4px',
                    }}>
                        {siteBranding.logoUrl ? (
                            <img
                                src={siteBranding.logoUrl}
                                alt="Logo"
                                style={{
                                    height: "56px",
                                    objectFit: "contain",
                                    maxWidth: "100%",
                                    filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none',
                                    transition: 'filter 0.3s ease'
                                }}
                            />
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg, ${siteBranding.logoColor}, #3b82f6)`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Ticket color="#fff" size={24} weight="bold" />
                                </div>
                                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: t.textMain, letterSpacing: "-0.5px" }}>{siteBranding.name}</h2>
                            </div>
                        )}
                    </div>
                </div>

                <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "24px" }}>
                    {/* Overview */}
                    <p className="section-header">Overview</p>
                    <button onClick={() => setActiveTab("dashboard")} className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab("banner_ads")} className={`sidebar-item ${activeTab === "banner_ads" ? "active" : ""}`}>
                        <Megaphone size={20} /> Banner Ads {bannerRequests.length > 0 && <span className="badge-orange">{bannerRequests.length}</span>}
                    </button>

                    {/* Operations */}
                    <p className="section-header">Operations</p>
                    <button onClick={() => setActiveTab("all_events")} className={`sidebar-item ${activeTab === "all_events" ? "active" : ""}`}>
                        <Calendar size={20} /> Events
                    </button>
                    <button onClick={() => setActiveTab("bookings")} className={`sidebar-item ${activeTab === "bookings" ? "active" : ""}`}>
                        <ShoppingCart size={20} /> Bookings
                    </button>

                    {/* Customers */}
                    <p className="section-header">Customers</p>
                    <button onClick={() => setActiveTab("customers")} className={`sidebar-item ${activeTab === "customers" ? "active" : ""}`}>
                        <UserCircle size={20} /> Customers
                    </button>

                    {/* Growth */}
                    <p className="section-header">Growth</p>
                    <div style={{ marginBottom: "4px" }}>
                        <button
                            onClick={() => setIsGrowthOpen(!isGrowthOpen)}
                            className={`sidebar-item ${isGrowthOpen ? "expanded-parent" : ""}`}
                            style={{ display: "flex", justifyContent: "space-between" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Gift size={20} /> Growth
                            </div>
                            <Menu size={14} style={{ transform: isGrowthOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} />
                        </button>
                        {isGrowthOpen && (
                            <div className="submenu">
                                <div onClick={() => setActiveTab("promotions")} className={`submenu-item ${activeTab === "promotions" ? "active-sub" : ""}`}>
                                    <div className="dot-icon"></div>
                                    <span style={{ flex: 1 }}>Promotions</span>
                                </div>
                                <div onClick={() => setActiveTab("send_notif")} className={`submenu-item ${activeTab === "send_notif" ? "active-sub" : ""}`}>
                                    <div className="dot-icon"></div>
                                    <span style={{ flex: 1 }}>Push Notifications</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Partners */}
                    <p className="section-header">Partners</p>
                    <div style={{ marginBottom: "4px" }}>
                        <button
                            onClick={() => setIsOrganizersOpen(!isOrganizersOpen)}
                            className={`sidebar-item ${isOrganizersOpen ? "expanded-parent" : ""}`}
                            style={{ display: "flex", justifyContent: "space-between" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Users size={20} /> Organizers
                            </div>
                            <Menu size={14} style={{ transform: isOrganizersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} />
                        </button>
                        {isOrganizersOpen && (
                            <div className="submenu">
                                {[
                                    { label: "All Organizers", id: "all_org" },
                                    { label: "Active Organizers", id: "active_org" },
                                    { label: "KYC Pending", id: "kyc_pending" },
                                    { label: "Banned Organizers", id: "banned_org" },
                                    { label: "With Balance", id: "with_balance" },
                                    { label: "Organiser Requests", id: "org_requests" },
                                    { label: "Send Notification", id: "send_notif" },
                                ].map((sub) => (
                                    <div key={sub.id} onClick={() => setActiveTab(sub.id)} className={`submenu-item ${activeTab === sub.id ? "active-sub" : ""}`}>
                                        <div className="dot-icon"></div>
                                        <span style={{ flex: 1 }}>{sub.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reports */}
                    <p className="section-header">Reports</p>
                    <button onClick={() => setActiveTab("support_tickets")} className={`sidebar-item ${activeTab === "support_tickets" ? "active" : ""}`}>
                        <MessageCircle size={20} /> Support Tickets
                    </button>
                    <button onClick={() => setActiveTab("pages")} className={`sidebar-item ${activeTab === "pages" ? "active" : ""}`}>
                        <FileText size={20} /> Pages
                    </button>

                    {/* System */}
                    <p className="section-header">System</p>
                    <div style={{ marginBottom: "4px" }}>
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`sidebar-item ${isSettingsOpen ? "expanded-parent" : ""}`}
                            style={{ display: "flex", justifyContent: "space-between" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Settings size={20} /> Settings
                            </div>
                            <Menu size={14} style={{ transform: isSettingsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} />
                        </button>
                        {isSettingsOpen && (
                            <div className="submenu">
                                {[
                                    { label: "API Keys", id: "api_settings" },
                                    { label: "Payment Gateways", id: "payment_settings" },
                                    { label: "Ticket & Notifications", id: "ticket_settings" },
                                    { label: "Email Integration", id: "email_settings" },
                                    { label: "SEO & Meta", id: "meta_management" },
                                    { label: "Email Templates", id: "email_templates" },
                                    { label: "Disclaimer & Policies", id: "disclaimer_settings" },
                                    { label: "SSO & OAuth2", id: "sso_settings" },
                                ].map((sub) => (
                                    <div key={sub.id} onClick={() => setActiveTab(sub.id)} className={`submenu-item ${activeTab === sub.id ? "active-sub" : ""}`}>
                                        <div className="dot-icon"></div>
                                        <span style={{ flex: 1 }}>{sub.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: "4px" }}>
                        <button
                            onClick={() => setIsHomeSettingsOpen(!isHomeSettingsOpen)}
                            className={`sidebar-item ${isHomeSettingsOpen ? "expanded-parent" : ""}`}
                            style={{ display: "flex", justifyContent: "space-between" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Globe size={20} /> Home Page
                            </div>
                            <Menu size={14} style={{ transform: isHomeSettingsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} />
                        </button>
                        {isHomeSettingsOpen && (
                            <div className="submenu">
                                {[
                                    { label: "Hero Banner (Slides)", id: "hero" },
                                    { label: "Video Banner & Content", id: "video_banner" },
                                    { label: "Branding", id: "branding" },
                                    { label: "Featured Events", id: "events_settings" },
                                    { label: "Event Partners", id: "event_partners" },
                                    { label: "Recent Memories", id: "memories" },
                                    { label: "Sections Order", id: "sections" },
                                    { label: "Copyright & Footer", id: "copyright" },
                                    { label: "SEO & Meta Ads", id: "meta_management" },
                                ].map((sub) => (
                                    <div key={sub.id} onClick={() => setActiveTab(sub.id)} className={`submenu-item ${activeTab === sub.id ? "active-sub" : ""}`}>
                                        <div className="dot-icon"></div>
                                        <span style={{ flex: 1 }}>{sub.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {[
                        { id: "categories", icon: LayoutGrid, label: "Categories" },
                    ].map((item) => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}>
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}

                    <div style={{ marginTop: "24px", borderTop: `1px solid ${t.sidebarBorder}`, paddingTop: "12px" }}>
                        <button className="sidebar-item"><UserCircle size={20} /> Profile</button>
                        <button className="sidebar-item" style={{ color: "#ef4444" }} onClick={handleLogout}><X size={20} /> Logout</button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="top-header">
                    <div>
                        <h1 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: 0 }}>
                            {activeTab === "dashboard" ? "Dashboard" : activeTab === "all_events" ? "Events" : activeTab === "bookings" ? "Bookings" : activeTab === "customers" ? "Customers" : activeTab === "promotions" ? "Promotions" : activeTab === "financials" ? "Financials" : activeTab === "support_tickets" ? "Support Tickets" : activeTab === "categories" ? "Event Categories" : activeTab === "video_banner" ? "Video Banner & Content" : activeTab === "copyright" ? "Copyright & Footer" : activeTab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </h1>
                        <p style={{ fontSize: "12px", color: t.textSub, margin: 0, opacity: 0.8 }}>
                            {activeTab === "dashboard" ? "Overview & stats" : activeTab === "all_events" ? "Create, edit, or archive events" : activeTab === "bookings" ? "Search and manage ticket orders" : activeTab === "customers" ? "User history and contact info" : activeTab === "promotions" ? "Coupon codes and BOGO offers" : activeTab === "send_notif" ? "Send alerts and reminders" : activeTab === "financials" ? "Export CSV/PDF for accounting" : activeTab === "support_tickets" ? "View and manage organiser support tickets; status changes notify organiser by email" : activeTab === "api_settings" || activeTab === "payment_settings" ? "API keys, payment gateway, SEO" : activeTab === "ticket_settings" ? "Ticket format, logo, send workflow (SMS, Email, WhatsApp PDF)" : activeTab === "categories" ? "Manage event categories" : ""}
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "none", alignItems: "center", gap: "8px", padding: "6px 12px", border: `1px solid ${t.border}`, borderRadius: "6px", color: t.textSub, fontSize: "13px" }}>
                            Select an option <Menu size={14} />
                        </div>
                        <button style={{ color: t.activeText, background: t.activeLink, border: `1px solid ${t.activeText}40`, padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Bell size={16} /> Refresh
                        </button>
                    </div>
                </header>

                {activeTab === "categories" && (
                    <div style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: theme === "light" ? "#f8fafc" : "#1e293b", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: t.textSub }}>Event Categories</span>
                        <button
                            onClick={() => setCategoryModal("add")}
                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}
                        >
                            <Plus size={18} /> Create a Category
                        </button>
                    </div>
                )}

                <main className="admin-main" style={{ padding: "20px", width: "100%" }}>
                    {(activeTab === "hero" || activeTab === "video" || activeTab === "video_banner" || activeTab === "copyright" || activeTab === "events_settings" || activeTab === "event_partners" || activeTab === "sections" || activeTab === "branding" || activeTab === "email_settings" || activeTab === "email_templates" || activeTab === "disclaimer_settings" || activeTab === "sso_settings" || activeTab === "payment_settings" || activeTab === "api_settings" || activeTab === "ticket_settings") && (
                        <div style={{ display: "flex", gap: "8px", backgroundColor: theme === 'light' ? "#fff" : t.cardBg, padding: "6px", borderRadius: "10px", border: `1px solid ${t.border}`, marginBottom: "20px", overflowX: "auto" }}>
                            {(["email_settings", "email_templates", "disclaimer_settings", "sso_settings", "payment_settings", "api_settings", "ticket_settings"].includes(activeTab) ? [
                                { id: "email_settings", label: "Email SMTP", icon: Mail },
                                { id: "email_templates", label: "Templates", icon: ImageIcon },
                                { id: "disclaimer_settings", label: "Disclaimer", icon: Shield },
                                { id: "sso_settings", label: "SSO / OAuth2", icon: Lock },
                                { id: "payment_settings", label: "Payments", icon: CreditCard },
                                { id: "ticket_settings", label: "Ticket & Notifications", icon: Ticket },
                                { id: "api_settings", label: "API Keys", icon: Code },
                            ] : [
                                { id: "hero", label: "Hero Slides", icon: ImageIcon },
                                { id: "video_banner", label: "Video Banner", icon: Video },
                                { id: "branding", label: "Branding", icon: Sparkles },
                                { id: "events_settings", label: "Featured Events", icon: Ticket },
                                { id: "event_partners", label: "Event Partners", icon: Users },
                                { id: "memories", label: "Recent Memories", icon: ImageIcon },
                                { id: "sections", label: "Sections Order", icon: LayoutDashboard },
                                { id: "copyright", label: "Copyright & Footer", icon: FileText },
                                { id: "meta_management", label: "SEO & Ads", icon: Globe },
                            ]).map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="tab-btn"
                                    style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: activeTab === tab.id ? (theme === 'light' ? "#eff6ff" : "#1e293b") : "transparent", color: activeTab === tab.id ? "#3b82f6" : t.textSub, whiteSpace: "nowrap" }}>
                                    <tab.icon size={18} /> <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {activeTab === "dashboard" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
                            {[
                                { label: "TOTAL EVENTS", value: dashboardStats ? dashboardStats.totalEvents.toString() : "…", color: "#0ea5e9", icon: Ticket },
                                { label: "TOTAL REVENUE", value: dashboardStats ? `₹${dashboardStats.totalRevenue.toLocaleString()}` : "…", color: "#22c55e", icon: LayoutDashboard },
                                { label: "TOTAL CUSTOMERS", value: dashboardStats ? dashboardStats.totalUsers.toString() : "…", color: "#f59e0b", icon: Users },
                                { label: "TOTAL ORGANIZERS", value: dashboardStats ? dashboardStats.totalOrganisers.toString() : "…", color: "#10b981", icon: Users },
                                { label: "TOTAL TICKETS SOLD", value: dashboardStats ? dashboardStats.totalTickets.toString() : "…", color: "#8b5cf6", icon: Ticket },
                                { label: "TOTAL BOOKINGS", value: dashboardStats ? dashboardStats.totalBookings.toString() : "…", color: "#ec4899", icon: ShoppingCart },
                            ].map((stat, i) => (
                                <div key={i} className="stat-card" style={{ backgroundColor: theme === 'light' ? `${stat.color}05` : `${stat.color}15`, borderLeft: `4px solid ${stat.color}` }}>
                                    <div className="stat-icon-wrapper" style={{ backgroundColor: stat.color, width: "36px", height: "36px", right: "12px", top: "12px" }}>
                                        <stat.icon size={16} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: "10px", fontWeight: 800, color: t.textSub, opacity: 0.9 }}>{stat.label}</span>
                                    <span style={{ fontSize: "22px", fontWeight: 800, color: stat.color, margin: "4px 0" }}>{stat.value}</span>
                                    <span className="click-to-view" style={{ fontSize: "10px", marginTop: "8px" }}>View Details</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "dashboard" && (() => {
                        const categoryLabels = ["Music", "Sports", "Theatre", "Comedy", "Fest"];
                        const byCat = categoryLabels.map(label => allEvents.filter(e => (e.category || "").toLowerCase().includes(label.toLowerCase())).length);
                        const maxCat = Math.max(1, ...byCat);
                        const paidCount = allEvents.filter(e => (e.type || "").toLowerCase() === "paid").length;
                        const paidPct = allEvents.length ? Math.round((paidCount / allEvents.length) * 100) : 0;
                        return (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Bookings by Category</h3>
                                    <div style={{ height: "140px", display: "flex", alignItems: "flex-end", gap: "16px", padding: "0 10px" }}>
                                        {byCat.map((count, i) => (
                                            <div key={i} style={{ flex: 1, height: `${(count / maxCat) * 100}%`, backgroundColor: "#3b82f6", borderRadius: "3px 3px 0 0", minHeight: count ? "8px" : "0" }}></div>
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "11px", color: t.textSub }}>
                                        {categoryLabels.map((l, i) => <span key={i}>{l}</span>)}
                                    </div>
                                </div>
                                <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Events by Type</h3>
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "140px" }}>
                                        <div style={{ width: "110px", height: "110px", borderRadius: "50%", background: `conic-gradient(#3b82f6 0deg, #3b82f6 ${paidPct * 3.6}deg, ${t.border} ${paidPct * 3.6}deg)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <div style={{ width: "74px", height: "74px", borderRadius: "50%", backgroundColor: t.cardBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "absolute" }}>
                                                <span style={{ fontSize: "18px", fontWeight: 800 }}>{paidPct}%</span>
                                                <p style={{ margin: 0, fontSize: "11px", color: t.textSub }}>Paid</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

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
                                    <a href="/organiser" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px", textDecoration: "none" }}><Plus size={18} /> Create event</a>
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
                                <button onClick={handleCreatePromotion} style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><Plus size={18} /> Create promotion</button>
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
                                <button onClick={() => window.print()} style={{ padding: "12px 24px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><FileText size={18} /> Export PDF (print)</button>
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
                                <button onClick={addSlide} className="tab-btn" style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
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
                                        style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
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

                    {activeTab === "branding" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Site Branding & Logo</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Site Name</label>
                                        <input
                                            type="text"
                                            value={siteBranding.name}
                                            onChange={(e) => updateSiteBrandingMutation({ ...siteBranding, name: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Logo URL</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. /logo.png or https://..."
                                            value={siteBranding.logoUrl}
                                            onChange={(e) => updateSiteBrandingMutation({ ...siteBranding, logoUrl: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Logomark Color</label>
                                        <input
                                            type="color"
                                            value={siteBranding.logoColor}
                                            onChange={(e) => updateSiteBrandingMutation({ ...siteBranding, logoColor: e.target.value })}
                                            style={{ width: "60px", height: "40px", padding: "2px", borderRadius: "4px", border: "none", cursor: "pointer" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Logo Preview</label>
                                    <div style={{ padding: "40px", border: `2px dashed ${t.border}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b' }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            {siteBranding.logoUrl ? (
                                                <img
                                                    src={siteBranding.logoUrl}
                                                    alt="Logo"
                                                    style={{
                                                        height: "80px",
                                                        objectFit: "contain",
                                                        filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{ width: "48px", height: "48px", background: `linear-gradient(135deg, ${siteBranding.logoColor}, #3b82f6)`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 15px rgba(37, 99, 235, 0.3)" }}>
                                                        <Ticket color="#fff" size={28} />
                                                    </div>
                                                    <span style={{ fontSize: "24px", fontWeight: 800, color: "#111" }}>{siteBranding.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "12px", color: t.textSub, marginTop: "12px" }}>Logo images with transparent backgrounds work best.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {["all_org", "active_org", "banned_org", "email_unverified", "mobile_unverified", "kyc_unverified", "kyc_pending", "with_balance"].includes(activeTab) && (
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
                                <div className="table-container" style={{ position: "relative" }}>
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
                                                if (activeTab === "active_org") return org.status === "Active";
                                                if (activeTab === "banned_org") return org.status === "Banned";
                                                if (activeTab === "kyc_pending") return ["KYC Pending", "Pending", "Submitted"].includes(org.status);
                                                if (activeTab === "with_balance") return parseFloat(String(org.balance).replace(/[^\d.-]/g, '')) > 0;
                                                if (activeTab === "email_unverified") return org.id % 2 === 0;
                                                if (activeTab === "mobile_unverified") return org.id % 3 === 0;
                                                if (activeTab === "kyc_unverified") return !["KYC Pending", "Pending", "Submitted", "Active"].includes(org.status);
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
                                                                org.status === 'Active' ? '#22c55e15' :
                                                                    org.status === 'Banned' ? '#ef444415' :
                                                                        (org.status === 'KYC Pending' || org.status === 'Pending' || org.status === 'Submitted') ? '#f9731615' : '#64748b15',
                                                            color:
                                                                org.status === 'Active' ? '#22c55e' :
                                                                    org.status === 'Banned' ? '#ef4444' :
                                                                        (org.status === 'KYC Pending' || org.status === 'Pending' || org.status === 'Submitted') ? '#f97316' : t.textSub
                                                        }}>
                                                            {(org.status === 'Pending' || org.status === 'Submitted') ? 'KYC PENDING' : org.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px", color: t.textMain, fontSize: "13px", fontWeight: 600 }}>{org.balance}</td>
                                                    <td style={{ padding: "12px", position: "relative" }}>
                                                        <button onClick={() => setOpenActionDropdown(openActionDropdown === org.id ? null : org.id)} style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        {openActionDropdown === org.id && (
                                                            <div style={{ position: "absolute", right: "20px", top: "45px", backgroundColor: theme === 'light' ? '#fff' : '#1e293b', border: `1px solid ${t.border}`, borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, width: "160px", overflow: "hidden" }}>
                                                                <button style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: t.textMain, fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                    <Save size={16} /> Edit Profile
                                                                </button>
                                                                {(org.status === 'KYC Pending' || org.status === 'Pending' || org.status === 'Submitted' || org.status === 'Start Onboarding') && (
                                                                    <>
                                                                        <button onClick={() => { setSelectedKycOrg(org); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#3b82f6", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                            <FileText size={16} /> View KYC
                                                                        </button>

                                                                        <button onClick={() => {
                                                                            patchOrganizerMutation({ id: org.id, kycStatus: 'Active' });
                                                                            setOpenActionDropdown(null);
                                                                        }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#22c55e", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                            <CheckCircle size={16} /> Approve KYC
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {org.status === 'Active' && (
                                                                    <button onClick={() => { patchOrganizerMutation({ id: org.id, kycStatus: 'Banned' }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#f97316", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <Bell size={16} /> Ban User
                                                                    </button>
                                                                )}
                                                                {org.status === 'Banned' && (
                                                                    <button onClick={() => { patchOrganizerMutation({ id: org.id, kycStatus: 'Active' }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#22c55e", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                        <CheckCircle size={16} /> Unban User
                                                                    </button>
                                                                )}
                                                                <button onClick={() => { patchOrganizerMutation({ id: org.id, kycStatus: 'Rejected' }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                                    <X size={16} /> Reject User
                                                                </button>
                                                                <div style={{ borderTop: `1px solid ${t.border}`, margin: "4px 0" }}></div>
                                                                <button onClick={() => { removeOrganizerMutation({ id: org.id }); setOpenActionDropdown(null); }} style={{ width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#334155'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
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
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Organiser Requests</h3>
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
                                        {convexOrganiserRequests.map((req) => (
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
                                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                        {req.status === 'Pending' && (
                                                            <div style={{ position: "relative" }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenRequestActionId(openRequestActionId === req._id ? null : req._id);
                                                                    }}
                                                                    style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: t.textSub, cursor: "pointer" }}
                                                                >
                                                                    <MoreVertical size={16} />
                                                                </button>

                                                                {openRequestActionId === req._id && (
                                                                    <div style={{
                                                                        position: "absolute",
                                                                        right: 0,
                                                                        top: "100%",
                                                                        marginTop: "4px",
                                                                        backgroundColor: t.cardBg,
                                                                        border: `1px solid ${t.border}`,
                                                                        borderRadius: "8px",
                                                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                                        zIndex: 100,
                                                                        minWidth: "120px",
                                                                        overflow: "hidden"
                                                                    }}>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedRequestForApproval(req);
                                                                                setShowApprovalModal(true);
                                                                                setOpenRequestActionId(null);
                                                                            }}
                                                                            style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", color: "#22c55e", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                                                        >
                                                                            <CheckCircle size={14} /> Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                try {
                                                                                    await updateOrganiserRequestStatusMutation({ id: req._id, status: 'Rejected' });
                                                                                    setOpenRequestActionId(null);
                                                                                } catch (err) {
                                                                                    alert('Error rejecting: ' + err.message);
                                                                                }
                                                                            }}
                                                                            style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderTop: `1px solid ${t.border}` }}
                                                                        >
                                                                            <X size={14} /> Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
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
                                                value={emailSettings.smtpHost || ""}
                                                onChange={(e) => updateEmailSettingsMutation({ ...emailSettings, smtpHost: e.target.value })}
                                                placeholder="smtp.office365.com"
                                                style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>SMTP Port <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input
                                            type="text"
                                            value={emailSettings.smtpPort || ""}
                                            onChange={(e) => updateEmailSettingsMutation({ ...emailSettings, smtpPort: e.target.value })}
                                            placeholder="587"
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                        />
                                    </div>

                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Encryption <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none", cursor: "pointer" }}>
                                            <option>TLS (Required for Office365)</option>
                                            <option>SSL</option>
                                            <option>None</option>
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Authentication Method</label>
                                        <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none", cursor: "pointer" }}>
                                            <option>App Password</option>
                                            <option>Basic Authentication</option>
                                            <option>None</option>
                                        </select>
                                    </div>

                                    <div style={{ position: "relative" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Username <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <div style={{ position: "relative" }}>
                                            <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub, opacity: 0.7 }} />
                                            <input
                                                type="text"
                                                value={emailSettings.smtpUser || ""}
                                                onChange={(e) => updateEmailSettingsMutation({ ...emailSettings, smtpUser: e.target.value })}
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
                                                value={emailSettings.smtpPass || ""}
                                                onChange={(e) => updateEmailSettingsMutation({ ...emailSettings, smtpPass: e.target.value })}
                                                placeholder="••••••••"
                                                style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>From Email <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input
                                            type="text"
                                            value={emailSettings.fromEmail || ""}
                                            onChange={(e) => updateEmailSettingsMutation({ ...emailSettings, fromEmail: e.target.value })}
                                            placeholder="noreply@example.com"
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>From Name <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input
                                            type="text"
                                            value={emailSettings.fromName || ""}
                                            onChange={(e) => updateEmailSettingsMutation({ ...emailSettings, fromName: e.target.value })}
                                            placeholder="Ticketing Tool"
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }}
                                        />
                                    </div>

                                    <div style={{ gridColumn: "span 2", marginTop: "12px", display: "flex", gap: "12px" }}>
                                        <button style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"} onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}>
                                            Save Email Settings
                                        </button>
                                        <button
                                            onClick={() => alert("Verification mail sent! Please check your inbox.")}
                                            style={{ backgroundColor: "transparent", color: "#3b82f6", border: "1px solid #3b82f6", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = "#3b82f610"}
                                            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                                        >
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
                                                        <button onClick={() => { setPageForm(page); setPageModal("edit"); }} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#3b82f6", cursor: "pointer" }}><Save size={14} /></button>
                                                        <button onClick={() => handleDeletePage(page._id)} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
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
                        </div>
                    )}

                    {(!["dashboard", "branding", "categories", "subnav", "events_settings", "event_partners", "pages", "sections", "all_org", "active_org", "banned_org", "email_unverified", "mobile_unverified", "kyc_unverified", "kyc_pending", "with_balance", "org_requests", "send_notif", "payment_settings", "ticket_settings", "email_settings", "email_templates", "disclaimer_settings", "sso_settings", "api_settings", "meta_management", "all_events", "customers", "bookings", "promotions", "financials", "support_tickets", "hero", "video"].includes(activeTab)) && (
                        <div style={{ backgroundColor: t.cardBg, padding: "60px 24px", textAlign: "center", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                            <Settings color={t.textSub} size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain }}>{activeTab.replace(/_/g, ' ').toUpperCase()}</h2>
                            <p style={{ color: t.textSub, marginTop: "8px", maxWidth: "350px", margin: "8px auto", fontSize: "14px" }}>This management module is currently being configured. You will be able to manage these settings shortly.</p>
                            <button onClick={() => setActiveTab("dashboard")} style={{ marginTop: "24px", padding: "10px 20px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Return to Dashboard</button>
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
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>Organization Details</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px", backgroundColor: t.cardBg, padding: "20px", borderRadius: "8px", border: `1px solid ${t.border}` }}>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Category</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.category}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Full Name</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.fullName}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>PAN Number</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.panNumber}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Mobile Number</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.mobile}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>City</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.city}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Designation</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.designation}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Has ITR (2 years)?</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.hasITR ? "Yes" : "No"}</p></div>
                                        <div><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Has OSTIN?</p><p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedKycOrg.kycDetails.hasOSTIN ? "Yes" : "No"}</p></div>
                                        {selectedKycOrg.kycDetails.websiteLink && <div style={{ gridColumn: "span 2" }}><p style={{ fontSize: "11px", color: t.textSub, margin: "0 0 4px" }}>Website</p><a href={selectedKycOrg.kycDetails.websiteLink} target="_blank" style={{ fontSize: "14px", fontWeight: 600, color: "#3b82f6", margin: 0, textDecoration: "none" }}>{selectedKycOrg.kycDetails.websiteLink}</a></div>}
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

                </main>
            </div >
        </div >
    );
}

