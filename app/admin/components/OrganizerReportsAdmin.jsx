/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Download, Filter, TrendingUp, Users, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function OrganizerReportsAdmin() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    

    const fetchReports = async () => {
        setLoading(true);
        // Fetch from organiser_reports and organisers
        const { data, error } = await supabase
            .from('organizer_reports')
            .select('*, organisers(name, email, kyc_status)');
        
        if (data) {
            setReports(data.map(r => ({
                ...r,
                name: r.organisers?.name || 'Unknown',
                email: r.organisers?.email || 'N/A',
                kyc_status: r.organisers?.kyc_status || 'Pending'
            })));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const exportCSV = () => {
        const headers = ["Name", "Email", "KYC", "Events", "Bookings", "Revenue", "Commission"];
        const csv = [
            headers.join(","),
            ...reports.map(r => [
                r.name, r.email, r.kyc_status, r.total_events, r.total_bookings, r.total_revenue, r.commission_amount
            ].join(","))
        ].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'organizer_reports.csv';
        a.click();
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(reports);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reports");
        XLSX.writeFile(wb, "organizer_reports.xlsx");
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Organizer Booking Reports", 14, 15);
        const tableColumn = ["Name", "Email", "Events", "Revenue", "Commission"];
        const tableRows = [];
        reports.forEach(r => {
            tableRows.push([r.name, r.email, r.total_events, `Rs.${r.total_revenue}`, `Rs.${r.commission_amount}`]);
        });
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("organizer_reports.pdf");
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <TrendingUp className="text-pink-500" />
                        Organizer Reports
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Analytics and performance tracking for all organizers.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-sm flex items-center gap-2">
                        <Download size={16} /> CSV
                    </button>
                    <button onClick={exportExcel} className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-lg hover:bg-green-200 text-sm flex items-center gap-2">
                        <FileText size={16} /> Excel
                    </button>
                    <button onClick={exportPDF} className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 text-sm flex items-center gap-2">
                        <FileText size={16} /> PDF
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold">Organizer</th>
                                <th className="p-4 font-bold">KYC Status</th>
                                <th className="p-4 font-bold">Events</th>
                                <th className="p-4 font-bold">Bookings</th>
                                <th className="p-4 font-bold">Revenue</th>
                                <th className="p-4 font-bold">Commission</th>
                                <th className="p-4 font-bold">Net Earnings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading reports...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No data found.</td></tr>
                            ) : reports.map((r) => (
                                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{r.name}</div>
                                        <div className="text-xs text-slate-500">{r.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${r.kyc_status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {r.kyc_status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700">{r.total_events}</td>
                                    <td className="p-4 font-bold text-slate-700">{r.total_bookings}</td>
                                    <td className="p-4 font-bold text-emerald-600">₹{r.total_revenue}</td>
                                    <td className="p-4 font-bold text-pink-600">₹{r.commission_amount}</td>
                                    <td className="p-4 font-black text-slate-800">₹{(r.total_revenue - r.commission_amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
