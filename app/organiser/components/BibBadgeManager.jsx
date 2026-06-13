"use client";
import React, { useState, useRef } from 'react';
import { Download, Search, Filter, Printer, RefreshCw, CheckCircle2, XCircle, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function BibBadgeManager({ marathon, registrations, theme }) {
  const t = theme || {
    cardBg: "rgba(255,255,255,0.05)",
    bg: "#13131a",
    border: "rgba(255,255,255,0.1)",
    textMain: "#ffffff",
    textSub: "rgba(255,255,255,0.5)"
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
  // Reusable Template Component
  const BadgeTemplate = ({ data, isPreview }) => {
    if (!data) return null;
    const rawBib = data.bib_number || "";
    // Match everything up to the last consecutive sequence of digits
    const match = rawBib.match(/^(.*?)(\d+)$/);
    const bibPrefix = match ? match[1].replace(/[-_\s]+$/, '') : ""; // Remove trailing hyphens/spaces
    const bibNumber = match ? match[2] : rawBib;

    const eventDate = marathon?.event_date 
      ? new Date(marathon.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
      : "";

    return (
      <div 
        className={`bg-white relative flex flex-col justify-center items-center text-slate-900 overflow-hidden border-[12px] border-slate-100 shadow-2xl origin-center`} 
        style={{ 
          fontFamily: 'sans-serif',
          width: settings.orientation === 'landscape' ? '210mm' : '148mm',
          height: settings.orientation === 'landscape' ? '148mm' : '210mm',
          ...(isPreview && { transform: 'scale(0.5)', transformOrigin: 'center' })
        }}
      >
        <div className="flex flex-col items-center justify-center w-full h-full p-12 text-center">
          
          {/* Category */}
          <h2 className="text-4xl font-black uppercase text-pink-600 tracking-widest mb-6">
            {data.category_name}
          </h2>

          {/* BIB Area */}
          <div className="flex flex-col items-center justify-center mb-10 w-full px-8">
            {bibPrefix && (
              <div className="text-3xl font-bold text-slate-400 uppercase tracking-widest mb-2 whitespace-normal break-words max-w-full leading-normal">
                {bibPrefix}
              </div>
            )}
            <div className="text-[170px] font-black text-slate-900 leading-tight tracking-tighter w-full whitespace-normal break-words py-4">
              {bibNumber}
            </div>
          </div>

          {/* Participant Name */}
          <h1 className="text-6xl font-black uppercase text-slate-800 w-full px-8 mb-4 whitespace-normal break-words leading-tight">
            {data.participant_name}
          </h1>

          {/* Event Date */}
          {eventDate && (
            <p className="text-2xl font-bold text-slate-400 uppercase tracking-widest">
              {eventDate}
            </p>
          )}

        </div>
      </div>
    );
  };

  const [settings, setSettings] = useState({
    orientation: 'landscape',
    format: 'a5',
    showEventLogo: true,
    showParticipantName: true,
    showQR: true,
    showPoweredBy: true,
  });

  const [showSettings, setShowSettings] = useState(false);
  
  // Ref for the hidden badge template used for rendering
  const badgeRef = useRef(null);
  const [activeBadgeData, setActiveBadgeData] = useState(null);

  // Get unique categories
  const categories = [...new Set(registrations.map(r => r.category_name).filter(Boolean))];

  // Filter registrations
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = 
      (r.participant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.bib_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.registration_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = categoryFilter ? r.category_name === categoryFilter : true;
    const matchesStatus = statusFilter ? 
      (statusFilter === 'has_bib' ? !!r.bib_number : !r.bib_number) : true;
      
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const generatePDF = async (participant) => {
    if (!participant.bib_number) {
      alert("This participant does not have a BIB number assigned yet.");
      return;
    }
    
    try {
      setGeneratingId(participant.id);
      setActiveBadgeData(participant);
      
      // Wait for React to render the hidden badge
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!badgeRef.current) throw new Error("Badge template not found");

      const canvas = await html2canvas(badgeRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: 'mm',
        format: settings.format
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${participant.bib_number}_${participant.participant_name.replace(/\s+/g, '_')}_BIB.pdf`);
      
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setGeneratingId(null);
      setActiveBadgeData(null);
    }
  };

  const handleBulkGenerate = async () => {
    const withBibs = filteredRegistrations.filter(r => r.bib_number);
    if (withBibs.length === 0) return alert("No participants with BIB numbers found in current filter.");
    
    if (!window.confirm(`Generate a combined PDF for ${withBibs.length} participants? This may take a moment.`)) return;

    setGeneratingId('bulk');
    try {
      const pdf = new jsPDF({ 
        orientation: settings.orientation, 
        unit: 'mm', 
        format: settings.format 
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      for (let i = 0; i < withBibs.length; i++) {
        setActiveBadgeData(withBibs[i]);
        await new Promise(resolve => setTimeout(resolve, 100)); // Render wait
        
        const canvas = await html2canvas(badgeRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`${marathon?.title?.replace(/\s+/g, '_')}_Bulk_BIBs.pdf`);
    } catch (err) {
      console.error(err);
      alert("Bulk generation failed.");
    } finally {
      setGeneratingId(null);
      setActiveBadgeData(null);
    }
  };

  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}` }} className="rounded-3xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black" style={{ color: t.textMain }}>BIB Badge Manager</h2>
            <p className="text-sm" style={{ color: t.textSub }}>Generate, preview, and print participant BIB badges.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
              style={{ backgroundColor: showSettings ? t.border : 'transparent', color: t.textMain, border: `1px solid ${t.border}` }}
            >
              <Filter size={18} /> Settings
            </button>
            <button 
              onClick={handleBulkGenerate}
              disabled={generatingId === 'bulk'}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {generatingId === 'bulk' ? <RefreshCw className="animate-spin" size={18} /> : <Printer size={18} />}
              Bulk Export ({filteredRegistrations.filter(r => r.bib_number).length})
            </button>
          </div>
        </div>

        {showSettings && (
          <div style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }} className="p-6 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-bold mb-2 block uppercase tracking-widest" style={{ color: t.textSub }}>Paper Size</label>
              <select value={settings.format} onChange={e=>setSettings({...settings, format: e.target.value})} style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, color: t.textMain }} className="w-full rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-pink-500">
                <option value="a4">A4</option>
                <option value="a5">A5</option>
                <option value="a6">A6</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold mb-2 block uppercase tracking-widest" style={{ color: t.textSub }}>Orientation</label>
              <select value={settings.orientation} onChange={e=>setSettings({...settings, orientation: e.target.value})} style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, color: t.textMain }} className="w-full rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-pink-500">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-col justify-center gap-2 pt-4">
              <label className="flex items-center gap-3 text-sm cursor-pointer transition-colors" style={{ color: t.textMain }}>
                <input type="checkbox" checked={settings.showEventLogo} onChange={e=>setSettings({...settings, showEventLogo: e.target.checked})} className="accent-pink-500" />
                Show Event Logo & Header
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer transition-colors" style={{ color: t.textMain }}>
                <input type="checkbox" checked={settings.showQR} onChange={e=>setSettings({...settings, showQR: e.target.checked})} className="accent-pink-500" />
                Show Check-In QR Code
              </label>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textSub }} size={18} />
            <input 
              type="text" 
              placeholder="Search Name, BIB, ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-pink-500"
              style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, color: t.textMain }}
            />
          </div>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-pink-500"
            style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.textMain }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-pink-500"
            style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.textMain }}
          >
            <option value="">All BIB Statuses</option>
            <option value="has_bib">Has BIB Number</option>
            <option value="no_bib">No BIB Assigned</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ backgroundColor: t.bg, color: t.textSub }} className="text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4">Participant</th>
                <th className="p-4">Category</th>
                <th className="p-4">BIB Number</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody style={{ borderColor: t.border }}>
              {filteredRegistrations.map(reg => (
                <tr key={reg.id} style={{ borderBottom: `1px solid ${t.border}` }} className="hover:opacity-80 transition-opacity">
                  <td className="p-4">
                    <div className="font-bold" style={{ color: t.textMain }}>{reg.participant_name}</div>
                    <div className="text-xs font-mono" style={{ color: t.textSub }}>{reg.registration_id}</div>
                  </td>
                  <td className="p-4" style={{ color: t.textMain }}>{reg.category_name}</td>
                  <td className="p-4">
                    {reg.bib_number ? (
                      <span className="px-3 py-1 font-black rounded-lg" style={{ backgroundColor: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.2)' }}>
                        {reg.bib_number}
                      </span>
                    ) : (
                      <span className="text-xs flex items-center gap-1" style={{ color: t.textSub }}>
                        <XCircle size={12}/> Not Assigned
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setPreviewData(reg)}
                        disabled={!reg.bib_number}
                        className="p-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                        style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, color: t.textMain }}
                        title="Preview BIB Card"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => generatePDF(reg)}
                        disabled={!reg.bib_number || generatingId === reg.id}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 flex items-center gap-2"
                        style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, color: t.textMain }}
                      >
                        {generatingId === reg.id ? <RefreshCw className="animate-spin" size={14} /> : <Download size={14} />}
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center" style={{ color: t.textSub }}>No participants found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed top-[-10000px] left-[-10000px]">
        <div 
          ref={badgeRef} 
          style={{ 
            width: settings.orientation === 'landscape' ? '210mm' : '148mm',
            height: settings.orientation === 'landscape' ? '148mm' : '210mm',
          }}
        >
          <BadgeTemplate data={activeBadgeData} isPreview={false} />
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setPreviewData(null)}
        >
          <div 
            className="relative bg-[#13131a] border border-white/10 rounded-3xl overflow-hidden flex flex-col max-w-4xl w-full mt-10 shadow-2xl"
            style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b shrink-0 z-10 relative" style={{ borderColor: t.border, backgroundColor: t.bg }}>
              <h3 className="text-xl font-black" style={{ color: t.textMain }}>BIB Preview</h3>
              <button 
                onClick={() => setPreviewData(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: t.textMain }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scaled Content */}
            <div className="p-4 md:p-8 flex items-start justify-center overflow-auto bg-black/5" style={{ maxHeight: '70vh' }}>
              <div style={{
                width: settings.orientation === 'landscape' ? '210mm' : '148mm',
                height: settings.orientation === 'landscape' ? '148mm' : '210mm',
                transform: 'scale(0.6)',
                transformOrigin: 'top center',
                marginBottom: '-40%' // Compensate for the scaled down height in document flow
              }}>
                <BadgeTemplate data={previewData} isPreview={false} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
