"use client";
import React, { useRef, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { isVirtualEvent, isFreeEvent } from "@/app/utils/eventUtils";
import { getEventPath } from "@/app/utils/seo";

export default function FeaturedEvents({ events }) {
    const [isMobile, setIsMobile] = useState(false);
    const list = useMemo(() => (Array.isArray(events) ? events : []), [events]);
    const scrollRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
        }
    };

    if (list.length === 0) return null;

    return (
        <section style={{ width: "100%", backgroundColor: "#fff", padding: "32px 0 24px" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Section Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{
                            fontSize: "28px",
                            fontWeight: 900,
                            color: "#111827",
                            margin: 0,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.1,
                            fontFamily: "var(--font-heading)"
                        }}>
                            Featured <span style={{
                                background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}>Events</span>
                        </h2>
                        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0", fontWeight: 500 }}>
                            Explore top events near you
                        </p>
                    </div>

                    {/* Arrow buttons */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => scroll("left")}
                            style={{
                                width: "36px", height: "36px", borderRadius: "50%",
                                border: "1px solid #e5e7eb", background: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                transition: "all 0.2s"
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            style={{
                                width: "36px", height: "36px", borderRadius: "50%",
                                border: "1px solid #e5e7eb", background: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                transition: "all 0.2s"
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Cards Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "12px",
                        marginTop: "10px"
                    }}
                >
                    {list.length > 0 ? list.map((event) => (
                        <Link
                            key={event.id}
                            href={getEventPath(event)}
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: "1px solid #e5e7eb",
                                    transition: "all 0.3s ease",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    height: '100%'
                                }}
                            >                                <div style={{ position: "relative", width: "100%", aspectRatio: "2.3/3", overflow: "hidden" }}>
                                    <img
                                        src={event.img}
                                        alt={event.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>

                                <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: "6px" }}>
                                        <h3 style={{
                                            fontSize: isMobile ? "15px" : "14px",
                                            fontWeight: 700,
                                            color: "#111827",
                                            margin: 0,
                                            lineHeight: "1.2",
                                            flex: 1,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden"
                                        }}>
                                            {event.title}
                                        </h3>
                                        {event.verified && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0, marginTop: "2px" }}>
                                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.5l-4.2-4.2 1.4-1.4 2.8 2.8 6.1-6.1 1.4 1.4-7.5 7.5z" />
                                            </svg>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {event.location || event.city || "TBA"}
                                        </span>
                                    </div>
                                    
                                    {isVirtualEvent(event) && (
                                        <div style={{ 
                                            marginBottom: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: 'linear-gradient(135deg, #f844a4 0%, #a855f7 100%)',
                                            color: '#fff',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: 900,
                                            width: 'fit-content',
                                            boxShadow: '0 2px 6px rgba(248, 68, 164, 0.3)'
                                        }}>
                                            <Video size={10} strokeWidth={3} /> JOIN NOW
                                        </div>
                                    )}

                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
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
                            </div>
                        </Link>
                    )) : (
                        <div style={{ padding: "40px", textAlign: "center", width: "100%", color: "#9ca3af" }}>
                            No featured events available right now.
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                section:has(.featured-scroll)::-webkit-scrollbar { display: none; }
            `}</style>
        </section>
    );
}
