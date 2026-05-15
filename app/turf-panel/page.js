"use client";
import React from "react";
import { 
    Ticket, IndianRupee, Users, TrendingUp, 
    Zap, Star, Clock, Calendar, CheckCircle2,
    ArrowUpRight, Target, Activity, LayoutGrid,
    Search, Filter, Plus, Bell, Shield, ArrowDownRight,
    MousePointer2, Sparkles, PieChart, BarChart3
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";

export default function TurfDashboard() {
    const { user } = useAuth();

    // Fetch essential stats
    const { data: bookings = [] } = useSupabaseQuery('turf_bookings', (q) => q, [user?.id]);
    const { data: earnings = [] } = useSupabaseQuery('turf_earnings', (q) => q, [user?.id]);
    const { data: turfs = [] } = useSupabaseQuery('turfs', (q) => q, [user?.id]);

    const stats = [
        { label: "TOTAL RESERVATIONS", value: bookings.length, icon: Ticket, trend: "+12%", color: "bg-[#f84464]" },
        { label: "GROSS YIELD", value: `₹${bookings.reduce((acc, b) => acc + (b.total_amount || 0), 0)}`, icon: IndianRupee, trend: "+8.4%", color: "bg-[#c026d3]" },
        { label: "ACTIVE FACILITIES", value: turfs.length, icon: Target, trend: "STABLE", color: "bg-[#1A1C2E]" },
        { label: "AVG OCCUPANCY", value: "84%", icon: Activity, trend: "+5.2%", color: "bg-[#10b981]" },
    ];

    const quickActions = [
        { name: "DEPLOY UNIT", icon: Plus, color: "bg-pink-50 text-[#f84464]" },
        { name: "BLOCK WINDOW", icon: Shield, color: "bg-purple-50 text-[#c026d3]" },
        { name: "BULK UPDATE", icon: Zap, color: "bg-amber-50 text-amber-500" },
        { name: "EXPORT LOGS", icon: IndianRupee, color: "bg-emerald-50 text-emerald-500" },
    ];

    return (
        <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
            {/* Hero / Quick Actions Row */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                <div className="xl:col-span-3 bg-[#1A1C2E] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="space-y-6 text-center md:text-left">
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                OPERATIONAL <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">EXCELLENCE</span>
                            </h2>
                            <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.4em]">Managing {turfs.length} Facilities in Chennai Hub</p>
                            <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                                {quickActions.map((action) => (
                                    <button key={action.name} className={`${action.color} px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg`}>
                                        <action.icon size={16} />
                                        {action.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="w-64 h-64 bg-white/5 rounded-[3rem] backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center space-y-4 shadow-2xl">
                            <div className="text-5xl font-black italic tracking-tighter text-pink-500">92%</div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PEAK PERFORMANCE</p>
                            <div className="flex gap-1.5">
                                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-6 bg-pink-500/20 rounded-full overflow-hidden relative"><div className="absolute bottom-0 w-full bg-pink-500" style={{ height: `${20 * i}%` }} /></div>)}
                            </div>
                        </div>
                    </div>
                    {/* Background Decorative */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
                </div>
                
                <div className="bg-gradient-to-br from-[#f84464] to-[#c026d3] rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-pink-500/20">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Sparkles size={28} />
                        </div>
                        <h3 className="text-xl font-black tracking-tighter uppercase italic leading-tight">YIELD<br/>OPTIMIZER</h3>
                    </div>
                    <div className="space-y-6">
                        <p className="text-sm font-bold leading-relaxed italic opacity-80">AI Suggestion: Increase slot prices by 12% for upcoming weekend premium hours.</p>
                        <button className="w-full py-5 bg-white text-[#f84464] rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-[#1A1C2E] hover:text-white transition-all shadow-xl">APPLY NOW</button>
                    </div>
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group overflow-hidden relative">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-12`}>
                                    <stat.icon size={24} />
                                </div>
                                <div className={`px-4 py-2 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'} text-[9px] font-black flex items-center gap-1.5`}>
                                    {stat.trend.startsWith('+') ? <ArrowUpRight size={12} /> : null}
                                    {stat.trend}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                                <p className="text-4xl font-black text-[#1A1C2E] italic tracking-tighter">{stat.value}</p>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-1000 opacity-20" />
                    </div>
                ))}
            </div>

            {/* Main Content Area: Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Performance Chart Placeholder */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-50 shadow-sm space-y-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">REVENUE DENSITY</h3>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-3">Monthly Yield Visualization</p>
                        </div>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            {['7D', '30D', '90D'].map(t => <button key={t} className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${t === '30D' ? 'bg-white text-[#1A1C2E] shadow-sm' : 'text-slate-300 hover:text-[#1A1C2E]'}`}>{t}</button>)}
                        </div>
                    </div>
                    
                    <div className="h-80 flex items-end gap-4 px-4">
                        {[40, 70, 45, 90, 65, 80, 50, 100, 85, 60, 75, 95].map((h, i) => (
                            <div key={i} className="flex-1 space-y-4 group">
                                <div className="relative h-full flex flex-col justify-end">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1C2E] text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">₹{(h * 1200).toLocaleString()}</div>
                                    <div className="w-full bg-slate-50 rounded-t-2xl group-hover:bg-gradient-to-t group-hover:from-[#f84464] group-hover:to-[#c026d3] transition-all duration-500 relative" style={{ height: `${h}%` }}>
                                        {h > 80 && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                    </div>
                                </div>
                                <p className="text-[8px] font-black text-slate-300 text-center uppercase">{['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][i]}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real-time Activity Feed */}
                <div className="bg-white rounded-[3rem] p-12 border border-slate-50 shadow-sm space-y-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">LIVE LOGS</h3>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center animate-pulse shadow-lg shadow-emerald-100">
                            <Activity size={20} />
                        </div>
                    </div>

                    <div className="space-y-10">
                        {[
                            { title: "NEW RESERVATION", time: "2 MIN AGO", user: "Vikram K.", amount: "₹1,200", icon: Ticket, color: "text-[#f84464] bg-pink-50" },
                            { title: "SLOT BLOCKED", time: "15 MIN AGO", user: "Admin", amount: "Maintenance", icon: Shield, color: "text-amber-500 bg-amber-50" },
                            { title: "PAYOUT PROCESSED", time: "1 HR AGO", user: "System", amount: "₹45,000", icon: IndianRupee, color: "text-emerald-500 bg-emerald-50" },
                            { title: "REVIEW RECEIVED", time: "3 HR AGO", user: "Rahul S.", amount: "5 Stars", icon: Star, color: "text-purple-500 bg-purple-50" },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-6 group cursor-pointer">
                                <div className={`w-14 h-14 rounded-2xl ${log.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                    <log.icon size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] font-black text-[#1A1C2E] uppercase tracking-widest">{log.title}</p>
                                        <span className="text-[9px] font-black text-slate-300 uppercase">{log.time}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 mt-1 truncate uppercase tracking-tighter italic">{log.user} · {log.amount}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-5 border-2 border-dashed border-slate-100 rounded-3xl text-[9px] font-black text-slate-300 uppercase tracking-widest hover:border-pink-500/30 hover:text-pink-500 transition-all">VIEW AUDIT TRAIL</button>
                </div>
            </div>
        </div>
    );
}
