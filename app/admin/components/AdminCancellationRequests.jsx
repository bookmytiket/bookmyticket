'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Check, X, CheckCircle, Search, Trash2, Clock } from 'lucide-react';

export default function AdminCancellationRequests({ t, theme }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('event_requests')
                .select(`
                    id, 
                    event_id, 
                    reason, 
                    status, 
                    request_type,
                    created_at, 
                    events ( title, date, location )
                `)
                .order('created_at', { ascending: false });
            
            if (data) setRequests(data);
        } catch (err) {
            console.error("Error fetching cancellation requests:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (request, newStatus) => {
        setActionLoading(request.id);
        try {
            if (newStatus === "APPROVED") {
                if (request.request_type === 'DELETION') {
                    // Soft Delete
                    await supabase.from("events").update({ is_deleted: true, deleted_at: new Date().toISOString(), status: 'DELETED' }).eq("id", request.event_id);
                } else {
                    // Cancellation
                    await supabase.from("events").update({ status: 'CANCELLED' }).eq("id", request.event_id);
                }
                
                // Update request
                await supabase.from('event_requests')
                    .update({ status: "APPROVED" })
                    .eq("id", request.id);

            } else {
                // Reject
                await supabase.from('event_requests')
                    .update({ status: "REJECTED" })
                    .eq("id", request.id);

                // Reactivate Event
                await supabase.from('events').update({ status: "Published" }).eq("id", request.event_id);
            }

            // Notify Organizer
            fetch('/api/comm/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: "organiser@bookmyticket.com", // Fallback, could fetch specific email
                    type: newStatus === "APPROVED" ? "ORGANIZER_REQUEST_APPROVED" : "ORGANIZER_REQUEST_REJECTED",
                    data: {
                        eventName: request.events?.title,
                        requestType: request.request_type,
                        status: newStatus
                    }
                })
            }).catch(console.error);

            fetchRequests();
        } catch (err) {
            console.error("Error updating request:", err);
            alert("Error processing action. Please try again.");
        }
        setActionLoading(null);
    };

    if (loading) return <div className="p-8 text-slate-500 font-bold animate-pulse text-center">Loading cancellation requests...</div>;

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const pastRequests = requests.filter(r => r.status !== 'PENDING');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none mb-1.5 flex items-center gap-2" style={{ color: t.textMain }}>
                        <Trash2 className="text-red-500" /> Cancellation Queue
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50" style={{ color: t.textSub }}>
                        Review Organizer Deletion Requests
                    </p>
                </div>
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    {pendingRequests.length} Pending
                </div>
            </div>

            <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                    <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                        <CheckCircle size={48} className="text-emerald-500 mb-4 opacity-50" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">All Clear</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No pending event cancellation requests.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-[24px] border border-red-100 shadow-sm shadow-red-50 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{req.request_type === 'DELETION' ? 'Deletion Requested' : 'Cancellation Requested'}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={12} /> {new Date(req.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 leading-tight mb-1">{req.events?.title || "Unknown Event"}</h4>
                                    <p className="text-sm font-bold text-slate-500 mb-3">{req.events?.date ? new Date(req.events.date).toLocaleDateString() : ""} • {req.events?.location || "N/A"}</p>
                                    
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 inline-block w-full">
                                        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">Reason Provided</span>
                                        <p className="text-sm font-bold text-red-900">{req.reason || "No reason provided."}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 min-w-[140px]">
                                    <button 
                                        onClick={() => handleAction(req, "APPROVED")}
                                        disabled={actionLoading === req.id}
                                        className="px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} /> Approve {req.request_type === 'DELETION' ? 'Deletion' : 'Cancellation'}
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req, "REJECTED")}
                                        disabled={actionLoading === req.id}
                                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <X size={16} /> Reject Request
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {pastRequests.length > 0 && (
                <div className="pt-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Past Requests</h3>
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date Processed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pastRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-[12px] font-black text-slate-900">{req.events?.title || "Unknown"}</td>
                                        <td className="p-4 text-[11px] font-bold text-slate-500">{req.request_type}</td>
                                        <td className="p-4 text-[11px] font-bold text-slate-500 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[10px] font-bold text-slate-400">{new Date(req.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
