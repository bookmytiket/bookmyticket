"use client";
import React, { useState, useEffect } from "react";
import { 
    LayoutDashboard, MapPin, Calendar, Clock, 
    IndianRupee, Users, Star, Settings, 
    LogOut, Bell, Menu, X, PlusCircle,
    ChevronRight, CreditCard, Ticket, Sparkles,
    Zap, Tag, MessageSquare, CheckCircle2,
    BarChart3, UserCircle, Shield
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function TurfPanelLayout({ children }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const checkRes = () => {
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        checkRes();
        window.addEventListener('resize', checkRes);
        return () => window.removeEventListener('resize', checkRes);
    }, []);

    useEffect(() => {
        if (!user) router.push('/signin');
    }, [user, router]);

    const navItems = [
        { name: "OVERVIEW", icon: LayoutDashboard, path: "/turf-panel" },
        { name: "FACILITIES", icon: MapPin, path: "/turf-panel/facilities" },
        { name: "INVENTORY SLOTS", icon: Zap, path: "/turf-panel/slots" },
        { name: "RESERVATIONS", icon: Ticket, path: "/turf-panel/bookings" },
        { name: "OPERATION CALENDAR", icon: Calendar, path: "/turf-panel/calendar" },
        { name: "CRM HUB", icon: UserCircle, path: "/turf-panel/customers" },
        { name: "GROWTH & OFFERS", icon: Tag, path: "/turf-panel/promotions" },
        { name: "FEEDBACK", icon: Star, path: "/turf-panel/reviews" },
        { name: "FINANCIALS", icon: IndianRupee, path: "/turf-panel/revenue" },
        { name: "SYSTEM SETTINGS", icon: Settings, path: "/turf-panel/settings" },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-[#1A1C2E] transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-80' : 'w-0 -translate-x-full lg:w-24 lg:translate-x-0'} overflow-y-auto overflow-x-hidden shadow-2xl custom-scrollbar`}>
                <div className="h-full flex flex-col p-8">
                    {/* Logo Area */}
                    <div className="mb-10 px-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center group">
                            <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-pink-500/20 group-hover:rotate-12 transition-transform duration-500">
                                B
                            </div>
                            {isSidebarOpen && (
                                <span className="ml-4 text-white font-black italic text-xl tracking-tighter uppercase">BOOK<span className="text-pink-500">MY</span>TICKET</span>
                            )}
                        </Link>
                    </div>

                    <div className="flex-1 space-y-8">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 px-4">CORE OPERATIONS</p>
                            
                            <nav className="space-y-1.5">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <Link 
                                            key={item.name} 
                                            href={item.path}
                                            className={`flex items-center gap-5 px-6 py-4 rounded-[1.5rem] transition-all group relative ${isActive ? 'bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white shadow-xl shadow-pink-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <item.icon size={18} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform duration-300'} strokeWidth={isActive ? 3 : 2} />
                                            {isSidebarOpen && <span className={`text-[10px] tracking-[0.1em] uppercase ${isActive ? 'font-black italic' : 'font-bold'}`}>{item.name}</span>}
                                            {isActive && isSidebarOpen && (
                                                <div className="ml-auto w-1 h-3 rounded-full bg-white/40" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Footer Profile */}
                    <div className="mt-12 space-y-6 pt-12 border-t border-white/5">
                        {isSidebarOpen && (
                            <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center text-pink-500 font-black text-lg italic shadow-inner">
                                    {user.full_name?.[0] || 'R'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-white truncate uppercase italic tracking-tighter">{user.full_name || 'TURF PARTNER'}</p>
                                    <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <Shield size={10} /> OPERATIONAL
                                    </p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={logout}
                            className="w-full py-5 bg-white/5 text-slate-400 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#f84464] hover:text-white transition-all duration-300"
                        >
                            <LogOut size={16} />
                            {isSidebarOpen && "EXIT SESSION"}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Container */}
            <main className={`flex-1 flex flex-col transition-all duration-500 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24'}`}>
                {/* Modern Header */}
                <header className="h-24 flex items-center justify-between px-10 sticky top-0 bg-white/70 backdrop-blur-3xl z-40 border-b border-slate-50">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-pink-500 transition-colors">
                            <Menu size={24} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-[#1A1C2E] italic tracking-tighter uppercase leading-none">
                                    {navItems.find(n => n.path === pathname)?.name || "DASHBOARD"}
                                </h1>
                                <div className="px-3 py-1 bg-pink-50 text-[#f84464] rounded-lg text-[9px] font-black uppercase tracking-widest italic border border-pink-100">
                                    LIVE
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mt-3">OPERATIONS HUB // V.4.0</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="hidden xl:flex flex-col items-end">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1.5 italic">GLOBAL CONNECTIVITY</p>
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black text-[#1A1C2E] uppercase tracking-widest">ENCRYPTED // SECURE</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-5">
                            <button className="w-14 h-14 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center relative hover:shadow-xl hover:border-pink-500/20 transition-all group">
                                <Bell size={22} className="group-hover:rotate-12 transition-transform" />
                                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-[#f84464] border-2 border-white rounded-full shadow-lg" />
                            </button>
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 shadow-xl shadow-pink-500/20">
                                <div className="w-full h-full bg-white rounded-[0.9rem] flex items-center justify-center text-[#f84464] font-black text-xl italic shadow-inner">
                                    {user.full_name?.[0] || 'R'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="px-10 py-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
