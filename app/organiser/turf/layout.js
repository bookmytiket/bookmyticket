"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    LayoutDashboard, 
    Calendar, 
    CheckCircle, 
    DollarSign, 
    Settings, 
    LogOut,
    Menu,
    X,
    Bell,
    Sparkles,
    Activity,
    PlusCircle
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";

export default function TurfLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const navigation = [
        { name: "Turf Dashboard", href: "/organiser/turf", icon: LayoutDashboard },
        { name: "Manage Turfs", href: "/organiser/turf/manage", icon: PlusCircle },
        { name: "All Bookings", href: "/organiser/turf/bookings", icon: CheckCircle },
        { name: "Earnings", href: "/organiser/turf/earnings", icon: DollarSign },
        { name: "Settings", href: "/organiser/turf/settings", icon: Settings },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <RequireAuth allowedRoles={["organiser"]}>
            <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
                {/* Sidebar */}
                <aside 
                    className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-all  ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none`}
                >
                    <div className="flex flex-col h-full">
                        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
                            <Link href="/" className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                    T
                                </div>
                                <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent italic tracking-tighter">
                                    TurfPanel
                                </span>
                            </Link>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 lg:hidden">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 py-6 bg-blue-50/50 border-b border-slate-100 flex items-center gap-3">
                             <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Activity size={16} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{user?.name || "Turf Owner"}</p>
                             </div>
                        </div>

                        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${
                                            isActive 
                                                ? 'bg-slate-900 text-white shadow-xl translate-x-2' 
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <item.icon size={18} />
                                        <span className={`text-[11px] uppercase tracking-widest ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-6 border-t border-slate-50 mt-auto bg-white relative z-10">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                                <LogOut size={14} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 backdrop-blur-md bg-white/80 sticky top-0 z-40">
                        <div className="flex items-center space-x-4">
                            <button onClick={toggleSidebar} className="p-2.5 rounded-2xl bg-slate-50 lg:hidden">
                                <Menu size={20} />
                            </button>
                            <h1 className="text-xl font-black text-slate-900 uppercase italic">
                                {navigation.find(n => n.href === pathname)?.name || "Panel"}
                            </h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={logout} 
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors lg:hidden bg-slate-50 rounded-lg" 
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                {user?.name?.charAt(0) || "T"}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-6 lg:p-12">
                        {children}
                    </main>
                </div>
            </div>
        </RequireAuth>
    );
}
