"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

const STORAGE_KEY = "recently_viewed_events";
const MAX_ITEMS = 12;

export default function RecentlyViewedEvents({ events: propEvents }) {
    const [events, setEvents] = useState(Array.isArray(propEvents) ? propEvents : []);
    const scrollRef = useRef(null);

    const loadFromStorage = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            setEvents(Array.isArray(list) ? list.slice(0, MAX_ITEMS) : []);
        } catch (_) {
            setEvents([]);
        }
    }, []);

    useEffect(() => {
        if (Array.isArray(propEvents) && propEvents.length > 0) {
            setEvents(propEvents);
            return;
        }
        loadFromStorage();
    }, [propEvents, loadFromStorage]);

    useEffect(() => {
        window.addEventListener("focus", loadFromStorage);
        return () => window.removeEventListener("focus", loadFromStorage);
    }, [loadFromStorage]);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
        }
    };

    if (!events || events.length === 0) return null;

    return (
        <section style={{ width: "100%", backgroundColor: "#fff", padding: "32px 0 24px" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{
                            fontSize: "28px",
                            fontWeight: 900,
                            color: "#111827",
                            margin: 0,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.1,
                            fontFamily: "var(--font-heading)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}>
                            <span style={{ display: "inline-flex", color: "#f84464" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                                </svg>
                            </span>
                            Recently <span style={{
                                background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}>Viewed</span>
                        </h2>
                        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0", fontWeight: 500 }}>
                            Here&apos;s a quick look at events you&apos;ve shown interest in.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={() => scroll("left")}
                            style={{
                                width: "36px", height: "36px", borderRadius: "50%",
                                border: "1px solid #e5e7eb", background: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                transition: "all 0.2s"
                            }}
                            aria-label="Scroll left"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll("right")}
                            style={{
                                width: "36px", height: "36px", borderRadius: "50%",
                                border: "1px solid #e5e7eb", background: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                transition: "all 0.2s"
                            }}
                            aria-label="Scroll right"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="recently-viewed-scroll"
                    style={{
                        display: "flex",
                        gap: "16px",
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        paddingBottom: "8px",
                    }}
                >
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            style={{ textDecoration: "none", color: "inherit", display: "block" }}
                        >
                            <div
                                style={{
                                    width: "231px",
                                    background: "#fff",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: "1px solid #e5e7eb",
                                    transition: "all 0.3s ease",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    flexShrink: 0,
                                    height: "100%",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                                }}
                            >
                                <div style={{
                                    width: "100%",
                                    aspectRatio: "2.3 / 3",
                                    overflow: "hidden",
                                    position: "relative",
                                    flexShrink: 0,
                                }}>
                                    <img
                                        src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop"}
                                        alt={event.title || "Event"}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                                    />
                                </div>

                                <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "8px" }}>
                                        <h3 style={{
                                            fontSize: "15px",
                                            fontWeight: 700,
                                            color: "#111827",
                                            margin: 0,
                                            lineHeight: "1.25",
                                            flex: 1,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            fontFamily: "var(--font-body)",
                                        }}>
                                            {event.title || "Event"}
                                        </h3>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {event.location || "—"}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>{event.date || "TBA"}</span>
                                        </div>
                                        <div style={{ position: "relative", display: "inline-block" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{event.type || "Paid"}</span>
                                            <span style={{
                                                position: "absolute",
                                                bottom: "-2px",
                                                left: 0,
                                                width: "100%",
                                                height: "2px",
                                                background: "#ef4444",
                                                borderRadius: "2px",
                                                display: "block",
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style>{`
                .recently-viewed-scroll::-webkit-scrollbar { display: none; }
            `}</style>
        </section>
    );
}
