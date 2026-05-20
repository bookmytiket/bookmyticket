"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    Calendar, 
    MapPin, 
    Download, 
    Share2, 
    ShieldCheck, 
    X,
    Trophy,
    Music,
    Briefcase,
    Zap,
    Plus
} from "lucide-react";
import * as htmlToImage from 'html-to-image';

export default function MobileTicketView({ booking, event, ticket, onClose, branding = {} }) {
    const [downloading, setDownloading] = useState(false);
    const cardRef = React.useRef(null);

    if (!booking || !event) return null;

    const ticketNumber = ticket?.ticket_number || (booking.id || "").slice(-8).toUpperCase();
    const attendeeName = booking.customer_details?.name || "Attendee";
    const category = event.category || "General Admission";

    // Category mapping for vertical mobile layout
    const getCategoryStyles = (cat) => {
        const c = String(cat || 'Event').toLowerCase();
        if (c.includes('marathon') || c.includes('sport')) {
            return {
                badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                accent: "text-emerald-500",
                bgGradient: "from-emerald-950 via-slate-950 to-slate-950",
                icon: <Trophy size={16} />
            };
        }
        if (c.includes('concert') || c.includes('music')) {
            return {
                badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                accent: "text-yellow-500",
                bgGradient: "from-purple-950 via-slate-950 to-slate-950",
                icon: <Music size={16} />
            };
        }
        return {
            badge: "bg-pink-500/10 text-pink-500 border-pink-500/20",
            accent: "text-pink-500",
            bgGradient: "from-indigo-950 via-slate-950 to-slate-950",
            icon: <Zap size={16} />
        };
    };

    const styles = getCategoryStyles(category);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await htmlToImage.toJpeg(cardRef.current, {
                quality: 0.98,
                pixelRatio: 2
            });
            const link = document.createElement('a');
            link.download = `Ticket-${event.title}-${ticketNumber}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Mobile ticket download failed:", error);
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${event.title} - My Digital Pass`,
                    text: `Hey! Check out my pass for ${event.title}. Booking ID: ${ticketNumber}`,
                    url: window.location.href
                });
            } catch (err) {
                console.log("Share cancelled or failed");
            }
        } else {
            alert(`Booking Code: ${ticketNumber} copied!`);
        }
    };

    return (
        <div className="fixed inset-0 z-[12000] bg-slate-950 flex flex-col justify-between font-sans text-white md:hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-[12100]">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Digital Entry Ticket</h2>
                    <p className="text-[10px] font-mono text-pink-500">#{ticketNumber}</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-all active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 space-y-6">
                {/* Visual Pass Card */}
                <div 
                    ref={cardRef}
                    className={`w-full rounded-[2.5rem] bg-gradient-to-b ${styles.bgGradient} border border-white/10 overflow-hidden shadow-2xl relative`}
                >
                    {/* Header Image */}
                    <div className="relative h-44 w-full bg-slate-900">
                        <img 
                            src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"} 
                            className="w-full h-full object-cover opacity-60" 
                            alt="Event Banner" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        
                        <div className="absolute top-4 left-4">
                            <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${styles.badge}`}>
                                {styles.icon}
                                {category}
                            </div>
                        </div>
                    </div>

                    {/* Ticket Details Body */}
                    <div className="px-6 pb-6 pt-4 space-y-6">
                        {/* Event Title */}
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight italic text-white leading-tight">
                                {event.title}
                            </h1>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                                {branding?.name || "BookMyTicket Production"}
                            </p>
                        </div>

                        {/* Stacking Metadata */}
                        <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-4">
                            <div>
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Attendee Name</p>
                                <p className="text-xs font-black text-white uppercase mt-0.5">{attendeeName}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Ticket Category</p>
                                <p className={`text-xs font-black uppercase mt-0.5 ${styles.accent}`}>{booking.ticket_category || "General"}</p>
                            </div>
                        </div>

                        {/* Date & Location */}
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <Calendar size={14} className="text-white/40 mt-0.5" />
                                <div>
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Date & Time</p>
                                    <p className="text-xs font-bold text-white/90">{event.date || "TBA"} • {event.time || "TBA"}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <MapPin size={14} className="text-white/40 mt-0.5" />
                                <div>
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Venue Station</p>
                                    <p className="text-xs font-bold text-white/90 truncate max-w-[200px]">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Stub Cuts (Visual Divider) */}
                        <div className="relative py-2 flex items-center justify-center">
                            <div className="w-full border-t border-dashed border-white/10" />
                            <div className="absolute -left-9 w-6 h-6 rounded-full bg-slate-950 border border-white/10" />
                            <div className="absolute -right-9 w-6 h-6 rounded-full bg-slate-950 border border-white/10" />
                        </div>

                        {/* QR Code section */}
                        <div className="flex flex-col items-center pt-2">
                            <div className="p-3 bg-white rounded-3xl shadow-xl">
                                <QRCodeSVG value={ticket?.qr_code || ticketNumber} size={150} level="H" fgColor="#020617" />
                            </div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-4">Scan QR at Entry Gate</p>
                            <p className="text-sm font-mono font-bold text-pink-500 mt-1">#{ticketNumber}</p>
                        </div>
                    </div>
                </div>

                {/* Add to Apple/Google Wallet Simulated Button */}
                <button 
                    onClick={() => alert("Digital Pass added to Wallet!")}
                    className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Plus size={16} /> Add to Apple Wallet
                </button>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex gap-3 z-[12100]">
                <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                    <Download size={16} /> {downloading ? "Saving..." : "Save Pass"}
                </button>
                <button 
                    onClick={handleShare}
                    className="px-6 bg-white/10 border border-white/10 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                    title="Share Ticket"
                >
                    <Share2 size={18} />
                </button>
            </div>
        </div>
    );
}
