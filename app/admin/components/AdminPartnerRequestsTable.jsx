import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle, XCircle, Search, Filter, Trash2, User, Briefcase } from "lucide-react";

export default function AdminPartnerRequestsTable({ t, theme }) {
    const requests = useQuery(api.partnerRequests.getAll) || [];
    const updateStatus = useMutation(api.partnerRequests.updateStatus);
    const approveMutation = useMutation(api.partnerRequests.approve);
    const removeRequest = useMutation(api.partnerRequests.remove);

    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("Pending");
    const [searchTerm, setSearchTerm] = useState("");

    const handleUpdate = async (id, status) => {
        if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;
        try {
            await updateStatus({ id, status });
        } catch (err) {
            alert("Error updating status: " + err.message);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm(`Are you sure you want to APPROVE this request? This will create an account and send welcome emails.`)) return;
        try {
            await approveMutation({ id });
        } catch (err) {
            alert("Error approving request: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(`Are you sure you want to DELETE this request permanently?`)) return;
        try {
            await removeRequest({ id });
        } catch (err) {
            alert("Error deleting request: " + err.message);
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesType = filterType === "all" || req.type === filterType;
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
                                                {req.type === "organiser" ? (
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
                                                        onClick={() => handleApprove(req._id)} 
                                                        title="Approve & Create Account"
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
        </div>
    );
}
