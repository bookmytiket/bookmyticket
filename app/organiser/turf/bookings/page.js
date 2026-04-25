"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    Calendar, 
    User, 
    CreditCard, 
    Phone, 
    Mail,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Check,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TurfBookings() {
    const { user } = useAuth();
    const vendorId = user?.userId || user?.identifier;

    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (!vendorId) return;
        supabase.from('turf_bookings').select('*').eq('organiser_id', vendorId)
            .then(({ data }) => setBookings(data || []));
    }, [vendorId]);

    const handleConfirmPayment = async (id) => {
        await supabase.from('turf_bookings').update({ booking_status: 'confirmed', payment_status: 'fully_paid' }).eq('id', id);
        setBookings(prev => prev.map(b => b.id === id ? { ...b, booking_status: 'confirmed', payment_status: 'fully_paid' } : b));
    };

    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    const filteredBookings = bookings.filter(b => {
        const matchesFilter = filter === "all" || b.booking_status === filter || b.payment_status === filter;
        const matchesSearch = b.customer_details?.name?.toLowerCase().includes(search.toLowerCase()) || 
                              b.turf_name?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Reservation Ledger
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        Comprehensive Log of all Turf Acquisitions and Payments
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search client or turf..."
                            className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all w-64 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        className="px-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Records</option>
                        <option value="pending">Pending Admin Review</option>
                        <option value="confirmed">Confirmed Appointments</option>
                        <option value="advance_paid">Advance Settled</option>
                        <option value="fully_paid">Full Settlement</option>
                    </select>
                </div>
            </div>

            {/* Bookings Table/List */}
            <div className="space-y-4">
                {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                    <motion.div 
                        key={booking._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 hover:border-blue-500/20 transition-all group overflow-hidden relative"
                    >
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
                            {/* Customer & Turf Info */}
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50/50 text-blue-600 border border-blue-100 flex items-center justify-center text-2xl font-black italic shadow-inner shrink-0">
                                    {booking.customer_details?.name?.charAt(0) || "U"}
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">
                                            {booking.customer_details?.name || "Client"}
                                        </h3>
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            booking.booking_status === 'confirmed' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                                        }`}>
                                            {booking.booking_status}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={12} className="text-blue-500" />
                                        Facility: <span className="text-slate-900">{booking.turf_name}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Schedule & Slot Info */}
                            <div className="flex flex-wrap items-center gap-6 xl:px-8 xl:border-x xl:border-slate-100">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Schedule</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-500" />
                                        <span className="text-[11px] font-bold text-slate-700">{booking.date}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Temporal Window</p>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-emerald-500" />
                                        <span className="text-[11px] font-bold text-slate-700">{booking.start_time} - {booking.end_time}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Acquisition Type</p>
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                        {booking.payment_type} Allocation
                                    </span>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="flex items-center gap-8 min-w-[300px] justify-between xl:justify-end">
                                <div className="text-right space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Base Yield</p>
                                    <p className="text-sm font-black text-slate-600">₹{booking.base_amount || booking.total_amount}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-emerald-500">Extra Yield (2%)</p>
                                    <p className="text-sm font-black text-emerald-600">+₹{booking.partner_bonus || 0}</p>
                                </div>
                                <div className="text-right space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Net Revenue</p>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter italic">₹{booking.partner_total || (booking.total_amount)}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${
                                        booking.payment_status === 'fully_paid' ? 'text-emerald-500' : 
                                        booking.payment_status === 'advance_paid' ? 'text-blue-500' : 'text-amber-500'
                                    }`}>
                                        {booking.payment_status?.replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="h-10 w-[1px] bg-slate-100 hidden xl:block"></div>
                                <button className="p-4 bg-white hover:bg-blue-600 text-slate-300 hover:text-white rounded-2xl transition-all shadow-sm border border-slate-100">
                                    <ArrowUpRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000">
                             <CheckCircle size={150} />
                        </div>
                    </motion.div>
                )) : (
                    <div className="py-32 text-center space-y-4">
                        <div className="text-slate-200 flex justify-center">
                            <Clock size={64} strokeWidth={1} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">No financial records discovered</p>
                    </div>
                )}
            </div>
        </div>
    );
}
