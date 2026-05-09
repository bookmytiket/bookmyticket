'use client';

import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Download, 
    Calendar, 
    ShieldCheck, 
    Activity,
    ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GstAuditDashboard({ t, theme }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGstReports();
    }, []);

    const fetchGstReports = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('gst_audit_report')
                .select('*')
                .order('created_at', { ascending: false });
            setReports(data || []);
        } catch (err) {
            console.error("GST Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const totalGst = reports.reduce((acc, curr) => acc + (curr.gst_collected || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Tax Intelligence</h2>
                    <p className="text-sm text-slate-500 font-medium">Audit-ready GST compliance logs and monthly statements.</p>
                </div>
                <button 
                    onClick={() => {
                        const csv = "Source,Reference,Taxable Value,GST Collected,Date\n" + 
                                   reports.map(r => `${r.source},${r.reference},${r.taxable_value},${r.gst_collected},${r.created_at}`).join("\n");
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `GST_Report_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                    }}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200"
                >
                    <Download size={16} /> Export GSTR-1
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Cumulative GST Payable</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">₹{totalGst.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-emerald-500">
                        <ShieldCheck size={32} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Taxable Value</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                            ₹{reports.reduce((acc, curr) => acc + (curr.taxable_value || 0), 0).toLocaleString('en-IN')}
                        </h3>
                    </div>
                    <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-500">
                        <Activity size={32} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">GST Audit Trail</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Node</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Value</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">GST (18%)</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No GST records found</td>
                                </tr>
                            ) : reports.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.source === 'Platform Fee' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>
                                            {r.source}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">#{r.reference?.slice(-8).toUpperCase()}</p>
                                        <p className="text-[10px] font-medium text-slate-300">{new Date(r.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="p-6 text-sm font-bold text-slate-900">₹{r.taxable_value.toFixed(2)}</td>
                                    <td className="p-6 text-sm font-black text-slate-900">₹{r.gst_collected.toFixed(2)}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Compliant</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
