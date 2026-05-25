"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Check, X, Search, FileText, User, Building, CreditCard, ExternalLink, ShieldAlert, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdminKycReview({ t }) {
    const [kycList, setKycList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("submitted");
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedKyc, setSelectedKyc] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const fetchKycList = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/kyc-list', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token || ""}`
                }
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || "Failed to fetch");
            
            setKycList(payload.kycList || []);
        } catch (err) {
            console.error("Fetch KYC Error:", err);
            showToast("Failed to fetch KYC applications", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchKycList();
    }, [fetchKycList]);

    const handleAction = async (action, reason = "") => {
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/kyc-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ""}`
                },
                body: JSON.stringify({
                    organizer_id: selectedKyc.organizer_id,
                    action,
                    reason,
                    notes: `Action performed by admin: ${action}`
                })
            });

            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || `Unable to ${action} KYC`);
            
            showToast(`KYC successfully ${action}d`, 'success');
            setSelectedKyc(null);
            fetchKycList();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
            setRejectReason("");
        }
    };

    const filteredList = useMemo(() => {
        return kycList.filter(item => {
            const matchesTab = item.kyc_status === activeTab;
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                (item.profile?.business_name || "").toLowerCase().includes(search) || 
                (item.profile?.full_name || "").toLowerCase().includes(search) ||
                (item.profile?.email || "").toLowerCase().includes(search);
            return matchesTab && matchesSearch;
        });
    }, [kycList, activeTab, searchTerm]);

    const stats = useMemo(() => {
        return {
            submitted: kycList.filter(r => r.kyc_status === "submitted" || r.kyc_status === "under_review").length,
            approved: kycList.filter(r => r.kyc_status === "approved").length,
            rejected: kycList.filter(r => r.kyc_status === "rejected" || r.kyc_status === "reupload_required").length,
        };
    }, [kycList]);

    // File URL fetcher logic
    const getPublicUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const { data } = supabase.storage.from('organizer-kyc-documents').getPublicUrl(path);
        return data.publicUrl;
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit flex-wrap">
                    <button 
                        onClick={() => setActiveTab("submitted")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "submitted" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldAlert size={16} />
                        Under Review
                        {stats.submitted > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.submitted}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab("approved")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "approved" ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Check size={16} />
                        Approved
                    </button>
                    <button 
                        onClick={() => setActiveTab("rejected")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "rejected" ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <X size={16} />
                        Rejected / Reupload
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search business..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                ) : filteredList.length > 0 ? filteredList.map((item) => (
                    <div key={item.id} className="card-premium flex flex-col md:flex-row items-center gap-6 group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => setSelectedKyc(item)}>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-black truncate text-slate-900">
                                {item.profile?.business_name || "Unknown Business"}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <User size={12} /> {item.profile?.full_name}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Building size={12} /> {item.profile?.business_type}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 px-6 border-x border-slate-100 flex-shrink-0">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Submitted On</p>
                                <p className="text-sm font-black text-slate-900">
                                    {new Date(item.submitted_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                                <p className={`text-sm font-black uppercase ${item.kyc_status === 'approved' ? 'text-emerald-500' : item.kyc_status === 'rejected' ? 'text-red-500' : 'text-orange-500'}`}>
                                    {item.kyc_status.replace('_', ' ')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                                <ExternalLink size={18} />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black mb-2 text-slate-900">No Applications Found</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">There are no KYC applications in this category.</p>
                    </div>
                )}
            </div>

            {selectedKyc && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                    <div className="premium-glass max-w-4xl w-full rounded-[32px] overflow-hidden shadow-2xl my-8">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 text-white relative">
                            <button onClick={() => setSelectedKyc(null)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <ShieldAlert size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black mb-1">{selectedKyc.profile?.business_name}</h2>
                                    <p className="text-white/70 text-sm font-medium uppercase tracking-wider">{selectedKyc.profile?.business_type}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Col: Details */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={16}/> Profile</h3>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">Name</p><p className="text-sm font-black text-slate-900">{selectedKyc.profile?.full_name}</p></div>
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">PAN Number</p><p className="text-sm font-black text-slate-900">{selectedKyc.profile?.pan_number}</p></div>
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">GST Number</p><p className="text-sm font-black text-slate-900">{selectedKyc.profile?.gst_number || 'N/A'}</p></div>
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">Address</p><p className="text-sm font-black text-slate-900">{selectedKyc.profile?.business_address}, {selectedKyc.profile?.city}</p></div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CreditCard size={16}/> Bank Info</h3>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">Account Name</p><p className="text-sm font-black text-slate-900">{selectedKyc.bank?.account_holder_name}</p></div>
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">Bank Name</p><p className="text-sm font-black text-slate-900">{selectedKyc.bank?.bank_name}</p></div>
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">Account Number</p><p className="text-sm font-black text-slate-900">{selectedKyc.bank?.account_number}</p></div>
                                        <div><p className="text-[10px] text-slate-500 font-bold uppercase">IFSC Code</p><p className="text-sm font-black text-slate-900">{selectedKyc.bank?.ifsc_code}</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Documents & Actions */}
                            <div className="space-y-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16}/> Documents</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['identity_proof_url', 'business_proof_url', 'address_proof_url', 'cancelled_cheque_url'].map(docKey => {
                                            const url = getPublicUrl(selectedKyc.documents?.[docKey]);
                                            if (!url) return null;
                                            return (
                                                <a key={docKey} href={url} target="_blank" rel="noreferrer" className="flex flex-col gap-2 p-3 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                                    <div className="h-20 bg-slate-100 rounded-lg overflow-hidden relative">
                                                        <img src={url} className="w-full h-full object-cover" alt="Document" onError={(e) => {e.target.src="https://placehold.co/400?text=PDF/Doc"}} />
                                                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center">
                                                            <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase truncate">{docKey.replace(/_url/g, '').replace(/_/g, ' ')}</span>
                                                </a>
                                            )
                                        })}
                                    </div>
                                </div>

                                {selectedKyc.kyc_status === 'submitted' || selectedKyc.kyc_status === 'under_review' ? (
                                    <div className="space-y-3 pt-6 border-t border-slate-100">
                                        <button 
                                            onClick={() => handleAction('approve')}
                                            disabled={isSubmitting}
                                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} /> Approve Application
                                        </button>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => {
                                                    const r = prompt("Reason for requiring reupload?");
                                                    if(r) handleAction('reupload', r);
                                                }}
                                                disabled={isSubmitting}
                                                className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl font-bold transition-all text-sm"
                                            >
                                                Request Reupload
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const r = prompt("Reason for rejection?");
                                                    if(r) handleAction('reject', r);
                                                }}
                                                disabled={isSubmitting}
                                                className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all text-sm"
                                            >
                                                Reject Application
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle size={16} className="text-slate-400" />
                                            <p className="text-sm font-black text-slate-700">Application Closed</p>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500">Current Status: <strong className="uppercase">{selectedKyc.kyc_status}</strong></p>
                                        {selectedKyc.rejection_reason && <p className="text-xs font-medium text-red-500 mt-2 bg-red-50 p-2 rounded">Reason: {selectedKyc.rejection_reason}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
