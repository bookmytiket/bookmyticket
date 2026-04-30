"use client";
import React, { useState, useMemo } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Search, Filter, Trash2, User, Briefcase, Eye, EyeOff, X, Key, ShieldCheck, Mail, AlertTriangle, FileText, Send } from "lucide-react";
import { useToast } from "@/context/ToastContext";

// Client-side fail-safe categorization
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
    const [updateStatus] = useSupabaseMutation('partner_requests', 'update', (q, p) => q.eq('id', p.id));
    const [removeRequest] = useSupabaseMutation('partner_requests', 'delete', (q, p) => q.eq('id', p.id));
    
    // Approval and KYC via Edge Function usually, but for status updates we can use mutation
    // Removed old handleInitiateKyc as handleApprove now handles the first step of KYC Initiation for Organisers

    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState("professional_service"); // "professional_service" or "event_organiser"
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
            // For organisers, we use the new kyc_details table linked by user_id
            // Note: req.user_id might not be in partner_requests yet, so we use req.id if it was mapped
            // Actually, in approve-partner we should have linked them.
            // For now, let's assume we can find it by email or id if the request was approved.
            
            const { data, error } = await supabase
                .from('kyc_details')
                .select('*')
                .eq('id', req.user_id || req.id) // Fallback to req.id if user_id not present
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
        if (manualPassword.length < 8) {
            showToast("Password must be at least 8 characters.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            // Call local API instead of Edge Function for stability
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
            const msg = activeTab === 'event_organiser' 
                ? "KYC Initiated! Credentials sent to organiser." 
                : "Partner approved! Account created and credentials sent.";
            showToast(msg, "success");
        } catch (err) {
            showToast("Error approving request: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from('partner_requests')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast("Request deleted successfully", "info");
        } catch (err) {
            showToast("Error deleting request: " + err.message, "error");
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            // Apply client-side normalization to the type, prioritizing DB value
            const trueType = req.type || (isServiceProvider(req.category) ? "professional_service" : "event_organiser");
            const matchesType = trueType === activeTab;
            
            const matchesStatus = filterStatus === "all" || req.status === filterStatus;
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                `${req.first_name || req.firstName} ${req.last_name || req.lastName}`.toLowerCase().includes(search) || 
                req.email.toLowerCase().includes(search) ||
                (req.phone && req.phone.includes(searchTerm));
            
            return matchesType && matchesStatus && matchesSearch;
        });
    }, [requests, activeTab, filterStatus, searchTerm]);

    const stats = useMemo(() => {
        return {
            ps: requests.filter(r => {
                const type = r.type || (isServiceProvider(r.category) ? "professional_service" : "event_organiser");
                return type === "professional_service" && r.status === "Pending";
            }).length,
            orgs: requests.filter(r => {
                const type = r.type || (isServiceProvider(r.category) ? "professional_service" : "event_organiser");
                return type === "event_organiser" && (r.status === "Pending" || r.status === "KYC Completed");
            }).length,
            totalPs: requests.filter(r => (r.type || (isServiceProvider(r.category) ? "professional_service" : "event_organiser")) === "professional_service").length,
            totalOrgs: requests.filter(r => (r.type || (isServiceProvider(r.category) ? "professional_service" : "event_organiser")) === "event_organiser").length
        };
    }, [requests]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Custom Tabs */}
            <div style={{ display: "flex", gap: "10px", padding: "4px", backgroundColor: t.cardBg, borderRadius: "14px", border: `1px solid ${t.border}`, width: "fit-content" }}>
                <button 
                    onClick={() => setActiveTab("professional_service")}
                    style={{ 
                        padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, 
                        display: "flex", alignItems: "center", gap: "8px", transition: "0.2s",
                        backgroundColor: activeTab === "professional_service" ? "#000" : "transparent",
                        background: activeTab === "professional_service" ? "linear-gradient(135deg, #FF3D6E 0%, #A855F7 100%)" : "transparent",
                        color: activeTab === "professional_service" ? "#fff" : t.textSub
                    }}
                >
                    <Briefcase size={16} /> Professional Services {stats.ps > 0 && <span style={{ background: "#fff", color: "#FF3D6E", padding: "2px 6px", borderRadius: "10px", fontSize: "10px" }}>{stats.ps} New</span>}
                </button>
                <button 
                    onClick={() => setActiveTab("event_organiser")}
                    style={{ 
                        padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, 
                        display: "flex", alignItems: "center", gap: "8px", transition: "0.2s",
                        backgroundColor: activeTab === "event_organiser" ? "#000" : "transparent",
                        background: activeTab === "event_organiser" ? "linear-gradient(135deg, #FF3D6E 0%, #A855F7 100%)" : "transparent",
                        color: activeTab === "event_organiser" ? "#fff" : t.textSub
                    }}
                >
                    <User size={16} /> Event Organisers {stats.orgs > 0 && <span style={{ background: "#fff", color: "#A855F7", padding: "2px 6px", borderRadius: "10px", fontSize: "10px" }}>{stats.orgs} New</span>}
                </button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", backgroundColor: t.cardBg, padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub }} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email or phone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: `1px solid ${t.border}`, background: "transparent", color: t.textMain, fontSize: "13px" }}
                    />
                </div>
                
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Filter size={14} color={t.textSub} />
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? '#1e293b' : '#fff', color: t.textMain, fontSize: "13px" }}
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending Review</option>
                        <option value="KYC Pending">Waiting for KYC</option>
                        <option value="KYC Completed">KYC Completed</option>
                        <option value="Approved">Approved</option>
                        <option value="Access Granted">Active</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", background: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}` }}>
                {filteredRequests.length === 0 ? (
                    <div style={{ padding: "60px", textAlign: "center", color: t.textSub }}>
                        No {activeTab.replace('_', ' ')} requests found.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' }}>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Applicant</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>KYC</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                                <th style={{ padding: "14px 16px", textAlign: "right", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((req) => {
                                const hasRequestId = Boolean(req?.id);
                                return (
                                <tr key={req.id || req.email} style={{ borderBottom: `1px solid ${t.border}`, transition: "0.2s" }} className="hover-row">
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ fontWeight: 700, color: t.textMain, fontSize: "14px" }}>{req.first_name || req.firstName} {req.last_name || req.lastName}</div>
                                        <div style={{ fontSize: "12px", color: t.textSub }}>{req.role}</div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ fontSize: "13px", color: t.textMain }}>{req.email}</div>
                                        <div style={{ fontSize: "12px", color: t.textSub }}>{req.phone}</div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ fontSize: "13px", color: t.textMain, fontWeight: 500 }}>{req.category}</div>
                                    </td>
                                    <td style={{ padding: "16px", fontSize: "12px", color: t.textSub }}>
                                        {req.type === "professional_service" ? "Professional Service" : "Event Organiser"}
                                    </td>
                                    <td style={{ padding: "16px", fontSize: "12px", color: t.textSub }}>
                                        {req.type === "event_organiser" ? (req.kyc_status || req.kycStatus || "Not Started") : "Not Required"}
                                    </td>
                                    <td style={{ padding: "16px", fontSize: "12px", color: t.textSub }}>
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : new Date(req.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{
                                            display: "inline-flex", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700,
                                            backgroundColor: 
                                                req.status === "Approved" ? "#dcfce7" : 
                                                req.status === "Access Granted" ? "#dcfce7" :
                                                req.status === "Rejected" ? "#fee2e2" : 
                                                req.status === "KYC Completed" ? "#dbeafe" :
                                                req.status === "KYC Submitted" ? "#dbeafe" :
                                                req.status === "KYC Initiated" ? "#f3e8ff" :
                                                req.status === "KYC Pending" ? "#fef3c7" : "#f1f5f9",
                                            color: 
                                                req.status === "Approved" ? "#166534" : 
                                                req.status === "Access Granted" ? "#166534" :
                                                req.status === "Rejected" ? "#991b1b" : 
                                                req.status === "KYC Completed" ? "#1e40af" :
                                                req.status === "KYC Submitted" ? "#1e40af" :
                                                req.status === "KYC Initiated" ? "#6b21a8" :
                                                req.status === "KYC Pending" ? "#92400e" : "#475569"
                                        }}>
                                            {req.status === "Access Granted" ? "Active" : req.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px", textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                            {/* Logic for Organisers: Step 1 - Initiate KYC (creates account) */}
                                            {hasRequestId && activeTab === "event_organiser" && req.status === "Pending" && (
                                                 <button 
                                                     onClick={() => handleApprove(req)} 
                                                     title="Initiate KYC & Send Credentials"
                                                     style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: "#8000ff15", color: "#8000ff", cursor: "pointer" }}
                                                 >
                                                     <Key size={16} />
                                                 </button>
                                             )}

                                              {hasRequestId && (
                                                 <button 
                                                     onClick={() => handleViewKyc(req)} 
                                                     title="View Partner Details"
                                                     style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: "#6366f115", color: "#6366f1", cursor: "pointer" }}
                                                 >
                                                     <Eye size={18} />
                                                 </button>
                                             )}

                                              {hasRequestId && (req.status === "KYC Completed" || req.status === "KYC Submitted") && (
                                                 <button 
                                                     onClick={() => handleViewKyc(req)} 
                                                     title="View KYC Documents"
                                                     style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: "#3b82f615", color: "#3b82f6", cursor: "pointer" }}
                                                 >
                                                     <FileText size={18} />
                                                 </button>
                                             )}

                                             {/* Final Approval for PS (immediate) or post-KYC Organisers */}
                                             {(hasRequestId && ((activeTab === "professional_service" && req.status === "Pending") || 
                                               (activeTab === "event_organiser" && req.status === "KYC Completed"))) && (
                                                 <button 
                                                     onClick={() => handleApprove(req)} 
                                                     title="Final Approval"
                                                     style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: "#22c55e15", color: "#22c55e", cursor: "pointer" }}
                                                 >
                                                     <CheckCircle size={18} />
                                                 </button>
                                             )}

                                             {hasRequestId && !["Approved", "Access Granted", "Rejected"].includes(req.status) && (
                                                 <button 
                                                     onClick={() => handleUpdate(req.id, "Rejected")} 
                                                     title="Reject Request"
                                                     style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: "#ef444415", color: "#ef4444", cursor: "pointer" }}
                                                 >
                                                     <XCircle size={18} />
                                                 </button>
                                             )}
                                            
                                            {hasRequestId ? (
                                                <button 
                                                    onClick={() => handleDelete(req.id)} 
                                                    title="Delete Log"
                                                    style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9', color: t.textSub, cursor: "pointer" }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>
            <style jsx>{`
                .hover-row:hover { background-color: #f8fafc; }
                [data-theme='dark'] .hover-row:hover { background-color: #1e293b; }
            `}</style>

            {/* Approval Modal */}
            {showApproveModal && selectedRequest && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}>
                    <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "440px", borderRadius: "20px", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                        <div style={{ background: "linear-gradient(135deg, #FF3D6E 0%, #A855F7 100%)", padding: "24px 20px", textAlign: "center", position: "relative" }}>
                            <button onClick={() => setShowApproveModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
                            <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto" }}>
                                <ShieldCheck size={24} />
                            </div>
                            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>Authorize {activeTab === 'event_organiser' ? 'Organiser' : 'Vendor'}</h2>
                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", marginTop: "4px" }}>Setting credentials for <strong>{selectedRequest.first_name || selectedRequest.firstName} {selectedRequest.last_name || selectedRequest.lastName}</strong></p>
                        </div>

                        <div style={{ padding: "24px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: theme === 'dark' ? '#1e293b' : '#f8fafc', padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                    <Mail size={16} color="#3b82f6" />
                                    <div>
                                        <p style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, margin: 0, textTransform: "uppercase" }}>Login Account (Email)</p>
                                        <p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedRequest.email}</p>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Key size={12} /> SET ACCESS PASSWORD
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <input 
                                            type={showPass ? "text" : "password"} 
                                            value={manualPassword}
                                            onChange={(e) => setManualPassword(e.target.value)}
                                            placeholder="Enter secure password"
                                            style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                                        />
                                        <button 
                                            onClick={() => setShowPass(!showPass)}
                                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.textSub, cursor: "pointer" }}
                                        >
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "6px" }}>CONFIRM PASSWORD</label>
                                    <input 
                                        type={showPass ? "text" : "password"} 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                                    />
                                </div>

                                <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px", backgroundColor: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0", marginTop: "4px" }}>
                                    <Send size={14} color="#16a34a" />
                                    <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>Credentials will be sent via Email & SMS</span>
                                </div>

                                <button 
                                    onClick={submitApproval}
                                    disabled={isSubmitting}
                                    style={{ 
                                        width: "100%", 
                                        padding: "14px", 
                                        borderRadius: "12px", 
                                        background: "linear-gradient(135deg, #FF3D6E 0%, #A855F7 100%)", 
                                        color: "#fff", 
                                        border: "none", 
                                        fontWeight: 800, 
                                        fontSize: "15px", 
                                        cursor: "pointer", 
                                        marginTop: "4px",
                                        opacity: isSubmitting ? 0.7 : 1,
                                        boxShadow: "0 10px 20px rgba(255, 61, 110, 0.15)"
                                    }}
                                >
                                    {isSubmitting ? "Processing..." : "Complete Approval & Grant Access"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KYC Details Modal */}
            {showKycModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}>
                    <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "1100px", borderRadius: "24px", border: `1px solid ${t.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                        <div style={{ background: "linear-gradient(135deg, #FF3D6E 0%, #A855F7 100%)", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <FileText size={20} color="#fff" />
                                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>KYC Documentation</h2>
                            </div>
                            <button onClick={() => setShowKycModal(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
                        </div>
                        
                        <div style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
                            {loadingKyc ? (
                                <div style={{ textAlign: "center", padding: "40px", color: t.textSub }}>Loading details...</div>
                            ) : kycData && kycData.kyc_details ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", alignItems: "start" }}>
                                        {/* Column 1: Profile & Details */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                            <div>
                                                <h3 style={{ fontSize: "14px", fontWeight: 800, color: t.textMain, marginBottom: "16px", borderBottom: `1px solid ${t.border}`, paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <User size={16} className="text-[#FF3D6E]" /> APPLICANT PROFILE
                                                </h3>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc', padding: "20px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                                    <div>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Legal Name</p>
                                                        <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{kycData.kyc_details.orgName || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Representative</p>
                                                        <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{kycData.kyc_details.contactPerson || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>GST Number</p>
                                                        <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{kycData.kyc_details.gstNumber || "Not Provided"}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>PAN Number</p>
                                                        <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{kycData.kyc_details.panNumber || "N/A"}</p>
                                                    </div>
                                                    <div style={{ gridColumn: "span 2" }}>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Registered Address</p>
                                                        <p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0, lineHeight: 1.5 }}>{kycData.kyc_details.address || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 style={{ fontSize: "14px", fontWeight: 800, color: t.textMain, marginBottom: "16px", borderBottom: `1px solid ${t.border}`, paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <Banknote size={16} className="text-[#A855F7]" /> BANKING & SETTLEMENT
                                                </h3>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc', padding: "20px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                                    <div style={{ gridColumn: "span 2" }}>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bank Name</p>
                                                        <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{kycData.kyc_details.bankDetails?.bank_name || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account Number</p>
                                                        <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{kycData.kyc_details.bankDetails?.account_number || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "10px", fontWeight: 700, color: t.textSub, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>IFSC Code</p>
                                                        <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{kycData.kyc_details.bankDetails?.ifsc_code || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ padding: "20px", background: "#f0fdf4", borderRadius: "16px", border: "1px solid #bbf7d0" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#166534" }}>
                                                    <ShieldCheck size={18} />
                                                    <span style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Verification Ready</span>
                                                </div>
                                                <p style={{ fontSize: "12px", color: "#166534", margin: "8px 0 0", opacity: 0.8, fontWeight: 500 }}>Partner has submitted all mandatory documents and accepted the platform terms of service.</p>
                                            </div>
                                        </div>

                                        {/* Column 2: Document Previews */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                            <h3 style={{ fontSize: "14px", fontWeight: 800, color: t.textMain, marginBottom: "16px", borderBottom: `1px solid ${t.border}`, paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <FileText size={16} className="text-[#3b82f6]" /> DOCUMENT VERIFICATION
                                            </h3>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                {[
                                                    { key: 'id_proof_url', label: 'Identity Proof' },
                                                    { key: 'business_proof_url', label: 'Business Proof' },
                                                    { key: 'address_proof_url', label: 'Address Proof' },
                                                    { key: 'cheque_url', label: 'Cancelled Cheque', isCheque: true }
                                                ].map(doc => {
                                                    const url = doc.isCheque ? kycData.kyc_details.cheque_url : kycData.kyc_details[doc.key];
                                                    return (
                                                        <div key={doc.key} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: theme === 'dark' ? '#1e293b' : '#f8fafc', borderRadius: "20px", border: `1px solid ${t.border}` }}>
                                                            <span style={{ fontSize: "10px", fontWeight: 800, color: t.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>{doc.label}</span>
                                                            {url ? (
                                                                <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000", border: `1px solid ${t.border}` }}>
                                                                    <img 
                                                                        src={url} 
                                                                        alt={doc.label}
                                                                        style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer", transition: "0.3s" }}
                                                                        onClick={() => window.open(url, '_blank')}
                                                                        className="hover-scale"
                                                                    />
                                                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "10px", padding: "6px", textAlign: "center", fontWeight: 700, letterSpacing: "0.05em" }}>VIEW FULL SIZE</div>
                                                                </div>
                                                            ) : (
                                                                <div style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9', borderRadius: "12px", fontSize: "11px", color: t.textSub, fontWeight: 600, border: `1.5px dashed ${t.border}` }}>Missing Document</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                                        {kycData.status === 'Submitted' ? (
                                            <div style={{ display: "flex", gap: "12px" }}>
                                                <button 
                                                    onClick={async () => {
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
                                                                    action: 'verify-kyc',
                                                                    data: {
                                                                        requestId: selectedRequest.id,
                                                                        organiserId: kycData.id,
                                                                        status: 'Approved'
                                                                    }
                                                                })
                                                            });
                                                            if (!res.ok) throw new Error("Verification failed");
                                                            showToast("KYC Approved! Organiser now has full access.", "success");
                                                            setShowKycModal(false);
                                                        } catch (err) {
                                                            showToast(err.message, "error");
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }}
                                                    disabled={isSubmitting}
                                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}
                                                >
                                                    Approve KYC
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const reason = prompt("Enter rejection reason:");
                                                        if (!reason) return;
                                                        
                                                        (async () => {
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
                                                                        action: 'verify-kyc',
                                                                        data: {
                                                                            requestId: selectedRequest.id,
                                                                            organiserId: kycData.id,
                                                                            status: 'Rejected',
                                                                            reason: reason
                                                                        }
                                                                    })
                                                                });
                                                                if (!res.ok) throw new Error("Rejection failed");
                                                                showToast("KYC Rejected. Organiser notified.", "info");
                                                                setShowKycModal(false);
                                                            } catch (err) {
                                                                showToast(err.message, "error");
                                                            } finally {
                                                                setIsSubmitting(false);
                                                            }
                                                        })();
                                                    }}
                                                    disabled={isSubmitting}
                                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", fontWeight: 800, cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "10px", borderRadius: "10px", background: kycData.status === 'Approved' ? '#f0fdf4' : '#fef2f2', color: kycData.status === 'Approved' ? '#166534' : '#991b1b', fontSize: "13px", fontWeight: 700 }}>
                                                KYC STATUS: {kycData.status.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px", color: t.textSub }}>No KYC details found for this partner.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
