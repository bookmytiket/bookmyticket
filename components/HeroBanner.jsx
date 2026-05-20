"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { resolveBannerRedirect } from "@/lib/bannerHelper";
import { motion, AnimatePresence } from 'framer-motion';

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
function PromoSlide({ isMobile }) {
    return (
        <div className="promo-slide" style={{ padding: isMobile ? "20px" : "40px" }}>
            {/* glow blobs */}
            <div className="promo-glow-1" />
            <div className="promo-glow-2" />

            {/* Left: heading */}
            <div className="promo-heading-wrap" style={{ flex: isMobile ? "1" : "unset" }}>
                <p style={{ margin: "0 0 4px", fontSize: isMobile ? "13px" : "11px", fontWeight: 800, letterSpacing: "3px", color: "#f84464", textTransform: "uppercase" }}>It's time to</p>
                <h2 className="promo-title" style={{ fontSize: isMobile ? "42px" : "clamp(32px, 5vw, 64px)" }}>
                    ROCK<br />Events
                </h2>
                <p style={{ margin: "6px 0 0", fontStyle: "italic", fontSize: isMobile ? "18px" : "16px", fontWeight: 700, color: "#e2a0ff" }}>Calendar</p>
            </div>

            {/* Divider */}
            <div className="promo-divider hide-mobile" style={{ width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

            {/* Middle: feature list */}
            <ul className="promo-features-list" style={{ gap: isMobile ? "8px" : "12px" }}>
                {FEATURES.map(f => (
                    <li key={f.num} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontWeight: 900, fontSize: isMobile ? "13px" : "11px", color: "#f84464", minWidth: "22px" }}>{f.num}</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: isMobile ? "12px" : "11px", color: "#e2d9f3", letterSpacing: "1px", textTransform: "uppercase", lineHeight: 1 }}>{f.title}</p>
                            <p style={{ margin: 0, fontSize: isMobile ? "11px" : "10px", color: "#9d8ec2" }}>{f.sub}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Right: CTA */}
            <div className="promo-cta-wrap" style={{ marginTop: isMobile ? "15px" : "0" }}>
                <div className="promo-cta-btn" style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "linear-gradient(90deg,#f84464,#c026d3)",
                    padding: isMobile ? "12px 28px" : "10px 22px", borderRadius: "50px",
                    fontSize: isMobile ? "12px" : "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "#fff",
                    whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(248,68,100,0.4)"
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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const goTo = useCallback(
        (idx, direction = 1) => {
            if (sliding) return;
            setDir(direction);
            setSliding(true);
            setCurrent((idx + total) % total);
            setTimeout(() => setSliding(false), 500);
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
        <div className="bms-banner-wrap" style={{ perspective: '1500px' }}>
            <div
                className="bms-banner-stage"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ position: 'relative', overflow: 'hidden' }}
            >
                <AnimatePresence initial={false} custom={dir}>
                    <motion.div
                        key={current}
                        custom={dir}
                        variants={{
                            enter: (direction) => ({
                                x: direction > 0 ? '100%' : '-100%',
                                opacity: 0,
                                rotateY: direction > 0 ? 45 : -45,
                                scale: 0.8,
                                zIndex: 0
                            }),
                            center: {
                                x: 0,
                                opacity: 1,
                                rotateY: 0,
                                scale: 1,
                                zIndex: 1
                            },
                            exit: (direction) => ({
                                x: direction < 0 ? '100%' : '-100%',
                                opacity: 0,
                                rotateY: direction < 0 ? 45 : -45,
                                scale: 0.8,
                                zIndex: 0
                            })
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.4 },
                            rotateY: { type: "spring", stiffness: 200, damping: 20 },
                            scale: { duration: 0.4 }
                        }}
                        style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, transformStyle: 'preserve-3d' }}
                    >
                    {slide.custom ? (
                        <PromoSlide isMobile={isMobile} />
                    ) : (
                        <div
                            onClick={() => {
                                const resolvedUrl = resolveBannerRedirect(
                                    slide.redirect_type,
                                    slide.redirect_id,
                                    slide.url
                                );
                                
                                if (resolvedUrl) {
                                    if (resolvedUrl.startsWith('http')) {
                                        window.open(resolvedUrl, "_blank");
                                    } else {
                                        router.push(resolvedUrl);
                                    }
                                }
                            }}
                            style={{ width: "100%", height: "100%", cursor: (slide.url || (slide.redirect_type && slide.redirect_id)) ? "pointer" : "default", position: "relative" }}
                        >
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)", zIndex: 1, pointerEvents: "none" }} />
                            <Image 
                                src={slide.image} 
                                alt={slide.alt} 
                                fill
                                priority={current === 0}
                                quality={75}
                                style={{ objectFit: "cover" }}
                            />
                            {showDetails && (
                                <div style={{ position: "absolute", bottom: "10%", left: "5%", right: "5%", zIndex: 2, pointerEvents: "none" }}>
                                    <h2 style={{ fontSize: isMobile ? "28px" : "clamp(24px, 4vw, 48px)", fontWeight: 800, marginBottom: "8px", lineHeight: 1.1, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
                                        {slide.title || "Live Events & Experiences"}
                                    </h2>
                                    <p style={{ fontSize: isMobile ? "15px" : "clamp(14px, 2vw, 20px)", color: "rgba(255,255,255,0.95)", fontWeight: 600, marginBottom: "20px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                                        {slide.subtitle || slide.alt || "Book tickets for concerts, sports & more"}
                                    </p>
                                    <div style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        padding: "12px 32px",
                                        borderRadius: "50px",
                                        background: "linear-gradient(90deg, #f84464, #c026d3)",
                                        color: "#fff",
                                        fontSize: "14px",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "1px",
                                        boxShadow: "0 8px 24px rgba(248,68,100,0.4)",
                                        pointerEvents: "auto"
                                    }}>
                                        Book Now
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
