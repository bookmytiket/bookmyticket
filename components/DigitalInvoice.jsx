"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    Download, 
    Printer, 
    FileText, 
    User, 
    Calendar, 
    MapPin, 
    Info,
    CheckCircle2
} from "lucide-react";
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

export default function DigitalInvoice({ booking, event, branding = {} }) {
    const invoiceRef = React.useRef(null);
    const [downloading, setDownloading] = React.useState(false);

    if (!booking || !event) return null;

    const invoiceNumber = `INV-${booking.id.slice(0, 8).toUpperCase()}`;
    const date = new Date(booking.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const downloadPDF = async () => {
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
            console.error("Invoice download failed:", error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
            <div 
                ref={invoiceRef}
                className="w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100 font-sans text-slate-800"
            >
                {/* Header Section */}
                <div className="bg-[#FEFF00] p-6 md:p-8 text-slate-900 relative overflow-hidden">
                    {/* Subtle dark accent line at top */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900 opacity-20" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                        <div className="space-y-1">
                            <img 
                                src={branding.logo_url || "/logo.png"} 
                                alt="BookMyTicket" 
                                className="h-14 w-auto brightness-0 object-contain" 
                            />
                            <p className="text-slate-800 text-[9px] font-black uppercase tracking-[0.3em]">Nexvant Technologies</p>
                        </div>
                        <div className="text-right md:text-right w-full md:w-auto">
                            <h1 className="text-2xl font-black uppercase tracking-tighter mb-0 text-slate-900">Tax Invoice</h1>
                            <p className="text-slate-700 font-black tracking-widest text-[9px] uppercase opacity-80">Original for Recipient</p>
                        </div>
                    </div>
                </div>

                {/* Info Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="p-3 border-r border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0">Invoice Number</p>
                        <p className="text-[10px] font-black text-slate-900">{invoiceNumber}</p>
                    </div>
                    <div className="p-3 border-r border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0">Invoice Date</p>
                        <p className="text-[10px] font-black text-slate-900">{date}</p>
                    </div>
                    <div className="p-3 border-r border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0">Booking ID</p>
                        <p className="text-[10px] font-black text-slate-900">#{booking.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="p-3">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0">Payment Status</p>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={10} />
                            <span className="text-[10px] font-black uppercase tracking-tight">{booking.status || 'Confirmed'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                    {/* Billing Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-900 mb-0.5">
                                <User size={14} className="text-yellow-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-tight">Billed To</h3>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <p className="text-sm font-black text-slate-900 mb-0">{booking.customer_details?.name || "Guest User"}</p>
                                <p className="text-[10px] font-bold text-slate-500">{booking.customer_details?.email}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{booking.customer_details?.phone}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-900 mb-0.5">
                                <FileText size={14} className="text-yellow-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-tight">Event Details</h3>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <p className="text-sm font-black text-slate-900 mb-0">{event.title}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                        <Calendar size={10} /> {event.date}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                        <MapPin size={10} /> {event.location?.split(',')[0]}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Particulars Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FEFF00] text-slate-900">
                                    <th className="p-3 text-[8px] font-black uppercase tracking-widest">Description</th>
                                    <th className="p-3 text-[8px] font-black uppercase tracking-widest text-center">Qty</th>
                                    <th className="p-3 text-[8px] font-black uppercase tracking-widest text-right">Price</th>
                                    <th className="p-3 text-[8px] font-black uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] font-bold divide-y divide-slate-100">
                                <tr>
                                    <td className="p-3">
                                        <p className="text-slate-900">{event.title}</p>
                                        <p className="text-slate-400 text-[9px] font-medium">Entry Pass</p>
                                    </td>
                                    <td className="p-3 text-center text-slate-900">{booking.ticket_count}</td>
                                    <td className="p-3 text-right text-slate-900">₹{((booking.base_amount || 0) / (booking.ticket_count || 1)).toFixed(2)}</td>
                                    <td className="p-3 text-right text-slate-900 font-black">₹{(booking.base_amount || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Summary & QR */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-2">
                        {/* QR Code Section */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full md:w-auto">
                            <div className="p-1 bg-white rounded-md shadow-sm">
                                <QRCodeSVG value={invoiceNumber} size={50} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0">Verify</p>
                                <p className="text-[9px] font-bold text-slate-500 leading-tight max-w-[100px]">
                                    Scan to verify.
                                </p>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="w-full md:w-[240px] space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                <span>Subtotal</span>
                                <span>₹{(booking.base_amount || 0).toFixed(2)}</span>
                            </div>
                            {booking.discount_amount > 0 && (
                                <div className="flex justify-between text-[11px] font-bold text-emerald-600">
                                    <span>Discount</span>
                                    <span>-₹{(booking.discount_amount || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                <span>Fee</span>
                                <span>₹{(booking.platform_charge || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-100">
                                <span>GST ({(booking.gst_percent || 18)}%)</span>
                                <span>₹{(booking.gst_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-0.5">
                                <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">Total</span>
                                <span className="text-lg font-black text-slate-900">₹{(booking.total_price || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                        COMPUTER GENERATED INVOICE. NO SIGNATURE REQUIRED.
                    </p>
                    <div className="flex justify-center items-center gap-6 flex-wrap grayscale opacity-60">
                        {branding?.sponsors?.length > 0 ? (
                            <>
                                {branding.sponsors.slice(0, 4).map((logo, idx) => (
                                    <img key={idx} src={logo} className="h-8 w-auto object-contain" alt="Sponsor Logo" />
                                ))}
                                <span className="h-4 w-[1px] bg-slate-300" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                                    Official<br/>Partners
                                </p>
                            </>
                        ) : (
                            <>
                                <img src="/logo.png" className="h-8 w-auto object-contain" alt="Logo" />
                                <span className="h-4 w-[1px] bg-slate-300" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">© 2026 Nexvant Technologies</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 no-print">
                <button 
                    onClick={downloadPDF}
                    disabled={downloading}
                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
                >
                    {downloading ? "Generating..." : <><Download size={16} /> Download Invoice</>}
                </button>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Printer size={16} /> Print
                </button>
            </div>
        </div>
    );
}
