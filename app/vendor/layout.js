"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import VendorErrorBoundary from "@/components/VendorErrorBoundary";
import { 
    LayoutDashboard, 
    Calendar, 
    Briefcase, 
    Image as ImageIcon, 
    MessageSquare, 
    Star, 
    DollarSign, 
    Settings, 
    LogOut,
    Menu,
    X,
    Bell,
    CheckCircle,
    UserCircle,
    Package,
    Sparkles
} from "lucide-react";

export default function VendorLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!loading && !user) {
            router.push("/signin");
        }
        // Check if user is a vendor or admin
        const isVendor = ["vendor", "organiser", "staff", "admin", "super_admin"].includes(user?.role);
        if (!loading && user && !isVendor) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (!mounted || loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 shadow-3xl shadow-pink-500/20"></div>
            </div>
        );
    }

    const isTurfVendor = user?.category?.toLowerCase().includes("turf");
    const isPoolVendor = user?.category?.toLowerCase().includes("swimming");

    const navigation = [
        { name: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
        { name: "Bookings", href: "/vendor/bookings", icon: CheckCircle },
        { name: "Calendar", href: "/vendor/calendar", icon: Calendar },
        { 
            name: isTurfVendor ? "Turf Management" : isPoolVendor ? "Pool Management" : "Services / Packages", 
            href: isPoolVendor ? "/vendor/swimming-pool" : "/vendor/services", 
            icon: (isTurfVendor || isPoolVendor) ? Package : Sparkles 
        },
        { name: isTurfVendor ? "Facility Gallery" : isPoolVendor ? "Pool Images" : "Portfolio", href: isPoolVendor ? "/vendor/swimming-pool" : "/vendor/portfolio", icon: ImageIcon },
        { name: "Messages", href: "/vendor/messages", icon: MessageSquare },
        { name: "Reviews", href: "/vendor/reviews", icon: Star },
        { name: "Earnings", href: "/vendor/earnings", icon: DollarSign },
        { name: "Settings", href: "/vendor/settings", icon: Settings },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-900 flex">
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static shadow-2xl lg:shadow-none flex flex-col h-full shrink-0`}
            >
                <div className="flex flex-col h-full font-figtree w-full">
                    {/* Header */}
                    <div className="h-20 shrink-0 flex items-center justify-center px-6 border-b border-slate-50 bg-white relative">
                        <Link href="/" className="flex items-center">
                            <img src="/logo.png" alt="BookMyTicket" className="h-14 w-auto" />
                        </Link>
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1 px-2 absolute right-6 text-slate-400 hover:text-pink-500 lg:hidden transition-colors"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>
                    </div>
                    {/* Side Sub-Header (Service Role) */}
                    <div className="px-6 py-6 shrink-0 bg-slate-50 border-b border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                            <Sparkles size={40} className="text-pink-500" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">
                            {isTurfVendor ? "Turf Portal" : isPoolVendor ? "Pool Portal" : "Artist Portal"}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">{user?.category || "Professional Artist"}</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-400 group relative ${
                                        isActive 
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' 
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.02]'
                                    }`}
                                >
                                    <item.icon size={18} className={isActive ? 'text-pink-500' : 'text-slate-300 group-hover:text-slate-900'} strokeWidth={isActive ? 3 : 2} />
                                    <span className={`text-[11px] uppercase tracking-widest ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
                                    {isActive && (
                                        <div className="absolute right-4 w-1 h-4 bg-pink-500 rounded-full"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer - Profile Minimal */}
                    <div className="p-4 shrink-0 border-t border-slate-50 bg-slate-50/50">
                        <div className="bg-white rounded-2xl p-3 mb-3 flex items-center space-x-3 border border-slate-100 shadow-sm group cursor-pointer hover:border-pink-500/30 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center text-pink-500 border border-pink-200 overflow-hidden shadow-inner shrink-0">
                                {user?.name?.charAt(0) || "V"}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight italic">{user?.name || "Professional"}</p>
                                <p className="text-[9px] font-black text-slate-300 truncate uppercase tracking-[0.2em] mt-0.5">Verified</p>
                            </div>
                        </div>
                        <button 
                            onClick={logout}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-[1rem] bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-pink-500/20 group"
                        >
                            <LogOut size={14} strokeWidth={3} className="text-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 font-figtree h-full">
                {/* Top Header - Glassmorphism Light */}
                <header className="h-16 shrink-0 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between px-6 lg:px-10">
                    <div className="flex items-center space-x-4 lg:space-x-6">
                        <button 
                            onClick={toggleSidebar}
                            className="p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-400 lg:hidden hover:bg-slate-100 transition-all border border-slate-100 shadow-sm shrink-0"
                        >
                            <Menu size={18} />
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-1 h-3 bg-pink-500 rounded-full hidden xs:block"></div>
                                <h1 className="text-[14px] sm:text-base lg:text-xl font-black text-slate-900 tracking-tighter uppercase italic truncate">
                                    {navigation.find(n => n.href === pathname)?.name || "Dashboard"}
                                </h1>
                            </div>
                            <p className="text-[7px] lg:text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] xs:ml-3 truncate">
                                {isTurfVendor ? "Turf Management Hub" : isPoolVendor ? "Pool Management Hub" : "Artist Management Hub"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 lg:space-x-8 shrink-0">
                        <div className="hidden lg:flex flex-col items-end mr-4">
                             <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Core Status</div>
                             <div className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2 mt-1">
                                 <CheckCircle size={12} strokeWidth={3} /> 
                                 <span className="tracking-[0.2em]">Operational</span>
                             </div>
                        </div>
                        <button className="p-3 lg:p-3.5 rounded-[1.2rem] bg-white border border-slate-100 text-slate-300 hover:text-slate-900 hover:border-pink-500/30 transition-all shadow-sm relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Sparkles size={8} className="text-yellow-400" />
                            </div>
                            <Bell size={20} strokeWidth={2.5} />
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-pink-500 rounded-full ring-4 ring-white shadow-lg"></span>
                        </button>
                        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-[1rem] lg:rounded-[1.2rem] bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 shadow-2xl shadow-pink-500/30 group cursor-pointer hover:rotate-[10deg] transition-transform duration-500">
                            <div className="w-full h-full bg-white rounded-[0.8rem] lg:rounded-[1rem] flex items-center justify-center text-pink-500 font-black text-lg lg:text-xl shadow-inner italic">
                                {user?.name?.charAt(0) || "V"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
                    <VendorErrorBoundary>
                        <div className="w-full">
                            {children}
                        </div>
                    </VendorErrorBoundary>
                </main>
            </div>
        </div>
    );
}
