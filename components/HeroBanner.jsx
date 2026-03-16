"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const FEATURES = [
    { num: "01", title: "Create Event Page", sub: "Do-it-yourself approach" },
    { num: "02", title: "Easy Sign-Up", sub: "Super quick activation" },
    { num: "03", title: "Simple Registration", sub: "No hassle, no paperwork" },
    { num: "04", title: "Quick Setup", sub: "No setup cost, zero fee" },
];

/* Each slide: { image (URL) or custom, alt }. Admin slides: { img, title, sub, alt, url } → map to { image, alt } */
const DEFAULT_BANNER_SLIDES = [];

const AUTO_PLAY_MS = 3500;

/* ── Small helper: renders the promo banner content ── */
function PromoSlide() {
    return (
        <div className="promo-slide">
            {/* glow blobs */}
            <div className="promo-glow-1" />
            <div className="promo-glow-2" />

            {/* Left: heading */}
            <div className="promo-heading-wrap">
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 800, letterSpacing: "3px", color: "#f84464", textTransform: "uppercase" }}>It's time to</p>
                <h2 className="promo-title">
                    ROCK<br />Events
                </h2>
                <p style={{ margin: "6px 0 0", fontStyle: "italic", fontSize: "16px", fontWeight: 700, color: "#e2a0ff" }}>Calendar</p>
            </div>

            {/* Divider */}
            <div className="promo-divider hide-mobile" style={{ width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

            {/* Middle: feature list */}
            <ul className="promo-features-list">
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
            <div className="promo-cta-wrap">
                <div className="promo-cta-btn" style={{
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

export default function HeroBanner({ slides: propSlides, showDetails = true, showPromo = true }) {
    const activeAds = useQuery(api.banners.getActiveBanners) || [];

    const slides = useMemo(() => {
        const adSlides = activeAds.map(ad => ({
            image: ad.imageUrl,
            alt: "Advertisement",
            url: ad.link,
            isAd: true
        }));

        const baseSlides = Array.isArray(propSlides) && propSlides.length > 0
            ? propSlides.map(s => ({ image: s.img || s.image, alt: s.alt || s.title || "Slide", url: s.url }))
            : DEFAULT_BANNER_SLIDES;

        const final = [...adSlides, ...baseSlides];
        if (showPromo) {
            final.unshift({ custom: true });
        }
        return final;
    }, [activeAds, propSlides, showPromo]);

    const [current, setCurrent] = useState(0);
    const [sliding, setSliding] = useState(false);
    const [dir, setDir] = useState(1);
    const total = slides.length;
    const timerRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const goTo = useCallback(
        (idx, direction = 1) => {
            if (sliding) return;
            setDir(direction);
            setSliding(true);
            setTimeout(() => {
                setCurrent((idx + total) % total);
                setTimeout(() => setSliding(false), 50);
            }, 400);
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

    if (total === 0) return null;

    const slide = slides[current];

    return (
        <div className="bms-banner-wrap">
            <div
                className="bms-banner-stage"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Main full-width active slide */}
                <div className={`bms-slide-main-full ${sliding ? (dir === 1 ? "slide-exit-left" : "slide-exit-right") : "slide-enter"}`}>
                    {slide.custom ? (
                        <PromoSlide />
                    ) : (
                        <div
                            onClick={() => slide.url && window.open(slide.url, "_blank")}
                            style={{ width: "100%", height: "100%", cursor: slide.url ? "pointer" : "default", position: "relative" }}
                        >
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)", zIndex: 1, pointerEvents: "none" }} />
                            <img src={slide.image} alt={slide.alt} draggable={false} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            {showDetails && (
                                <div style={{ position: "absolute", bottom: "10%", left: "40px", right: "40px", zIndex: 2, color: "#fff", pointerEvents: "none" }}>
                                    <h2 style={{ fontSize: "clamp(24px, 4vw, 48px)", fontWeight: 800, marginBottom: "8px", lineHeight: 1.1, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                                        {slide.title || "Live Events & Experiences"}
                                    </h2>
                                    <p style={{ fontSize: "clamp(14px, 2vw, 20px)", color: "rgba(255,255,255,0.9)", fontWeight: 500, margin: 0 }}>
                                        {slide.subtitle || slide.alt || "Book tickets for concerts, sports & more"}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
