"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Zap, Users, ShieldCheck, AlertCircle, 
    BarChart3, Clock, MapPin, Activity,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function ScannerMonitor({ t }) {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data, error } = await supabase
                .from('gate_monitoring_stats')
                .select('*, events(title)')
                .order('last_scan_at', { ascending: false });
            
            if (!error) setStats(data || []);
            setLoading(false);
        };

        fetchStats();

        // Subscribe to real-time gate updates
        const channel = supabase
            .channel('gate_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_monitoring_stats' }, (payload) => {
                setStats(current => {
                    const idx = current.findIndex(s => s.id === payload.new.id);
                    if (idx >= 0) {
                        const next = [...current];
                        next[idx] = { ...next[idx], ...payload.new };
                        return next;
                    }
                    return [payload.new, ...current];
                });
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">Syncing with scanners...</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
                        <Activity size={24} />
                    </div>

                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Scans</h4>
                    <p className="text-3xl font-black text-slate-900">{stats.reduce((a, b) => a + (b.total_scanned || 0), 0)}</p>
                </div>
                {/* Add more metric cards if needed */}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase italic">Live Gate Monitoring</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time attendance tracking per event</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase">Live Feed Active</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Event / Venue</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Efficiency</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Scanned / Total</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Success Rate</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Entry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map(stat => {
                                const progress = (stat.total_scanned / (stat.total_expected || 1)) * 100;
                                const successRate = (stat.successful_scans / (stat.total_scanned || 1)) * 100;
                                
                                return (
                                    <tr key={stat.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <p className="text-sm font-black text-slate-900 uppercase italic">{stat.events?.title || 'Unknown Event'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gate: {stat.gate_id || 'Main Entrance'}</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-1000" 
                                                    style={{ width: `${Math.min(100, progress)}%` }} 
                                                />
                                            </div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase mt-2">{progress.toFixed(1)}% Capacity</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-900">{stat.total_scanned}</span>
                                                <span className="text-[10px] font-bold text-slate-300">/ {stat.total_expected}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${successRate > 95 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {successRate.toFixed(1)}% SUCCESS
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={12} />
                                                <span className="text-[11px] font-bold">{stat.last_scan_at ? new Date(stat.last_scan_at).toLocaleTimeString() : 'No scans yet'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
