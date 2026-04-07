import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminPartnerRequestsTable({ t }) {
    const requests = useQuery(api.partnerRequests.getAll) || [];
    const updateStatus = useMutation(api.partnerRequests.updateStatus);

    const handleUpdate = async (id, status) => {
        if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;
        try {
            await updateStatus({ id, status });
        } catch (err) {
            alert("Error updating status: " + err.message);
        }
    };

    if (requests.length === 0) {
        return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No partner requests found.</div>;
    }

    return (
        <div style={{ overflowX: "auto", paddingBottom: "160px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Name</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Email</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Phone</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Category / Role</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Remarks</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Status</th>
                        <th style={{ padding: "12px", color: t.textSub, fontSize: "13px", fontWeight: 600 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((req) => (
                        <tr key={req._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                            <td style={{ padding: "12px", color: t.textMain, fontSize: "14px", fontWeight: 600 }}>
                                {req.firstName} {req.lastName}
                            </td>
                            <td style={{ padding: "12px", color: t.textSub, fontSize: "14px" }}>{req.email}</td>
                            <td style={{ padding: "12px", color: t.textSub, fontSize: "14px" }}>{req.phone}</td>
                            <td style={{ padding: "12px", color: t.textSub, fontSize: "14px" }}>
                                {req.category}<br/>
                                <span style={{ fontSize: "12px", color: "#8b5cf6", fontWeight: "600" }}>{req.role}</span>
                            </td>
                            <td style={{ padding: "12px", color: t.textSub, fontSize: "13px", maxWidth: "200px" }}>
                                {req.remarks || "-"}
                            </td>
                            <td style={{ padding: "12px" }}>
                                <span style={{
                                    padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                                    backgroundColor: req.status === "Approved" ? "#dcfce7" : req.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                                    color: req.status === "Approved" ? "#16a34a" : req.status === "Rejected" ? "#dc2626" : "#d97706"
                                }}>
                                    {req.status}
                                </span>
                            </td>
                            <td style={{ padding: "12px" }}>
                                {req.status === "Pending" ? (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button onClick={() => handleUpdate(req._id, "Approved")} style={{ backgroundColor: "#22c55e", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600" }}>
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button onClick={() => handleUpdate(req._id, "Rejected")} style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600" }}>
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: "12px", color: t.textSub }}>Processed</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
