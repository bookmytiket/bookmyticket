"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    Calendar, 
    MapPin, 
    Ticket, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ShieldCheck
} from "lucide-react";
import { DEFAULT_TICKET_TERMS } from "@/app/utils/ticketTerms";

export default function DigitalTicket({ booking, event, terms = DEFAULT_TICKET_TERMS }) {
    if (!booking || !event) return null;

    const isScanned = booking.scanned || booking.status === "Scanned";
    const bookingId = booking._id || booking.id;
    const shortId = bookingId?.slice(-8).toUpperCase();

    // Responsive helper styles
    const containerStyle = {
        width: "100%",
        maxWidth: "850px",
        margin: "0 auto",
        backgroundColor: "#fff",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column", // Default mobile
    };

    const landscapeSectionStyle = {
        display: "flex",
        flexDirection: "row", // Will be changed via className or inline logic for desktop
        flexWrap: "wrap"
    };

    return (
        <div className="digital-ticket-container" style={containerStyle}>
            {/* Main Landscape Row */}
            <div className="flex flex-col md:flex-row w-full">
                
                {/* Left Section: Event Image (30% width on desktop) */}
                <div className="w-full md:w-[30%] relative min-h-[220px]">
                    <img 
                        src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"} 
                        alt={event.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />
                    
                    {/* Entry Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest">
                        <Ticket size={12} />
                        Standard Pass
                    </div>
                </div>

                {/* Middle Section: Event Details (45% width on desktop) */}
                <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dashed border-slate-200 relative">
                    {/* Perforated Cuts (Desktop only) */}
                    <div className="hidden md:block absolute -top-3 -right-3 w-6 height-6 bg-[#f8fafc] rounded-full border border-slate-200 shadow-inner" />
                    <div className="hidden md:block absolute -bottom-3 -right-3 w-6 height-6 bg-[#f8fafc] rounded-full border border-slate-200 shadow-inner" />

                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                            {event.title}
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar size={12} className="text-rose-500" /> Date
                                </p>
                                <p className="text-sm font-extrabold text-slate-800">{event.date}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock size={12} className="text-rose-500" /> Time
                                </p>
                                <p className="text-sm font-extrabold text-slate-800">{event.time || "TBA"}</p>
                            </div>
                        </div>

                        <div className="space-y-1 mb-8">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <MapPin size={12} className="text-rose-500" /> Venue
                            </p>
                            <p className="text-sm font-extrabold text-slate-800 line-clamp-1">{event.location}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <ShieldCheck size={12} className="text-emerald-500" /> Guidelines
                        </p>
                        <ul className="space-y-1.5">
                            {terms.slice(0, 2).map((term, i) => (
                                <li key={i} className="text-[11px] text-slate-500 font-medium leading-relaxed flex gap-2">
                                    <span className="text-emerald-500">•</span> {term}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Section: QR & ID (25% width on desktop) */}
                <div className="w-full md:w-[25%] bg-slate-50/50 p-6 md:p-8 flex flex-col items-center justify-center text-center">
                    
                    {/* Dynamic Status Badge */}
                    <div className={`mb-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                        isScanned 
                        ? "bg-rose-100 text-rose-600 border border-rose-200" 
                        : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                    }`}>
                        {isScanned ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        {isScanned ? "Used" : "Active"}
                    </div>

                    <div className="p-3 bg-white rounded-2xl shadow-xl border border-white mb-6">
                        <QRCodeSVG 
                            value={bookingId} 
                            size={120} 
                            level="H" 
                            fgColor={isScanned ? "#cbd5e1" : "#0f172a"} 
                        />
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Booking ID</p>
                        <p className="text-lg font-black text-slate-900 font-mono tracking-tighter">#{shortId}</p>
                    </div>

                    {isScanned && (
                        <p className="mt-4 text-[10px] text-rose-500 font-black uppercase max-w-[120px]">
                            Redeemed at Venue
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="bg-slate-900 px-8 py-3 flex items-center justify-between text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                <div className="flex items-center gap-3">
                    <span className="text-rose-500">Security Checkpoint:</span>
                    <span>Valid Govt ID Required</span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>Verified Digital Pass</span>
                </div>
            </div>
        </div>
    );
}
