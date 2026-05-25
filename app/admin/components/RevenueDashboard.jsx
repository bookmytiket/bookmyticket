'use client';

import React, { useState, useEffect } from 'react';
import { 
    DollarSign, 
    TrendingUp, 
    BarChart3, 
    PieChart, 
    Activity, 
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RevenueDashboard({ t, theme }) {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalPlatformFee: 0,
        totalGst: 0,
        recentTransactions: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenueStats();

        // Realtime sync for revenue audit
        const channel = supabase
            .channel('admin-revenue-stream')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'booking_financials' }, () => {
                fetchRevenueStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRevenueStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/revenue-stats');
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.stats) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error("Revenue Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Revenue Data...</div>;

    const cards = [
        { label: 'Total Gross', value: stats.totalRevenue, icon: DollarSign, color: '#3b82f6', trend: '+12%' },
        { label: 'Platform Fees', value: stats.totalPlatformFee, icon: TrendingUp, color: '#ec4899', trend: '+8%' },
        { label: 'Net Platform Margin', value: stats.totalNet, icon: ArrowUpRight, color: '#10b981', trend: '+14%' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1.5">Platform Economics</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time revenue tracking & audit monitor</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                        <Calendar size={12} /> Last 30 Days
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                        <Filter size={12} /> Filter
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                        <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <card.icon size={60} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{card.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">₹{card.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <ArrowUpRight size={9} /> {card.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Revenue Stream */}
                <div className="lg:col-span-2 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <BarChart3 size={16} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase">Revenue Stream</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform Fee</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">GST (18%)</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Partner Share</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.recentTransactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="text-[11px] font-bold text-slate-900">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            <p className="text-[8px] font-medium text-slate-400 uppercase">{new Date(tx.created_at).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="p-4 text-[11px] font-black text-pink-500">₹{tx.platform_fee.toFixed(2)}</td>
                                        <td className="p-4 text-[11px] font-bold text-slate-600">₹{tx.gst_amount.toFixed(2)}</td>
                                        <td className="p-4 text-[11px] font-bold text-amber-500">₹{(tx.partner_share || 0).toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">
                                                ₹{(tx.net_platform_revenue || (tx.platform_fee - (tx.partner_share || 0))).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                <tr>
                                    <td className="p-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Totals:</td>
                                    <td className="p-4 text-[11px] font-black text-pink-500">₹{stats.recentTransactions.reduce((acc, tx) => acc + (tx.platform_fee || 0), 0).toFixed(2)}</td>
                                    <td className="p-4 text-[11px] font-bold text-slate-600">₹{stats.recentTransactions.reduce((acc, tx) => acc + (tx.gst_amount || 0), 0).toFixed(2)}</td>
                                    <td className="p-4 text-[11px] font-bold text-amber-500">₹{stats.recentTransactions.reduce((acc, tx) => acc + (tx.partner_share || 0), 0).toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">
                                            ₹{stats.recentTransactions.reduce((acc, tx) => acc + (tx.net_platform_revenue || (tx.platform_fee - (tx.partner_share || 0))), 0).toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Growth Chart Placeholder / Distribution */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                                <PieChart size={16} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase">Earnings Split</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { label: 'Event Bookings', value: '72%', color: '#ec4899' },
                                { label: 'Service Sessions', value: '18%', color: '#8b5cf6' },
                                { label: 'Ad Banners', value: '10%', color: '#3b82f6' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <span>{item.label}</span>
                                        <span>{item.value}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full" 
                                            style={{ width: item.value, backgroundColor: item.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 p-5 bg-slate-900 rounded-[20px] text-white">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5">Net Platform Margin</p>
                        <h4 className="text-xl font-black tracking-tight italic">₹{(stats.totalPlatformFee * 0.82).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
                        <p className="text-[9px] text-white/30 mt-1.5 font-medium">Post-operational estimates.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
