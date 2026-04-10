import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle, XCircle, Search, Filter, Trash2, User, Briefcase, Eye, EyeOff, X, Key, ShieldCheck, Mail, AlertTriangle } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdminPartnerRequestsTable({ t, theme }) {
    const requests = useQuery(api.partnerRequests.getAll) || [];
    const updateStatus = useMutation(api.partnerRequests.updateStatus);
    const approveMutation = useMutation(api.partnerRequests.approve);
    const removeRequest = useMutation(api.partnerRequests.remove);
    const { showToast } = useToast();

    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("Pending");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [manualPassword, setManualPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdate = async (id, status) => {
        try {
            await updateStatus({ id, status });
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
            await approveMutation({ 
                id: selectedRequest._id, 
                password: manualPassword 
            });
            setShowApproveModal(false);
            showToast("Partner approved! Credentials sent via Email and SMS.", "success");
        } catch (err) {
            showToast("Error approving request: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await removeRequest({ id });
            showToast("Request deleted successfully", "info");
        } catch (err) {
            showToast("Error deleting request: " + err.message, "error");
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesType = filterType === "all" || (req.type || "professional_service") === filterType;
            const matchesStatus = filterStatus === "all" || req.status === filterStatus;
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                `${req.firstName} ${req.lastName}`.toLowerCase().includes(search) || 
                req.email.toLowerCase().includes(search) ||
                (req.phone && req.phone.includes(searchTerm));
            
            return matchesType && matchesStatus && matchesSearch;
        });
    }, [requests, filterType, filterStatus, searchTerm]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? '#1e293b' : '#fff', color: t.textMain, fontSize: "13px" }}
                    >
                        <option value="all">All Partners</option>
                        <option value="organiser">Organisers</option>
                        <option value="professional_service">Service Providers</option>
                    </select>

                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? '#1e293b' : '#fff', color: t.textMain, fontSize: "13px" }}
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", background: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}` }}>
                {filteredRequests.length === 0 ? (
                    <div style={{ padding: "60px", textAlign: "center", color: t.textSub }}>
                        No results found matching your filters.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc' }}>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Partner / Type</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact Info</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category / Role</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Submitted</th>
                                <th style={{ padding: "14px 16px", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                                <th style={{ padding: "14px 16px", textAlign: "right", color: t.textSub, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((req) => (
                                <tr key={req._id} style={{ borderBottom: `1px solid ${t.border}`, transition: "0.2s" }} className="hover-row">
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontWeight: 700, color: t.textMain, fontSize: "14px" }}>{req.firstName} {req.lastName}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                {(req.type || "professional_service") === "organiser" ? (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#3b82f615", color: "#3b82f6", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                                                        <User size={10} /> Organiser
                                                    </span>
                                                ) : (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#8b5cf615", color: "#8b5cf6", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                                                        <Briefcase size={10} /> Professional
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ fontSize: "13px", color: t.textMain }}>{req.email}</div>
                                        <div style={{ fontSize: "12px", color: t.textSub }}>{req.phone}</div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ fontSize: "13px", color: t.textMain, fontWeight: 500 }}>{req.category}</div>
                                        <div style={{ fontSize: "12px", color: t.textSub }}>{req.role}</div>
                                    </td>
                                    <td style={{ padding: "16px", fontSize: "12px", color: t.textSub }}>
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{
                                            display: "inline-flex", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700,
                                            backgroundColor: req.status === "Approved" ? "#dcfce7" : req.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                                            color: req.status === "Approved" ? "#166534" : req.status === "Rejected" ? "#991b1b" : "#92400e"
                                        }}>
                                            {req.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px", textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                            {req.status === "Pending" && (
                                                <>
                                                    <button 
                                                        onClick={() => handleApprove(req)} 
                                                        title="Approve & Set Password"
                                                        style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: "#22c55e15", color: "#22c55e", cursor: "pointer", transition: "0.2s" }}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdate(req._id, "Rejected")} 
                                                        title="Reject Request"
                                                        style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: "#ef444415", color: "#ef4444", cursor: "pointer", transition: "0.2s" }}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(req._id)} 
                                                title="Delete Log"
                                                style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9', color: t.textSub, cursor: "pointer", transition: "0.2s" }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>Authorize Partner</h2>
                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", marginTop: "4px" }}>Approving <strong>{selectedRequest.firstName} {selectedRequest.lastName}</strong></p>
                        </div>

                        <div style={{ padding: "24px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: theme === 'dark' ? '#1e293b' : '#f8fafc', padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                    <Mail size={16} color="#3b82f6" />
                                    <div>
                                        <p style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, margin: 0, textTransform: "uppercase" }}>Login Account</p>
                                        <p style={{ fontSize: "14px", fontWeight: 600, color: t.textMain, margin: 0 }}>{selectedRequest.email}</p>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Key size={12} /> MANUAL PASSWORD
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
                                    {isSubmitting ? "Finalizing Approval..." : "Approve & Send Credentials"}
                                </button>
                                
                                <p style={{ fontSize: "11px", color: t.textSub, textAlign: "center", margin: 0 }}>
                                    Partner will be notified via <strong>Email</strong> and <strong>SMS</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
