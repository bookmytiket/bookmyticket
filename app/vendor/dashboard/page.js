"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    CheckCircle, 
    Clock, 
    DollarSign, 
    Star, 
    TrendingUp, 
    Users, 
    Calendar as CalendarIcon,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Sparkles,
    Image as ImageIcon,
    LayoutDashboard,
    Briefcase,
    Share
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PromoteModal from "@/components/PromoteModal";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const vendorId = getVendorAccountKey(user);
    const [mounted, setMounted] = React.useState(false);
    const [promoteProfileModal, setPromoteProfileModal] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (!loading && !user && mounted) {
            router.push("/signin?redirect=/vendor/dashboard");
        }
    }, [user, loading, router, mounted]);

    const profile = useQuery(
        api.vendors.getByOrganiserId,
        vendorId ? { organiserId: vendorId } : "skip"
    );
    const stats = useQuery(
        api.vendors.getStats,
        vendorId ? { vendorId } : "skip"
    ) || {
        totalBookings: 0,
        totalEarnings: 0,
        upcomingJobs: 0,
        avgRating: 0
    };

    const bookings = useQuery(
        api.vendorBookings.list,
        vendorId ? { vendorId, status: "pending" } : "skip"
    ) || [];
    const upcoming = useQuery(
        api.vendorBookings.getUpcoming,
        vendorId ? { vendorId } : "skip"
    ) || [];

    if (!mounted) return null;

    const portfolioCount = profile?.portfolio?.length || 0;
    const stylesCount = profile?.advancedSettings?.styles?.length || 0;

    const statCards = [
        { name: "Total Earnings", value: `₹${stats.totalEarnings}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50", trend: "+12.5%", trendUp: true },
        { name: "Confirmed Jobs", value: stats.upcomingJobs, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", trend: "+3 this week", trendUp: true },
        { name: "Portfolio Arts", value: portfolioCount, icon: ImageIcon, color: "text-indigo-500", bg: "bg-indigo-50", trend: "Ready to show", trendUp: true },
        { name: "Client Rating", value: Number(stats?.avgRating) > 0 ? Number(stats.avgRating).toFixed(1) : "N/A", icon: Star, color: "text-pink-500", bg: "bg-pink-50", trend: "Top Rated", trendUp: true },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-12">
            {/* Header Section - Inspired by Luxury Dashboards */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-pink-500 rounded-2xl text-white shadow-lg shadow-pink-500/20">
                            <LayoutDashboard size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Artist Command Center
                        </h2>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] ml-1.5">
                        Operational Hub for your {
                            (user?.category?.includes("photograph")) ? "Photography Empire" :
                            (user?.category?.includes("makeup")) ? "Makeup Boutique" :
                            "Mehendi Studio"
                        }
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setPromoteProfileModal(true)}
                        className="group bg-pink-50 border border-pink-200 px-8 py-3.5 rounded-2xl text-pink-500 font-black text-[10px] shadow-sm hover:shadow-xl hover:bg-pink-100 transition-all flex items-center gap-3 uppercase tracking-widest"
                    >
                        <Share size={16} className="text-pink-500" />
                        Promote
                    </button>
                    <Link 
                        href="/vendor/services"
                        className="group bg-white border border-slate-200 px-8 py-3.5 rounded-2xl text-slate-900 font-black text-[10px] shadow-sm hover:shadow-xl hover:border-pink-500/30 transition-all flex items-center gap-3 uppercase tracking-widest"
                    >
                        <Sparkles size={16} className="text-pink-500 group-hover:animate-pulse" />
                        Expand Services
                    </Link>
                </div>
            </div>

            {/* Promote Modal */}
            <PromoteModal
                isOpen={promoteProfileModal}
                onClose={() => setPromoteProfileModal(false)}
                title={profile?.name || "Professional Services"}
                imageUrl={profile?.portfolio?.[0]?.url || ""}
                type="Service"
                bookingUrl={typeof window !== "undefined" && vendorId ? `${window.location.origin}/services/${vendorId}` : ""}
            />

            {/* Premium Stat Grid - Clean & Elevated */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div 
                        key={stat.name}
                        className="group relative bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-pink-500/20 transition-all duration-500 shadow-xl shadow-slate-200/40 overflow-hidden"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-100 ${stat.color} shadow-inner group-hover:bg-white transition-colors`}>
                                <stat.icon size={22} strokeWidth={2.5} />
                            </div>
                            <div className="text-[9px] font-black tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase">
                                {stat.trend}
                            </div>
                        </div>

                        <div className="mt-6 relative z-10">
                            <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{stat.name}</h3>
                            <div className="text-3xl font-black text-slate-900 mt-1.5 group-hover:text-pink-600 transition-colors tracking-tighter italic">
                                {stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Pending Requests - High Fidelity List */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-yellow-400 rounded-full"></div>
                            <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Incoming Artist Requests</h3>
                        </div>
                        <span className="text-[9px] font-black text-white bg-slate-900 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-slate-900/10">
                            {bookings.length} New Leads
                        </span>
                    </div>

                    <div className="space-y-4">
                        {bookings.length > 0 ? bookings.map((booking) => (
                            <div 
                                key={booking._id}
                                className="group bg-white rounded-3xl p-5 border border-slate-100 hover:border-pink-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between shadow-xl shadow-slate-200/30 relative overflow-hidden"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 text-pink-500 border border-slate-100 flex items-center justify-center text-xl font-black italic shadow-inner transform group-hover:scale-105 transition-transform duration-500">
                                        {booking.customerDetails?.name?.charAt(0) || "U"}
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-pink-600 transition-colors">
                                            {booking.customerDetails?.name || "Premium Client"}
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <CalendarIcon size={12} className="text-yellow-500" />
                                                {booking.bookingDate}
                                            </span>
                                            <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock size={12} className="text-pink-500" />
                                                {booking.bookingTime || "Flexi-Time"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-6 md:mt-0">
                                    <button className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-200/50">
                                        Overview
                                    </button>
                                    <button className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all">
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white rounded-[3rem] p-24 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-inner">
                                    <CheckCircle size={48} strokeWidth={1} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Agenda Zero</h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs">All artist queues are perfectly cleared.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Earnings & Upcoming Gigs Section */}
                <div className="space-y-8">
                    {/* Premium Earnings Card */}
                    <div className="group relative p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000 scale-150">
                            <Sparkles size={100} className="text-pink-500" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-pink-400">Total Portfolio Yield</p>
                                <h4 className="text-4xl font-black text-white tracking-tighter italic">₹{stats.totalEarnings}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Health Score</p>
                                    <p className="text-lg font-black text-white italic">9.8/10</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Sync status</p>
                                    <p className="text-lg font-black text-emerald-400 italic">LIVE</p>
                                </div>
                            </div>

                            <button className="w-full bg-pink-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-pink-600/20 hover:bg-white hover:text-black transition-all">
                                Execute Settlement
                            </button>
                        </div>
                    </div>

                    {/* Upcoming Jobs - Clean & Refined */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Immediate Roadmap</h3>
                        </div>

                        {upcoming.length > 0 ? (
                            <div className="space-y-6">
                                {upcoming.slice(0, 3).map((job, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-4 -mx-4 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-500 border border-slate-100 shadow-inner">
                                                <Briefcase size={20} strokeWidth={2.5} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{job.customerDetails?.name || "Client"}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{job.bookingDate}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-emerald-600 tracking-tight">₹{job.totalAmount}</p>
                                            <div className="w-full h-1 bg-emerald-100 rounded-full mt-1 overflow-hidden">
                                                <div className="w-full h-full bg-emerald-500"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 space-y-4">
                                <div className="text-slate-200">
                                    <Clock size={48} strokeWidth={1} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roadmap is clear</p>
                            </div>
                        )}
                        
                        <Link href="/vendor/calendar" className="block w-full text-center text-[10px] font-black text-pink-500 hover:text-slate-900 transition-all uppercase tracking-[0.3em] pt-6 border-t border-slate-100">
                            Explore Schedule
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
