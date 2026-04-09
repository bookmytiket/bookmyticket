"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    Calendar, 
    MapPin, 
    Ticket, 
    User, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ShieldCheck,
    Info
} from "lucide-react";
import { DEFAULT_TICKET_TERMS } from "@/app/utils/ticketTerms";

export default function DigitalTicket({ booking, event, terms = DEFAULT_TICKET_TERMS }) {
    if (!booking || !event) return null;

    const isScanned = booking.scanned || booking.status === "Scanned";
    const bookingId = booking._id || booking.id;
    const shortId = bookingId?.slice(-8).toUpperCase();

    return (
        <div className="digital-ticket-root" style={{
            maxWidth: "400px",
            margin: "0 auto",
            backgroundColor: "#fff",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            fontFamily: "'Inter', sans-serif",
            position: "relative",
            border: "1px solid #e2e8f0"
        }}>
            {/* Top Section: Event Image + Header */}
            <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                <img 
                    src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"} 
                    alt={event.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)"
                }} />
                
                {/* Status Badge */}
                <div style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    backgroundColor: isScanned ? "#ef4444" : "#22c55e",
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: "50px",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                }}>
                    {isScanned ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                    {isScanned ? "Used" : "Active"}
                </div>
            </div>

            {/* Ticket Content */}
            <div style={{ padding: "24px", position: "relative" }}>
                {/* Event Name */}
                <h2 style={{ 
                    fontSize: "20px", 
                    fontWeight: "900", 
                    color: "#111827", 
                    margin: "0 0 16px 0",
                    lineHeight: "1.2",
                    letterSpacing: "-0.02em"
                }}>
                    {event.title}
                </h2>

                {/* Info Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ color: "#f84464", marginTop: "2px" }}><Calendar size={18} /></div>
                        <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Date</p>
                            <p style={{ margin: 0, fontSize: "14px", color: "#111827", fontWeight: "700" }}>{event.date}</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ color: "#f84464", marginTop: "2px" }}><Clock size={16} /></div>
                        <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Time</p>
                            <p style={{ margin: 0, fontSize: "14px", color: "#111827", fontWeight: "700" }}>{event.time || "TBA"}</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "24px" }}>
                    <div style={{ color: "#f84464", marginTop: "2px" }}><MapPin size={18} /></div>
                    <div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Venue</p>
                        <p style={{ margin: 0, fontSize: "14px", color: "#111827", fontWeight: "700" }}>{event.location}</p>
                    </div>
                </div>

                {/* Perforated Divider */}
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    margin: "0 -24px 24px -24px",
                    overflow: "hidden" 
                }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#f8fafc", marginLeft: "-10px", border: "1px solid #e2e8f0" }} />
                    <div style={{ flex: 1, borderTop: "2px dashed #e2e8f0", margin: "0 10px" }} />
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#f8fafc", marginRight: "-10px", border: "1px solid #e2e8f0" }} />
                </div>

                {/* QR Section */}
                <div style={{ 
                    textAlign: "center", 
                    background: "#f8fafc", 
                    borderRadius: "16px", 
                    padding: "24px",
                    border: "1px solid #f1f5f9",
                    marginBottom: "24px"
                }}>
                    <div style={{ 
                        display: "inline-block", 
                        padding: "12px", 
                        background: "#fff", 
                        borderRadius: "16px", 
                        boxShadow: "0 8px 24px rgba(0,0,0,0.05)" 
                    }}>
                        <QRCodeSVG 
                            value={bookingId} 
                            size={160} 
                            level="H" 
                            fgColor={isScanned ? "#94a3b8" : "#000000"} 
                        />
                    </div>
                    <div style={{ marginTop: "16px" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "700", letterSpacing: "0.1em" }}>BOOKING ID</p>
                        <p style={{ margin: 0, fontSize: "18px", color: "#111827", fontWeight: "900", fontFamily: "monospace" }}>#{shortId}</p>
                    </div>
                    {isScanned && (
                        <div style={{ 
                            marginTop: "12px", 
                            color: "#ef4444", 
                            fontSize: "12px", 
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px"
                        }}>
                             <AlertCircle size={14} /> This ticket has been redeemed
                        </div>
                    )}
                </div>

                {/* Guidelines Section */}
                <div style={{ textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <ShieldCheck size={18} style={{ color: "#22c55e" }} />
                        <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em" }}>Entry Guidelines</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {terms.slice(0, 3).map((term, i) => (
                            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "bold", marginTop: "2px" }}>{i+1}</div>
                                <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>{term}</p>
                            </div>
                        ))}
                    </div>
                    <p style={{ marginTop: "12px", fontSize: "11px", color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>
                        Full Terms & Conditions available at the venue.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ 
                background: "#111827", 
                padding: "16px", 
                color: "#fff", 
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
            }}>
                <Ticket size={16} />
                <span style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em" }}>BOOKMYTICKET SECURE DIGITAL PASS</span>
            </div>
        </div>
    );
}
