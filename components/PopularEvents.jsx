"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { isFreeEvent } from "@/app/utils/eventUtils";

function PopularCard({ event }) {
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
                    transition: "box-shadow 0.2s ease"
                }}
            >
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>{event.date}</span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#111827" }}>{isFreeEvent(event) ? "Free" : "Paid"}</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default function PopularEvents({ events }) {
    const list = useMemo(() => (Array.isArray(events) ? events : []), [events]);
    return (
        <section style={{ width: "100%", backgroundColor: "#fafafa", padding: "36px 0 40px" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px" }}>
                    <div>
                        <h2 id="popular-events-heading" style={{
                            fontSize: "28px",
                            fontWeight: 900,
                            color: "#111827",
                            margin: 0,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.1,
                            fontFamily: "var(--font-heading)"
                        }}>
                            Explore Popular <span style={{
                                background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}>Events</span>
                        </h2>
                        <p style={{ color: '#9ca3af', fontSize: '13px', margin: "4px 0 0", fontWeight: 500 }}>
                            Discover what everyone is talking about
                        </p>
                    </div>
                </div>

                {/* Grid Container */}
                <div style={{ display: "flex", flexDirection: "column", gap: list.length > 0 ? "32px" : "0" }}>
                    {/* Main / Static Events Row */}
                    <div
                        aria-labelledby="popular-events-heading"
                        className="events-scroll-container"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                            gap: "16px",
                        }}
                    >
                        {list.filter(e => !e._id).map(event => (
                            <div key={event.id} className="event-item-wrapper">
                                <PopularCard event={event} />
                            </div>
                        ))}
                    </div>

                    {/* Organiser Events Row (Convex) */}
                    {list.some(e => e._id) && (
                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "32px" }}>
                            <div
                                className="events-scroll-container"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                                    gap: "16px",
                                }}
                            >
                                {list.filter(e => e._id).map(event => (
                                    <div key={event.id} className="event-item-wrapper">
                                        <PopularCard event={event} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {list.length === 0 && (
                        <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af", background: "#fff", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                            Popular events will appear here soon.
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @media (max-width: 768px) {
                        .events-scroll-container {
                            display: flex !important;
                            flex-wrap: nowrap !important;
                            overflow-x: auto !important;
                            overflow-y: hidden;
                            scroll-snap-type: x mandatory;
                            padding-bottom: 20px;
                            margin: 0 -20px;
                            padding: 0 20px;
                            gap: 16px !important;
                            -webkit-overflow-scrolling: touch;
                        }
                        
                        .events-scroll-container::-webkit-scrollbar {
                            display: none;
                        }

                        .event-item-wrapper {
                            flex: 0 0 280px;
                            scroll-snap-align: start;
                        }
                    }
                `}</style>
            </div>
        </section>
    );
}
