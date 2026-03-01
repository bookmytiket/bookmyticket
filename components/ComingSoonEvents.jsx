"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const COMING_SOON_EVENTS = [
    {
        id: 1,
        title: "Top Model Of Tamil Nadu 2026",
        date: "Apr 5, 2026",
        time: "01:00 PM",
        venue: "Clusters Media College",
        targetDate: "2026-04-05T13:00:00",
        img: "https://images.unsplash.com/photo-1529139574466-a303027614b2?w=900&h=420&fit=crop",
        tag: "BROCHURE",
    },
    {
        id: 2,
        title: "Harmony Summer Music Festival",
        date: "May 10, 2026",
        time: "06:00 PM",
        venue: "CODISSIA Trade Fair Complex",
        targetDate: "2026-05-10T18:00:00",
        img: "https://images.unsplash.com/photo-1459749411177-042180ce673c?w=900&h=420&fit=crop",
        tag: "LIMITED SEATS",
    },
    {
        id: 3,
        title: "Startup Pitch Battle 2026",
        date: "Jun 15, 2026",
        time: "10:00 AM",
        venue: "IIT Madras Research Park",
        targetDate: "2026-06-15T10:00:00",
        img: "https://images.unsplash.com/photo-1542626991-cbc4e32524cc?w=900&h=420&fit=crop",
        tag: "REGISTER NOW",
    },
];

function useCountdown(targetDate) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        const calc = () => {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                mins: Math.floor((diff % 3600000) / 60000),
                secs: Math.floor((diff % 60000) / 1000),
            });
        };
        calc();
        const t = setInterval(calc, 1000);
        return () => clearInterval(t);
    }, [targetDate]);

    return timeLeft;
}

function TimerBox({ value, label }) {
    return (
        <div style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "10px 14px",
            textAlign: "center",
            minWidth: "62px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                {String(value).padStart(2, "0")}
            </div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>
                {label}
            </div>
        </div>
    );
}

export default function ComingSoonEvents() {
    const [idx, setIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const event = COMING_SOON_EVENTS[idx];
    const timeLeft = useCountdown(event.targetDate);

    const prev = () => setIdx((i) => (i - 1 + COMING_SOON_EVENTS.length) % COMING_SOON_EVENTS.length);
    const next = () => setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);

    // Auto-scroll every 5 seconds, pause on hover
    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);
        }, 2000);
        return () => clearInterval(timer);
    }, [isHovered]);

    return (
        <section
            style={{ width: "100%", backgroundColor: "#fff", padding: "36px 0 32px" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Section Header */}
                <div style={{ marginBottom: "20px" }}>
                    <h2 style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#111827",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontFamily: "var(--font-heading)",
                    }}>
                        Coming Soon Events
                        <span style={{ fontSize: "20px" }}>🎯</span>
                    </h2>
                    <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0", fontWeight: 500 }}>
                        Handpicked experiences and standout events you won't want to miss!
                    </p>
                </div>

                {/* Main Card */}
                <div style={{
                    display: "flex",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    minHeight: "260px",
                    background: "#fff",
                }}>
                    {/* Left — Event Image */}
                    <div style={{ flex: "0 0 60%", position: "relative", overflow: "hidden" }}>
                        <img
                            src={event.img}
                            alt={event.title}
                            key={event.id}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                transition: "opacity 0.4s ease",
                            }}
                        />
                        {/* Tag badge */}
                        <div style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            background: "#fff",
                            color: "#111",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "5px 12px",
                            borderRadius: "6px",
                            letterSpacing: "0.08em",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}>
                            {event.tag}
                        </div>
                        {/* Ticket9 logo watermark style */}
                        <div style={{
                            position: "absolute",
                            bottom: "12px",
                            right: "14px",
                            background: "rgba(0,0,0,0.55)",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "4px",
                            letterSpacing: "0.04em",
                        }}>
                            bookmyticket
                        </div>
                    </div>

                    {/* Right — Details Panel */}
                    <div style={{
                        flex: "0 0 40%",
                        background: "#fff5f5",
                        padding: "28px 28px 24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                    }}>
                        {/* Scroll-up button (top right) */}
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            style={{
                                position: "absolute",
                                top: "16px",
                                right: "16px",
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                background: "#f97316",
                                border: "none",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 3px 10px rgba(249,115,22,0.4)",
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15" />
                            </svg>
                        </button>

                        {/* Event Title */}
                        <div>
                            <h3 style={{
                                fontSize: "20px",
                                fontWeight: 800,
                                color: "#111827",
                                margin: "0 0 14px",
                                lineHeight: 1.25,
                                paddingRight: "36px",
                                fontFamily: "var(--font-heading)",
                            }}>
                                {event.title}
                            </h3>

                            {/* Event Starts In label */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>Event Starts In</span>
                            </div>

                            {/* Countdown Timer */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                                <TimerBox value={timeLeft.days} label="Days" />
                                <TimerBox value={timeLeft.hours} label="Hours" />
                                <TimerBox value={timeLeft.mins} label="Mins" />
                                <TimerBox value={timeLeft.secs} label="Secs" />
                            </div>

                            {/* Meta info — Date, Time, Venue */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#fff", borderRadius: "8px", padding: "6px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{event.date}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#fff", borderRadius: "8px", padding: "6px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{event.time}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#fff", borderRadius: "8px", padding: "6px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.venue}</span>
                                </div>
                            </div>


                            {/* Book Now Button */}
                            <Link href={`/events/${event.id}`}>
                                <button style={{
                                    background: "#f97316",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "12px 28px",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
                                    transition: "all 0.2s",
                                    letterSpacing: "0.02em",
                                    width: "fit-content"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#ea6c0a"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.transform = "translateY(0)"; }}
                                >
                                    Book Now
                                </button>
                            </Link>
                        </div>

                        {/* Prev / Next arrows */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                            <button
                                onClick={prev}
                                style={{
                                    width: "34px", height: "34px", borderRadius: "50%",
                                    border: "1px solid #e5e7eb", background: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "#f97316"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <button
                                onClick={next}
                                style={{
                                    width: "34px", height: "34px", borderRadius: "50%",
                                    border: "1px solid #e5e7eb", background: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "#f97316"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dot indicators */}
                <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "14px" }}>
                    {COMING_SOON_EVENTS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIdx(i)}
                            style={{
                                width: i === idx ? "20px" : "8px",
                                height: "8px",
                                borderRadius: "4px",
                                background: i === idx ? "#f97316" : "#e5e7eb",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                padding: 0,
                            }}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
}
