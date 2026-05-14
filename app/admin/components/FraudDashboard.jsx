"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    ShieldCheck, Fingerprint, MapPin, 
    Smartphone, AlertTriangle, CheckCircle,
    XCircle, Info, Lock, Eye, Trash2, Clock, Zap
} from 'lucide-react';

export default function FraudDashboard({ t }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            const { data } = await supabase
                .from('fraud_alerts')
                .select('*, profiles(full_name, email)')
                .order('created_at', { ascending: false });
            setAlerts(data || []);
            setLoading(false);
        };
        fetchAlerts();
    }, []);

    const updateAlertStatus = async (id, status) => {
        const { error } = await supabase
            .from('fraud_alerts')
            .update({ status })
            .eq('id', id);
        if (!error) {
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400">Scanning for threats...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Security Ops Center</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Heuristic Fraud Detection & Monitoring</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-3 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">{alerts.filter(a => a.status === 'pending').length} Active Threats</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Alert List */}
                <div className="lg:col-span-8 space-y-6">
                    {alerts.length === 0 ? (
                        <div className="p-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                            <ShieldCheck size={48} className="text-slate-100 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No security anomalies detected</p>
                        </div>

                    ) : alerts.map(alert => (
                        <div key={alert.id} className={`p-8 bg-white rounded-[2.5rem] border transition-all ${alert.status === 'pending' ? 'border-red-100 shadow-xl shadow-red-500/5' : 'border-slate-100'}`}>
                            <div className="flex items-start justify-between gap-8">
                                <div className="flex items-start gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${alert.risk_level === 'high' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                        {alert.alert_type === 'double_login' ? <Lock size={24} /> : <Fingerprint size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-sm font-black text-slate-900 uppercase italic">{alert.alert_type.replace(/_/g, ' ')}</h4>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${alert.risk_level === 'high' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                {alert.risk_level} Risk
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mb-4">{alert.details || 'Suspicious activity pattern detected from user device.'}</p>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">U</div>
                                                <span className="text-[11px] font-bold text-slate-900">{alert.profiles?.full_name || 'Anonymous User'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold">{new Date(alert.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    {alert.status === 'pending' ? (
                                        <>
                                            <button 
                                                onClick={() => updateAlertStatus(alert.id, 'resolved')}
                                                className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                            >
                                                Resolve
                                            </button>
                                            <button 
                                                onClick={() => updateAlertStatus(alert.id, 'dismissed')}
                                                className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                            >
                                                Dismiss
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${alert.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                            {alert.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Context */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">

                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                            <Smartphone size={18} className="text-pink-500" />
                            Device Intelligence
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Active Sessions', val: '1,204', color: 'bg-emerald-500' },
                                { label: 'Known Devices', val: '8,492', color: 'bg-blue-500' },
                                { label: 'Blocked IPs', val: '142', color: 'bg-red-500' }
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black">{item.val}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
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
