"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Search, Filter, Trash2, User, Briefcase, Eye, EyeOff, X, Key, ShieldCheck, Mail, AlertTriangle, FileText, Send, Phone, Calendar, ChevronRight, Check, Ban, Users, Tag, Building2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const isServiceProvider = (category) => {
    if (!category) return false;
    const c = String(category).trim().toLowerCase();
    return (
        c.includes("mehandi") ||
        c.includes("mehendi") ||
        c.includes("photograph") ||
        c.includes("makeup") ||
        c.includes("artist") ||
        c.includes("turf") ||
        c.includes("personal service")
    );
};

export default function AdminPartnerRequestsTable({ t, theme }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // 1. Robust Realtime Fetching
    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            // kyc_details.id is the user's auth/profile id. There is no PostgREST
            // FK relationship in the live schema, so fetch profiles separately.
            const { data: kycRows, error } = await supabase
                .from('kyc_details')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            const profileIds = [...new Set((kycRows || []).map(row => row.id).filter(Boolean))];
            let profilesById = {};

            if (profileIds.length > 0) {
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, phone')
                    .in('id', profileIds);

                if (profileError) throw profileError;
                profilesById = Object.fromEntries((profiles || []).map(profile => [profile.id, profile]));
            }

            setRequests((kycRows || []).map(row => ({
                ...row,
                user_id: row.id,
                profiles: profilesById[row.id] || null
            })));
        } catch (err) {
            console.error("Admin Sync Error:", err);
            showToast("Failed to sync KYC data", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // 2. Realtime Listener
    useEffect(() => {
        Promise.resolve().then(fetchRequests);

        // Listen for new KYC submissions or status changes
        const channel = supabase
            .channel('admin-kyc-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kyc_details' }, () => {
                console.log("[Admin] Realtime KYC update detected...");
                fetchRequests();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchRequests]);

    const [activeTab, setActiveTab] = useState("Pending");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showKycModal, setShowKycModal] = useState(false);
    const [kycData, setKycData] = useState(null);
    const [loadingKyc, setLoadingKyc] = useState(false);

    const handleViewKyc = (req) => {
        setSelectedRequest(req);
        setKycData(req); // Since we now fetch full data in the main query
        setShowKycModal(true);
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ""}`
                },
                body: JSON.stringify({
                    action: 'verify-kyc',
                    data: {
                        organiserId: id,
                        status,
                        reason: status === 'Rejected' ? 'Rejected by admin' : null
                    }
                })
            });

            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload.error || 'Unable to update KYC status');
            }

            showToast(status === 'Approved' ? "KYC verified. Organiser portal access granted." : `Status updated to ${status}`, 'success');
            fetchRequests();
        } catch (err) {
            showToast("Update failed: " + err.message, 'error');
        }
    };

    const submitApproval = async () => {
        setIsSubmitting(true);
        try {
            await handleUpdateStatus(selectedRequest.id, 'Approved');
            setShowApproveModal(false);
        } catch (err) {
            showToast("Error approving request: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this KYC record? This cannot be undone.")) return;
        try {
            const { error } = await supabase.from('kyc_details').delete().eq('id', id);
            if (error) throw error;
            showToast("Record deleted", "info");
            fetchRequests();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesTab = activeTab === "all" || req.status === activeTab || (activeTab === "Pending" && req.status === "Submitted");
            const matchesStatus = filterStatus === "all" || req.status === filterStatus;
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                (req.profiles?.full_name || "").toLowerCase().includes(search) || 
                (req.profiles?.email || "").toLowerCase().includes(search) ||
                (req.business_name || "").toLowerCase().includes(search);
            return matchesTab && matchesStatus && matchesSearch;
        });
    }, [requests, activeTab, filterStatus, searchTerm]);

    const stats = useMemo(() => {
        return {
            pending: requests.filter(r => r.status === "Pending" || r.status === "Submitted").length,
            approved: requests.filter(r => r.status === "Approved").length
        };
    }, [requests]);

    return (
        <div className="flex flex-col gap-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab("Pending")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "Pending" ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldCheck size={16} />
                        Pending Verification
                        {stats.pending > 0 && <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.pending}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab("Approved")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "Approved" ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CheckCircle size={16} />
                        Verified Partners
                        {stats.approved > 0 && <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.approved}</span>}
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search partners..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-medium w-64"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none text-sm font-bold text-slate-600 cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="KYC Completed">KYC Done</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* List View */}
            <div className="grid grid-cols-1 gap-4">
                {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                    <div key={req.id} className="card-premium flex flex-col md:flex-row items-center gap-6 group hover:border-pink-500/30 transition-all">
                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-black truncate" style={{ color: t.textMain }}>
                                {req.profiles?.full_name || req.org_name || "Unknown Partner"}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Mail size={12} /> {req.profiles?.email || "N/A"}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Phone size={12} /> {req.profiles?.phone || "N/A"}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-black text-pink-500/70 uppercase tracking-wider">
                                    <Building2 size={12} /> {req.business_category || "General"}
                                </span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-8 px-6 border-x border-slate-100 flex-shrink-0">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Requested On</p>
                                <p className="text-sm font-black" style={{ color: t.textMain }}>
                                    {new Date(req.submitted_at || req.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">KYC Status</p>
                                <p className={`text-sm font-black ${req.status === 'Approved' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {req.status || "Pending"}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className={`status-badge px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                req.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                                {req.status}
                            </div>
                            
                            <div className="flex gap-2">
                                {["Pending", "Submitted", "Under Review"].includes(req.status) && (
                                    <button 
                                        onClick={() => { setSelectedRequest(req); setShowApproveModal(true); }}
                                        className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-pink-500/20"
                                        title="Approve Partner"
                                    >
                                        <Check size={18} strokeWidth={3} />
                                    </button>
                                )}
                                {["Pending", "Submitted", "Under Review"].includes(req.status) && (
                                    <button 
                                        onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                                        className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="Reject Application"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleViewKyc(req)}
                                    className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-black/20"
                                    title="View Details"
                                >
                                    <Eye size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(req.id)}
                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
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
                            <Users size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black mb-2" style={{ color: t.textMain }}>No pending requests</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">When new partners sign up, they will appear here for your review and approval.</p>
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="premium-glass max-w-md w-full rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-8 text-white relative">
                            <button onClick={() => setShowApproveModal(false)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-2xl font-black mb-1">Verify KYC</h2>
                            <p className="text-white/70 text-sm font-medium">Grant organiser portal access for {selectedRequest.profiles?.full_name || selectedRequest.contact_person || selectedRequest.org_name || "this partner"}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-emerald-50 p-4 rounded-2xl flex gap-3 items-center">
                                <ShieldCheck className="text-emerald-500" size={18} />
                                <p className="text-[11px] font-bold text-emerald-700 leading-tight">This will mark KYC as approved, approve the organiser record, and allow this account into the organiser portal.</p>
                            </div>
                            <button 
                                onClick={submitApproval}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                            >
                                {isSubmitting ? "Processing..." : "Verify KYC & Grant Access"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* KYC Details Modal */}
            {showKycModal && selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
                    <div className="premium-glass max-w-2xl w-full rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">KYC Intelligence</h2>
                                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Verification Dossier</p>
                                </div>
                            </div>
                            <button onClick={() => setShowKycModal(false)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-10">
                            {loadingKyc ? (
                                <div className="py-20 text-center">
                                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm font-bold text-slate-400">Decrypting documents...</p>
                                </div>
                            ) : kycData ? (
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Full Legal Name</label>
                                            <p className="text-base font-black text-slate-900">{kycData.profiles?.full_name || kycData.contact_person || "Not Provided"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Business Entity</label>
                                            <p className="text-base font-black text-slate-900">{kycData.org_name || "Individual / Sole Prop"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Business Category</label>
                                            <p className="text-base font-bold text-slate-600">{kycData.business_category || "General"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tax Identity (PAN)</label>
                                            <p className="text-base font-bold text-slate-600 font-mono">{kycData.pan_number || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Settlement Bank</label>
                                            <p className="text-base font-bold text-slate-600">{kycData.bank_details?.bank_name || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Verification Status</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${kycData.status === 'Approved' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                                <p className={`text-xs font-black uppercase tracking-tighter ${kycData.status === 'Approved' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {kycData.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="col-span-2 pt-6 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Identity Documents</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: "ID Proof", url: kycData.id_proof_url },
                                                { label: "Business Proof", url: kycData.business_proof_url },
                                                { label: "Address Proof", url: kycData.address_proof_url },
                                                { label: "Bank Proof", url: kycData.bank_details?.cancelled_cheque_url }
                                            ].map((doc, idx) => doc.url && (
                                                <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
                                                            <FileText size={18} />
                                                        </div>
                                                        <p className="text-xs font-black text-slate-900">{doc.label}</p>
                                                    </div>
                                                    <a 
                                                        href={doc.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black border border-slate-200 hover:bg-slate-50 transition-all"
                                                    >
                                                        VIEW
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                    <AlertTriangle size={48} className="text-orange-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-black text-slate-900">No KYC Record Found</h4>
                                    <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">This partner has not yet submitted their digital KYC dossier for verification.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
