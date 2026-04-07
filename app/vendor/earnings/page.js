"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    DollarSign, 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight, 
    Wallet, 
    Clock, 
    Download, 
    Filter, 
    Search,
    CreditCard,
    PieChart,
    ChevronRight,
    ArrowUpCircle,
    CheckCircle
} from "lucide-react";

export default function EarningsPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    
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
        vendorId ? { vendorId, status: "completed" } : "skip"
    ) || [];

    const transactions = bookings.map(b => ({
        id: b._id,
        desc: `${b.serviceType} for ${b.customerDetails?.name || "Customer"}`,
        amount: `+₹${b.totalAmount}`,
        date: new Date(b.createdAt).toLocaleDateString(),
        status: "Success",
        type: "credit"
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1 border-b border-slate-200 px-1">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white p-2.5 shadow-xl shadow-purple-500/20">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-600">Finances</span>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">Earnings & Settlements</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs max-w-xl font-medium">Manage your revenue, withdrawals, and bank history.</p>
                </div>
                <div className="flex items-center space-x-3 mb-1">
                    <button className="flex items-center space-x-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl font-black text-[10px] border border-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
                        <Download size={14} />
                        <span>Export</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-black text-[10px] shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">
                        <ArrowUpCircle size={16} />
                        <span>Withdraw</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
                {[
                    { label: "Available Balance", value: `₹${stats.totalEarnings}`, sub: "Ready for transfer", icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Pending Jobs", value: "₹0", sub: "Awaiting sync", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Total Lifetime", value: `₹${stats.totalEarnings}`, sub: "Accrued earnings", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Growth Rate", value: "+12%", sub: "Monthly increase", icon: PieChart, color: "text-pink-500", bg: "bg-pink-50" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-3xl group-hover:bg-purple-50 transition-colors"></div>
                        <div className="space-y-4 relative z-10">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors tracking-tighter">{stat.value}</h3>
                                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-0.5">{stat.label}</p>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium italic">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Transaction History */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center space-x-4 tracking-tighter uppercase italic">
                            <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
                            <span>Payment History</span>
                        </h3>
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-6 text-xs text-slate-900 outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-slate-300" 
                                />
                            </div>
                            <button className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-purple-600 transition-all">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/50">
                        <div className="divide-y divide-slate-50">
                            {transactions.length > 0 ? transactions.map((tx, i) => (
                                <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all group">
                                    <div className="flex items-center space-x-5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                            tx.type === 'credit' 
                                                ? 'bg-green-50 text-green-600 border-green-100 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-500' 
                                                : 'bg-red-50 text-red-600 border-red-100 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500'
                                        }`}>
                                            {tx.type === 'credit' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors uppercase italic tracking-tight truncate max-w-[200px]">{tx.desc}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{tx.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <p className={`text-base font-black ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{tx.amount}</p>
                                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">{tx.status}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-200 group-hover:text-purple-500 group-hover:translate-x-1.5 transition-all" />
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 mx-auto group">
                                        <DollarSign size={32} className="group-hover:text-purple-600 transition-colors" />
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No entries found</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full py-4 text-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-purple-600 transition-all border-t border-slate-50 bg-slate-50/20">
                            Load Archive
                        </button>
                    </div>
                </div>

                {/* Card/System Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group shadow-purple-900/10">
                        <div className="absolute top-0 right-0 p-6 text-white/5 opacity-10 rotate-12 group-hover:rotate-0 transition-all duration-1000">
                            <CreditCard size={150} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-xl shadow-amber-500/10"></div>
                                <span className="text-white/20 font-black text-sm italic uppercase tracking-tighter">Gold Tier</span>
                            </div>
                            <div className="space-y-4">
                                <p className="text-white font-black text-xl tracking-[0.25em]">•••• •••• •••• 4210</p>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-[7px] text-white/30 uppercase font-black tracking-widest">Provider</p>
                                        <p className="text-[11px] text-white font-black uppercase truncate max-w-[120px] italic">{user?.name || "Verified Artist"}</p>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                        <p className="text-[7px] text-white/30 uppercase font-black tracking-widest">Expires</p>
                                        <p className="text-[11px] text-white font-black italic">12/28</p>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-slate-900 transition-all">
                                Update Payouts
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                                <Clock size={16} />
                            </div>
                            <h4 className="text-slate-900 font-black text-[11px] tracking-widest uppercase italic">Settlement Times</h4>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "IMPS / UPI", desc: "Real-time", check: true },
                                { label: "Bank Transfer", desc: "NEFT / RTGS", check: true },
                                { label: "System Sync", desc: "Every 12 Hours", check: true }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start space-x-3 group">
                                    <div className="h-4 w-4 rounded-full bg-green-50 flex items-center justify-center text-green-500 mt-0.5 border border-green-100 group-hover:bg-green-500 group-hover:text-white transition-all">
                                        <CheckCircle size={10} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 tracking-tight uppercase">{item.label}</p>
                                        <p className="text-[8px] text-slate-400 font-bold">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
