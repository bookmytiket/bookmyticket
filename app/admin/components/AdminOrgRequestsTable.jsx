"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Check, X, Trash2, ShieldCheck, CheckCircle, Search, Mail, Phone, Briefcase } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdminOrgRequestsTable({ t }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("Pending");
    const [searchTerm, setSearchTerm] = useState("");

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/partner-requests?type=event_organiser', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token || ""}`
                }
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || "Failed to fetch");
            
            setRequests((payload.requests || []).map(r => ({
                ...r,
                full_name: r.full_name || `${r.first_name} ${r.last_name}`,
                mobile: r.mobile || r.phone,
                description: r.description || r.remarks
            })));
        } catch (err) {
            console.error("Fetch Org Requests Error:", err);
            showToast("Failed to fetch organiser requests", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchRequests();
        const channel = supabase
            .channel('admin-org-req-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_requests' }, () => {
                fetchRequests();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchRequests]);

    const handleUpdateStatus = async (id, status) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (status === 'Approved') {
                const res = await fetch('/api/admin/action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token || ""}`
                    },
                    body: JSON.stringify({
                        action: 'approve-partner',
                        data: { requestId: id }
                    })
                });

                const payload = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(payload.error || 'Unable to approve partner');
                showToast("Request Approved & Account Created", 'success');
            } else if (status === 'Rejected') {
                const res = await fetch('/api/admin/action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token || ""}`
                    },
                    body: JSON.stringify({
                        action: 'reject-partner',
                        data: { requestId: id, reason: "Rejected by admin" }
                    })
                });

                const payload = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(payload.error || 'Unable to reject partner');
                showToast("Request Rejected", 'success');
            }

            setShowApproveModal(false);
            fetchRequests();
        } catch (err) {
            showToast("Update failed: " + err.message, 'error');
        }
    };

    const submitApproval = async () => {
        setIsSubmitting(true);
        try {
            await handleUpdateStatus(selectedRequest.id, 'Approved');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!requestToDelete) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('partner_requests').delete().eq('id', requestToDelete.id);
            if (error) throw error;
            showToast("Request deleted", "info");
            setShowDeleteModal(false);
            setRequestToDelete(null);
            fetchRequests();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesTab = activeTab === "KYC Initiated" 
                ? ["Approved", "KYC Initiated", "Access Granted"].includes(req.status)
                : (req.status === activeTab || (activeTab === "Pending" && req.status === "Pending"));
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                (req.full_name || "").toLowerCase().includes(search) || 
                (req.email || "").toLowerCase().includes(search) ||
                (req.business_name || "").toLowerCase().includes(search);
            return matchesTab && matchesSearch;
        });
    }, [requests, activeTab, searchTerm]);

    const stats = useMemo(() => {
        return {
            pending: requests.filter(r => r.status === "Pending").length,
            approved: requests.filter(r => r.status === "Approved" || r.status === "KYC Initiated" || r.status === "Access Granted").length
        };
    }, [requests]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab("Pending")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "Pending" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldCheck size={16} />
                        Pending Approval
                        {stats.pending > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.pending}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab("KYC Initiated")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "KYC Initiated" ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CheckCircle size={16} />
                        Approved Organisers
                        {stats.approved > 0 && <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.approved}</span>}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search requests..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                    <div key={req.id} className="card-premium flex flex-col md:flex-row items-center gap-6 group hover:border-blue-500/30 transition-all">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-black truncate" style={{ color: t?.textMain || '#0f172a' }}>
                                {req.business_name || req.full_name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Mail size={12} /> {req.email}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Phone size={12} /> {req.mobile}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-black text-blue-500/70 uppercase tracking-wider">
                                    <Briefcase size={12} /> {req.category}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 px-6 border-x border-slate-100 flex-shrink-0">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Requested On</p>
                                <p className="text-sm font-black" style={{ color: t?.textMain || '#0f172a' }}>
                                    {new Date(req.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                                <p className={`text-sm font-black ${(req.status === 'Approved' || req.status === 'KYC Initiated' || req.status === 'Access Granted') ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {req.status}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex gap-2">
                                {req.status === "Pending" && (
                                    <button 
                                        onClick={() => { setSelectedRequest(req); setShowApproveModal(true); }}
                                        className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
                                        title="Approve Request"
                                    >
                                        <Check size={18} strokeWidth={3} />
                                    </button>
                                )}
                                {req.status === "Pending" && (
                                    <button 
                                        onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                                        className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="Reject Application"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => { setRequestToDelete(req); setShowDeleteModal(true); }}
                                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                    title="Delete Request"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black mb-2" style={{ color: t?.textMain || '#0f172a' }}>No requests found</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">New event organiser requests will appear here.</p>
                    </div>
                )}
            </div>

            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="premium-glass max-w-md w-full rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white relative">
                            <button onClick={() => setShowApproveModal(false)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-2xl font-black mb-1">Verify Organiser</h2>
                            <p className="text-white/70 text-sm font-medium">Approve and create account for {selectedRequest.business_name || selectedRequest.full_name}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-emerald-50 p-4 rounded-2xl flex gap-3 items-center">
                                <CheckCircle className="text-emerald-500" size={18} />
                                <p className="text-[11px] font-bold text-emerald-700 leading-tight">This will approve the request, create an auth account, and send an invite email. They will still need to complete KYC.</p>
                            </div>
                            <button 
                                onClick={submitApproval}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                            >
                                {isSubmitting ? "Processing..." : "Approve & Create Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && requestToDelete && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="premium-glass max-w-md w-full rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 text-white relative">
                            <button onClick={() => setShowDeleteModal(false)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-2xl font-black mb-1">Delete Request?</h2>
                            <p className="text-white/70 text-sm font-medium">Are you sure you want to permanently delete the request from {requestToDelete.business_name || requestToDelete.full_name}?</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <button 
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
                            </button>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
