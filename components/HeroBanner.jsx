"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const BANNER_SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=1400&h=300&fit=crop",
        alt: "Ani Vs U1 Singalong Event",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1400&h=300&fit=crop",
        alt: "Rapport 26 Unplugged Concert",
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1400&h=300&fit=crop",
        alt: "Tech Innovation Panel 2026",
    },
];

const AUTO_PLAY_MS = 2000;

export default function HeroBanner() {
    const [current, setCurrent] = useState(0);
    const [sliding, setSliding] = useState(false);
    const [dir, setDir] = useState(1); // 1 = left, -1 = right
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

    return (
        <div className="bms-banner-wrap">
            <div
                className="bms-banner-stage"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Left peek slide */}
                <div className="bms-slide-peek bms-peek-left" onClick={prev}>
                    <img src={BANNER_SLIDES[prevIdx].image} alt={BANNER_SLIDES[prevIdx].alt} draggable={false} />
                    <div className="bms-peek-dim" />
                </div>

                {/* Main active slide */}
                <div className={`bms-slide-main ${sliding ? (dir === 1 ? "slide-exit-left" : "slide-exit-right") : "slide-enter"}`}>
                    <img src={BANNER_SLIDES[current].image} alt={BANNER_SLIDES[current].alt} draggable={false} />
                    {/* Dots */}
                    <div className="bms-dots">
                        {BANNER_SLIDES.map((_, i) => (
                            <button
                                key={i}
                                className={`bms-dot${i === current ? " active" : ""}`}
                                onClick={(e) => { e.stopPropagation(); goTo(i, i > current ? 1 : -1); }}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Right peek slide */}
                <div className="bms-slide-peek bms-peek-right" onClick={next}>
                    <img src={BANNER_SLIDES[nextIdx].image} alt={BANNER_SLIDES[nextIdx].alt} draggable={false} />
                    <div className="bms-peek-dim" />
                </div>

                {/* Arrow buttons */}
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
            </div>
        </div>
    );
}
