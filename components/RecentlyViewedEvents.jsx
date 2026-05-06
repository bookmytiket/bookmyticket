"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { isFreeEvent } from "@/app/utils/eventUtils";

const STORAGE_KEY = "recently_viewed_events";
const MAX_ITEMS = 12;

function parseEventDate(dateStr, timeStr) {
    if (!dateStr) return null;
    try {
        let dt = String(dateStr).trim();
        if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
            const p = dt.split(/[-/]/);
            dt = `${p[2]}-${p[1]}-${p[0]}`;
        }
        const nd = dt.includes(" ") && !dt.includes("T") ? dt.replace(" ", "T") : dt;
        let nt = "23:59";
        if (timeStr) {
            const t = String(timeStr).trim().toUpperCase();
            const m = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
            if (m) {
                let h = parseInt(m[1]), mn = m[2] || "00", ap = m[3];
                if (ap === "PM" && h < 12) h += 12;
                if (ap === "AM" && h === 12) h = 0;
                nt = `${String(h).padStart(2, "0")}:${mn}`;
            } else nt = t.includes(":") ? t : `${t}:00`;
        }
        const d = new Date(`${nd}T${nt}`);
        return isNaN(d.getTime()) ? null : d;
    } catch (_) { return null; }
}

export default function RecentlyViewedEvents({ events: propEvents, liveEvents }) {
    const [events, setEvents] = useState(Array.isArray(propEvents) ? propEvents : []);
    const scrollRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [liveLoaded, setLiveLoaded] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const isExpiredEvent = (ev) => {
        const d = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time);
        return d ? d < new Date() : false;
    };

    const loadFromStorage = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            // Filter out expired events immediately on load
            const activeOnly = (Array.isArray(list) ? list : []).filter(ev => !isExpiredEvent(ev));
            setEvents(activeOnly.slice(0, MAX_ITEMS));
        } catch (_) { setEvents([]); }
    }, []);

    useEffect(() => {
        if (Array.isArray(propEvents) && propEvents.length > 0) {
            const activeOnly = propEvents.filter(ev => !isExpiredEvent(ev));
            setEvents(activeOnly);
            return;
        }
        loadFromStorage();
    }, [propEvents, loadFromStorage]);

    /* ── Sync: update fields AND remove deleted events ── */
    useEffect(() => {
        if (!liveEvents || liveEvents.length === 0) return;
        setLiveLoaded(true);

        setEvents(prev => {
            let changed = false;
            const synced = prev.map(ev => {
                const isStaticEvent = String(ev.id || "").startsWith("static-");
                if (isStaticEvent) return ev;

                const live = liveEvents.find(l => String(l._id || l.id) === String(ev.id));

                if (!live) {
                    // Event not in live DB → removed
                    changed = true;
                    return null;
                }

                const nl = { ...live, id: live._id || live.id };
                if (nl.type !== ev.type || nl.price !== ev.price) {
                    changed = true;
                    return { ...ev, ...nl };
                }
                return ev;
            }).filter(ev => ev !== null && !isExpiredEvent(ev)); // Filter out nulls and newly expired

            if (synced.length !== prev.length) changed = true;
            return changed ? synced : prev;
        });
    }, [liveEvents]);

    useEffect(() => {
        window.addEventListener("focus", loadFromStorage);
        return () => window.removeEventListener("focus", loadFromStorage);
    }, [loadFromStorage]);

    const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });

    if (!events || events.length === 0) return null;

    return (
        <section style={{ width: "100%", backgroundColor: "#fff", padding: "32px 0 24px" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#111827", margin: 0, letterSpacing: "-0.04em", lineHeight: 1.1, fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ display: "inline-flex", color: "#f84464" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                            </span>
                            Recently{" "}
                            <span style={{ background: "linear-gradient(135deg,#f84464,#c026d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>Viewed</span>
                        </h2>
                        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0", fontWeight: 500 }}>
                            Here&apos;s a quick look at events you&apos;ve shown interest in.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {["left", "right"].map(dir => (
                            <button key={dir} type="button" onClick={() => scroll(dir)} aria-label={`Scroll ${dir}`}
                                style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div ref={scrollRef} className="recently-viewed-scroll"
                    style={{ display: "flex", gap: "16px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: "8px" }}>
                    {events.map((event) => {
                        return (
                            <Link
                                key={event.id}
                                href={`/events/detail?id=${event.id}`}
                                style={{ textDecoration: "none", color: "inherit", display: "block", flexShrink: 0 }}
                            >
                                <div
                                    style={{
                                        width: isMobile ? "220px" : "280px",
                                        background: "#fff",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        border: "1px solid #e5e7eb",
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                                        <img
                                            src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop"}
                                            alt={event.title || "Event"}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                        />
                                    </div>

                                    {/* Body */}
                                    <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1 }}>
                                        <h3 style={{
                                            fontSize: "14px", fontWeight: 700,
                                            color: "#111827",
                                            margin: "0 0 8px", lineHeight: "1.25",
                                            display: "-webkit-box", WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical", overflow: "hidden",
                                            fontFamily: "var(--font-body)",
                                        }}>
                                            {event.title || "Event"}
                                        </h3>

                                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.location || "—"}</span>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>{event.date || "TBA"}</span>
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
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
            <style>{`.recently-viewed-scroll::-webkit-scrollbar{display:none}`}</style>
        </section>
    );
}
