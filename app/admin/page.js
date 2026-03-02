"use client";
import React, { useState, useEffect } from "react";
import { LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles, CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2, Mail, Lock, CreditCard, Code, Globe, Shield } from "lucide-react";

export default function AdminHomePage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [isOrganizersOpen, setIsOrganizersOpen] = useState(true);
    const [isHomeSettingsOpen, setIsHomeSettingsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [organizers, setOrganizers] = useState([
        { id: 1, username: "john_doe", email: "john@example.com", status: "Active", balance: "₹1,200" },
        { id: 2, username: "event_pro", email: "pro@events.com", status: "Banned", balance: "₹0" },
        { id: 3, username: "new_guy", email: "new@example.com", status: "KYC Pending", balance: "₹500" },
        { id: 4, username: "tech_fest", email: "tech@university.edu", status: "Active", balance: "₹25,000" },
        { id: 5, username: "local_gigs", email: "gigs@local.com", status: "Active", balance: "₹3,450" },
        { id: 6, username: "scammer_hub", email: "scam@redflag.com", status: "Banned", balance: "₹0" },
        { id: 7, username: "pending_kyc", email: "audit@test.com", status: "KYC Pending", balance: "₹0" },
    ]);

    const [newOrg, setNewOrg] = useState({ username: "", password: "", email: "" });
    const [notificationForm, setNotificationForm] = useState({ subject: "", message: "", target: "all" });
    const [emailTemplates, setEmailTemplates] = useState([
        { id: "booking", name: "Ticket Booking Confirmation", subject: "Your Tickets for {{event_name}}", autoSend: true },
        { id: "canceled", name: "Ticket Booking Canceled", subject: "Booking Canceled: {{event_name}}", autoSend: true },
        { id: "registration", name: "User Registration", subject: "Welcome to BookMyTicket!", autoSend: true },
        { id: "organiser_welcome", name: "New Organiser Welcome & Credentials", subject: "Your Organiser Account is Ready!", autoSend: true },
        { id: "otp", name: "OTP Verification", subject: "{{otp}} is your verification code", autoSend: true },
    ]);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [disclaimerContent, setDisclaimerContent] = useState({
        booking_header: "Disclaimer: All ticket bookings are final. Please review event details, date, and venue carefully before payment.",
        payment_terms: "By proceeding with the payment, you agree to our Terms of Service and Privacy Policy. Platform fees and taxes are non-refundable.",
        event_disclaimer: "Organizers are solely responsible for event content, performance, and management. BookMyTicket is only a ticketing platform.",
        cancellation_policy: "Refunds are subject to individual event organizer policies. If an event is cancelled, refunds will be processed within 7-10 business days."
    });
    const [ssoConfigs, setSsoConfigs] = useState({
        facebook: false,
        google: false
    });

    useEffect(() => {
        const savedSso = localStorage.getItem('sso_configs');
        if (savedSso) {
            setSsoConfigs(JSON.parse(savedSso));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sso_configs', JSON.stringify(ssoConfigs));
    }, [ssoConfigs]);

    const [siteBranding, setSiteBranding] = useState({
        name: "book my ticket",
        logoColor: "#111111",
        logoUrl: "/logo.png"
    });

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

    const [slides, setSlides] = useState([
        { id: 1, url: "/events/chennai-concert", alt: "Slide Event 1", img: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=300&h=200&fit=crop" },
        { id: 2, url: "/events/chennai-concert", alt: "Slide Event 2", img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=300&h=200&q=80" },
        { id: 3, url: "/events/chennai-concert", alt: "Slide Event 3", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&h=200&q=80" }
    ]);
    const [subnavItems, setSubnavItems] = useState([
        { id: 1, label: "Concert", icon: "🎫" },
        { id: 2, label: "Sports", icon: "🏆" },
        { id: 3, label: "Comedy", icon: "🎭" },
        { id: 4, label: "Theatre", icon: "🎭" },
        { id: 5, label: "Music", icon: "🎵" },
        { id: 6, label: "Workshop", icon: "🎪" },
        { id: 7, label: "Festival", icon: "🎡" },
        { id: 8, label: "Live Shows", icon: "🎬" }
    ]);
    const [categories, setCategories] = useState([
        { id: 1, name: "Concert", slug: "concert", count: 24, icon: "🎫" },
        { id: 2, name: "Sports", slug: "sports", count: 12, icon: "🏆" },
        { id: 3, name: "Comedy", slug: "comedy", count: 8, icon: "🎭" },
        { id: 4, name: "Theatre", slug: "theatre", count: 5, icon: "🎭" },
        { id: 5, name: "Music", slug: "music", count: 15, icon: "🎵" },
        { id: 6, name: "Workshop", slug: "workshop", count: 7, icon: "🎪" }
    ]);

    const addSlide = () => {
        const newId = slides.length > 0 ? Math.max(...slides.map(s => s.id)) + 1 : 1;
        setSlides([...slides, {
            id: newId,
            url: "",
            alt: `New Slide ${newId}`,
            img: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=300&h=200&fit=crop"
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
                        justifyContent: "center",
                        gap: "10px",
                        background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        padding: '12px 10px',
                        borderRadius: '12px',
                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
                    }}>
                        {siteBranding.logoUrl ? (
                            <img
                                src={siteBranding.logoUrl}
                                alt="Logo"
                                style={{
                                    height: "44px",
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
                    <button onClick={() => setActiveTab("dashboard")} className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab("reports")} className={`sidebar-item ${activeTab === "reports" ? "active" : ""}`}>
                        <Users size={20} /> Reports
                    </button>

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
                                    { label: "Email Integration", id: "email_settings" },
                                    { label: "Email Templates", id: "email_templates" },
                                    { label: "Disclaimer & Policies", id: "disclaimer_settings" },
                                    { label: "SSO & OAuth2", id: "sso_settings" },
                                    { label: "Payment Gateways", id: "payment_settings" },
                                    { label: "API Configuration", id: "api_settings" },
                                ].map((sub) => (
                                    <div key={sub.id} onClick={() => setActiveTab(sub.id)} className={`submenu-item ${activeTab === sub.id ? "active-sub" : ""}`}>
                                        <div className="dot-icon"></div>
                                        <span style={{ flex: 1 }}>{sub.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="section-header">Administration</p>

                    {/* Organizers Menu matching Image */}
                    <div style={{ marginBottom: "4px" }}>
                        <button
                            onClick={() => setIsOrganizersOpen(!isOrganizersOpen)}
                            className={`sidebar-item ${isOrganizersOpen ? "expanded-parent" : ""}`}
                            style={{ display: "flex", justifyContent: "space-between" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Users size={20} /> Organizers
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="badge-orange">!</span>
                                <Menu size={14} style={{ transform: isOrganizersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} />
                            </div>
                        </button>

                        {isOrganizersOpen && (
                            <div className="submenu">
                                {[
                                    { label: "Active Organizers", id: "active_org" },
                                    { label: "Banned Organizers", id: "banned_org" },
                                    { label: "Email Unverified", id: "email_unverified" },
                                    { label: "Mobile Unverified", id: "mobile_unverified" },
                                    { label: "KYC Unverified", id: "kyc_unverified", badge: "9" },
                                    { label: "KYC Pending", id: "kyc_pending" },
                                    { label: "With Balance", id: "with_balance" },
                                    { label: "All Organizers", id: "all_org" },
                                    { label: "Send Notification", id: "send_notif" },
                                ].map((sub) => (
                                    <div key={sub.id} onClick={() => setActiveTab(sub.id)} className={`submenu-item ${activeTab === sub.id ? "active-sub" : ""}`}>
                                        <div className="dot-icon"></div>
                                        <span style={{ flex: 1 }}>{sub.label}</span>
                                        {sub.badge && <span className="badge-blue">{sub.badge}</span>}
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
                                <Settings size={20} /> Home Page Settings
                            </div>
                            <Menu size={14} style={{ transform: isHomeSettingsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} />
                        </button>

                        {isHomeSettingsOpen && (
                            <div className="submenu">
                                {[
                                    { label: "Branding", id: "branding" },
                                    { label: "Sub Nav Bar", id: "subnav" },
                                    { label: "Featured Events", id: "events_settings" },
                                    { label: "Sections Order", id: "sections" },
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
                        { id: "categories", icon: LayoutDashboard, label: "Categories" },
                    ].map((item) => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}>
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}

                    <div style={{ marginTop: "24px", borderTop: `1px solid ${t.sidebarBorder}`, paddingTop: "12px" }}>
                        <button className="sidebar-item"><Users size={20} /> Profile</button>
                        <button className="sidebar-item" style={{ color: "#ef4444" }}><X size={20} /> Logout</button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="top-header">
                    <div>
                        <h1 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: 0 }}>Dashboard</h1>
                        <p style={{ fontSize: "12px", color: t.textSub, margin: 0, opacity: 0.8 }}>Overview & stats</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "none", alignItems: "center", gap: "8px", padding: "6px 12px", border: `1px solid ${t.border}`, borderRadius: "6px", color: t.textSub, fontSize: "13px" }}>
                            Select an option <Menu size={14} />
                        </div>
                        <button onClick={toggleTheme} style={{ background: t.activeLink, color: t.activeText, border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" }}>
                            {theme === 'light' ? <Sparkles size={16} /> : <ImageIcon size={16} />}
                        </button>
                        <button style={{ color: t.activeText, background: t.activeLink, border: `1px solid ${t.activeText}40`, padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Bell size={16} /> Refresh
                        </button>
                    </div>
                </header>

                <main className="admin-main" style={{ padding: "20px", width: "100%" }}>
                    {(activeTab === "hero" || activeTab === "video" || activeTab === "subnav" || activeTab === "events_settings" || activeTab === "sections" || activeTab === "branding" || activeTab === "email_settings" || activeTab === "email_templates" || activeTab === "disclaimer_settings" || activeTab === "sso_settings" || activeTab === "payment_settings" || activeTab === "api_settings") && (
                        <div style={{ display: "flex", gap: "8px", backgroundColor: theme === 'light' ? "#fff" : t.cardBg, padding: "6px", borderRadius: "10px", border: `1px solid ${t.border}`, marginBottom: "20px", overflowX: "auto" }}>
                            {(["email_settings", "email_templates", "disclaimer_settings", "sso_settings", "payment_settings", "api_settings"].includes(activeTab) ? [
                                { id: "email_settings", label: "Email SMTP", icon: Mail },
                                { id: "email_templates", label: "Templates", icon: ImageIcon },
                                { id: "disclaimer_settings", label: "Disclaimer", icon: Shield },
                                { id: "sso_settings", label: "SSO / OAuth2", icon: Lock },
                                { id: "payment_settings", label: "Payments", icon: CreditCard },
                                { id: "api_settings", label: "API Keys", icon: Code },
                            ] : [
                                { id: "branding", label: "Branding", icon: Sparkles },
                                { id: "subnav", label: "Sub Nav Bar", icon: Sparkles },
                                { id: "events_settings", label: "Featured Events", icon: Ticket },
                                { id: "sections", label: "Sections Order", icon: Menu },
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
                                { label: "TOTAL EVENTS", value: "124", color: "#0ea5e9", icon: Ticket },
                                { label: "TOTAL REVENUE", value: "₹45,200", color: "#22c55e", icon: LayoutDashboard },
                                { label: "TOTAL ORGANIZERS", value: "15", color: "#10b981", icon: Users },
                                { label: "PAYOUTS PENDING", value: "3", color: "#64748b", icon: LayoutDashboard },
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

                    {activeTab === "dashboard" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Bookings by Category</h3>
                                <div style={{ height: "140px", display: "flex", alignItems: "flex-end", gap: "16px", padding: "0 10px" }}>
                                    {[60, 40, 80, 50, 70, 45].map((h, i) => (
                                        <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: "#3b82f6", borderRadius: "3px 3px 0 0" }}></div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "11px", color: t.textSub }}>
                                    <span>Music</span><span>Sports</span><span>Theatre</span><span>Comedy</span><span>Fest</span>
                                </div>
                            </div>
                            <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Events by Type</h3>
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "140px" }}>
                                    <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: "18px solid #3b82f6", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ textAlign: "center" }}>
                                            <span style={{ fontSize: "18px", fontWeight: 800 }}>72%</span>
                                            <p style={{ margin: 0, fontSize: "11px", color: t.textSub }}>Paid</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "categories" && (
                        <div style={{ backgroundColor: t.cardBg, padding: "16px", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Event Categories</h3>
                                <button style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                                    + Add Category
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
                                        {categories.map((cat) => (
                                            <tr key={cat.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px 16px", fontSize: "18px" }}>{cat.icon}</td>
                                                <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500 }}>{cat.name}</td>
                                                <td style={{ padding: "12px 16px", fontSize: "14px", color: t.textSub }}>{cat.slug}</td>
                                                <td style={{ padding: "12px 16px", fontSize: "14px" }}><span style={{ backgroundColor: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>{cat.count}</span></td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <button style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", marginRight: "12px" }}>Edit</button>
                                                    <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                            onChange={(e) => setSiteBranding({ ...siteBranding, name: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Logo URL</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. /logo.png or https://..."
                                            value={siteBranding.logoUrl}
                                            onChange={(e) => setSiteBranding({ ...siteBranding, logoUrl: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Logomark Color</label>
                                        <input
                                            type="color"
                                            value={siteBranding.logoColor}
                                            onChange={(e) => setSiteBranding({ ...siteBranding, logoColor: e.target.value })}
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
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="tab-btn" style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                                        <Plus size={18} /> Create Organiser
                                    </button>
                                </div>
                            </div>
                            <div style={{ overflowX: "auto" }}>
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
                                        {organizers.filter(org => {
                                            if (activeTab === "active_org") return org.status === "Active";
                                            if (activeTab === "banned_org") return org.status === "Banned";
                                            if (activeTab === "kyc_pending") return org.status === "KYC Pending";
                                            if (activeTab === "with_balance") return parseInt(org.balance.replace(/[^\d]/g, '')) > 0;
                                            // Mock filters for others since we don't have enough data fields
                                            if (activeTab === "email_unverified") return org.id % 2 === 0;
                                            if (activeTab === "mobile_unverified") return org.id % 3 === 0;
                                            if (activeTab === "kyc_unverified") return org.status !== "KYC Pending" && org.status !== "Active";
                                            return true; // all_org
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
                                                                    org.status === 'KYC Pending' ? '#f9731615' : '#64748b15',
                                                        color:
                                                            org.status === 'Active' ? '#22c55e' :
                                                                org.status === 'Banned' ? '#ef4444' :
                                                                    org.status === 'KYC Pending' ? '#f97316' : t.textSub
                                                    }}>
                                                        {org.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px", color: t.textMain, fontSize: "13px", fontWeight: 600 }}>{org.balance}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button title="Edit" style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#3b82f6", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#3b82f610"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}><Save size={14} /></button>
                                                        {org.status === 'KYC Pending' && (
                                                            <>
                                                                <button title="View KYC Details" onClick={() => {
                                                                    alert(`KYC DETAILS FOR ${org.username.toUpperCase()}:\n\n- Org Type: Individual\n- Aadhar: Verified\n- PAN: Verified\n- Venue License: Attached\n- Status: Pending Admin Approval`);
                                                                }} style={{ padding: "6px", borderRadius: "6px", border: `2px solid #3b82f6`, background: "#3b82f615", color: "#3b82f6", cursor: "pointer" }}><FileText size={14} /></button>

                                                                <button title="Approve KYC" onClick={() => {
                                                                    setOrganizers(organizers.map(o => o.id === org.id ? { ...o, status: 'Active' } : o));
                                                                    alert(`Organiser ${org.username} KYC has been approved! They now have full portal access.`);
                                                                }} style={{ padding: "6px", borderRadius: "6px", border: `2px solid #22c55e`, background: "#22c55e15", color: "#22c55e", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#22c55e25"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#22c55e15"}><CheckCircle size={14} /></button>
                                                            </>
                                                        )}
                                                        {org.status === 'Active' && (
                                                            <button title="Ban" onClick={() => setOrganizers(organizers.map(o => o.id === org.id ? { ...o, status: 'Banned' } : o))} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#f97316", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9731610"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}><Bell size={14} /></button>
                                                        )}
                                                        {org.status === 'Banned' && (
                                                            <button title="Activate" onClick={() => setOrganizers(organizers.map(o => o.id === org.id ? { ...o, status: 'Active' } : o))} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#22c55e", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#22c55e10"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}><CheckCircle size={14} /></button>
                                                        )}
                                                        <button title="Reject" onClick={() => setOrganizers(organizers.map(o => o.id === org.id ? { ...o, status: 'Rejected' } : o))} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#ef4444", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#ef444410"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}><X size={14} /></button>
                                                        <button title="Delete" onClick={() => setOrganizers(organizers.filter(o => o.id !== org.id))} style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.border}`, background: "none", color: "#ef4444", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#ef444410"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                                { id: 'all', label: 'All Organisers', count: organizers.length },
                                                { id: 'active', label: 'Active Only', count: organizers.filter(o => o.status === 'Active').length },
                                                { id: 'pending', label: 'KYC Pending', count: organizers.filter(o => o.status === 'KYC Pending').length }
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
                                        onClick={() => {
                                            if (!notificationForm.subject || !notificationForm.message) return alert("Please fill in both subject and message.");
                                            const targetCount = notificationForm.target === 'all' ? organizers.length :
                                                notificationForm.target === 'active' ? organizers.filter(o => o.status === 'Active').length :
                                                    organizers.filter(o => o.status === 'KYC Pending').length;
                                            alert(`Broadcast initiated! Sending notifications to ${targetCount} organisers...`);
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
                                    { name: "Stripe", status: "Connected", desc: "Global payments, Cards, Apple Pay", color: "#6366f1" },
                                    { name: "Razorpay", status: "Inactive", desc: "Cards, UPI, Netbanking (India)", color: "#339af0" },
                                    { name: "PayU", status: "Inactive", desc: "Enterprise checkout & UPI solutions", color: "#a4c639" },
                                    { name: "PhonePe", status: "Inactive", desc: "Direct UPI & merchant payments", color: "#6739b7" },
                                    { name: "Paytm", status: "Connected", desc: "Wallet, UPI & Netbanking payments", color: "#00b9f1" }
                                ].map((gw) => (
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
                                                backgroundColor: gw.status === 'Connected' ? '#22c55e20' : '#f1f5f9',
                                                color: gw.status === 'Connected' ? '#22c55e' : '#64748b'
                                            }}>{gw.status.toUpperCase()}</span>
                                        </div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 700, color: t.textMain, margin: "0 0 6px 0" }}>{gw.name}</h4>
                                        <p style={{ fontSize: "12px", color: t.textSub, margin: "0 0 16px 0", lineHeight: "1.4" }}>{gw.desc}</p>
                                        <button style={{
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
                                        }} onMouseOver={(e) => { e.target.style.backgroundColor = t.bg; }} onMouseOut={(e) => { e.target.style.backgroundColor = "transparent"; }}>
                                            Configure Settings
                                        </button>
                                    </div>
                                ))}
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
                                            <input type="text" placeholder="smtp.office365.com" style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>SMTP Port <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input type="text" placeholder="587" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }} />
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
                                            <input type="text" placeholder="your-email@example.com" style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }} />
                                        </div>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>Password <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <div style={{ position: "relative" }}>
                                            <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub, opacity: 0.7 }} />
                                            <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>From Email <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input type="text" placeholder="noreply@example.com" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: t.textMain }}>From Name <span style={{ color: "#888", fontWeight: "normal" }}>*</span> <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input type="text" placeholder="Ticketing Tool" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontSize: "13px", outline: "none" }} />
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
                                    {activeTemplate ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Edit {activeTemplate.name}</h3>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <span style={{ fontSize: "12px", color: t.textSub }}>Auto-send:</span>
                                                    <button
                                                        onClick={() => setEmailTemplates(emailTemplates.map(t => t.id === activeTemplate.id ? { ...t, autoSend: !t.autoSend } : t))}
                                                        style={{
                                                            width: "44px", height: "22px", borderRadius: "11px",
                                                            backgroundColor: activeTemplate.autoSend ? "#3b82f6" : "#cbd5e1",
                                                            border: "none", cursor: "pointer", position: "relative", transition: "0.3s"
                                                        }}>
                                                        <div style={{
                                                            position: "absolute", top: "2px", left: activeTemplate.autoSend ? "24px" : "2px",
                                                            width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "0.3s"
                                                        }} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Email Subject</label>
                                                <input
                                                    type="text"
                                                    value={activeTemplate.subject}
                                                    onChange={(e) => setEmailTemplates(emailTemplates.map(t => t.id === activeTemplate.id ? { ...t, subject: e.target.value } : t))}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none" }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Message Content (HTML Supported)</label>
                                                <textarea
                                                    rows={10}
                                                    placeholder="HTML content here..."
                                                    defaultValue={`Hello {{user_name}},\n\nYour ticket for {{event_name}} has been confirmed successfully.\nTicket ID: {{ticket_id}}\nBooking Date: {{booking_date}}\n\nThank you for booking with us!`}
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
                                                onClick={() => {
                                                    alert("Template saved successfully!");
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
                                            onChange={(e) => setDisclaimerContent({ ...disclaimerContent, booking_header: e.target.value })}
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
                                            onChange={(e) => setDisclaimerContent({ ...disclaimerContent, payment_terms: e.target.value })}
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
                                                onChange={(e) => setDisclaimerContent({ ...disclaimerContent, event_disclaimer: e.target.value })}
                                                rows={5}
                                                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, outline: "none", fontSize: "13px", lineHeight: "1.5" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: t.textMain }}>Cancellation & Refund Policy</label>
                                            <textarea
                                                value={disclaimerContent.cancellation_policy}
                                                onChange={(e) => setDisclaimerContent({ ...disclaimerContent, cancellation_policy: e.target.value })}
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
                                            onClick={() => setSsoConfigs({ ...ssoConfigs, facebook: !ssoConfigs.facebook })}
                                            style={{
                                                width: "40px",
                                                height: "20px",
                                                backgroundColor: ssoConfigs.facebook ? "#22c55e" : "#e2e8f0",
                                                borderRadius: "20px",
                                                position: "relative",
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
                                            onClick={() => setSsoConfigs({ ...ssoConfigs, google: !ssoConfigs.google })}
                                            style={{
                                                width: "40px",
                                                height: "20px",
                                                backgroundColor: ssoConfigs.google ? "#22c55e" : "#e2e8f0",
                                                borderRadius: "20px",
                                                position: "relative",
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
                                <button style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
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
                                        {[
                                            { label: "Production Mobile App", key: "ak_live_724819...9238", status: "Active" },
                                            { label: "Staging Environment", key: "ak_test_123891...0841", status: "Active" }
                                        ].map((item, i) => (
                                            <tr key={i} style={{ borderBottom: i === 1 ? 'none' : `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px 16px", fontWeight: 600, color: t.textMain }}>{item.label}</td>
                                                <td style={{ padding: "12px 16px", fontFamily: "monospace", color: t.textSub }}>{item.key}</td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#22c55e20", color: "#22c55e", fontWeight: 700 }}>{item.status.toUpperCase()}</span>
                                                </td>
                                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                                    <button style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer", marginRight: "12px", fontSize: "12px" }}>Edit</button>
                                                    <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>Revoke</button>
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

                    {(!["dashboard", "branding", "categories", "subnav", "events_settings", "sections", "all_org", "active_org", "banned_org", "email_unverified", "mobile_unverified", "kyc_unverified", "kyc_pending", "with_balance", "send_notif", "payment_settings", "email_settings", "email_templates", "disclaimer_settings", "sso_settings", "api_settings"].includes(activeTab)) && (
                        <div style={{ backgroundColor: t.cardBg, padding: "60px 24px", textAlign: "center", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                            <Settings color={t.textSub} size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain }}>{activeTab.replace(/_/g, ' ').toUpperCase()}</h2>
                            <p style={{ color: t.textSub, marginTop: "8px", maxWidth: "350px", margin: "8px auto", fontSize: "14px" }}>This management module is currently being configured. You will be able to manage these settings shortly.</p>
                            <button onClick={() => setActiveTab("dashboard")} style={{ marginTop: "24px", padding: "10px 20px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Return to Dashboard</button>
                        </div>
                    )}

                    {showCreateModal && (
                        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", width: "400px", border: `1px solid ${t.border}` }}>
                                <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>Add New Organiser</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", marginBottom: "8px", color: t.textSub }}>Username</label>
                                        <input
                                            type="text"
                                            value={newOrg.username}
                                            onChange={(e) => setNewOrg({ ...newOrg, username: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", marginBottom: "8px", color: t.textSub }}>Email Address</label>
                                        <input
                                            type="email"
                                            value={newOrg.email}
                                            onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", marginBottom: "8px", color: t.textSub }}>Password</label>
                                        <input
                                            type="password"
                                            value={newOrg.password}
                                            onChange={(e) => setNewOrg({ ...newOrg, password: e.target.value })}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                        <button
                                            onClick={() => {
                                                const finalOrg = { ...newOrg, id: Date.now(), status: "Active", balance: "₹0" };
                                                setOrganizers([...organizers, finalOrg]);
                                                setShowCreateModal(false);
                                                alert(`Organiser account created! Login credentials have been sent to ${newOrg.email}`);
                                                setNewOrg({ username: "", password: "", email: "" });
                                            }}
                                            style={{ flex: 1, padding: "12px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
                                            Create Organiser
                                        </button>
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            style={{ flex: 1, padding: "12px", borderRadius: "8px", backgroundColor: "transparent", color: t.textMain, border: `1px solid ${t.border}`, fontWeight: 600, cursor: "pointer" }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div >
        </div >
    );
}

