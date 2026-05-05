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
    }, []);

    const fetchRevenueStats = async () => {
        setLoading(true);
        try {
            // Fetch platform revenue stats
            const { data: revData } = await supabase
                .from('platform_revenue')
                .select('*')
                .order('created_at', { ascending: false });

            if (revData) {
                const totalRev = revData.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
                const totalFee = revData.reduce((acc, curr) => acc + (curr.platform_fee || 0), 0);
                const totalGst = revData.reduce((acc, curr) => acc + (curr.gst_amount || 0), 0);

                setStats({
                    totalRevenue: totalRev,
                    totalPlatformFee: totalFee,
                    totalGst: totalGst,
                    recentTransactions: revData.slice(0, 10)
                });
            }
        } catch (err) {
            console.error("Revenue Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Revenue Data...</div>;

    const cards = [
        { label: 'Total Revenue', value: stats.totalRevenue, icon: DollarSign, color: '#3b82f6', trend: '+12%' },
        { label: 'Platform Fees', value: stats.totalPlatformFee, icon: TrendingUp, color: '#ec4899', trend: '+8%' },
        { label: 'GST Collected', value: stats.totalGst, icon: Activity, color: '#8b5cf6', trend: '+15%' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Platform Economics</h2>
                    <p className="text-sm text-slate-500 font-medium">Real-time revenue tracking and tax compliance monitor.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        <Calendar size={14} /> Last 30 Days
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                        <Filter size={14} /> Filter
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <card.icon size={80} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">{card.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">₹{card.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                    <ArrowUpRight size={10} /> {card.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Revenue Stream */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                <BarChart3 size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Revenue Stream</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Fee</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">GST (18%)</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.recentTransactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <p className="text-sm font-bold text-slate-900">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-medium text-slate-400">{new Date(tx.created_at).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="p-6 text-sm font-black text-pink-500">₹{tx.platform_fee.toFixed(2)}</td>
                                        <td className="p-6 text-sm font-bold text-slate-600">₹{tx.gst_amount.toFixed(2)}</td>
                                        <td className="p-6">
                                            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[11px] font-black">
                                                ₹{tx.total_revenue.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Growth Chart Placeholder / Distribution */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                <PieChart size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Earnings Split</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { label: 'Event Bookings', value: '72%', color: '#ec4899' },
                                { label: 'Service Sessions', value: '18%', color: '#8b5cf6' },
                                { label: 'Ad Banners', value: '10%', color: '#3b82f6' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                                        <span>{item.label}</span>
                                        <span>{item.value}</span>
                                    </div>
                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full" 
                                            style={{ width: item.value, backgroundColor: item.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 p-6 bg-slate-900 rounded-[32px] text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Net Platform Margin</p>
                        <h4 className="text-2xl font-black tracking-tight">₹{(stats.totalPlatformFee * 0.82).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">After estimated operational costs & deductions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
