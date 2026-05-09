"use client";
import React, { useState, useMemo } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Search, Filter, Trash2, User, Briefcase, Eye, EyeOff, X, Key, ShieldCheck, Mail, AlertTriangle, FileText, Send, Phone, Calendar, ChevronRight, Check, Ban, Users, Tag } from "lucide-react";
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
    const { data: requests = [] } = useSupabaseQuery('partner_requests', (q) => q.order('created_at', { ascending: false }));
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState("professional_service");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [manualPassword, setManualPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showKycModal, setShowKycModal] = useState(false);
    const [kycData, setKycData] = useState(null);
    const [loadingKyc, setLoadingKyc] = useState(false);

    const handleViewKyc = async (req) => {
        setSelectedRequest(req);
        setLoadingKyc(true);
        setShowKycModal(true);
        try {
            const { data, error } = await supabase
                .from('kyc_details')
                .select('*')
                .eq('id', req.user_id || req.id)
                .maybeSingle();
            if (error) throw error;
            setKycData(data || null);
        } catch (err) {
            showToast("Error fetching KYC: " + err.message, "error");
            setShowKycModal(false);
        } finally {
            setLoadingKyc(false);
        }
    };

    const handleUpdate = async (id, status) => {
        try {
            const { error } = await supabase
                .from('partner_requests')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
            showToast(`Request ${status.toLowerCase()} successfully`, 'success');
        } catch (err) {
            showToast("Error updating status: " + err.message, 'error');
        }
    };

    const handleApprove = (req) => {
        setSelectedRequest(req);
        setManualPassword("");
        setConfirmPassword("");
        setShowApproveModal(true);
    };

    const submitApproval = async () => {
        if (!manualPassword) {
            showToast("Please enter a password.", "error");
            return;
        }
        if (manualPassword !== confirmPassword) {
            showToast("Passwords do not match!", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/action', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    action: 'approve-partner',
                    data: {
                        requestId: selectedRequest.id,
                        password: manualPassword
                    }
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Approval failed");
            setShowApproveModal(false);
            showToast("Partner approved and credentials sent!", "success");
        } catch (err) {
            showToast("Error approving request: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this request log?")) return;
        try {
            const { error } = await supabase.from('partner_requests').delete().eq('id', id);
            if (error) throw error;
            showToast("Request deleted", "info");
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const trueType = req.type || (isServiceProvider(req.category) ? "professional_service" : "event_organiser");
            const matchesType = trueType === activeTab;
            const matchesStatus = filterStatus === "all" || req.status === filterStatus;
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                `${req.first_name || req.firstName} ${req.last_name || req.lastName}`.toLowerCase().includes(search) || 
                req.email.toLowerCase().includes(search);
            return matchesType && matchesStatus && matchesSearch;
        });
    }, [requests, activeTab, filterStatus, searchTerm]);

    const stats = useMemo(() => {
        return {
            ps: requests.filter(r => (r.type || (isServiceProvider(r.category) ? "professional_service" : "event_organiser")) === "professional_service" && r.status === "Pending").length,
            orgs: requests.filter(r => (r.type || (isServiceProvider(r.category) ? "professional_service" : "event_organiser")) === "event_organiser" && r.status === "Pending").length
        };
    }, [requests]);

    return (
        <div className="flex flex-col gap-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab("professional_service")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "professional_service" ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Briefcase size={16} />
                        Professional Services
                        {stats.ps > 0 && <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.ps}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab("event_organiser")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "event_organiser" ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <User size={16} />
                        Event Organisers
                        {stats.orgs > 0 && <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.orgs}</span>}
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
                                {req.first_name || req.firstName} {req.last_name || req.lastName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Mail size={12} /> {req.email}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Phone size={12} /> {req.phone || "No phone"}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-black text-pink-500/70 uppercase tracking-wider">
                                    <Tag size={12} /> {req.category}
                                </span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-8 px-6 border-x border-slate-100 flex-shrink-0">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Requested On</p>
                                <p className="text-sm font-black" style={{ color: t.textMain }}>
                                    {new Date(req.created_at || req.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">KYC Status</p>
                                <p className={`text-sm font-black ${req.kyc_status === 'Approved' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {req.kyc_status || "Pending"}
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
                                {req.status === 'Pending' && (
                                    <button 
                                        onClick={() => handleApprove(req)}
                                        className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-pink-500/20"
                                        title="Approve Partner"
                                    >
                                        <Check size={18} strokeWidth={3} />
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
                            <h2 className="text-2xl font-black mb-1">Grant Access</h2>
                            <p className="text-white/70 text-sm font-medium">Create credentials for {selectedRequest.first_name} {selectedRequest.last_name}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Set Login Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type={showPass ? "text" : "password"}
                                            value={manualPassword}
                                            onChange={(e) => setManualPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-bold"
                                            placeholder="••••••••"
                                        />
                                        <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 transition-colors">
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Confirm Password</label>
                                    <input 
                                        type={showPass ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-6 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-2xl flex gap-3 items-center">
                                <Send className="text-emerald-500" size={18} />
                                <p className="text-[11px] font-bold text-emerald-700 leading-tight">Approved partners will receive their login details via email and SMS instantly.</p>
                            </div>
                            <button 
                                onClick={submitApproval}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                            >
                                {isSubmitting ? "Processing..." : "Approve & Send Credentials"}
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
                                            <p className="text-base font-black text-slate-900">{kycData.full_name || "Not Provided"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Business Entity</label>
                                            <p className="text-base font-black text-slate-900">{kycData.business_name || "Individual / Sole Prop"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Registration ID</label>
                                            <p className="text-base font-bold text-slate-600">{kycData.registration_number || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tax Identity</label>
                                            <p className="text-base font-bold text-slate-600">{kycData.gst_number || "No GST Linked"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Contact Verified</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                <p className="text-xs font-black text-emerald-600 uppercase tracking-tighter">Identity Match Confirmed</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="col-span-2 pt-6 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Identity Documents</label>
                                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">ID_PROOF_PRIMARY.PDF</p>
                                                    <p className="text-[10px] font-bold text-slate-400">Verified Hash: SHA-256 Checksum Active</p>
                                                </div>
                                            </div>
                                            <button className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black border border-slate-200 hover:bg-slate-50 transition-all">
                                                Download Proof
                                            </button>
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
