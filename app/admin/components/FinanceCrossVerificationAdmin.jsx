'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, FileText, IndianRupee, RefreshCw } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function FinanceCrossVerificationAdmin({ t, theme }) {
    const [reconciliations, setReconciliations] = useState([]);
    const [allReconciliations, setAllReconciliations] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [selectedOrganizer, setSelectedOrganizer] = useState('all');
    const [isOpen, setIsOpen] = useState(false);
    const [stats, setStats] = useState({ totalCustomerPaid: 0, totalAdminRev: 0, totalOrganizerRev: 0, mismatchCount: 0 });
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState(''); // 'reconciliation_logs' or 'bookings'
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settlement-verification');
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.organizers) setOrganizers(data.organizers);
            if (data.reconciliations) {
                setDataSource(data.dataSource || 'none');
                setAllReconciliations(data.reconciliations);
                applyFilter(data.reconciliations, selectedOrganizer);
            }
        } catch (err) {
            console.error("Fetch Data Error:", err);
            showToast("Failed to load audit data", "error");
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (data, orgId) => {
        let filtered = data;
        if (orgId !== 'all') {
            filtered = data.filter(row => row.organizer_id === orgId);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', borderBottom: `1px solid ${t.border}`, paddingBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: t.textMain, letterSpacing: '-0.02em', margin: 0 }}>Settlement Cross-Verification</h3>
                    <p style={{ fontSize: '12px', color: t.textSub, marginTop: '4px' }}>Automated matching of Customer Paid vs (Admin Revenue + Organizer Net Revenue).</p>
                    {dataSource && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: dataSource.includes('bookings') ? '#fef3c7' : '#d1fae5', color: dataSource.includes('bookings') ? '#92400e' : '#065f46', marginTop: '6px', display: 'inline-block' }}>
                            Source: {dataSource}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={fetchData}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setIsOpen(!isOpen)}
                            style={{ padding: "10px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "13px", fontWeight: 600, cursor: "pointer", minWidth: "200px", display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                        >
                            <span>{selectedOrganizer === 'all' ? 'All Organisers' : organizers.find(o => o.id === selectedOrganizer)?.business_name || 'Select'}</span>
                            <span style={{ fontSize: '10px', marginLeft: '8px', opacity: 0.7 }}>▼</span>
                        </div>
                        {isOpen && (
                            <>
                                <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, backgroundColor: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '200px', padding: '4px' }}>
                                    <div onClick={() => { setSelectedOrganizer('all'); setIsOpen(false); }} style={{ padding: '10px 14px', fontSize: '13px', fontWeight: selectedOrganizer === 'all' ? 800 : 600, color: selectedOrganizer === 'all' ? '#fff' : t.textMain, backgroundColor: selectedOrganizer === 'all' ? '#3b82f6' : 'transparent', borderRadius: '8px', cursor: 'pointer' }}>
                                        All Organisers
                                    </div>
                                    {organizers.map(org => (
                                        <div key={org.id} onClick={() => { setSelectedOrganizer(org.id); setIsOpen(false); }} style={{ padding: '10px 14px', fontSize: '13px', fontWeight: selectedOrganizer === org.id ? 800 : 600, color: selectedOrganizer === org.id ? '#fff' : t.textMain, backgroundColor: selectedOrganizer === org.id ? '#3b82f6' : 'transparent', borderRadius: '8px', cursor: 'pointer', marginTop: '2px' }}>
                                            {org.business_name}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', border: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Total Processed</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: t.textMain, marginTop: "8px" }}>₹{stats.totalCustomerPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                </div>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#f0fdf4' : '#064e3b', border: `1px solid #86efac` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: theme === 'light' ? '#166534' : '#a7f3d0', textTransform: "uppercase" }}>Admin Revenue (Fee+GST)</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: theme === 'light' ? '#15803d' : '#86efac', marginTop: "8px" }}>₹{stats.totalAdminRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                </div>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: theme === 'light' ? '#eff6ff' : '#1e3a8a', border: `1px solid #bfdbfe` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: theme === 'light' ? '#1e40af' : '#bfdbfe', textTransform: "uppercase" }}>Organizer Credits</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: theme === 'light' ? '#1d4ed8' : '#93c5fd', marginTop: "8px" }}>₹{stats.totalOrganizerRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                </div>
                <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: stats.mismatchCount > 0 ? (theme === 'light' ? '#fef2f2' : '#7f1d1d') : (theme === 'light' ? '#f8fafc' : '#1e293b'), border: `1px solid ${stats.mismatchCount > 0 ? '#fecaca' : t.border}` }}>
                    <p style={{ fontSize: "11px", fontWeight: 800, color: stats.mismatchCount > 0 ? '#dc2626' : t.textSub, textTransform: "uppercase" }}>Mismatches</p>
                    <h4 style={{ fontSize: "24px", fontWeight: 900, color: stats.mismatchCount > 0 ? '#b91c1c' : t.textMain, marginTop: "8px" }}>{stats.mismatchCount}</h4>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Booking Ref</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Date</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Customer Paid</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Organizer Net</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Admin Rev</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Variance</th>
                            <th style={{ padding: "14px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reconciliations.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No confirmed bookings found.</td></tr>
                        ) : reconciliations.map((log) => (
                            <tr key={log.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                <td style={{ padding: "14px", fontSize: "12px", fontWeight: 700, color: t.textMain, fontFamily: 'monospace' }}>
                                    #{log.booking_id?.slice(-8)?.toUpperCase()}
                                </td>
                                <td style={{ padding: "14px", fontSize: "12px", color: t.textSub }}>
                                    {log.created_at ? new Date(log.created_at).toLocaleDateString('en-IN') : '-'}
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
