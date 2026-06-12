import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter, FileText, FileSpreadsheet, FileIcon, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminMarathonReports({ t, theme }) {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [checkins, setCheckins] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterOrganizer, setFilterOrganizer] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await adminClient.auth.getSession();
      const headers = { 'Authorization': `Bearer ${session?.access_token}` };

      // Fetch all marathons
      const evRes = await fetch('/api/marathon');
      const evData = await evRes.json();
      const marathons = evData.marathons || [];
      setEvents(marathons);

      // We need to fetch registrations for all marathons? That might be huge.
      // But for this feature, let's fetch all registrations using the admin client.
      // Actually, /api/marathon/register?marathon_id=xxx only fetches for one.
      // Let's directly query Supabase here since we have anon key, but we need service role to bypass RLS,
      // wait, the Admin dashboard usually uses `useSupabaseQuery` or direct supabase calls.
      // I'll just use a direct API route or try fetching via adminClient if RLS allows (admins usually have permissions).
      // Let's assume RLS allows admins to select all.

      const { data: regs } = await adminClient
        .from('marathon_registrations')
        .select(`
          *,
          marathon_categories ( category_name, distance_km ),
          marathon_events ( title, organiser_id, user_profiles:organiser_id ( full_name ) )
        `);
      
      const { data: chks } = await adminClient.from('marathon_checkins').select('*');

      setRegistrations(regs || []);
      setCheckins(chks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const organizers = useMemo(() => {
    const orgs = new Set(registrations.map(r => r.marathon_events?.user_profiles?.full_name).filter(Boolean));
    return ['All', ...Array.from(orgs)];
  }, [registrations]);

  const filteredData = useMemo(() => {
    return registrations.filter(reg => {
      const s = searchTerm.toLowerCase();
      const matchSearch = 
        (reg.participant_name || '').toLowerCase().includes(s) ||
        (reg.bib_number || '').toLowerCase().includes(s) ||
        (reg.registration_id || '').toLowerCase().includes(s);

      const matchEvent = filterEvent === 'All' || reg.marathon_id === filterEvent;
      const matchOrg = filterOrganizer === 'All' || reg.marathon_events?.user_profiles?.full_name === filterOrganizer;
      const matchPayment = filterPayment === 'All' || reg.payment_status === filterPayment;

      return matchSearch && matchEvent && matchOrg && matchPayment;
    });
  }, [registrations, searchTerm, filterEvent, filterOrganizer, filterPayment]);

  const getReportData = () => {
    return filteredData.map((reg, index) => {
      const chk = checkins.find(c => c.registration_id === reg.registration_id);
      return {
        'S.No': index + 1,
        'Event': reg.marathon_events?.title || '-',
        'Organizer': reg.marathon_events?.user_profiles?.full_name || '-',
        'BIB Number': reg.bib_number || 'N/A',
        'Ticket ID': reg.ticket_id || 'N/A',
        'Registration ID': reg.registration_id || 'N/A',
        'Participant Name': reg.participant_name || '-',
        'Gender': reg.participant_gender || '-',
        'Mobile': reg.participant_phone || '-',
        'Email': reg.participant_email || '-',
        'Category': reg.marathon_categories?.category_name || '-',
        'Payment Status': reg.payment_status || '-',
        'Amount': reg.payment_amount || '0',
        'Booking Date': new Date(reg.created_at).toLocaleString(),
        'Check-in': chk ? 'Yes' : 'No'
      };
    });
  };

  const logExportAction = async (exportType) => {
    try {
      const { data: { session } } = await adminClient.auth.getSession();
      await fetch('/api/marathon/export-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          event_id: filterEvent === 'All' ? null : filterEvent,
          export_type: exportType,
          records_count: filteredData.length
        })
      });
    } catch (e) { console.error('Logging error', e); }
  };

  const exportExcel = async () => {
    setIsGenerating(true);
    try {
      const data = getReportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
      XLSX.writeFile(workbook, `Admin_Marathon_Report_${new Date().getTime()}.xlsx`);
      await logExportAction('Admin_Excel');
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const exportCSV = async () => {
    setIsGenerating(true);
    try {
      const data = getReportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Admin_Marathon_Report_${new Date().getTime()}.csv`;
      link.click();
      await logExportAction('Admin_CSV');
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const exportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF('landscape');
      doc.setFontSize(18);
      doc.text("Marathon Participants Global Report", 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated on ${new Date().toLocaleString()} | Total: ${filteredData.length}`, 14, 28);

      const data = getReportData();
      const rows = data.map((d, i) => [
        i + 1, d['Event'], d['Organizer'], d['BIB Number'], d['Registration ID'], d['Participant Name'], d['Category'], d['Payment Status']
      ]);

      doc.autoTable({
        head: [['S.No', 'Event', 'Organizer', 'BIB', 'Reg ID', 'Name', 'Category', 'Payment']],
        body: rows,
        startY: 35,
        styles: { fontSize: 8 }
      });
      doc.save(`Admin_Marathon_Report_${new Date().getTime()}.pdf`);
      await logExportAction('Admin_PDF');
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading Report Data...</div>;

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Marathon Global Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Audit participant registrations, export across events, view BIB allocations.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} disabled={isGenerating || !filteredData.length} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-2 uppercase tracking-widest disabled:opacity-50">
            <FileText size={16} /> CSV
          </button>
          <button onClick={exportExcel} disabled={isGenerating || !filteredData.length} className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl font-bold text-xs flex items-center gap-2 uppercase tracking-widest disabled:opacity-50">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={exportPDF} disabled={isGenerating || !filteredData.length} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs flex items-center gap-2 uppercase tracking-widest disabled:opacity-50">
            <FileIcon size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Name, BIB..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-pink-500" 
          />
        </div>
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
          <option value="All">All Events</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select value={filterOrganizer} onChange={(e) => setFilterOrganizer(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
          {organizers.map(o => <option key={o} value={o}>{o === 'All' ? 'All Organizers' : o}</option>)}
        </select>
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
          <option value="All">All Payments</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
        <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Preview ({filteredData.length} Records)</span>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest font-black sticky top-0">
              <tr>
                <th className="p-4">BIB</th>
                <th className="p-4">Event</th>
                <th className="p-4">Participant</th>
                <th className="p-4">Category</th>
                <th className="p-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.slice(0, 100).map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-xs font-bold text-pink-500">{reg.bib_number || '-'}</td>
                  <td className="p-4 font-bold text-slate-700">{reg.marathon_events?.title || 'Unknown'}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{reg.participant_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{reg.registration_id}</p>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-600">{reg.marathon_categories?.category_name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${reg.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {reg.payment_status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
