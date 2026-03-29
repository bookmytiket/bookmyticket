"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Search, 
    Filter, 
    MoreVertical, 
    CheckCircle, 
    XCircle, 
    Calendar as CalendarIcon, 
    Clock, 
    MapPin, 
    Phone, 
    Mail,
    ChevronRight,
    MessageSquare,
    AlertCircle
} from "lucide-react";

export default function BookingsPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const bookings = useQuery(
        api.vendorBookings.list,
        vendorId ? { vendorId, status: statusFilter } : "skip"
    ) || [];
    const updateStatus = useMutation(api.vendorBookings.updateStatus);

    const filteredBookings = bookings.filter(b =>
        (b.customerDetails?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.customerDetails?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateStatus({ id, status });
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "confirmed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-400 rounded-2xl text-slate-900 shadow-lg shadow-yellow-400/20">
                            <CalendarIcon size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Registry Hub</h2>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] ml-1.5">Full Command over your professional service sessions</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-pink-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find leads by name or email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/30 transition-all w-full md:w-80 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Filters - Premium Pills */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-hide px-2">
                {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                            statusFilter === status 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-pink-500/30 hover:text-pink-500 shadow-sm'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Bookings Table - High Fidelity Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">
                                <th className="px-8 py-6">Customer Profile</th>
                                <th className="px-8 py-6">Session & Timeline</th>
                                <th className="px-8 py-6">Financials</th>
                                <th className="px-8 py-6">Current Status</th>
                                <th className="px-8 py-6 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                                <tr key={booking._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-8 py-7 whitespace-nowrap">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-900 border border-slate-200 flex items-center justify-center font-black italic shadow-inner group-hover:scale-105 transition-transform">
                                                {booking.customerDetails.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-slate-900 font-black text-base tracking-tight italic uppercase">{booking.customerDetails.name}</div>
                                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{booking.customerDetails.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="text-slate-800 text-sm font-black uppercase italic tracking-tight">{booking.serviceType}</div>
                                        <div className="flex items-center space-x-3 mt-2 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                            <span className="flex items-center space-x-1.5">
                                                <CalendarIcon size={12} className="text-pink-500" />
                                                <span>{booking.bookingDate}</span>
                                            </span>
                                            <span className="text-slate-200">|</span>
                                            <span className="flex items-center space-x-1.5">
                                                <Clock size={12} className="text-yellow-500" />
                                                <span>{booking.bookingTime || "Flexi"}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="text-slate-900 font-black text-sm tracking-tight italic">₹{booking.totalAmount}</div>
                                        <div className="text-[8px] text-emerald-500 mt-1 font-black uppercase tracking-[0.2em] flex items-center gap-1">
                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                            Fully Vetted
                                        </div>
                                    </td>
                                    <td className="px-8 py-7 whitespace-nowrap">
                                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="flex items-center justify-end space-x-3">
                                            {booking.status === "pending" && (
                                                <>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(booking._id, "confirmed")}
                                                        className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                                        title="Confirm Session"
                                                    >
                                                        <CheckCircle size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(booking._id, "cancelled")}
                                                        className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                                                        title="Decline Request"
                                                    >
                                                        <XCircle size={18} strokeWidth={2.5} />
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === "confirmed" && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(booking._id, "completed")}
                                                    className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[9px] font-black hover:bg-pink-600 transition-all uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10"
                                                >
                                                    Safe Complete
                                                </button>
                                            )}
                                            <button className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm group">
                                                <MessageSquare size={18} strokeWidth={2.5} className="group-hover:animate-bounce" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-6">
                                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 text-slate-200 flex items-center justify-center border border-slate-100 shadow-inner">
                                                <AlertCircle size={40} />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-slate-900 font-black text-2xl tracking-tighter uppercase italic">No Active Entries</h4>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Our sensors found no matches for your current sweep.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Overview for Bookings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
                {[
                    { label: "Completion Rate", value: "98%", color: "text-emerald-500", detail: "Near Perfect Sync" },
                    { label: "Response Latency", value: "2.5 hrs", color: "text-blue-500", detail: "Rapid Response" },
                    { label: "Successful Cycles", value: bookings.filter(b => b.status === 'completed').length, color: "text-pink-500", detail: "Verified Gigs" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center justify-between group hover:border-pink-500/20 transition-all">
                        <div className="space-y-1">
                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">{stat.label}</span>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{stat.detail}</p>
                        </div>
                        <span className={`text-3xl font-black ${stat.color} italic tracking-tighter`}>{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
