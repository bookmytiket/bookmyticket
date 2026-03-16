"use client";
import { useState, useEffect } from "react";

export default function LeftBanner({ slides }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const slideCount = slides?.length || 0;
        if (slideCount <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide(p => (p + 1) % slideCount);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides?.length]);

    if (!slides || slides.length === 0) return null;

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {slides.map((s, i) => (
                <div key={i} style={{ position: "absolute", inset: 0, opacity: currentSlide === i ? 1 : 0, transition: "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: currentSlide === i ? 1 : 0 }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)", zIndex: 1 }} />
                    <img src={s.img} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", bottom: "10%", left: "40px", right: "40px", zIndex: 2, color: "#fff" }}>
                        <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "8px", lineHeight: 1.1, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                            {s.title}
                        </h2>
                        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", fontWeight: 500, margin: 0 }}>
                            {s.sub}
                        </p>
                    </div>
                </div>
            ))}
            {/* Dots */}
            {slides.length > 1 && (
                <div style={{ position: "absolute", bottom: "40px", left: "40px", zIndex: 3, display: "flex", gap: "8px" }}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            style={{
                                width: currentSlide === i ? "24px" : "8px",
                                height: "8px",
                                borderRadius: "4px",
                                background: currentSlide === i ? "#f84464" : "rgba(255,255,255,0.5)",
                                border: "none",
                                padding: 0,
                                transition: "all 0.3s ease",
                                cursor: "pointer"
                            }}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
