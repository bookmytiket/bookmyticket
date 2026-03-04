"use client";

import React, { useEffect, useState } from "react";

const DEFAULT_LOGO_NAME = "book my ticket";
const DEFAULT_IMPORTANT_INFO = `We are book my ticket and we are dedicated to selling tickets for the best events. book my ticket is not the event organizer and is not responsible for event conditions, safety, rescheduling, or cancellations. For any queries about the event or this ticket, contact us via Support on our website. Present this ticket (printed or on your phone) with a valid ID at the venue. Do not share this ticket with others.`;

export default function TicketTemplate({ booking = {}, event = {}, settings = {} }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const companyName = settings.companyName || DEFAULT_LOGO_NAME;
    const logoUrl = settings.logoUrl || "/logo.png";
    const importantInfo = settings.importantInfo || DEFAULT_IMPORTANT_INFO;
    const supportUrl = settings.supportUrl || "https://www.bookmyticket.com";

    const eventName = booking.eventName || event.title || "Event";
    const eventImg = event.img || event.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop";
    const location = event.location || booking.location || "—";
    const date = event.date || booking.date || "—";
    const time = event.time || "";
    const ticketType = booking.ticketType || "General Admission";
    const bookingId = booking.id || "";
    const bookingDate = booking.date || new Date().toISOString().split("T")[0];
    const totalPaid = booking.amount ?? 0;
    const tax = booking.gst ?? 0;
    const convenienceFee = booking.convenienceFee ?? 0;
    const tickets = booking.tickets ?? 1;
    const paymentStatus = booking.status || "Completed";
    const paymentMethod = booking.paymentMethod || "Online";

    const qrUrl = mounted && bookingId
        ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(bookingId)}`
        : "";

    return (
        <div
            id="ticket-print-area"
            style={{
                fontFamily: "var(--font-body), system-ui, sans-serif",
                maxWidth: "640px",
                margin: "0 auto",
                background: "#fff",
                border: "2px solid #7dd3fc",
                borderRadius: "12px",
                overflow: "hidden",
                color: "#111827",
            }}
        >
            {/* Header: Home page logo — larger, centered */}
            <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={logoUrl} alt={companyName} style={{ height: "64px", width: "auto", objectFit: "contain" }} />
            </div>

            {/* Main ticket content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "220px" }}>
                    {/* Left: Event image */}
                    <div style={{ padding: "16px", borderRight: "1px solid #e5e7eb" }}>
                        <img
                            src={eventImg}
                            alt={eventName}
                            style={{ width: "100%", height: "100%", minHeight: "200px", objectFit: "cover", borderRadius: "8px" }}
                        />
                    </div>
                    {/* Right: Event + ticket details + QR */}
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <h2 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 6px 0", lineHeight: 1.2 }}>{eventName}</h2>
                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>{location}</p>
                            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>{date}{time ? ` ${time}` : ""}</p>
                            <p style={{ fontSize: "12px", fontWeight: 600, margin: "8px 0 0 0" }}>{ticketType}</p>
                            <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>{ticketType} — {tickets} ticket{tickets !== 1 ? "s" : ""}</p>
                        </div>
                        {qrUrl && (
                            <div style={{ alignSelf: "flex-end", marginTop: "8px" }}>
                                <img src={qrUrl} alt="Ticket QR" width={100} height={100} style={{ display: "block" }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking & payment summary grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", padding: "16px 20px", background: "#f8fafc", borderTop: "1px solid #e5e7eb" }}>
                    <div><span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Booking date</span><p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>{bookingDate}</p></div>
                    <div><span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Booking ID</span><p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>#{bookingId}</p></div>
                    <div><span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Tax / GST</span><p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>{tax.toFixed(2)} INR</p></div>
                    <div><span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Convenience fee</span><p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>{convenienceFee.toFixed(2)} INR</p></div>
                    <div><span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total paid</span><p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>{totalPaid.toFixed(2)} INR</p></div>
                    <div><span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Payment</span><p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600 }}>{paymentMethod} · {paymentStatus}</p></div>
                </div>

                {/* Important information */}
                <div style={{ padding: "16px 20px", borderTop: "2px solid #7dd3fc" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 10px 0" }}>Important information</h3>
                    <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-line" }}>{importantInfo}</div>
                    <p style={{ fontSize: "12px", marginTop: "10px", fontWeight: 600 }}>Support: {supportUrl}</p>
                </div>
            </div>
        </div>
    );
}
