"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    LayoutDashboard, Settings, Video, Sparkles, Users, Menu, Bell, 
    Mail, Shield, FileText, Megaphone, LayoutGrid, Calendar, 
    ShoppingCart, UserCircle, Gift, Globe, Briefcase, MessageCircle, 
    LogOut, ChevronDown, Search 
} from "lucide-react";

const ACCENT_BLUE = "#3b82f6";
const ACCENT_PURPLE = "#8b5cf6";
const ACCENT_PINK = "#f84464";
const ACCENT_GRADIENT = `linear-gradient(135deg, ${ACCENT_BLUE} 0%, ${ACCENT_PURPLE} 100%)`;

export default function AdminDashboardLayout({ children, activeTab: initialActiveTab }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(initialActiveTab || "dashboard");
    
    // Sidebar expansion states
    const [isHomeSettingsOpen, setIsHomeSettingsOpen] = useState(false);
    const [isOrganizersOpen, setIsOrganizersOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [isGrowthOpen, setIsGrowthOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const homeTabs = ["hero", "mobile_banners", "video_banner", "site_branding", "events_settings", "event_partners", "memories", "sections", "copyright", "meeting_settings", "maintenance"];
        const organizerTabs = ["all_org", "active_org", "kyc_verified", "kyc_pending", "banned_org"];
        const serviceTabs = ["all_turfs", "turf_bookings", "service_active", "service_banned"];
        const growthTabs = ["promotions", "send_notif", "comm_hub"];
        const settingTabs = ["api_settings", "payment_settings", "email_settings", "meta_management", "email_templates", "disclaimer_settings", "sso_settings", "ticket_settings", "comm_hub", "seo_settings", "terms_settings"];

        if (homeTabs.includes(activeTab)) setIsHomeSettingsOpen(true);
        if (organizerTabs.includes(activeTab)) setIsOrganizersOpen(true);
        if (serviceTabs.includes(activeTab)) setIsServicesOpen(true);
        if (growthTabs.includes(activeTab)) setIsGrowthOpen(true);
        if (settingTabs.includes(activeTab)) setIsSettingsOpen(true);
    }, [activeTab]);

    const handleLogout = () => {
        logout();
        router.push("/signin");
    };

    const navigateToTab = (id) => {
        if (id === "seo_settings") {
            router.push('/admin/settings/seo');
        } else if (id === "comm_hub") {
            router.push('/admin/settings/communication');
        } else if (id === "terms_settings") {
            router.push('/admin/settings/terms');
        } else {
            router.push(`/admin?tab=${id}`);
        }
        setActiveTab(id);
    };

    const SidebarItem = ({ id, label, icon: Icon, active }) => (
        <button 
            onClick={() => navigateToTab(id)} 
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all  group relative ${ active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.02]' }`}
        >
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
            className={`w-full flex items-center justify-between px-4 py-2 mt-2 transition-all  group ${isOpen ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <div className="flex items-center space-x-3">
                <Icon size={18} className={isOpen ? "text-pink-500" : "text-slate-300 group-hover:text-slate-400"} strokeWidth={2.5} />
                <span className={`text-[11px] uppercase tracking-[0.2em] whitespace-nowrap ${isOpen ? 'font-black' : 'font-bold'}`}>{label}</span>
            </div>
            <ChevronDown size={14} className={`transition-transform  ${isOpen ? 'rotate-180 text-pink-500' : 'text-slate-300'}`} />
        </button>
    );

    const SidebarSubItem = ({ id, label, active }) => (
        <button 
            onClick={() => navigateToTab(id)} 
            className={`w-full flex items-center space-x-3 px-4 py-1.5 pl-10 rounded-xl transition-all  group ${ active ? 'bg-pink-50 text-pink-600 font-black scale-[1.01]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800' }`}
        >
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-pink-500' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
            <span className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-screen transition-all  ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:flex shadow-2xl shadow-slate-200/50`}>
                <div className="h-16 flex items-center justify-center border-b border-slate-50 bg-white">
                    <div className="flex items-center cursor-pointer" onClick={() => navigateToTab("dashboard")}>
                        <img src="/logo.png" alt="BookMyTicket" className="h-14 w-auto" />
                    </div>
                </div>

                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 relative overflow-hidden group">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">Admin Portal</p>
                    <div className="flex items-center gap-2">

                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Super Admin</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <SidebarGroupTitle title="Home" />
                    <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} active={activeTab === "dashboard"} />
                    <SidebarItem id="partner_requests" label="Partner Requests" icon={Users} active={activeTab === "partner_requests"} />
                    
                    <SidebarCategoryHeader label="Home Page" icon={Globe} isOpen={isHomeSettingsOpen} onClick={() => setIsHomeSettingsOpen(!isHomeSettingsOpen)} />
                    {isHomeSettingsOpen && (
                        <div className="space-y-0.5">
                            {[
                                { label: "Hero Banner", id: "hero" },
                                { label: "Mobile Banners", id: "mobile_banners" },
                                { label: "Video Banner", id: "video_banner" },
                                { label: "Site Branding", id: "site_branding" },
                                { label: "Exclusive Events", id: "exclusive_settings" },
                                { label: "Featured Events", id: "events_settings" },
                                { label: "Event Partners", id: "event_partners" },
                                { label: "Maintenance Mode", id: "maintenance" }
                            ].map(sub => (
                                <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} />
                            ))}
                        </div>
                    )}

                    <SidebarGroupTitle title="Operations" />
                    <SidebarItem id="all_events" label="Events" icon={Calendar} active={activeTab === "all_events"} />
                    <SidebarItem id="bookings" label="Bookings" icon={ShoppingCart} active={activeTab === "bookings"} />

                    <SidebarGroupTitle title="Partners" />
                    <SidebarItem id="customers" label="Customers" icon={UserCircle} active={activeTab === "customers"} />
                    <SidebarItem id="subscribers" label="Subscribers" icon={Mail} active={activeTab === "subscribers"} />

                    <SidebarGroupTitle title="System" />
                    <SidebarCategoryHeader label="Settings" icon={Settings} isOpen={isSettingsOpen} onClick={() => setIsSettingsOpen(!isSettingsOpen)} />
                    {isSettingsOpen && (
                        <div className="space-y-0.5">
                            {[
                                { label: "Email System", id: "email_templates" },
                                { label: "SMS & WhatsApp", id: "comm_hub" },
                                { label: "Payments", id: "payment_settings" },
                                { label: "SEO & Analytics", id: "seo_settings" },
                                { label: "SSO Config", id: "sso_settings" },
                                { label: "Terms & Conditions", id: "terms_settings" },
                            ].map(sub => (
                                <SidebarSubItem key={sub.id} id={sub.id} label={sub.label} active={activeTab === sub.id} />
                            ))}
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-50 bg-slate-50/50 mt-auto">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[0.8rem] bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-[1.02] transition-all  shadow-xl shadow-pink-500/20 group"
                    >
                        <LogOut size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-16 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between px-8">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl bg-slate-50 text-slate-400 md:hidden">
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                                {activeTab.replace(/_/g, ' ')}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 rounded-xl bg-slate-50 text-slate-400 relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-slate-200">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-900 uppercase italic">Admin</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Platform</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
