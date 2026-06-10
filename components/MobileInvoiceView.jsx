"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    Download, 
    Printer, 
    Share2, 
    X,
    Calendar,
    MapPin,
    ChevronDown,
    ChevronUp,
    FileText,
    CheckCircle2
} from "lucide-react";
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

export default function MobileInvoiceView({ booking, event, onClose, branding = {} }) {
    const [downloading, setDownloading] = useState(false);
    const [feesExpanded, setFeesExpanded] = useState(false);
    const invoiceRef = React.useRef(null);

    if (!booking || !event) return null;

    const invoiceNumber = `INV-${(booking.id || booking._id || "XXXXXXXX").slice(0, 8).toUpperCase()}`;
    const date = new Date(booking.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const handleDownload = async () => {
        if (!invoiceRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await htmlToImage.toPng(invoiceRef.current, { quality: 0.95 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice-${invoiceNumber}.pdf`);
        } catch (error) {
            console.error("Mobile PDF rendering failed:", error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[12000] bg-slate-950 flex flex-col justify-between font-sans text-white md:hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-[12100]">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Tax Invoice</h2>
                    <p className="text-[10px] font-mono text-blue-400">{invoiceNumber}</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-all active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 space-y-6">
                <div 
                    ref={invoiceRef}
                    className="w-full bg-[#0a0f1d] border border-white/5 rounded-[2rem] p-6 space-y-6 shadow-xl"
                >
                    {/* Invoice Brand Banner */}
                    <div className="flex justify-between items-start">
                        <div>
                            <img 
                                src={branding.logo_url || "/logo.png"} 
                                className="h-10 w-auto brightness-0 invert object-contain" 
                                alt="Logo" 
                            />
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Nexvant Technologies</p>
                        </div>
                        <div className="text-right">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                                <CheckCircle2 size={10} />
                                {booking.status || "Paid"}
                            </span>
                        </div>
                    </div>

                    {/* Meta stack */}
                    <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-4">
                        <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Invoice Date</p>
                            <p className="text-xs font-black mt-0.5">{date}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Booking Code</p>
                            <p className="text-xs font-black mt-0.5">#{booking.id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Customer Stack */}
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Billed Recipient</p>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-0.5">
                            <p className="text-xs font-black text-white">{booking.customer_details?.name || "Guest Attendee"}</p>
                            <p className="text-[10px] font-bold text-white/50">{booking.customer_details?.email || "—"}</p>
                            <p className="text-[10px] font-bold text-white/50">{booking.customer_details?.phone || "—"}</p>
                        </div>
                    </div>

                    {/* Particulars Card */}
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Acquired Access</p>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                            <div>
                                <p className="text-xs font-black text-white uppercase italic">{event.title}</p>
                                <div className="flex gap-4 items-center mt-1 text-[9px] font-bold text-white/40">
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {event.date}</span>
                                    <span className="flex items-center gap-1"><MapPin size={10} /> {event.location?.split(',')[0]}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-white/5 pt-3 text-[10px] font-bold text-white/60">
                                <span>Seats Count: {booking.ticket_count}</span>
                                <span className="font-black text-white">₹{(booking.base_amount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pricing collapse & summary */}
                    <div className="space-y-3">
                        <button 
                            onClick={() => setFeesExpanded(!feesExpanded)}
                            className="w-full flex justify-between items-center py-2 text-[10px] font-black text-white/40 uppercase tracking-widest"
                        >
                            <span>Breakdown of Taxes & Fees</span>
                            {feesExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        
                        {feesExpanded && (
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 text-[10px] font-bold text-white/60">
                                <div className="flex justify-between">
                                    <span>Tickets Subtotal</span>
                                    <span>₹{(booking.base_amount || 0).toFixed(2)}</span>
                                </div>
                                {booking.discount_amount > 0 && (
                                    <div className="flex justify-between text-emerald-400">
                                        <span>Coupons Promo Discount</span>
                                        <span>-₹{(booking.discount_amount || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Platform Processing Charge</span>
                                    <span>₹{(booking.platform_charge || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Integrated GST ({(booking.gst_percent || 18)}%)</span>
                                    <span>₹{(booking.gst_amount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-white/10 rounded-2xl flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase tracking-widest">Grand Total</span>
                            <span className="text-lg font-black text-pink-500">₹{(booking.total_price || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* QR Stamp */}
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="p-1 bg-white rounded-lg">
                            <QRCodeSVG value={invoiceNumber} size={60} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Verify Authenticity</p>
                            <p className="text-[9px] font-bold text-white/50 leading-tight">
                                Scan with any mobile lens to verify Nexvant receipt.
                            </p>
                        </div>
                    </div>

                    {/* Sponsors & Partners Strip */}
                    {(branding.sponsors?.length > 0 || branding.partners?.length > 0) && (
                        <div className="pt-6 mt-6 border-t border-white/10 text-center space-y-4">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Supported By</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {branding.sponsors?.filter(s => s.status !== 'inactive').map((sponsor, i) => (
                                    <div key={i} className="h-8 w-auto opacity-50 contrast-200 grayscale">
                                        <img src={sponsor.logo_url} className="h-full w-auto object-contain" alt={sponsor.name} />
                                    </div>
                                ))}
                                {branding.partners?.filter(p => p.status !== 'inactive').map((partner, i) => (
                                    <div key={`p-${i}`} className="h-8 w-auto opacity-50 contrast-200 grayscale">
                                        <img src={partner.logo_url} className="h-full w-auto object-contain" alt={partner.name} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex gap-3 z-[12100]">
                <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                    <Download size={16} /> {downloading ? "Generating..." : "Save PDF"}
                </button>
                <button 
                    onClick={() => window.print()}
                    className="px-6 bg-white/10 border border-white/10 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                    title="Print Invoice"
                >
                    <Printer size={18} />
                </button>
            </div>
        </div>
    );
}
