"use client";
import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { isFreeEvent } from "@/app/utils/eventUtils";

function ExclusiveCard({ event }) {
    return (
        <Link
            href={`/events/detail?id=${event.id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
            <article
                style={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    overflow: "hidden",
                    cursor: "pointer",
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: "box-shadow 0.2s ease",
                }}
            >
                <div style={{ position: "relative", width: "100%", aspectRatio: "2.3/3", overflow: "hidden" }}>
                    <img
                        src={event.img}
                        alt={event.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </div>
                <div style={{ padding: "10px", flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: "6px" }}>
                        <h3 style={{
                            fontSize: "14px", fontWeight: 700, color: "#111827",
                            margin: 0, lineHeight: 1.2,
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical", overflow: "hidden",
                            flex: 1
                        }}>
                            {event.title}
                        </h3>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0, marginTop: "2px" }}>
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.5l-4.2-4.2 1.4-1.4 2.8 2.8 6.1-6.1 1.4 1.4-7.5 7.5z" />
                        </svg>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {event.location || "Coimbatore"}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>{event.date}</span>
                        </div>
                        <div style={{ 
                            fontSize: '11px', 
                            fontWeight: 900, 
                            color: isFreeEvent(event) ? '#22c55e' : '#111827',
                            backgroundColor: isFreeEvent(event) ? '#22c55e10' : '#f1f5f9',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase'
                        }}>
                            {isFreeEvent(event) ? "FREE" : "PAID"}
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default function ExclusiveEvents({ events }) {
    const scrollRef = useRef(null);
    const list = useMemo(() => (Array.isArray(events) ? events : []), [events]);
    const scroll = dir =>
        scrollRef.current?.scrollBy({ left: dir === "left" ? -310 : 310, behavior: "smooth" });

    if (list.length === 0) return null;
    return (
        <section style={{ width: "100%", background: "linear-gradient(135deg, #fdf4ff 0%, #faf5ff 50%, #fff0fb 100%)", padding: "44px 0 40px" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Centered Header */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <h2 style={{
                        fontSize: "28px",
                        fontWeight: 900,
                        color: "#111827",
                        margin: "0 0 8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        letterSpacing: "-0.04em",
                        lineHeight: 1.1,
                        fontFamily: "var(--font-heading)"
                    }}>
                        Exclusive <span style={{
                            background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'inline-block'
                        }}>Events</span> ✨
                    </h2>
                    <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0, fontWeight: 500 }}>
                        Be the first to experience exclusive events before anyone else.
                    </p>
                </div>

                {/* Grid Container */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "12px",
                        marginTop: "10px"
                    }}
                >
                    {list.length > 0 ? list.map(event => <ExclusiveCard key={event.id} event={event} />) : (
                        <div style={{ padding: "40px", textAlign: "center", width: "100%", color: "#9ca3af" }}>
                            Exclusive event collection coming soon.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
