"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
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
    Activity,
    Plus,
    LayoutDashboard,
    Package
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function TurfDashboard() {
    const { user } = useAuth();
    const vendorId = user?.userId || user?.identifier;

    const turfs = useQuery(api.turfs.getByOrganiserId, { organiserId: vendorId || "" });
    const bookings = useQuery(api.turfBookings.listByVendor, { organiserId: vendorId || "" }) || [];

    const stats = {
        totalTurfs: turfs?.length || 0,
        totalBookings: bookings.length,
        totalEarnings: bookings
            .filter(b => b.paymentStatus === "fully_paid" || b.paymentStatus === "advance_paid")
            .reduce((acc, b) => acc + (b.paymentStatus === "fully_paid" ? b.totalAmount : b.advancePaid), 0),
        pendingBookings: bookings.filter(b => b.bookingStatus === "pending").length,
    };

    const statCards = [
        { name: "Total Earnings", value: `₹${stats.totalEarnings}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50", trend: "+8.4%", trendUp: true },
        { name: "Active Turfs", value: stats.totalTurfs, icon: Package, color: "text-blue-500", bg: "bg-blue-50", trend: "Fully Operational", trendUp: true },
        { name: "Total Bookings", value: stats.totalBookings, icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-50", trend: "+12 this month", trendUp: true },
        { name: "Pending Requests", value: stats.pendingBookings, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", trend: "Action Required", trendUp: false },
    ];

    return (
        <motion.div 
            className="space-y-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Hero Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Turf Operations Control
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        Real-time overview of your sports facility performance
                    </p>
                </div>
                
                <Link 
                    href="/organiser/turf/manage"
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 uppercase tracking-widest"
                >
                    <Plus size={16} />
                    Add New Turf
                </Link>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div 
                        key={stat.name}
                        variants={itemVariants}
                        className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-blue-500/20 transition-all duration-500 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                                <stat.icon size={22} strokeWidth={2.5} />
                            </div>
                            <div className={`text-[9px] font-black tracking-widest px-3 py-1.5 rounded-full border uppercase ${stat.trendUp ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
                                {stat.trend}
                            </div>
                        </div>

                        <div className="mt-6 relative z-10">
                            <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{stat.name}</h3>
                            <div className="text-3xl font-black text-slate-900 mt-1.5 tracking-tighter italic">
                                {stat.value}
                            </div>
                        </div>
                        
                        <div className="absolute -bottom-4 -right-4 opacity-0 group-hover:opacity-5 transition-opacity duration-700">
                             <stat.icon size={100} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Recent Bookings */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Recent Turf Bookings</h3>
                        </div>
                        <span className="text-[9px] font-black text-white bg-slate-900 px-4 py-1.5 rounded-full uppercase tracking-widest">
                            {bookings.length} Total
                        </span>
                    </div>

                    <div className="space-y-4">
                        {bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                            <div 
                                key={booking._id}
                                className="group bg-white rounded-3xl p-5 border border-slate-100 hover:border-blue-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between shadow-xl shadow-slate-200/30"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-blue-600 border border-slate-100 flex items-center justify-center text-xl font-black italic shadow-inner">
                                        {booking.customerDetails?.name?.charAt(0) || "U"}
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight">
                                            {booking.customerDetails?.name || "Customer"}
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <CalendarIcon size={12} className="text-blue-500" />
                                                {booking.date}
                                            </span>
                                            <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock size={12} className="text-emerald-500" />
                                                {booking.startTime} - {booking.endTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-6 md:mt-0">
                                    <div className="text-right mr-4">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                         <p className={`text-[10px] font-black uppercase tracking-widest ${booking.bookingStatus === 'confirmed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {booking.bookingStatus}
                                         </p>
                                    </div>
                                    <Link 
                                        href="/organiser/turf/bookings"
                                        className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Details
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white rounded-[3rem] p-24 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                                    <Clock size={40} strokeWidth={1} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase italic">No Active Bookings</h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest max-w-xs mt-2">Your facilities are ready to receive new reservations.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Facility Status Card */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                         <div className="relative z-10 space-y-8">
                             <div className="space-y-2">
                                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400">Total Operational Revenue</p>
                                 <h4 className="text-4xl font-black tracking-tighter italic">₹{stats.totalEarnings}</h4>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Facility health</p>
                                     <p className="text-lg font-black italic text-emerald-400">98%</p>
                                 </div>
                                 <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Active Slots</p>
                                     <p className="text-lg font-black italic text-white">{stats.totalTurfs > 0 ? 'LIVE' : 'N/A'}</p>
                                 </div>
                             </div>

                             <Link href="/organiser/turf/manage" className="block w-full bg-blue-600 text-center py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-blue-600/20">
                                View Facility Layout
                             </Link>
                         </div>
                         
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000 scale-150">
                             <Activity size={120} />
                         </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
