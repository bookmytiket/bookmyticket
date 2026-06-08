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
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabase";

export default function DigitalTicket({ booking, event, ticket: initialTicket, showDownload = true, branding = {} }) {
    const [ticket, setTicket] = useState(initialTicket);
    const [isRevealed, setIsRevealed] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isTabActive, setIsTabActive] = useState(true);
    const ticketRef = useRef(null);

    useEffect(() => {
        if (initialTicket) {
            setTicket(initialTicket);
        }
    }, [initialTicket]);

    useEffect(() => {
        if (!ticket && booking?.id) {
            supabase
                .from('tickets')
                .select('*')
                .eq('booking_id', booking.id)
                .limit(1)
                .maybeSingle()
                .then(({ data }) => {
                    if (data) {
                        setTicket(data);
                    }
                })
                .catch(err => console.error("[DigitalTicket] Error fetching ticket:", err));
        }
    }, [booking?.id, ticket]);

    useEffect(() => {
        const handleVisibility = () => setIsTabActive(!document.hidden);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    if (!booking || !event) return null;

    const ticketNumber = ticket?.ticket_number || (booking.id || "").slice(-8).toUpperCase();
    
    // Dynamic Content Mapping based on Category
    // Dynamic Content Mapping based on Category
    const getCategoryDetails = (category) => {
        const c = String(category || 'Event').toLowerCase();
        
        let theme = {
            icon: <Zap className="text-pink-400" size={20} />,
            accent: "text-pink-400",
            titleStyle: { fontWeight: "900", letterSpacing: "-0.03em", textShadow: "0 2px 15px rgba(236,72,153,0.5)" },
            overlay: "from-fuchsia-900/90 via-purple-900/80 to-slate-900/90",
            glow1: "bg-pink-600",
            glow2: "bg-purple-600",
            border: "border-pink-500/30",
            fallbackBg: "#4a044e"
        };

        if (c.includes('marathon') || c.includes('sport')) {
            theme = {
                ...theme,
                icon: <Trophy className="text-pink-400" size={20} />,
                titleStyle: { fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "-0.05em", transform: "skewX(-10deg)", textShadow: "0 2px 15px rgba(236,72,153,0.5)" },
            };
        } else if (c.includes('corporate') || c.includes('business')) {
            theme = {
                ...theme,
                icon: <Briefcase className="text-pink-400" size={20} />,
                titleStyle: { fontWeight: "300", letterSpacing: "0.05em", textShadow: "0 2px 15px rgba(236,72,153,0.5)" },
            };
        }

        const selectedSeats = booking?.selected_seats || [];
        const hasSeats = selectedSeats.length > 0;
        
        let zone = booking?.metadata?.zone || "General Admission";
        let seatNo = booking?.metadata?.seat_no || "Open Seating";

        if (hasSeats) {
            const blocks = [...new Set(selectedSeats.map(s => s.blockName || s.id.split('-')[0]))];
            zone = blocks.join(', ');
            seatNo = selectedSeats.map(s => {
                const parts = s.id.split('-');
                return parts.length > 1 ? parts.slice(1).join('-') : s.id;
            }).join(', ');
        }

        const bibNumber = booking?.customer_details?.bib_number;

        return {
            label: category || "Event",
            fields: bibNumber ? [
                { label: "ATTENDEE", value: booking?.customer_name || booking?.customer_details?.name || booking?.customer_email || "Guest" },
                { label: "EVENT TYPE", value: event?.category || "General" },
                { label: "CATEGORY", value: booking?.customer_details?.packageId || zone },
                { label: "BIB NUMBER", value: bibNumber }
            ] : [
                { label: "ATTENDEE", value: booking?.customer_name || booking?.customer_details?.name || booking?.customer_email || "Guest" },
                { label: "EVENT TYPE", value: event?.category || "General" },
                { label: "SEAT CATEGORY", value: zone },
                { label: "SEAT NO", value: seatNo }
            ],
            ...theme
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
            // Capturing at 1200x600 for High Quality
            const dataUrl = await htmlToImage.toJpeg(ticketRef.current, { 
                quality: 1.0, 
                pixelRatio: 2,
                width: 1200,
                height: 600
            });
            
            // Create PDF
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "px",
                format: [1200, 600]
            });
            
            pdf.addImage(dataUrl, 'JPEG', 0, 0, 1200, 600);
            pdf.save(`Ticket-${event.title}-${ticketNumber}.pdf`);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsCapturing(false);
            setDownloading(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full mx-auto p-4 max-w-5xl">
            {/* Dynamic CSS for shimmer */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes ticket-shimmer {
                    0% { transform: translateX(-150%) skewX(-15deg); }
                    50% { transform: translateX(200%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }
                .animate-ticket-shimmer {
                    animation: ticket-shimmer 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}} />
            
            {/* Standard Size Container */}
            <div 
                ref={ticketRef}
                className={`group relative w-full flex flex-col md:flex-row transition-all duration-500 overflow-hidden shadow-2xl ${isCapturing ? 'rounded-none' : 'rounded-3xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-1'} ${!isTabActive && !isCapturing ? 'blur-2xl' : ''} ${details.border}`}
                style={{ 
                    aspectRatio: isCapturing ? "2/1" : undefined,
                    minHeight: "350px",
                    maxWidth: "800px",
                    backgroundImage: 'url("/bookmyticket/eventticket.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: details.fallbackBg
                }}
            >
                {/* Dynamic Category Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${details.overlay} pointer-events-none transition-colors duration-1000`} />
                
                {/* Animated Shimmer Effect (disabled during capture) */}
                {!isCapturing && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-ticket-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                )}
                
                {/* Neon Glow Effects */}
                <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-40 transition-colors duration-1000 ${details.glow1}`} />
                <div className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-40 transition-colors duration-1000 ${details.glow2}`} />

                {/* Left Section: Main Body */}
                <div className="flex-[2] p-6 md:p-10 flex flex-col justify-between relative z-10 w-full min-w-0">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                    {details.icon}
                                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.4em] ${details.accent}`}>{details.label}</p>
                                </div>
                                <h2 
                                    className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white italic leading-[1] break-words"
                                    style={details.titleStyle}
                                >
                                    {event.title}
                                </h2>
                            </div>
                            <div className="flex-shrink-0 pt-1">
                                <img src="/logo.png" className="h-8 md:h-12 w-auto brightness-0 invert object-contain opacity-90 drop-shadow-lg" alt="Logo" />
                            </div>
                        </div>

                        {/* Dynamic Metadata Fields */}
                        <div className="grid grid-cols-2 gap-4 md:gap-6 pt-2">
                            {details.fields.map((f, i) => (
                                <div key={i} className="space-y-0.5 min-w-0">
                                    <p className="text-[8px] md:text-[9px] font-black text-white/50 uppercase tracking-widest truncate">{f.label}</p>
                                    <p className="text-sm md:text-base font-black text-white uppercase tracking-tight leading-tight truncate">{f.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Details */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-t border-white/20 pt-4 md:pt-6 mt-6 md:mt-auto gap-4 md:gap-0">
                        <div className="flex flex-col gap-4 min-w-0">
                            
                            <div className="flex flex-wrap gap-6 md:gap-8">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-white/60">
                                        <Calendar size={10} />
                                        <p className="text-[8px] font-black uppercase tracking-widest">Date</p>
                                    </div>
                                    <p className="text-xs font-black text-white truncate">
                                        {booking?.customer_details?.showtimeDate 
                                            ? new Date(booking.customer_details.showtimeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                            : (event.date || "TBA")}
                                    </p>
                                </div>
                                {booking?.customer_details?.showtimeStart && (
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-1.5 text-white/60">
                                            <Zap size={10} />
                                            <p className="text-[8px] font-black uppercase tracking-widest">Time</p>
                                        </div>
                                        <p className="text-xs font-black text-white truncate">
                                            {new Date(`2000-01-01T${booking.customer_details.showtimeStart}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            {booking.customer_details.showtimeName && ` (${booking.customer_details.showtimeName})`}
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-white/60">
                                        <MapPin size={10} />
                                        <p className="text-[8px] font-black uppercase tracking-widest">Venue</p>
                                    </div>
                                    <p className="text-xs font-black text-white truncate max-w-[150px]">{event.location?.split(',')[0]}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Pass Price</p>
                            <p className={`text-xl md:text-2xl font-black ${details.accent}`}>₹{booking.total_price}</p>
                        </div>
                    </div>
                </div>

                {/* Divider (Horizontal on Mobile, Vertical on Desktop) */}
                <div className="w-full md:w-px h-px md:h-auto border-t md:border-t-0 md:border-l border-dashed border-white/20 relative z-20">
                    <div className="absolute top-1/2 md:-top-4 -left-4 md:left-1/2 -translate-y-1/2 md:-translate-y-0 md:-translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border border-white/10" />
                    <div className="absolute top-1/2 md:-bottom-4 -right-4 md:left-1/2 md:right-auto -translate-y-1/2 md:translate-y-0 md:-translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border border-white/10" />
                </div>

                {/* Right Section: Stub */}
                <div className="flex-1 bg-white/5 p-8 flex flex-col items-center justify-center relative">
                    <div 
                        className={`p-3 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-2xl shadow-2xl transition-all cursor-pointer ${!isRevealed && !isCapturing ? 'blur-md grayscale opacity-20' : ''}`}
                        onClick={() => setIsRevealed(!isRevealed)}
                    >
                        <div className="bg-white p-1 rounded-xl">
                            <QRCodeSVG value={ticket?.qr_code || ticketNumber} size={110} level="H" fgColor="#2e1065" />
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
