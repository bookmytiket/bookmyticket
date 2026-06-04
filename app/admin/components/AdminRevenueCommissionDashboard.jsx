/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, BarChart3, TrendingUp, PieChart, Wallet } from 'lucide-react';

export default function AdminRevenueCommissionDashboard() {
    const [stats, setStats] = useState({
        total_platform_revenue: 0,
        total_organizer_revenue: 0,
        total_service_provider_revenue: 0,
        pending_payouts: 0,
        completed_payouts: 0,
        commission_breakdown: []
    });
    const [loading, setLoading] = useState(true);

    

    const fetchStats = async () => {
        setLoading(true);
        // We simulate a backend aggregation or use the organizer_reports table to sum things up
        const { data, error } = await supabase.from('organizer_reports').select('total_revenue, commission_amount');
        
        let orgRev = 0;
        let comm = 0;
        if (data) {
            data.forEach(d => {
                orgRev += (d.total_revenue - d.commission_amount);
                comm += d.commission_amount;
            });
        }

        setStats({
            total_platform_revenue: comm,
            total_organizer_revenue: orgRev,
            total_service_provider_revenue: 0, // Mock for now since services just added
            pending_payouts: orgRev * 0.2, // mock value
            completed_payouts: orgRev * 0.8, // mock value
            commission_breakdown: [
                { category: 'Events', amount: comm * 0.9 },
                { category: 'Services', amount: comm * 0.1 }
            ]
        });
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Financials...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Wallet className="text-emerald-500" />
                        Revenue & Commission Dashboard
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Platform-wide financial health and payout tracking.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<DollarSign className="text-emerald-500" />} title="Platform Revenue (Commission)" value={`₹${stats.total_platform_revenue.toLocaleString()}`} />
                <StatCard icon={<TrendingUp className="text-blue-500" />} title="Organizer Revenue" value={`₹${stats.total_organizer_revenue.toLocaleString()}`} />
                <StatCard icon={<PieChart className="text-purple-500" />} title="Service Provider Revenue" value={`₹${stats.total_service_provider_revenue.toLocaleString()}`} />
                
                <StatCard icon={<BarChart3 className="text-amber-500" />} title="Pending Payouts" value={`₹${stats.pending_payouts.toLocaleString()}`} />
                <StatCard icon={<CheckCircleIcon className="text-green-500" />} title="Completed Payouts" value={`₹${stats.completed_payouts.toLocaleString()}`} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Commission Breakdown</h3>
                <div className="space-y-4">
                    {stats.commission_breakdown.map(b => (
                        <div key={b.category} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                            <span className="font-bold text-slate-700">{b.category}</span>
                            <span className="font-black text-slate-900">₹{b.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</div>
                <div className="text-2xl font-black text-slate-800">{value}</div>
            </div>
        </div>
    );
}

function CheckCircleIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    );
}
