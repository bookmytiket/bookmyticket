"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import DynamicBadge from "./DynamicBadge";

function useCountdown(targetDate) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        if (!targetDate) return;
        const calc = () => {
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
            borderRadius: "6px",
            padding: "6px 8px",
            textAlign: "center",
            minWidth: "48px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                {String(value).padStart(2, "0")}
            </div>
            <div style={{ fontSize: "8px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: "2px" }}>
                {label}
            </div>
        </div>
    );
}

export default function ComingSoonEvents({ events = [] }) {
    const [idx, setIdx] = useState(0);
    const [direction, setDirection] = useState(0); // 1 for right, -1 for left
    const [isHovered, setIsHovered] = useState(false);
    
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

    const prev = () => {
        setDirection(-1);
        setIdx((i) => (i - 1 + COMING_SOON_EVENTS.length) % COMING_SOON_EVENTS.length);
    };
    const next = () => {
        setDirection(1);
        setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);
    };

    useEffect(() => {
        if (isHovered || COMING_SOON_EVENTS.length <= 1) return;
        const timer = setInterval(() => {
            setDirection(1);
            setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [isHovered, COMING_SOON_EVENTS.length]);

    if (COMING_SOON_EVENTS.length === 0) return null;

    const variants = {
        enter: (dir) => ({
            x: dir > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (dir) => ({
            x: dir < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <section
            style={{ width: "100%", backgroundColor: "#fff", padding: "24px 0", overflow: "hidden" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
                <div style={{ marginBottom: "16px" }}>
                    <h2 style={{
                        fontSize: "26px",
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
                </div>

                <div style={{ position: "relative", height: "380px" }}>
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={idx}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            style={{
                                position: "absolute",
                                width: "100%",
                                display: "grid",
                                gridTemplateColumns: "1.8fr 1fr",
                                borderRadius: "24px",
                                overflow: "hidden",
                                boxShadow: "0 15px 50px rgba(0,0,0,0.12)",
                                border: "1px solid #f1f5f9",
                                height: "380px",
                                background: "#fff",
                            }}
                        >
                            {/* Left Grid: Banner Image */}
                            <div style={{ position: "relative", overflow: "hidden" }}>
                                <img src={event.img} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>

                            {/* Right Grid: Timer & Content */}
                            <div style={{ 
                                background: "#fff", 
                                padding: "40px 30px", 
                                display: "flex", 
                                flexDirection: "column", 
                                justifyContent: "space-between",
                                position: "relative",
                                overflow: "hidden" 
                            }}>
                                {/* Dynamic Glitch-Mesh Background */}
                                <div style={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 0,
                                    overflow: "hidden"
                                }}>
                                    <img 
                                        src={event.img} 
                                        alt="" 
                                        style={{ 
                                            width: "140%", 
                                            height: "140%", 
                                            position: "absolute",
                                            top: "-20%",
                                            left: "-20%",
                                            objectFit: "cover",
                                            filter: "blur(80px) saturate(2)",
                                            opacity: 0.15,
                                            transform: "rotate(-5deg)"
                                        }} 
                                    />
                                </div>

                                {/* Dynamic Flipping Badge (Restored & Replaced static SPORTS) */}
                                <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 1 }}>
                                    <DynamicBadge size="medium" />
                                </div>

                                <div style={{ position: "relative", zIndex: 1 }}>
                                    <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#111827", margin: "0 0 20px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{event.title}</h3>
                                    
                                    <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
                                        <TimerBox value={timeLeft.days} label="Days" />
                                        <TimerBox value={timeLeft.hours} label="Hours" />
                                        <TimerBox value={timeLeft.mins} label="Mins" />
                                        <TimerBox value={timeLeft.secs} label="Secs" />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "30px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "16px", color: "#f84464" }}>📅</span>
                                            <span style={{ fontSize: "15px", color: "#475569", fontWeight: 700 }}>{event.date}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "16px", color: "#f84464" }}>📍</span>
                                            <span style={{ fontSize: "15px", color: "#475569", fontWeight: 700 }}>{event.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: "relative", zIndex: 1 }}>
                                    <button 
                                        onClick={() => {
                                            if (event.id) {
                                                window.location.href = `/events/detail?id=${event.id}`;
                                            }
                                        }}
                                        style={{ 
                                            background: "linear-gradient(135deg, #f844a4 0%, #a855f7 100%)", 
                                            color: "#fff", 
                                            border: "none", 
                                            borderRadius: "12px", 
                                            padding: "14px 32px", 
                                            fontWeight: 800, 
                                            cursor: "pointer", 
                                            boxShadow: "0 10px 20px rgba(248, 68, 164, 0.25)", 
                                            fontSize: "15px",
                                            width: "100%",
                                            transition: "all 0.2s",
                                            zIndex: 10,
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 12px 24px rgba(248, 68, 164, 0.35)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 10px 20px rgba(248, 68, 164, 0.25)";
                                        }}
                                    >
                                        BOOK NOW
                                    </button>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                                        <button onClick={prev} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                                        <button onClick={next} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
