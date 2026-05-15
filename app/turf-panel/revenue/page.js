"use client";
import React, { useState } from "react";
import { 
    IndianRupee, TrendingUp, TrendingDown, ArrowUpRight,
    Calendar, Download, Filter, CreditCard,
    CheckCircle2, Clock, AlertCircle, RefreshCw,
    Wallet, Landmark, PieChart, BarChart3
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import PayoutRequestPanel from "@/components/PayoutRequestPanel";

export default function RevenuePage() {
    const { user } = useAuth();
    
    // Fetch Earnings records
    const { data: earnings = [] } = useSupabaseQuery('turf_earnings', (q) => 
        q.eq('partner_id', user?.id).order('created_at', { ascending: false })
    , [user?.id]);

    const totalEarned = earnings.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const netEarnings = earnings.reduce((acc, curr) => acc + Number(curr.net_amount || 0), 0);
    const totalPlatformFee = earnings.reduce((acc, curr) => acc + Number(curr.platform_fee || 0), 0);

    const stats = [
        { label: "Gross Revenue", value: `₹${totalEarned.toLocaleString('en-IN')}`, icon: IndianRupee, color: "text-[#f84464]", bg: "bg-pink-50" },
        { label: "Net Yield", value: `₹${netEarnings.toLocaleString('en-IN')}`, icon: Wallet, color: "text-[#c026d3]", bg: "bg-purple-50", trend: "+8.5%" },
        { label: "Service Tax", value: `₹${totalPlatformFee.toLocaleString('en-IN')}`, icon: PieChart, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Daily Average", value: "₹2,400", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-50" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div>
                    <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">FINANCIAL LEDGER</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Track your yield, commissions, and payout settlements</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-10 py-5 bg-white border border-slate-100 text-[#1A1C2E] rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                        EXPORT LEDGER
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group">
                        <div className="flex justify-between items-start mb-8">
                            <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <stat.icon size={30} />
                            </div>
                            {stat.trend && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm">{stat.trend}</span>}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">{stat.label}</p>
                            <p className="text-4xl font-black text-[#1A1C2E] tracking-tighter italic">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payout & Settlements */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <PayoutRequestPanel requesterType="provider" />
                </div>

                {/* Settlement Logs / Sidebar */}
                <div className="space-y-10">
                    <div className="bg-[#1A1C2E] rounded-[4rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-10 relative z-10">SETTLEMENTS</h3>
                        <div className="space-y-8 relative z-10">
                            {earnings.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex items-center gap-5 group/item">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-pink-400 shrink-0 group-hover/item:scale-110 transition-transform">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black uppercase truncate tracking-tight">ID #{log.booking_id?.slice(0,8)}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.created_at?.split('T')[0]}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-400 italic">+₹{log.net_amount}</p>
                                    </div>
                                </div>
                            ))}
                            {earnings.length === 0 && (
                                <div className="py-16 text-center opacity-20">
                                    <RefreshCw size={48} className="mx-auto mb-6 animate-spin-slow" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">NO TRANSACTIONS</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full mt-12 py-5 bg-white/10 hover:bg-white/20 transition-all rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                            DOWNLOAD HISTORY
                        </button>
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
                    </div>

                    <div className="bg-white rounded-[4rem] p-10 border border-slate-50 shadow-sm space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#f84464] flex items-center justify-center shadow-sm">
                                <Landmark size={24} />
                            </div>
                            <h3 className="text-xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">BANK VAULT</h3>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] leading-relaxed px-1">Your earnings are settled to the primary account linked below.</p>
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">ACCOUNT HOLDER</p>
                                <p className="text-xs font-black text-[#1A1C2E] uppercase italic">{user.full_name || 'PARTNER IDENTITY'}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">SECURITY STATUS</p>
                                <p className="text-xs font-black text-emerald-500 uppercase flex items-center gap-2 italic">
                                    <Shield size={14} /> VERIFIED ACCOUNT
                                </p>
                            </div>
                        </div>
                        <button className="w-full py-5 bg-[#0F1115] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-slate-200">
                            UPDATE BANK INFO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

