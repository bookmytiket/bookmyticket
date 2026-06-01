"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { resolveBannerRedirect } from "@/lib/bannerHelper";
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES = [
    { num: "01", title: "Create Event Page", sub: "Do-it-yourself approach" },
    { num: "02", title: "Easy Sign-Up", sub: "Super quick activation" },
    { num: "03", title: "Simple Registration", sub: "No hassle, no paperwork" },
    { num: "04", title: "Quick Setup", sub: "No setup cost, zero fee" },
];

const DEFAULT_BANNER_SLIDES = [];
const AUTO_PLAY_MS = 4000;

function PromoSlide({ isMobile }) {
    return (
        <div className="promo-slide" style={{ padding: isMobile ? "20px" : "40px", minHeight: "200px" }}>
            <div className="promo-glow-1" />
            <div className="promo-glow-2" />
            <div className="promo-heading-wrap" style={{ flex: isMobile ? "1" : "unset" }}>
                <p style={{ margin: "0 0 4px", fontSize: isMobile ? "13px" : "11px", fontWeight: 800, letterSpacing: "3px", color: "#f84464", textTransform: "uppercase" }}>It's time to</p>
                <h2 className="promo-title" style={{ fontSize: isMobile ? "36px" : "clamp(32px, 5vw, 64px)" }}>ROCK<br />Events</h2>
                <p style={{ margin: "6px 0 0", fontStyle: "italic", fontSize: isMobile ? "16px" : "16px", fontWeight: 700, color: "#e2a0ff" }}>Calendar</p>
            </div>
            <div className="promo-divider hide-mobile" style={{ width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
            <ul className="promo-features-list" style={{ gap: isMobile ? "8px" : "12px" }}>
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
            <div className="promo-cta-wrap" style={{ marginTop: isMobile ? "12px" : "0" }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "linear-gradient(90deg,#f84464,#c026d3)",
                    padding: "10px 22px", borderRadius: "50px",
                    fontSize: "11px", fontWeight: 800, letterSpacing: "2px",
                    textTransform: "uppercase", color: "#fff", whiteSpace: "nowrap",
                    boxShadow: "0 4px 20px rgba(248,68,100,0.4)"
                }}>
                    🎟 All Events Start Here
                </div>
            </div>
        </div>
    );
}

export default function HeroBanner({ slides: propSlides, showDetails = true, showPromo = true }) {
    const { data: activeAdsRaw } = useSupabaseQuery('branding_banners', (q) => q.eq('status', 'Active'), []);
    const activeAds = activeAdsRaw || [];
    const router = useRouter();

    const slides = useMemo(() => {
        const adSlides = activeAds.map(ad => ({
            image: ad.imageUrl || ad.img || ad.image_url,
            alt: ad.title || "Advertisement",
            url: ad.redirectUrl || ad.link || ad.redirect_url,
            redirect_type: ad.redirect_type,
            redirect_id: ad.redirect_id,
            isAd: true
        }));

        const baseSlides = Array.isArray(propSlides) && propSlides.length > 0
            ? propSlides.map(s => ({
                image: s.img || s.image || s.image_url || '',
                alt: s.alt || s.title || "Slide",
                url: s.url || s.link || '',
                redirect_type: s.redirect_type,
                redirect_id: s.redirect_id,
            }))
            : DEFAULT_BANNER_SLIDES;

        const final = [...adSlides, ...baseSlides];
        if (showPromo) final.unshift({ custom: true });
        return final;
    }, [activeAds, propSlides, showPromo]);

    const [current, setCurrent] = useState(0);
    const [sliding, setSliding] = useState(false);
    const [dir, setDir] = useState(1);
    const total = slides.length;
    const timerRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (total > 0 && current >= total) setCurrent(0);
    }, [total, current]);

    const goTo = useCallback((idx, direction = 1) => {
        if (sliding || total <= 1) return;
        setDir(direction);
        setSliding(true);
        setCurrent(((idx % total) + total) % total);
        setTimeout(() => setSliding(false), 500);
    }, [sliding, total]);

    const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
    const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

    useEffect(() => {
        if (total <= 1) return;
        if (isHovered) { clearInterval(timerRef.current); return; }
        timerRef.current = setInterval(next, AUTO_PLAY_MS);
        return () => clearInterval(timerRef.current);
    }, [next, isHovered, total]);

    const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        if (Math.abs(dx) > 40 && Math.abs(dx) > dy) { dx < 0 ? next() : prev(); }
        touchStartX.current = null;
    };

    if (total === 0) return null;
    const slide = slides[current] || slides[0];

    return (
        <div className="bms-banner-wrap">
            {/* Outer stage: position:relative so arrows/dots can be absolute inside */}
            <div
                className="bms-banner-stage"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ position: 'relative', overflow: 'hidden', background: '#fff' }}
            >
                {/* Slide content fills the aspect-ratio stage absolutely */}
                <AnimatePresence initial={false} custom={dir} mode="wait">
                    <motion.div
                        key={current}
                        custom={dir}
                        variants={{
                            enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
                            center: { x: 0, opacity: 1 },
                            exit: (d) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "tween", duration: 0.4, ease: "easeInOut" }, opacity: { duration: 0.2 } }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    >
                        {!slide ? null : slide.custom ? (
                            <PromoSlide isMobile={isMobile} />
                        ) : (
                            <div
                                onClick={() => {
                                    const url = resolveBannerRedirect(slide.redirect_type, slide.redirect_id, slide.url);
                                    if (!url) return;
                                    url.startsWith('http') ? window.open(url, "_blank") : router.push(url);
                                }}
                                style={{ width: "100%", height: "100%", lineHeight: 0, cursor: (slide.url || slide.redirect_type) ? "pointer" : "default" }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={slide.image}
                                    alt={slide.alt || "Banner"}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        objectPosition: "center center",
                                        display: "block"
                                    }}
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Arrows — absolute positioned over the image */}
                {total > 1 && (
                    <>
                        <button className="bms-arrow bms-arrow-left" onClick={prev} aria-label="Previous slide">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button className="bms-arrow bms-arrow-right" onClick={next} aria-label="Next slide">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots — absolute at bottom */}
                {total > 1 && (
                    <div className="bms-dots" style={{ zIndex: 10 }}>
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                className={`bms-dot${i === current ? ' active' : ''}`}
                                onClick={() => goTo(i, i > current ? 1 : -1)}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
