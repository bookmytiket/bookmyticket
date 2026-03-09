"use client";
import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { HOME_EVENTS } from "@/app/data/homeEvents";

const DEFAULT_TRENDING = HOME_EVENTS.filter((e) => e.trending);

function EventCard({ event }) {
    const [wished, setWished] = useState(false);
    return (
        <Link
            href={`/events/${event.id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
            <article
                style={{
                    minWidth: "340px",
                    width: "340px",
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
                {/* Image — 16:9 */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
                    <img
                        src={event.img}
                        alt={event.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                    {/* Heart button */}
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
                {/* Card Content */}
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

export default function TrendingEvents({ events = DEFAULT_TRENDING }) {
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (scrollRef.current)
            scrollRef.current.scrollBy({ left: dir === "left" ? -380 : 380, behavior: "smooth" });
    };

    return (
        <section style={{ width: "100%", backgroundColor: "#fff", padding: "36px 0 28px" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{
                            fontSize: "28px",
                            fontWeight: 900,
                            color: "#111827",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            letterSpacing: "-0.04em",
                            lineHeight: 1.1,
                            fontFamily: "var(--font-heading)"
                        }}>
                            Trending <span style={{
                                background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}>Events</span> 🔥
                        </h2>
                        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0", fontWeight: 500 }}>
                            These are trending now!
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => scroll("left")} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "all 0.2s" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <button onClick={() => scroll("right")} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "all 0.2s" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                </div>

                {/* Scroll Row */}
                <div
                    ref={scrollRef}
                    style={{ display: "flex", gap: "16px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: "8px" }}
                >
                    {events && events.length > 0 ? events.map(event => <EventCard key={event.id} event={event} />) : (
                        <div style={{ padding: "40px", textAlign: "center", width: "100%", color: "#9ca3af" }}>
                            Explore what's trending soon.
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
}
