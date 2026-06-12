import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, FileText, FileSpreadsheet, FileIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DownloadReports({ marathon, registrations, checkins }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterCheckin, setFilterCheckin] = useState('All');
  const [sortBy, setSortBy] = useState('bookingTime');
  const [isGenerating, setIsGenerating] = useState(false);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(registrations.map(r => r.marathon_categories?.category_name).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [registrations]);

  const filteredAndSortedData = useMemo(() => {
    let result = registrations.filter(reg => {
      // Search
      const s = searchTerm.toLowerCase();
      const matchSearch = 
        (reg.participant_name || '').toLowerCase().includes(s) ||
        (reg.participant_email || '').toLowerCase().includes(s) ||
        (reg.participant_phone || '').toLowerCase().includes(s) ||
        (reg.bib_number || '').toLowerCase().includes(s) ||
        (reg.ticket_id || '').toLowerCase().includes(s) ||
        (reg.registration_id || '').toLowerCase().includes(s);

      // Filters
      const matchCategory = filterCategory === 'All' || (reg.marathon_categories?.category_name === filterCategory);
      const matchPayment = filterPayment === 'All' || (reg.payment_status === filterPayment);
      
      const isCheckedIn = checkins.some(c => c.registration_id === reg.registration_id);
      const matchCheckin = filterCheckin === 'All' || 
                           (filterCheckin === 'Checked-In' && isCheckedIn) ||
                           (filterCheckin === 'Not Checked-In' && !isCheckedIn);

      return matchSearch && matchCategory && matchPayment && matchCheckin;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return (a.participant_name || '').localeCompare(b.participant_name || '');
      if (sortBy === 'bib_asc') return (a.bib_number || '').localeCompare(b.bib_number || '');
      if (sortBy === 'bib_desc') return (b.bib_number || '').localeCompare(a.bib_number || '');
      if (sortBy === 'category') return (a.marathon_categories?.category_name || '').localeCompare(b.marathon_categories?.category_name || '');
      // Default: bookingTime (created_at desc)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return result;
  }, [registrations, checkins, searchTerm, filterCategory, filterPayment, filterCheckin, sortBy]);

  const getReportData = () => {
    return filteredAndSortedData.map((reg, index) => {
      const chk = checkins.find(c => c.registration_id === reg.registration_id);
      return {
        'Serial Number': index + 1,
        'BIB Number': reg.bib_number || 'N/A',
        'Ticket ID': reg.ticket_id || 'N/A',
        'Registration ID': reg.registration_id || 'N/A',
        'Participant Name': reg.participant_name || '-',
        'Bib Name': reg.bib_name || '-',
        'Gender': reg.participant_gender || '-',
        'Age': reg.participant_age || '-',
        'Date of Birth': reg.dob ? new Date(reg.dob).toLocaleDateString() : '-',
        'Blood Group': reg.blood_group || '-',
        'Mobile Number': reg.participant_phone || '-',
        'Email Address': reg.participant_email || '-',
        'Emergency Contact': reg.emergency_contact || '-',
        'Running Club': reg.running_club || '-',
        'Category': reg.marathon_categories?.category_name || '-',
        'Distance': reg.marathon_categories?.distance_km ? `${reg.marathon_categories.distance_km} KM` : '-',
        'T-Shirt Size': reg.tshirt_size || '-',
        'Payment Status': reg.payment_status || '-',
        'Registration Fee': reg.payment_amount || '0',
        'Booking Date': new Date(reg.created_at).toLocaleString(),
        'Check-in Status': chk ? 'Checked-In' : 'Not Checked-In',
        'Kit Issued Status': chk?.kit_issued ? 'Yes' : 'No',
        'QR Verification Status': reg.qr_verified ? 'Verified' : 'Pending',
        'City': reg.city || '-',
        'State': reg.state || '-',
        'Country': reg.country || '-'
      };
    });
  };

  const logExportAction = async (exportType) => {
    try {
      const token = (await window.supabase.auth.getSession()).data.session?.access_token;
      await fetch('/api/marathon/export-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: marathon.id,
          export_type: exportType,
          records_count: filteredAndSortedData.length
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
      
      // Auto-size columns slightly
      const colWidths = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `${marathon.title.replace(/\s+/g, '_')}_Participants.xlsx`);
      await logExportAction('Excel');
    } catch (error) {
      console.error('Error generating Excel:', error);
    } finally {
      setIsGenerating(false);
    }
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
      link.download = `${marathon.title.replace(/\s+/g, '_')}_Participants.csv`;
      link.click();
      await logExportAction('CSV');
    } catch (error) {
      console.error('Error generating CSV:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF('landscape');
      
      // Header
      doc.setFontSize(18);
      doc.text(marathon.title, 14, 20);
      doc.setFontSize(11);
      doc.text(`Participants Report - Generated on ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Participants: ${filteredAndSortedData.length}`, 14, 34);

      const data = getReportData();
      const columns = [
        'S.No', 'BIB', 'Reg ID', 'Name', 'Category', 'Phone', 'Payment', 'Check-In'
      ];
      
      const rows = data.map((d, i) => [
        i + 1,
        d['BIB Number'],
        d['Registration ID'],
        d['Participant Name'],
        d['Category'],
        d['Mobile Number'],
        d['Payment Status'],
        d['Check-in Status']
      ]);

      doc.autoTable({
        head: [columns],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [236, 72, 153] } // Pink
      });

      doc.save(`${marathon.title.replace(/\s+/g, '_')}_Participants.pdf`);
      await logExportAction('PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-black">Download Reports</h2>
          <p className="text-sm text-white/50 mt-1">Export comprehensive participant data with exact BIB numbers.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV} 
            disabled={isGenerating || filteredAndSortedData.length === 0}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FileText size={16} /> CSV
          </button>
          <button 
            onClick={exportExcel} 
            disabled={isGenerating || filteredAndSortedData.length === 0}
            className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button 
            onClick={exportPDF} 
            disabled={isGenerating || filteredAndSortedData.length === 0}
            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FileIcon size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative col-span-1 md:col-span-4 lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Name, BIB, Email..." 
            className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm outline-none focus:border-pink-500 transition-colors" 
          />
        </div>
        
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm outline-none focus:border-pink-500 text-white"
        >
          {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        
        <select 
          value={filterPayment} 
          onChange={(e) => setFilterPayment(e.target.value)}
          className="px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm outline-none focus:border-pink-500 text-white"
        >
          <option value="All">All Payment Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <select 
          value={filterCheckin} 
          onChange={(e) => setFilterCheckin(e.target.value)}
          className="px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm outline-none focus:border-pink-500 text-white"
        >
          <option value="All">All Check-In Status</option>
          <option value="Checked-In">Checked-In</option>
          <option value="Not Checked-In">Not Checked-In</option>
        </select>
        
        <div className="md:col-span-4 flex items-center gap-2 mt-2">
          <span className="text-sm text-white/50 font-bold uppercase tracking-widest"><Filter size={14} className="inline mr-1"/> Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-none text-sm outline-none text-pink-400 font-bold cursor-pointer"
          >
            <option value="bookingTime">Booking Time (Latest First)</option>
            <option value="name">Participant Name (A-Z)</option>
            <option value="bib_asc">BIB Number (Ascending)</option>
            <option value="bib_desc">BIB Number (Descending)</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/5">
        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
          <span className="text-sm font-bold text-white/70">Preview ({filteredAndSortedData.length} Records)</span>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/50 text-white/50 text-[10px] uppercase tracking-widest font-bold sticky top-0 backdrop-blur-md">
              <tr>
                <th className="p-4">BIB</th>
                <th className="p-4">Participant</th>
                <th className="p-4">Category</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Check-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedData.slice(0, 100).map((reg) => {
                const isCheckedIn = checkins.some(c => c.registration_id === reg.registration_id);
                return (
                  <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-pink-400">{reg.bib_number || '-'}</td>
                    <td className="p-4">
                      <p className="font-bold">{reg.participant_name}</p>
                      <p className="text-xs text-white/40">{reg.registration_id}</p>
                    </td>
                    <td className="p-4 text-xs">{reg.marathon_categories?.category_name || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${reg.payment_status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {reg.payment_status || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      {isCheckedIn ? <span className="text-green-400 text-xs font-bold">Yes</span> : <span className="text-white/30 text-xs">No</span>}
                    </td>
                  </tr>
                )
              })}
              {filteredAndSortedData.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-white/50">No matching records found.</td></tr>
              )}
              {filteredAndSortedData.length > 100 && (
                <tr><td colSpan="5" className="p-4 text-center text-white/40 text-xs italic">Showing first 100 records in preview. Export to see all.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
