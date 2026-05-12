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
            background: "#0f172a", // Application-themed dark slate
            borderRadius: "14px",
            padding: "8px 0",
            textAlign: "center",
            minWidth: "64px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.05)",
            position: "relative",
            overflow: "hidden"
        }}>
            <div style={{ 
                height: "32px", 
                position: "relative", 
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={value}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        style={{ 
                            fontSize: "24px", 
                            fontWeight: 950, 
                            color: "#ffffff", // High-contrast white
                            lineHeight: 1,
                            fontFamily: "var(--font-heading)",
                            textShadow: "0 2px 8px rgba(0,0,0,0.4)"
                        }}
                    >
                        {String(value).padStart(2, "0")}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div style={{ 
                fontSize: "9px", 
                fontWeight: 800, 
                color: "#f84464", // Units in brand pink
                textTransform: "uppercase", 
                letterSpacing: "0.12em", 
                marginTop: "2px",
                opacity: 1
            }}>
                {label}
            </div>
            
            {/* Pulsing Accent Glow */}
            <motion.div 
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #f84464 0%, #c026d3 100%)",
                    borderRadius: "2px"
                }}
            />
        </div>
    );
}

export default function ComingSoonEvents({ events = [] }) {
    const [idx, setIdx] = useState(0);
    const [direction, setDirection] = useState(0); // 1 for right, -1 for left
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        // Show any upcoming event regardless of featured/trending status
        return eventDate >= now;
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

                <div style={{ position: "relative", width: "100%" }}>
                    <AnimatePresence initial={false} custom={direction} mode="wait">
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
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: isMobile ? "column" : "row",
                                        borderRadius: "24px",
                                        overflow: "hidden",
                                        boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                                        border: "1px solid #f1f5f9",
                                        background: "#fff",
                                        minHeight: isMobile ? "auto" : "350px"
                                    }}
                                >
                                    {/* 16:9 Image Section - Reduced width for compact height */}
                                    <div style={{ 
                                        position: "relative", 
                                        width: isMobile ? "100%" : "50%", 
                                        aspectRatio: isMobile ? "16/10" : "16/9",
                                        overflow: "hidden", 
                                        flexShrink: 0 
                                    }}>
                                        <img 
                                            src={event.img} 
                                            alt={event.title} 
                                            style={{ 
                                                width: "100%", 
                                                height: "100%", 
                                                objectFit: "cover", 
                                                display: "block" 
                                            }} 
                                        />
                                        
                                        {/* Subtle Dark Overlay on Image for depth */}
                                        <div style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: "linear-gradient(to right, transparent 70%, rgba(255,255,255,1))",
                                            display: isMobile ? "none" : "block",
                                            zIndex: 1
                                        }} />
                                    </div>

                                    {/* Details Content Section */}
                                    <div style={{ 
                                        flex: 1,
                                        background: "#fff", 
                                        padding: isMobile ? "20px" : "30px", 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        justifyContent: "center",
                                        position: "relative",
                                        overflow: "hidden",
                                        zIndex: 2
                                    }}>
                                        {/* Dynamic Flipping Badge */}
                                        <div style={{ 
                                            position: "absolute", 
                                            top: isMobile ? "16px" : "24px", 
                                            right: isMobile ? "16px" : "24px", 
                                            zIndex: 10 
                                        }}>
                                            <DynamicBadge size={isMobile ? "small" : "medium"} />
                                        </div>

                                        <div style={{ position: "relative", zIndex: 1 }}>
                                            <h3 style={{ 
                                                fontSize: isMobile ? "20px" : "28px", 
                                                fontWeight: 950, 
                                                color: "#0f172a", 
                                                margin: "0 0 16px", 
                                                letterSpacing: "-0.04em", 
                                                lineHeight: 1.1,
                                                paddingRight: isMobile ? "70px" : "120px",
                                                fontFamily: "var(--font-heading)"
                                            }}>{event.title}</h3>
                                            
                                            <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
                                                <TimerBox value={timeLeft.days} label="Days" />
                                                <TimerBox value={timeLeft.hours} label="Hours" />
                                                <TimerBox value={timeLeft.mins} label="Mins" />
                                                <TimerBox value={timeLeft.secs} label="Secs" />
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <span style={{ fontSize: "16px" }}>📅</span>
                                                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: 800 }}>{event.date}</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <span style={{ fontSize: "16px" }}>📍</span>
                                                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: 800 }}>{event.location || event.city || "Venue TBA"}</span>
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
                                                    background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", 
                                                    color: "#fff", 
                                                    border: "none", 
                                                    borderRadius: "14px", 
                                                    padding: "14px 28px", 
                                                    fontWeight: 900, 
                                                    cursor: "pointer", 
                                                    boxShadow: "0 10px 20px rgba(244, 63, 94, 0.25)", 
                                                    fontSize: "14px",
                                                    width: isMobile ? "100%" : "auto",
                                                    minWidth: isMobile ? "100%" : "180px",
                                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em"
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                                                    e.currentTarget.style.boxShadow = "0 15px 30px rgba(244, 63, 94, 0.4)";
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                                                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(244, 63, 94, 0.3)";
                                                }}
                                            >
                                                BOOK NOW
                                            </button>
                                            
                                            <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", gap: "12px", marginTop: "32px" }}>
                                                <button onClick={prev} style={{ width: "44px", height: "44px", borderRadius: "14px", border: "1px solid #f1f5f9", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#f84464"; e.currentTarget.style.color = "#f84464"; }}>←</button>
                                                <button onClick={next} style={{ width: "44px", height: "44px", borderRadius: "14px", border: "1px solid #f1f5f9", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#f84464"; e.currentTarget.style.color = "#f84464"; }}>→</button>
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
