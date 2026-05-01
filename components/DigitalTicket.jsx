"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { Calendar,
    MapPin,
    Ticket,
    CheckCircle2,
    Clock,
    AlertCircle,
    ShieldCheck,
    Download,
    Loader2
} from "lucide-react"; 

import { DEFAULT_TICKET_TERMS } from "@/app/utils/ticketTerms";
import BrandingHeader from "./BrandingHeader";
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

export default function DigitalTicket({ booking, event, ticket, terms = DEFAULT_TICKET_TERMS, showDownload = false }) {
  // Fetch branding for Powered By logo via API to bypass RLS
  const [branding, setBranding] = React.useState({ powered_by_logo_url: '/logo.png' });
  React.useEffect(() => {
      fetch('/api/branding')
          .then(res => res.json())
          .then(data => { if (data.powered_by_logo_url) setBranding(data); })
          .catch(console.error);
  }, []);
    const ticketRef = React.useRef(null);
    const [downloading, setDownloading] = React.useState(false);
    const [isCapturing, setIsCapturing] = React.useState(false);
    const [isRevealed, setIsRevealed] = React.useState(false);
    const [isTabActive, setIsTabActive] = React.useState(true);

    // Security: Tab Visibility Detection
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabActive(!document.hidden);
        };
        const handleFocus = () => setIsTabActive(true);
        const handleBlur = () => setIsTabActive(false);

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

    // Security: Prevent Right-click and Print
    React.useEffect(() => {
        const preventActions = (e) => {
            // Prevent Right Click
            if (e.type === "contextmenu") {
                e.preventDefault();
                return false;
            }
            // Prevent Ctrl+P
            if (e.ctrlKey && (e.key === "p" || e.keyCode === 80)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Printing is restricted for security reasons.");
                return false;
            }
            // Prevent Ctrl+S
            if (e.ctrlKey && (e.key === "s" || e.keyCode === 83)) {
                e.preventDefault();
                return false;
            }
        };

        window.addEventListener("contextmenu", preventActions);
        window.addEventListener("keydown", preventActions);

        return () => {
            window.removeEventListener("contextmenu", preventActions);
            window.removeEventListener("keydown", preventActions);
        };
    }, []);

    if (!booking || !event) return null;
    const isScanned = booking.scanned || booking.status === "Scanned";
    const bookingId = booking._id || booking.id;
    const ticketNumber = ticket?.ticket_number || bookingId?.slice(-8).toUpperCase();
    const shortId = ticketNumber;
    const customerName = booking.customer_name || "Valued Customer";

    // Robust helper to convert image to base64 with canvas fallback
    const toBase64 = async (imgElement) => {
        const url = imgElement.src;
        try {
            // Method 1: Fetch
            const response = await fetch(url, { mode: 'cors' });
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("Fetch failed, trying canvas fallback:", e);
            try {
                // Method 2: Canvas (if already loaded)
                const canvas = document.createElement('canvas');
                canvas.width = imgElement.naturalWidth || imgElement.width;
                canvas.height = imgElement.naturalHeight || imgElement.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgElement, 0, 0);
                return canvas.toDataURL('image/jpeg', 0.9);
            } catch (canvasError) {
                console.error("Canvas fallback also failed:", canvasError);
                return url;
            }
        }
    };

    const downloadTicket = async () => {
        if (!ticketRef.current) return;
        
        // Ensure ticket is revealed before capturing
        const originalRevealed = isRevealed;
        setIsRevealed(true);
        
        setDownloading(true);
        setIsCapturing(true);

        // Pre-convert images in the DOM to avoid CORS issues during capture
        const images = ticketRef.current.querySelectorAll('img');
        const originalSrcs = [];
        
        try {
            // Store and replace with base64
            for (let img of images) {
                originalSrcs.push({ img, src: img.src });
                if (img.src && !img.src.startsWith('data:')) {
                    const b64 = await toBase64(img);
                    img.src = b64;
                }
            }

            // More generous wait time for all assets to render correctly
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Capture dimensions from the DOM to ensure exact framing
            const element = ticketRef.current;
            const width = element.offsetWidth;
            const height = element.offsetHeight;

            // Using toJpeg with explicit dimensions to avoid cropping/alignment issues
            const dataUrl = await htmlToImage.toJpeg(element, {
                quality: 1.0,
                pixelRatio: 3, 
                backgroundColor: '#fff',
                cacheBust: true,
                includeFonts: true,
                width: width,
                height: height,
                style: {
                    transform: 'none',
                    margin: '0',
                    padding: '0',
                    width: `${width}px`,
                    height: `${height}px`,
                }
            });
            
            const link = document.createElement('a');
            link.download = `Ticket-${(event.title || 'Event').replace(/\s+/g, '-')}-${shortId}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to generate ticket image. Please refresh and try again.');
        } finally {
            // Restore original srcs
            for (let item of originalSrcs) {
                item.img.src = item.src;
            }
            setIsRevealed(originalRevealed);
            setIsCapturing(false);
            setDownloading(false);
        }
    };

    const cacheBuster = `v=${Date.now()}`;
    const getFinalSrc = (src) => {
        if (!src || src === "undefined" || src === "null") return "https://images.unsplash.com/photo-1540575467063-178a50c2df87";
        if (src.startsWith('data:')) return src;
        // Only add cache buster to internal or supabase URLs
        if (src.includes('bookmyticket') || src.startsWith('/')) {
            const separator = src.includes('?') ? '&' : '?';
            return `${src}${separator}${cacheBuster}`;
        }
        return src;
    };

    const containerStyle = {
        width: "100%",
        maxWidth: isCapturing ? "700px" : "800px",
        margin: isCapturing ? "0" : "0 auto",
        backgroundColor: "#fff",
        borderRadius: isCapturing ? "0" : "20px",
        overflow: "hidden",
        boxShadow: "none",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        border: isCapturing ? "none" : "1px solid #e2e8f0",
        filter: (!isTabActive && !isCapturing) ? "blur(15px)" : "none",
        transition: "filter 0.3s ease",
        userSelect: "none",
    };

    return (
        <div className="flex flex-col items-center w-full relative">
            {/* Security Warning for Mobile/Web */}
            {!isCapturing && !isTabActive && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 ">
                        <ShieldCheck className="text-pink-500" size={24} />
                        <p className="text-white font-black uppercase italic tracking-widest text-xs">Security Protocol Active</p>
                    </div>
                </div>
            )}

            <div className="digital-ticket-container select-none" style={containerStyle} ref={ticketRef}>
                <div className="flex flex-col md:flex-row w-full relative z-10">
                    {/* Left Section: Event Image */}
                    <div className="w-full md:w-[30%] relative min-h-[160px] md:min-h-[240px]">
                        <img 
                            src={getFinalSrc(event?.img)} 
                            alt={event.title}
                            crossOrigin="anonymous"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />
                    </div>

                    {/* Middle Section: Event Details */}
                    <div className="w-full md:w-[45%] p-4 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dashed border-slate-200 relative text-center md:text-left">
                        {/* Branding Header integrated here */}
                        <div className="mb-4 md:mb-6 w-full flex justify-center items-center">
                            <BrandingHeader />
                        </div>

                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                                {event.title}
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                                        <Calendar size={12} className="text-rose-500" /> Date
                                    </p>
                                    <p className="text-sm font-extrabold text-slate-800">{event.date}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                                        <Clock size={12} className="text-rose-500" /> Time
                                    </p>
                                    <p className="text-sm font-extrabold text-slate-800">{event.time || "TBA"}</p>
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                                    <MapPin size={12} className="text-rose-500" /> Venue
                                </p>
                                <p className="text-sm font-extrabold text-slate-800 line-clamp-1">{event.location}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: QR & ID */}
                    <div className="w-full md:w-[25%] bg-slate-50/50 p-4 md:p-8 flex flex-col items-center justify-center text-center">
                        <div className={`mb-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                            isScanned 
                            ? "bg-rose-100 text-rose-600 border border-rose-200" 
                            : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                        }`}>
                            {isScanned ? "Used" : "Active"}
                        </div>

                        <div 
                            className="w-full max-w-[140px] bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden flex flex-col items-center cursor-pointer relative group"
                            onClick={() => setIsRevealed(!isRevealed)}
                        >
                            {!isRevealed && !isCapturing && (
                                <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all group-hover:bg-slate-900/50">
                                    <ShieldCheck className="text-white mb-2" size={24} />
                                    <p className="text-[8px] font-black text-white uppercase tracking-widest leading-tight">Tap to<br/>Reveal QR</p>
                                </div>
                            )}
                            
                            <div className={`p-4 flex items-center justify-center w-full transition-all  ${!isRevealed && !isCapturing ? 'blur-xl scale-90 opacity-20' : 'blur-0 scale-100 opacity-100'}`}>
                                <QRCodeSVG 
                                    value={ticket?.ticket_number || bookingId} 
                                    size={100} 
                                    level="H" 
                                    fgColor={isScanned ? "#cbd5e1" : "#0f172a"} 
                                />
                            </div>
                            <div className="w-full bg-slate-900 py-2 px-1">
                                <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">Booking ID</p>
                                <div className={`transition-all  ${!isRevealed && !isCapturing ? 'blur-md opacity-20' : 'blur-0 opacity-100'}`}>
                                    <p className="text-[10px] font-black text-white font-mono tracking-tighter italic">#{ticketNumber}</p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {isRevealed ? "Tap to Hide" : "Secure Information"}
                        </p>
                    </div>
                </div>

                {/* Normal UI Footer Bar */}
                {!isCapturing && (
                    <div className="bg-slate-900 px-8 py-3 flex items-center justify-between text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-rose-500">Security:</span>
                            <span>Screenshots Restricted</span>
                        </div>
                        
                        {/* Centered Logo - UI Size */}
                        <div className="flex-1 flex justify-center">
                            <img src={getFinalSrc(branding.logo_url || "/logo.png")} alt="Logo" crossOrigin="anonymous" style={{ height: '40px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                        </div>

                        {showDownload && (
                            <button 
                                onClick={downloadTicket}
                                disabled={downloading}
                                className="download-button-exclude flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                                style={{ border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                            >
                                {downloading ? <Loader2 size={12} className="animate-spin text-white" /> : <Download size={12} className="text-white" />}
                                <span style={{ color: '#fff' }}>{downloading ? 'Preparing...' : 'Save Ticket'}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Capture-only Branding Watermark */}
                {isCapturing && (
                    <div style={{ 
                        backgroundColor: '#111827', 
                        padding: '30px 30px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <img src={getFinalSrc(branding.logo_url || "/logo.png")} alt="Logo" crossOrigin="anonymous" style={{ height: '60px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px' }}>
                            Authorized Digital Ticket • BookMyTicket
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
