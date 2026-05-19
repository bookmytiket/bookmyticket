'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, FileText, IndianRupee } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function FinanceCrossVerificationAdmin({ t, theme }) {
    const [reconciliations, setReconciliations] = useState([]);
    const [allReconciliations, setAllReconciliations] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [selectedOrganizer, setSelectedOrganizer] = useState('all');
    const [stats, setStats] = useState({ totalCustomerPaid: 0, totalAdminRev: 0, totalOrganizerRev: 0, mismatchCount: 0 });
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Organizers
            const { data: orgData } = await supabase
                .from('organisers')
                .select('id, brand_name, full_name')
                .eq('status', 'approved');
            
            if (orgData) setOrganizers(orgData);

            await fetchReconciliations();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReconciliations = async () => {
        try {
            const { data, error } = await supabase
                .from('settlement_reconciliation_logs')
                .select('*, bookings(id, base_amount, total_amount, platform_charge, gst_amount, discount_amount, events(organiser_id))')
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) {
                if (error.message.includes('relation "settlement_reconciliation_logs" does not exist')) {
                    showToast("Database tables for new accounting system are not yet created. Please run the SQL migration.", "warning");
                }
                setAllReconciliations([]);
                setReconciliations([]);
            } else {
                setAllReconciliations(data || []);
                applyFilter(data || [], selectedOrganizer);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const applyFilter = (data, orgId) => {
        let filtered = data;
        if (orgId !== 'all') {
            filtered = data.filter(row => row.bookings?.events?.organiser_id === orgId);
        }
        setReconciliations(filtered);
        
        const s = { totalCustomerPaid: 0, totalAdminRev: 0, totalOrganizerRev: 0, mismatchCount: 0 };
        filtered.forEach(row => {
            s.totalCustomerPaid += Number(row.customer_paid || 0);
            s.totalAdminRev += Number(row.admin_actual || 0);
            s.totalOrganizerRev += Number(row.organizer_actual || 0);
            if (row.verification_status === 'mismatch') s.mismatchCount++;
        });
        setStats(s);
    };

    useEffect(() => {
        applyFilter(allReconciliations, selectedOrganizer);
    }, [selectedOrganizer]);

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading financial ledger...</div>;
    }

    return (
        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", border: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: `1px solid ${t.border}`, paddingBottom: '20px' }}>
                <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: t.textMain, letterSpacing: '-0.02em', margin: 0 }}>Settlement Cross-Verification</h3>
                    <p style={{ fontSize: '12px', color: t.textSub, marginTop: '4px' }}>Automated matching of Customer Paid vs (Admin Revenue + Organizer Net Revenue).</p>
                </div>
                <div>
                    <select 
                        value={selectedOrganizer}
                        onChange={(e) => setSelectedOrganizer(e.target.value)}
                        style={{
                            padding: "10px 16px",
                            borderRadius: "12px",
                            border: `1px solid ${t.border}`,
                            backgroundColor: t.bg,
                            color: t.textMain,
                            fontSize: "13px",
                            fontWeight: 600,
                            outline: "none",
                            cursor: "pointer",
                            minWidth: "200px"
                        }}
                    >
                        <option value="all">All Organisers</option>
                        {organizers.map(org => (
                            <option key={org.id} value={org.id}>
                                {org.brand_name || org.full_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', border: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Total Processed</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: t.textMain, marginTop: "8px" }}>₹{stats.totalCustomerPaid.toLocaleString()}</h4>
                </div>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#f0fdf4' : '#064e3b', border: `1px solid #86efac` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: theme === 'light' ? '#166534' : '#a7f3d0', textTransform: "uppercase" }}>Admin Revenue</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: theme === 'light' ? '#15803d' : '#86efac', marginTop: "8px" }}>₹{stats.totalAdminRev.toLocaleString()}</h4>
                </div>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#eff6ff' : '#1e3a8a', border: `1px solid #bfdbfe` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: theme === 'light' ? '#1e40af' : '#bfdbfe', textTransform: "uppercase" }}>Organizer Wallet Credits</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: theme === 'light' ? '#1d4ed8' : '#93c5fd', marginTop: "8px" }}>₹{stats.totalOrganizerRev.toLocaleString()}</h4>
                </div>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: stats.mismatchCount > 0 ? (theme === 'light' ? '#fef2f2' : '#7f1d1d') : (theme === 'light' ? '#f8fafc' : '#1e293b'), border: `1px solid ${stats.mismatchCount > 0 ? '#fecaca' : t.border}` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: stats.mismatchCount > 0 ? '#dc2626' : t.textSub, textTransform: "uppercase" }}>Mismatches</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: stats.mismatchCount > 0 ? '#b91c1c' : t.textMain, marginTop: "8px" }}>{stats.mismatchCount}</h4>
                </div>
            </div>

            <div className="table-container">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Booking Ref</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Customer Paid</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Organizer Net</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Admin Rev (Fee+Tax)</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Variance</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reconciliations.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No settlement logs found.</td></tr>
                        ) : reconciliations.map((log) => (
                            <tr key={log.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                <td style={{ padding: "14px", fontSize: "12px", fontWeight: 700, color: t.textMain }}>
                                    {log.booking_id?.substring(0, 8)}...
                                </td>
                                <td style={{ padding: "14px", fontWeight: 800, color: t.textMain }}>₹{Number(log.customer_paid).toFixed(2)}</td>
                                <td style={{ padding: "14px", fontWeight: 800, color: "#3b82f6" }}>₹{Number(log.organizer_actual).toFixed(2)}</td>
                                <td style={{ padding: "14px", fontWeight: 800, color: "#10b981" }}>₹{Number(log.admin_actual).toFixed(2)}</td>
                                <td style={{ padding: "14px", fontWeight: 800, color: log.variance_amount == 0 ? t.textSub : "#ef4444" }}>
                                    ₹{Number(log.variance_amount).toFixed(2)}
                                </td>
                                <td style={{ padding: "14px" }}>
                                    {log.verification_status === 'matched' ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: "4px 8px", backgroundColor: "#22c55e20", color: "#22c55e", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                                            <CheckCircle2 size={12} /> MATCHED
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: "4px 8px", backgroundColor: "#ef444420", color: "#ef4444", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                                            <AlertCircle size={12} /> MISMATCH
                                        </span>
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
