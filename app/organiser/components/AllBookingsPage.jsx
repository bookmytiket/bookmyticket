"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Filter, Download, Columns, ChevronDown, CheckSquare, 
  Square, FileSpreadsheet, FileText, File as PdfFile, Check, X,
  ArrowUpDown, Printer, Mail, Bell, Settings2, SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CustomSelect from './CustomSelect';
import BibBadgeManager from './BibBadgeManager';

// Default and Optional Columns definition
const ALL_COLUMNS = [
  { id: "booking_id", label: "Booking ID", default: true },
  { id: "ticket_id", label: "Ticket ID", default: true },
  { id: "bib_number", label: "BIB Number", default: true },
  { id: "event_name", label: "Event Name", default: true },
  { id: "event_category", label: "Event Category", default: true },
  { id: "participant_name", label: "Participant Name", default: true },
  { id: "email", label: "Email", default: true },
  { id: "mobile", label: "Mobile Number", default: true },
  { id: "race_category", label: "Race / Ticket Category", default: true },
  { id: "registration_fee", label: "Registration Fee", default: true },
  { id: "payment_status", label: "Payment Status", default: true },
  { id: "booking_status", label: "Booking Status", default: true },
  { id: "event_date", label: "Event Date", default: true },
  { id: "check_in_status", label: "Check-in Status", default: true },
  { id: "registration_id", label: "Registration ID", default: false },
  { id: "bib_name", label: "Bib Name", default: false },
  { id: "running_club", label: "Running Club", default: false },
  { id: "age", label: "Age", default: false },
  { id: "gender", label: "Gender", default: false },
  { id: "dob", label: "Date of Birth", default: false },
  { id: "blood_group", label: "Blood Group", default: false },
  { id: "emergency_contact", label: "Emergency Contact", default: false },
  { id: "tshirt_size", label: "T-Shirt Size", default: false },
  { id: "address", label: "Address", default: false },
  { id: "city", label: "City", default: false },
  { id: "state", label: "State", default: false },
  { id: "country", label: "Country", default: false },
  { id: "qr_status", label: "QR Status", default: false },
  { id: "kit_issued", label: "Kit Issued", default: false },
  { id: "certificate_status", label: "Certificate Status", default: false },
  { id: "coupon_code", label: "Coupon Code", default: false },
  { id: "voucher_code", label: "Voucher Code", default: false },
  { id: "created_at", label: "Created Date", default: false },
  { id: "updated_at", label: "Updated Date", default: false }
];

export default function AllBookingsPage({ bookings = [], events = [], theme: t, user, supabase }) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showColManager, setShowColManager] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBadgeManager, setShowBadgeManager] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  
  // Filters state
  const [filters, setFilters] = useState({
    eventCategory: "",
    eventName: "",
    bookingStatus: "",
    paymentStatus: "",
    ticketCategory: "",
    bibNumber: "",
    ticketId: ""
  });

  // Column preferences state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`bookingCols_${user?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Could not load preferences", e); }
    return ALL_COLUMNS.filter(c => c.default).map(c => c.id);
  });

  // Save column preferences when they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`bookingCols_${user?.id}`, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, user?.id]);

  // Map events to a fast lookup dictionary
  const eventsMap = useMemo(() => {
    return events.reduce((acc, ev) => {
      acc[ev.id] = ev;
      return acc;
    }, {});
  }, [events]);

  // Process raw bookings to enriched rows
  const rows = useMemo(() => {
    return bookings.map(b => {
      const ev = eventsMap[b.event_id] || {};
      const meta = b.metadata || {};
      const userDetails = b.customer_details || b.user_details || {};
      
      const isMarathon = ev.type === "Marathon";
      
      // Try to find the participant name anywhere it might be hiding
      const participant_name = 
        userDetails["Full Name"] || 
        userDetails.name || 
        meta.participant_name || 
        b.name || 
        b.customer_name || 
        "Guest";

      // Try to find the BIB number anywhere it might be hiding
      const bib = 
        b.bib_number || 
        meta.bib_number || 
        userDetails.bib_number || 
        userDetails["BIB Number"] || 
        (isMarathon ? "--" : "--");

      const email = 
        userDetails["Email Address"] || 
        userDetails.email || 
        meta.email || 
        b.email || 
        b.customer_email || 
        "";

      const mobile = 
        userDetails["Phone Number"] || 
        userDetails.phone || 
        meta.phone || 
        b.phone || 
        b.customer_phone || 
        "";

      const registration_fee = b.amount || b.total_price || b.payment_amount || 0;
      let payment_status = b.payment_status || (b.status === 'Confirmed' ? 'Paid' : 'Pending');
      if (Number(registration_fee) === 0) payment_status = "Free";

      return {
        _raw: b,
        id: b.id,
        booking_id: b.booking_id || b.id.substring(0,8),
        ticket_id: b.ticket_id || meta.ticket_id || b.id.substring(0,8),
        bib_number: bib,
        event_name: ev.title || "Unknown Event",
        event_category: ev.type || "Event",
        participant_name,
        email,
        mobile,
        race_category: b.category || meta.category || b.ticket_type || "General",
        registration_fee,
        payment_status,
        booking_status: b.status || "Pending",
        event_date: ev.date || ev.startDate || "TBA",
        check_in_status: b.scanned || b.is_scanned || b.check_in_status === 'Checked In' ? "Checked In" : "Pending",
        registration_id: meta.registration_id || "",
        bib_name: meta.bib_name || userDetails["BIB Name"] || "",
        running_club: meta.running_club || userDetails["Running Club"] || "",
        age: meta.age || userDetails.age || "",
        gender: meta.gender || userDetails.gender || "",
        dob: meta.dob || userDetails.dob || "",
        blood_group: meta.blood_group || userDetails["Blood Group"] || "",
        emergency_contact: meta.emergency_contact || userDetails["Emergency Contact"] || "",
        tshirt_size: meta.tshirt_size || userDetails["T-Shirt Size"] || "",
        address: userDetails.address || userDetails.Place || "",
        city: userDetails.city || userDetails.Place || "",
        state: userDetails.state || "",
        country: userDetails.country || "",
        qr_status: b.qr_code ? "Generated" : "Pending",
        kit_issued: meta.kit_issued ? "Yes" : "No",
        certificate_status: meta.certificate_issued ? "Issued" : "Pending",
        coupon_code: b.coupon_code || b.customer_details?.applied_campaign_code || "",
        voucher_code: b.voucher_code || "",
        created_at: b.created_at || "",
        updated_at: b.updated_at || ""
      };
    });
  }, [bookings, eventsMap]);

  // Apply Search, Filters, and Sorting
  const filteredAndSortedRows = useMemo(() => {
    let result = rows;

    // Apply Global Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => 
        r.participant_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q) ||
        r.ticket_id.toLowerCase().includes(q) ||
        r.booking_id.toLowerCase().includes(q) ||
        r.event_name.toLowerCase().includes(q) ||
        r.bib_number.toLowerCase().includes(q)
      );
    }

    // Apply specific filters
    if (filters.eventCategory) result = result.filter(r => r.event_category === filters.eventCategory);
    if (filters.eventName) result = result.filter(r => r.event_name.includes(filters.eventName));
    if (filters.bookingStatus) result = result.filter(r => r.booking_status === filters.bookingStatus);
    if (filters.paymentStatus) result = result.filter(r => r.payment_status === filters.paymentStatus);
    if (filters.ticketCategory) result = result.filter(r => r.race_category.includes(filters.ticketCategory));
    if (filters.bibNumber) result = result.filter(r => r.bib_number.includes(filters.bibNumber));
    if (filters.ticketId) result = result.filter(r => r.ticket_id.includes(filters.ticketId));

    // Sort
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [rows, search, filters, sortConfig]);

  const toggleColumn = (colId) => {
    setVisibleColumns(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedBookings.size === filteredAndSortedRows.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredAndSortedRows.map(r => r.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedBookings);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBookings(next);
  };

  // Export Functions
  const logExport = async (format, count) => {
    try {
      if (supabase) {
        await supabase.from('export_logs').insert([{
          organiser_id: user?.id,
          export_type: 'All Bookings',
          format,
          record_count: count
        }]);
      }
    } catch (e) { console.error("Failed to log export", e); }
  };

  const getExportData = () => {
    const activeCols = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id));
    const dataToExport = selectedBookings.size > 0 
      ? filteredAndSortedRows.filter(r => selectedBookings.has(r.id))
      : filteredAndSortedRows;
      
    return { activeCols, dataToExport };
  };

  const exportExcel = () => {
    const { activeCols, dataToExport } = getExportData();
    const exportArray = dataToExport.map(row => {
      let obj = {};
      activeCols.forEach(col => { obj[col.label] = row[col.id]; });
      return obj;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `Bookings_Export_${new Date().getTime()}.xlsx`);
    logExport('excel', dataToExport.length);
    setShowExportMenu(false);
  };

  const exportCSV = () => {
    const { activeCols, dataToExport } = getExportData();
    const exportArray = dataToExport.map(row => {
      let obj = {};
      activeCols.forEach(col => { obj[col.label] = row[col.id]; });
      return obj;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportArray);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Bookings_Export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logExport('csv', dataToExport.length);
    setShowExportMenu(false);
  };

  const exportPDF = () => {
    const { activeCols, dataToExport } = getExportData();
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(16);
    doc.text("All Bookings Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = activeCols.map(c => c.label);
    const tableRows = dataToExport.map(row => activeCols.map(c => String(row[c.id] || '')));

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Bookings_Export_${new Date().getTime()}.pdf`);
    logExport('pdf', dataToExport.length);
    setShowExportMenu(false);
  };

  return (
    <div style={{ backgroundColor: t.bg, minHeight: '100vh', padding: '24px', fontFamily: "'Figtree', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: t.textMain, margin: 0, letterSpacing: '-0.5px' }}>All Bookings</h2>
            <p style={{ color: t.textSub, margin: '4px 0 0 0', fontSize: '14px' }}>Manage all event registrations, check-ins, and participant details.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: '#10b981', color: '#fff', border: 'none',
                  padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                }}
              >
                <Download size={16} /> Export
              </button>
              
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                      backgroundColor: t.cardBg, border: `1px solid ${t.border}`,
                      borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      width: '200px', zIndex: 50, padding: '8px'
                    }}
                  >
                    <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {selectedBookings.size > 0 ? `Export ${selectedBookings.size} Selected` : 'Export All'}
                    </div>
                    <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: t.textMain, cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '14px' }}>
                      <FileSpreadsheet size={16} color="#10b981" /> Excel (.xlsx)
                    </button>
                    <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: t.textMain, cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '14px' }}>
                      <FileText size={16} color="#3b82f6" /> CSV (.csv)
                    </button>
                    <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: t.textMain, cursor: 'pointer', borderRadius: '6px', textAlign: 'left', fontSize: '14px' }}>
                      <PdfFile size={16} color="#ef4444" /> PDF Document
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={() => setShowColManager(!showColManager)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: t.cardBg, color: t.textMain, border: `1px solid ${t.border}`,
                padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Columns size={16} /> Columns
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: showFilters ? '#3b82f6' : t.cardBg, 
                color: showFilters ? '#fff' : t.textMain, 
                border: `1px solid ${showFilters ? '#3b82f6' : t.border}`,
                padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>

        {/* Global Search and Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Search size={18} color={t.textSub} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by Name, Email, Ticket ID, BIB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px 12px 40px',
                backgroundColor: t.cardBg, border: `1px solid ${t.border}`,
                borderRadius: '12px', color: t.textMain, fontSize: '14px',
                outline: 'none', transition: 'border-color 0.2s'
              }}
            />
          </div>

          <button 
            onClick={() => setShowBadgeManager(!showBadgeManager)}
            style={{ padding: '12px 20px', backgroundColor: showBadgeManager ? '#ec4899' : '#1e293b', color: '#fff', borderRadius: '12px', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            <Printer size={16} /> {showBadgeManager ? 'Back to Bookings' : 'BIB Badges'}
          </button>
        </div>
      </div>

      {showBadgeManager ? (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
          <BibBadgeManager 
            marathon={{ title: "All Events" }} 
            registrations={bookings.map(b => {
              const ev = eventsMap[b.event_id] || {};
              const userDetails = b.customer_details || b.user_details || {};
              const meta = b.metadata || {};
              const participant_name = userDetails["Full Name"] || userDetails.name || meta.participant_name || b.name || b.customer_name || "Guest";
              const bib = b.bib_number || meta.bib_number || userDetails.bib_number || userDetails["BIB Number"];
              return {
                id: b.id,
                registration_id: b.booking_id || b.id,
                participant_name,
                category_name: ev.type || "Event",
                bib_number: bib
              };
            })}
            theme={t}
          />
        </div>
      ) : (
      <>
        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }} 
              animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }} 
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              style={{ marginBottom: '24px' }}
            >
              <div style={{ padding: '24px', backgroundColor: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: t.textMain }}>Advanced Filters</h4>
                  <button 
                    onClick={() => setFilters({ eventCategory: "", eventName: "", bookingStatus: "", paymentStatus: "", ticketCategory: "", bibNumber: "", ticketId: "" })}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear Filters
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  <CustomSelect 
                    value={filters.eventCategory} 
                    onChange={(v) => setFilters({...filters, eventCategory: v})}
                    placeholder="All Categories"
                    options={[
                      { label: "All Categories", value: "" },
                      { label: "Marathon", value: "Marathon" },
                      { label: "Tournament", value: "Tournament" },
                      { label: "Music Concert", value: "Music Concert" },
                      { label: "RSVP Event", value: "RSVP Event" }
                    ]}
                  />
                  <CustomSelect 
                    value={filters.bookingStatus} 
                    onChange={(v) => setFilters({...filters, bookingStatus: v})}
                    placeholder="All Booking Statuses"
                    options={[
                      { label: "All Booking Statuses", value: "" },
                      { label: "Confirmed", value: "Confirmed" },
                      { label: "Pending", value: "Pending" },
                      { label: "Cancelled", value: "Cancelled" }
                    ]}
                  />
                  <CustomSelect 
                    value={filters.paymentStatus} 
                    onChange={(v) => setFilters({...filters, paymentStatus: v})}
                    placeholder="All Payment Statuses"
                    options={[
                      { label: "All Payment Statuses", value: "" },
                      { label: "Paid", value: "Paid" },
                      { label: "Free", value: "Free" },
                      { label: "Pending", value: "Pending" }
                    ]}
                  />
                  <input 
                    type="text" placeholder="Filter by BIB Number" 
                    value={filters.bibNumber} onChange={(e) => setFilters({...filters, bibNumber: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold px-4 py-3.5 rounded-2xl focus:outline-none focus:border-pink-300 transition-all shadow-inner"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Column Manager */}
        <AnimatePresence>
          {showColManager && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '24px' }}
            >
              <div style={{ padding: '24px', backgroundColor: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: t.textMain }}>Manage Columns</h4>
                  <button onClick={() => setVisibleColumns(ALL_COLUMNS.filter(c => c.default).map(c => c.id))} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Reset to Default</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {ALL_COLUMNS.map(col => (
                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: t.textMain }}>
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.includes(col.id)} 
                        onChange={() => toggleColumn(col.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedBookings.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ 
                position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: '#1e293b', color: '#fff', padding: '12px 24px', borderRadius: '100px',
                display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', zIndex: 100
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{selectedBookings.size} selected</span>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#334155' }}></div>
              <button style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><Check size={14}/> Mark Check-in</button>
              <button style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><Mail size={14}/> Email Selected</button>
              <button onClick={() => setSelectedBookings(new Set())} style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: '10px' }}><X size={14}/></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Container */}
        <div style={{ backgroundColor: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
              <thead style={{ backgroundColor: t.bg, borderBottom: `1px solid ${t.border}` }}>
                <tr>
                  <th style={{ padding: '16px', width: '50px' }}>
                    <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: t.textSub }}>
                      {selectedBookings.size === filteredAndSortedRows.length && filteredAndSortedRows.length > 0 ? <CheckSquare size={18} color="#3b82f6" /> : <Square size={18} />}
                    </button>
                  </th>
                  {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => (
                    <th key={col.id} onClick={() => handleSort(col.id)} style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 700, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {col.label}
                        <ArrowUpDown size={12} opacity={sortConfig.key === col.id ? 1 : 0.3} color={sortConfig.key === col.id ? '#3b82f6' : 'inherit'} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} style={{ padding: '40px', textAlign: 'center', color: t.textSub, fontSize: '15px' }}>
                      No bookings match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRows.map((row, index) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: selectedBookings.has(row.id) ? '#3b82f60a' : 'transparent', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <button onClick={() => toggleSelectRow(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: t.textSub }}>
                          {selectedBookings.has(row.id) ? <CheckSquare size={18} color="#3b82f6" /> : <Square size={18} />}
                        </button>
                      </td>
                      {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => {
                        let value = row[col.id];
                        let cellContent = value;

                        // Custom rendering for specific columns
                        if (col.id === 'payment_status') {
                          const isPaid = value === 'Paid' || value === 'Success' || value === 'Free';
                          const isFree = value === 'Free';
                          const bgColor = isFree ? '#3b82f620' : (isPaid ? '#22c55e20' : '#f59e0b20');
                          const textColor = isFree ? '#3b82f6' : (isPaid ? '#22c55e' : '#f59e0b');
                          
                          cellContent = <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: bgColor, color: textColor }}>{value}</span>;
                        } else if (col.id === 'booking_status') {
                          const isConf = value === 'Confirmed';
                          cellContent = <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, backgroundColor: isConf ? '#3b82f620' : '#ef444420', color: isConf ? '#3b82f6' : '#ef4444' }}>{value}</span>;
                        } else if (col.id === 'bib_number') {
                          cellContent = <span style={{ fontWeight: 800, color: value !== '--' ? '#ec4899' : t.textSub }}>{value}</span>;
                        } else if (col.id === 'participant_name') {
                          cellContent = <span style={{ fontWeight: 600, color: t.textMain }}>{value}</span>;
                        } else if (col.id === 'registration_fee') {
                          cellContent = <span style={{ fontWeight: 600 }}>₹{value}</span>;
                        }

                        return (
                          <td key={col.id} style={{ padding: '16px 12px', fontSize: '14px', color: t.textMain, whiteSpace: 'nowrap' }}>
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}

    </div>
  );
}
