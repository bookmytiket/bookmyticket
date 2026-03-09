"use client";
import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { HOME_EVENTS } from "@/app/data/homeEvents";

const DEFAULT_EXCLUSIVE = HOME_EVENTS.filter((e) => e.exclusive);

function ExclusiveCard({ event }) {
    const [wished, setWished] = useState(false);
    return (
        <Link
            href={`/events/${event.id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
            <article
                style={{
                    minWidth: "280px",
                    width: "280px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    overflow: "hidden",
                    flexShrink: 0,
                    cursor: "pointer",
                    transition: "box-shadow 0.25s ease, border-color 0.25s ease",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = "#d1d5db";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                }}
            >
                <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
                    <img
                        src={event.img}
                        alt={event.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                    <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setWished(w => !w); }}
                        style={{
                            position: "absolute", top: "8px", right: "8px",
                            width: "30px", height: "30px", borderRadius: "50%",
                            background: "rgba(255,255,255,0.9)", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            transition: "transform 0.2s",
                            zIndex: 10
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24"
                            fill={wished ? "#ef4444" : "none"}
                            stroke={wished ? "#ef4444" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                    <h3 style={{
                        fontSize: "15px", fontWeight: 700, color: "#111827",
                        margin: "0 0 8px", lineHeight: 1.3,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                        {event.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <span style={{ fontSize: "12px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {event.location}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>{event.date}</span>
                        </div>
                        <div style={{ position: "relative", display: "inline-block" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{event.type}</span>
                            <span style={{ position: "absolute", bottom: "-2px", left: 0, width: "100%", height: "2px", background: "#ef4444", borderRadius: "2px", display: "block" }} />
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default function ExclusiveEvents({ events }) {
    const scrollRef = useRef(null);
    const list = useMemo(() => (Array.isArray(events) && events.length > 0 ? events : DEFAULT_EXCLUSIVE), [events]);
    const scroll = dir =>
        scrollRef.current?.scrollBy({ left: dir === "left" ? -310 : 310, behavior: "smooth" });

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

                {/* Scroll row with right arrow */}
                <div style={{ position: "relative" }}>
                    <div
                        ref={scrollRef}
                        style={{ display: "flex", gap: "16px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: "8px", paddingRight: "48px" }}
                    >
                        {list.length > 0 ? list.map(event => <ExclusiveCard key={event.id} event={event} />) : (
                            <div style={{ padding: "40px", textAlign: "center", width: "100%", color: "#9ca3af" }}>
                                Exclusive event collection coming soon.
                            </div>
                        )}
                    </div>

                    {/* Right-edge arrow (like Ticket9) */}
                    <button
                        onClick={() => scroll("right")}
                        style={{
                            position: "absolute", top: "50%", right: 0, transform: "translateY(-60%)",
                            width: "38px", height: "38px", borderRadius: "50%",
                            background: "#fff", border: "1px solid #e5e7eb",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                            zIndex: 2, transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.borderColor = "#f97316"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
