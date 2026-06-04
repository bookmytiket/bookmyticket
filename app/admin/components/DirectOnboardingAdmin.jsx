/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, UserCheck, Shield, ChevronRight } from 'lucide-react';

export default function DirectOnboardingAdmin() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    

    const fetchRequests = async () => {
        setLoading(true);
        let query = supabase.from('onboarding_requests').select('*').order('created_at', { ascending: false });
        if (filter !== 'All') {
            query = query.eq('user_type', filter);
        }
        const { data, error } = await query;
        if (data) setRequests(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const handleApprove = async (id) => {
        await supabase.from('onboarding_requests').update({ 
            verification_status: 'Verified',
            approved_at: new Date().toISOString()
        }).eq('id', id);
        fetchRequests();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <UserCheck className="text-emerald-500" />
                        Admin Onboarding Center
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Directly onboard and verify Organizers, Service Providers, and Staff.</p>
                </div>
                <div className="flex gap-2">
                    {['All', 'Organizer', 'Service Provider', 'Staff'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 font-bold rounded-lg text-sm ${filter === f ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                            <th className="p-4 font-bold">Request ID</th>
                            <th className="p-4 font-bold">User Type</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold">Requested Date</th>
                            <th className="p-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-400">No onboarding requests found.</td></tr>
                        ) : requests.map(req => (
                            <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="p-4 font-mono text-xs text-slate-500">{req.id}</td>
                                <td className="p-4 font-bold text-slate-800">{req.user_type}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${req.verification_status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {req.verification_status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">{new Date(req.created_at).toLocaleString()}</td>
                                <td className="p-4">
                                    {req.verification_status !== 'Verified' && (
                                        <button onClick={() => handleApprove(req.id)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                            <Shield size={14} /> Verify & Approve
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
