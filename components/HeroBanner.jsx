"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const FEATURES = [
    { num: "01", title: "Create Event Page", sub: "Do-it-yourself approach" },
    { num: "02", title: "Easy Sign-Up", sub: "Super quick activation" },
    { num: "03", title: "Simple Registration", sub: "No hassle, no paperwork" },
    { num: "04", title: "Quick Setup", sub: "No setup cost, zero fee" },
];

/* Each slide can have either `image` (URL string) or `custom` (JSX / render fn) */
const BANNER_SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=1400&h=300&fit=crop&auto=format",
        alt: "Ani Vs U1 Singalong Event",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1400&h=300&fit=crop&auto=format",
        alt: "Rapport 26 Unplugged Concert",
    },
    {
        /* ── Promo / sign-up banner slide ── */
        id: 3,
        custom: true,
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1400&h=300&fit=crop&auto=format",
        alt: "Tech Innovation Panel 2026",
    },
];

const AUTO_PLAY_MS = 3500;

/* ── Small helper: renders the promo banner content ── */
function PromoSlide() {
    return (
        <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(120deg,#0b0727 0%,#1a0640 40%,#2d0a6b 70%,#0b0727 100%)",
            display: "flex", alignItems: "center",
            padding: "0 5%",
            gap: "48px",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
        }}>
            {/* glow blobs */}
            <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,#ff2d7840 0%,transparent 70%)", top: "-60px", left: "-60px", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle,#7c3aed30 0%,transparent 70%)", bottom: "-80px", right: "10%", pointerEvents: "none" }} />

            {/* Left: heading */}
            <div style={{ flex: "0 0 auto", minWidth: "200px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 800, letterSpacing: "3px", color: "#f84464", textTransform: "uppercase" }}>It's time to</p>
                <h2 style={{
                    margin: 0, lineHeight: 0.9, fontWeight: 900, textTransform: "uppercase",
                    fontSize: "clamp(36px,5vw,60px)", letterSpacing: "-2px",
                    background: "linear-gradient(90deg,#fff 50%,#f84464 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    ROCK<br />Events
                </h2>
                <p style={{ margin: "6px 0 0", fontStyle: "italic", fontSize: "16px", fontWeight: 700, color: "#e2a0ff" }}>Calendar</p>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

            {/* Middle: feature list */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                {FEATURES.map(f => (
                    <li key={f.num} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontWeight: 900, fontSize: "11px", color: "#f84464", minWidth: "22px" }}>{f.num}</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "11px", color: "#e2d9f3", letterSpacing: "1px", textTransform: "uppercase", lineHeight: 1 }}>{f.title}</p>
                            <p style={{ margin: 0, fontSize: "10px", color: "#9d8ec2" }}>{f.sub}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Right: CTA */}
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "linear-gradient(90deg,#f84464,#c026d3)",
                    padding: "10px 22px", borderRadius: "50px",
                    fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "#fff",
                    whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(248,68,100,0.4)"
                }}>
                    🎟 All Events Start Here
                </div>
            </div>
        </div>
    );
}

/* ── Helper: thumbnail preview for peek slides ── */
function SlideThumbnail({ slide }) {
    if (slide.custom) {
        return (
            <div style={{
                width: "100%", height: "100%",
                background: "linear-gradient(120deg,#0b0727,#2d0a6b)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <span style={{ color: "#e2a0ff", fontWeight: 900, fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase" }}>🎟 Events</span>
            </div>
        );
    }
    return <img src={slide.image} alt={slide.alt} draggable={false} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}

export default function HeroBanner() {
    const [current, setCurrent] = useState(0);
    const [sliding, setSliding] = useState(false);
    const [dir, setDir] = useState(1);
    const total = BANNER_SLIDES.length;
    const timerRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const goTo = useCallback(
        (idx, direction = 1) => {
            if (sliding) return;
            setDir(direction);
            setSliding(true);
            setTimeout(() => {
                setCurrent((idx + total) % total);
                setSliding(false);
            }, 420);
        },
        [sliding, total]
    );

    const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
    const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

    useEffect(() => {
        if (isHovered) { clearInterval(timerRef.current); return; }
        timerRef.current = setInterval(next, AUTO_PLAY_MS);
        return () => clearInterval(timerRef.current);
    }, [next, isHovered]);

    const prevIdx = (current - 1 + total) % total;
    const nextIdx = (current + 1) % total;
    const slide = BANNER_SLIDES[current];

    return (
        <div className="bms-banner-wrap">
            <div
                className="bms-banner-stage"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Left peek slide */}
                <div className="bms-slide-peek bms-peek-left" onClick={prev}>
                    <SlideThumbnail slide={BANNER_SLIDES[prevIdx]} />
                    <div className="bms-peek-dim" />
                </div>

                {/* Main active slide */}
                <div className={`bms-slide-main ${sliding ? (dir === 1 ? "slide-exit-left" : "slide-exit-right") : "slide-enter"}`}>
                    {slide.custom ? (
                        <PromoSlide />
                    ) : (
                        <img src={slide.image} alt={slide.alt} draggable={false} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}


                </div>

                {/* Right peek slide */}
                <div className="bms-slide-peek bms-peek-right" onClick={next}>
                    <SlideThumbnail slide={BANNER_SLIDES[nextIdx]} />
                    <div className="bms-peek-dim" />
                </div>


            </div>
        </div>
    );
}
