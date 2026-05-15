"use client";
import React, { useState } from "react";
import { 
    Ticket, Search, Filter, Calendar, 
    Clock, CheckCircle2, XCircle, ChevronRight,
    User, Phone, Mail, MapPin, ExternalLink,
    AlertCircle, RefreshCw, Download, ArrowUpRight,
    Activity, Shield, Star
} from "lucide-react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";

const STATUS_CONFIG = {
    pending: { label: "Pending Review", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    confirmed: { label: "Confirmed", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    completed: { label: "Completed", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    cancelled: { label: "Cancelled", icon: XCircle, color: "text-[#f84464]", bg: "bg-pink-50", border: "border-pink-100" },
    rescheduled: { label: "Rescheduled", icon: RefreshCw, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
};

export default function BookingsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);

    const { data: bookings = [], reload: reloadBookings } = useSupabaseQuery('turf_bookings', (q) => {
        let query = q.order('created_at', { ascending: false });
        if (statusFilter !== "all") query = query.eq('booking_status', statusFilter);
        return query;
    }, [user?.id, statusFilter]);

    const [updateBooking] = useSupabaseMutation('turf_bookings', 'update', (q, p) => q.eq('id', p.id));

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await updateBooking({ id, booking_status: newStatus });
            showToast(`Transaction ${newStatus} successfully`, "success");
            reloadBookings();
            setSelectedBooking(null);
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const filteredBookings = bookings.filter(b => 
        b.customer_details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_details?.phone?.includes(searchQuery) ||
        b.id.includes(searchQuery)
    );

    return (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-1000">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div>
                    <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">BUSINESS TRANSACTIONS</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Monitor and manage all incoming court reservations</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1A1C2E] transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="SEARCH BY IDENTITY..."
                            className="w-full bg-slate-50 border-none pl-16 pr-8 py-5 rounded-[1.8rem] text-sm font-black focus:ring-4 focus:ring-pink-500/5 transition-all shadow-sm italic uppercase"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-50 p-1.5 rounded-[1.8rem] border border-slate-100 shrink-0 shadow-sm">
                        {['all', 'pending', 'confirmed', 'completed'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    statusFilter === status ? 'bg-[#1A1C2E] text-white shadow-xl' : 'text-slate-300 hover:text-[#1A1C2E]'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bookings List */}
            <div className="bg-white rounded-[4rem] border border-slate-50 overflow-hidden shadow-sm">
                {filteredBookings.length === 0 ? (
                    <div className="p-32 text-center space-y-10">
                        <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Ticket size={56} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">NO MATCH FOUND</h3>
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">Adjust your filters or search query</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-50">
                                    <th className="px-10 py-8 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">TRANSACTION / USER</th>
                                    <th className="px-10 py-8 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">SPORT / VENUE</th>
                                    <th className="px-10 py-8 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">SCHEDULE</th>
                                    <th className="px-10 py-8 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">FINANCIALS</th>
                                    <th className="px-10 py-8 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">STATUS</th>
                                    <th className="px-10 py-8 text-right text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredBookings.map((booking) => {
                                    const cfg = STATUS_CONFIG[booking.booking_status] || STATUS_CONFIG.pending;
                                    return (
                                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black text-base uppercase shadow-inner group-hover:bg-[#1A1C2E] group-hover:text-pink-400 transition-all italic">
                                                        {booking.customer_details?.name?.[0] || 'G'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[#1A1C2E] uppercase tracking-tighter italic truncate max-w-[150px]">
                                                            {booking.customer_details?.name || "GUEST USER"}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                                                            ID: {booking.id.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-[#1A1C2E] uppercase tracking-widest flex items-center gap-2 italic">
                                                        <Activity size={14} className="text-[#f84464]" /> FOOTBALL
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">THUNDER ARENA · COURT A</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-black text-[#1A1C2E] uppercase tracking-tighter italic">{booking.booking_date}</p>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock size={12} className="text-pink-400" /> 06:00 PM - 07:00 PM
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1.5">
                                                    <p className="text-sm font-black text-[#1A1C2E] tracking-tighter">₹{booking.total_amount}</p>
                                                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest italic">{booking.payment_status}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} text-[9px] font-black uppercase tracking-widest shadow-sm`}>
                                                    <cfg.icon size={14} strokeWidth={3} />
                                                    {cfg.label}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <button 
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1A1C2E] hover:text-white transition-all shadow-sm"
                                                >
                                                    INSPECT DETAIL
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Detail Side Panel Overlay */}
            {selectedBooking && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto scrollbar-hide">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Booking Specification</h3>
                            <button onClick={() => setSelectedBooking(null)} className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center hover:rotate-90 transition-all shadow-sm border border-slate-100">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-12">
                            {/* User Profile */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-slate-900 text-emerald-400 flex items-center justify-center text-3xl font-black shadow-2xl shadow-slate-200 uppercase">
                                    {selectedBooking.customer_details?.name?.[0] || 'G'}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedBooking.customer_details?.name || "Guest User"}</h4>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Phone size={14} />
                                        <span className="text-xs font-bold tracking-widest">{selectedBooking.customer_details?.phone || "No phone"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-6 bg-slate-50 rounded-[2rem] space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Event Date</label>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <Calendar size={14} className="text-emerald-500" /> {selectedBooking.booking_date}
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[2rem] space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Time Schedule</label>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <Clock size={14} className="text-emerald-500" /> 06:00 PM - 07:00 PM
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Financial Breakdown</p>
                                    <Download size={16} className="text-slate-300" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-500 uppercase text-[10px]">Base Fee</span>
                                        <span className="font-black text-slate-900">₹{selectedBooking.total_amount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-500 uppercase text-[10px]">Taxes (GST)</span>
                                        <span className="font-black text-slate-900">₹0.00</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                        <span className="font-black text-slate-900 uppercase text-xs">Total Collected</span>
                                        <span className="text-2xl font-black text-emerald-600 tracking-tighter">₹{selectedBooking.total_amount}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Payment Status</span>
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{selectedBooking.payment_status}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Administrative Controls</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedBooking.booking_status === 'pending' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                                            className="py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-black transition-all"
                                        >
                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                            Confirm Booking
                                        </button>
                                    )}
                                    {selectedBooking.booking_status !== 'cancelled' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelled')}
                                            className="py-5 bg-white border border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-3"
                                        >
                                            <XCircle size={16} />
                                            Cancel / Refund
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
