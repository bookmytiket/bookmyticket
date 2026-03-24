"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

function useCountdown(targetDate) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        if (!targetDate) return;
        const calc = () => {
            // Normalize "YYYY-MM-DD HH:mm" to "YYYY-MM-DDTHH:mm" for cross-browser consistency
            const normalized = String(targetDate).includes(' ') && !String(targetDate).includes('T') 
                ? String(targetDate).replace(' ', 'T') 
                : targetDate;
            const diff = new Date(normalized) - new Date();
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

export default function ComingSoonEvents({ events = [] }) {
    const [idx, setIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Filter events that have a targetDate or are marked as featured/special
    const now = new Date();
    const parseEventDate = (dateStr, timeStr) => {
        if (!dateStr) return null;
        try {
            let dt = String(dateStr).trim();
            if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
                const parts = dt.split(/[-/]/);
                dt = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            
            if (dt.includes('T') || dt.includes(' ')) {
                const d = new Date(dt.replace(' ', 'T'));
                return isNaN(d.getTime()) ? null : d;
            }

            let normalizedTime = "23:59";
            if (timeStr) {
                let t = String(timeStr).trim().toUpperCase();
                const ampmMatch = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
                if (ampmMatch) {
                    let [_, hours, mins = "00", ampm] = ampmMatch;
                    hours = parseInt(hours);
                    if (ampm === "PM" && hours < 12) hours += 12;
                    if (ampm === "AM" && hours === 12) hours = 0;
                    normalizedTime = `${String(hours).padStart(2, '0')}:${mins}`;
                } else {
                    normalizedTime = t.includes(':') ? t : `${t}:00`;
                }
            }
            
            const eventDate = new Date(`${dt}T${normalizedTime}`);
            return isNaN(eventDate.getTime()) ? null : eventDate;
        } catch (_) { return null; }
    };

    const COMING_SOON_EVENTS = (events || []).filter(e => {
        const eventDate = parseEventDate(e.date || e.rawDate, e.time || e.rawTime);
        if (!eventDate) return false;
        return (e.featured || e.trending) && eventDate >= now;
    }).slice(0, 5);

    const event = COMING_SOON_EVENTS[idx] || {};
    const timeLeft = useCountdown(event.date);

    const prev = () => setIdx((i) => (i - 1 + COMING_SOON_EVENTS.length) % COMING_SOON_EVENTS.length);
    const next = () => setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);

    useEffect(() => {
        if (isHovered || COMING_SOON_EVENTS.length <= 1) return;
        const timer = setInterval(() => {
            setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isHovered, COMING_SOON_EVENTS.length]);

    if (COMING_SOON_EVENTS.length === 0) {
        return null;
    }

    return (
        <section
            style={{ width: "100%", backgroundColor: "#fff", padding: "36px 0 32px" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
                <div style={{ marginBottom: "20px" }}>
                    <h2 style={{
                        fontSize: "28px",
                        fontWeight: 900,
                        color: "#111827",
                        margin: 0,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.1,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontFamily: "var(--font-heading)"
                    }}>
                        Coming <span style={{
                            background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'inline-block'
                        }}>Soon</span> 🎯
                    </h2>
                    <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0", fontWeight: 500 }}>
                        Handpicked experiences and standout events you won't want to miss!
                    </p>
                </div>

                <div style={{
                    display: "flex",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    minHeight: "260px",
                    background: "#fff",
                }}>
                    <div style={{ flex: "0 0 60%", position: "relative", overflow: "hidden" }}>
                        <img src={event.img} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", top: "16px", right: "16px", background: "#fff", color: "#111", fontSize: "10px", fontWeight: 800, padding: "5px 12px", borderRadius: "6px" }}>
                            {event.category || "Featured"}
                        </div>
                    </div>

                    <div style={{ flex: "0 0 40%", background: "#fff5f5", padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#111827", margin: "0 0 14px" }}>{event.title}</h3>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                                <TimerBox value={timeLeft.days} label="Days" />
                                <TimerBox value={timeLeft.hours} label="Hours" />
                                <TimerBox value={timeLeft.mins} label="Mins" />
                                <TimerBox value={timeLeft.secs} label="Secs" />
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                                <span style={{ fontSize: "12px", color: "#374151" }}>{event.date}</span>
                                <span style={{ fontSize: "12px", color: "#374151" }}>{event.location}</span>
                            </div>
                                <Link href={`/events/detail?id=${event.id}`}>
                                    <button style={{ background: "linear-gradient(135deg, #f844a4 0%, #a855f7 100%)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 28px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(248, 68, 164, 0.2)" }}>
                                        Book Now
                                    </button>
                                </Link>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button onClick={prev} style={{ padding: "8px", borderRadius: "50%", border: "1px solid #e5e7eb" }}>←</button>
                            <button onClick={next} style={{ padding: "8px", borderRadius: "50%", border: "1px solid #e5e7eb" }}>→</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
