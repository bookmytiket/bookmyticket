"use client";

import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    ShieldCheck,
    Download,
    Loader2,
    Calendar,
    MapPin,
    Trophy,
    Music,
    Users,
    Briefcase,
    Zap
} from "lucide-react"; 
import * as htmlToImage from 'html-to-image';

export default function DigitalTicket({ booking, event, ticket, showDownload = true, branding = {} }) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isTabActive, setIsTabActive] = useState(true);
    const ticketRef = useRef(null);

    useEffect(() => {
        const handleVisibility = () => setIsTabActive(!document.hidden);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    if (!booking || !event) return null;

    const ticketNumber = ticket?.ticket_number || (booking.id || "").slice(-8).toUpperCase();
    
    // Dynamic Content Mapping based on Category
    const getCategoryDetails = (category) => {
        const c = String(category || 'Event').toLowerCase();
        
        if (c.includes('marathon') || c.includes('sport')) {
            return {
                label: "Marathon",
                icon: <Trophy className="text-emerald-400" size={20} />,
                neonColor: "shadow-emerald-500/50",
                accent: "text-emerald-400",
                fields: [
                    { label: "BIB NUMBER", value: booking.metadata?.bib_number || `BIB-${ticketNumber.slice(-3)}` },
                    { label: "DISTANCE", value: booking.metadata?.distance || event.distance || "21K" },
                    { label: "TEAM", value: booking.metadata?.team_name || "PRO" }
                ],
                gradient: "from-[#064e3b] via-[#020617] to-[#020617]",
                titleStyle: { fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "-0.05em", transform: "skewX(-10deg)" }
            };
        }
        if (c.includes('concert') || c.includes('music')) {
            return {
                label: "Concert",
                icon: <Music className="text-yellow-400" size={20} />,
                neonColor: "shadow-yellow-500/50",
                accent: "text-yellow-400",
                fields: [
                    { label: "ARTIST", value: event.artist_name || "Headliner" },
                    { label: "ZONE", value: booking.metadata?.zone || "Platinum" },
                    { label: "ENTRY", value: "Gate 4" }
                ],
                gradient: "from-[#2e1065] via-[#4c1d95] to-[#020617]",
                titleStyle: { textShadow: "0 0 20px rgba(234, 179, 8, 0.5)", letterSpacing: "-0.02em" }
            };
        }
        if (c.includes('corporate') || c.includes('business')) {
            return {
                label: "Corporate",
                icon: <Briefcase className="text-purple-400" size={20} />,
                neonColor: "shadow-purple-500/50",
                accent: "text-purple-400",
                fields: [
                    { label: "COMPANY", value: booking.customer_details?.company || "Organization" },
                    { label: "ROLE", value: booking.customer_details?.designation || "Delegate" },
                    { label: "HALL", value: "A-12" }
                ],
                gradient: "from-[#1e1b4b] via-[#4c1d95] to-[#020617]",
                titleStyle: { fontWeight: "300", letterSpacing: "0.05em" }
            };
        }
        // Default Sports/Event - Using Yellow and Purple
        return {
            label: "Event",
            icon: <Zap className="text-yellow-400" size={20} />,
            neonColor: "shadow-yellow-500/50",
            accent: "text-yellow-400",
            fields: [
                { label: "STADIUM", value: event.location?.split(',')[0] || "Venue" },
                { label: "STAND", value: "North Wing" },
                { label: "GATE", value: "01" }
            ],
            gradient: "from-[#4c1d95] via-[#1e1b4b] to-[#020617]",
            titleStyle: { fontWeight: "900", letterSpacing: "-0.03em" }
        };
    };

    const details = getCategoryDetails(event.category);

    const downloadTicket = async () => {
        if (!ticketRef.current) return;
        setIsRevealed(true);
        setDownloading(true);
        setIsCapturing(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            // Capturing at 1200x600 for High Quality as requested
            const dataUrl = await htmlToImage.toJpeg(ticketRef.current, { 
                quality: 1.0, 
                pixelRatio: 2,
                width: 1200,
                height: 600
            });
            const link = document.createElement('a');
            link.download = `Ticket-${event.title}-${ticketNumber}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsCapturing(false);
            setDownloading(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full mx-auto p-4 max-w-5xl">
            {/* Standard Size Container (800x400) */}
            <div 
                ref={ticketRef}
                className={`relative w-full flex flex-row transition-all duration-500 overflow-hidden shadow-2xl ${isCapturing ? 'rounded-none' : 'rounded-3xl'} ${!isTabActive && !isCapturing ? 'blur-2xl' : ''} ${details.neonColor} border border-white/10 bg-gradient-to-br ${details.gradient}`}
                style={{ 
                    aspectRatio: "2/1",
                    minHeight: "350px",
                    maxWidth: "800px"
                }}
            >
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                {/* Neon Glow Effects */}
                <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-20 ${details.accent.replace('text-', 'bg-')}`} />
                <div className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 ${details.accent.replace('text-', 'bg-')}`} />

                {/* Left Section: Main Body */}
                <div className="flex-[2] p-10 flex flex-col justify-between relative z-10">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-1 max-w-[75%]">
                                <div className="flex items-center gap-2">
                                    {details.icon}
                                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${details.accent}`}>{details.label}</p>
                                </div>
                                <h2 
                                    className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white italic leading-[0.9] break-words"
                                    style={details.titleStyle}
                                >
                                    {event.title}
                                </h2>
                            </div>
                            <div className="flex-shrink-0">
                                <img src="/logo.png" className="h-12 w-auto brightness-0 invert object-contain opacity-80" alt="Logo" />
                            </div>
                        </div>

                        {/* Dynamic Metadata Fields */}
                        <div className="grid grid-cols-3 gap-8 pt-2">
                            {details.fields.map((f, i) => (
                                <div key={i} className="space-y-0.5">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{f.label}</p>
                                    <p className="text-base md:text-lg font-black text-white uppercase tracking-tight leading-tight">{f.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Details */}
                    <div className="flex items-end justify-between border-t border-white/10 pt-6 mt-auto">
                        <div className="flex flex-col gap-4">
                            {/* Sponsors Section */}
                            <div className="space-y-1.5">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Official Sponsors</p>
                                <div className="flex items-center gap-4">
                                    {(branding?.sponsor_logo_1 || branding?.sponsor_logo_2 || branding?.partner_logo_1 || branding?.partner_logo_2) ? (
                                        <>
                                            {[
                                                branding?.sponsor_logo_1,
                                                branding?.sponsor_logo_2,
                                                branding?.partner_logo_1,
                                                branding?.partner_logo_2
                                            ].filter(Boolean).map((logo, idx) => (
                                                <div key={idx} className="h-7 hover:scale-110 transition-all duration-300">
                                                    <img src={logo} className="h-full w-auto object-contain" alt="Sponsor" />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 opacity-30 grayscale transition-all">
                                                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center border border-white/10">
                                                    <ShieldCheck size={12} className="text-white/40" />
                                                </div>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Sponsor</span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-30 grayscale transition-all">
                                                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center border border-white/10">
                                                    <Zap size={12} className="text-white/40" />
                                                </div>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Partner</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-8 pt-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-white/40">
                                        <Calendar size={10} />
                                        <p className="text-[8px] font-black uppercase tracking-widest">Date</p>
                                    </div>
                                    <p className="text-xs font-black text-white">{event.date || "TBA"}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-white/40">
                                        <MapPin size={10} />
                                        <p className="text-[8px] font-black uppercase tracking-widest">Venue</p>
                                    </div>
                                    <p className="text-xs font-black text-white truncate max-w-[120px]">{event.location?.split(',')[0]}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Pass Price</p>
                            <p className={`text-2xl font-black ${details.accent}`}>₹{booking.total_price}</p>
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px border-l border-dashed border-white/10 relative z-20">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 border border-white/10" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 border border-white/10" />
                </div>

                {/* Right Section: Stub */}
                <div className="flex-1 bg-white/5 p-8 flex flex-col items-center justify-center relative">
                    <div 
                        className={`p-3 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-2xl shadow-2xl transition-all cursor-pointer ${!isRevealed && !isCapturing ? 'blur-md grayscale opacity-20' : ''}`}
                        onClick={() => setIsRevealed(!isRevealed)}
                    >
                        <div className="bg-white p-1 rounded-xl">
                            <QRCodeSVG value={ticketNumber} size={110} level="H" fgColor="#2e1065" />
                        </div>
                    </div>

                    <div className="mt-6 text-center space-y-1">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ticket ID</p>
                        <p className={`text-lg font-mono font-black italic tracking-tighter ${details.accent}`}>#{ticketNumber}</p>
                    </div>

                    {/* Sponsors & Partners Section */}
                    <div className="mt-auto pt-4 flex flex-col items-center gap-1.5 opacity-40">
                        <p className="text-[7px] font-black text-white uppercase tracking-[0.3em]">Sponsors & Partners</p>
                        <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/5 border border-white/5 shadow-inner">
                             {[
                                branding?.sponsor_logo_1,
                                branding?.sponsor_logo_2,
                                branding?.partner_logo_1,
                                branding?.partner_logo_2
                             ].filter(Boolean).slice(0, 2).map((logo, idx) => (
                                <img key={idx} src={logo} className="h-4 w-auto brightness-0 invert opacity-80" alt="Logo" />
                             ))}
                             {![branding?.sponsor_logo_1, branding?.sponsor_logo_2, branding?.partner_logo_1, branding?.partner_logo_2].some(Boolean) && (
                                <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">{branding?.name || "BookMyTicket"}</span>
                             )}
                        </div>
                    </div>

                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 rotate-90 whitespace-nowrap">
                        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/5">ID: {booking.id.slice(0, 16)}</p>
                    </div>
                </div>

                {/* Security Shield Overlay */}
                {!isTabActive && !isCapturing && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-3xl">
                        <ShieldCheck className={details.accent} size={64} />
                    </div>
                )}
            </div>

            {/* Actions */}
            {showDownload && (
                <div className="mt-10 no-print">
                    <button 
                        onClick={downloadTicket}
                        disabled={downloading}
                        className={`flex items-center gap-3 px-14 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 active:scale-95 transition-all shadow-2xl ${details.neonColor}`}
                    >
                        {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {downloading ? "Rendering High-Quality..." : "Download Digital Pass"}
                    </button>
                </div>
            )}
        </div>
    );
}
