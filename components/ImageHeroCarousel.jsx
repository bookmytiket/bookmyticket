"use client";
import React, { useState, useEffect } from "react";

const AUTO_PLAY_MS = 5000;

// Shared with Spotlight: same banner height and rounded card style
export const BANNER_HEIGHT = 322;
export const BANNER_BORDER_RADIUS = 20;

export default function ImageHeroCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_PLAY_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;

  const go = (dir) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <section style={{ width: "100%", padding: "24px 0", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px", position: "relative" }}>
        <div
          style={{
            width: "100%",
            overflow: "hidden",
            borderRadius: BANNER_BORDER_RADIUS,
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              transition: "transform 0.5s ease-out",
              transform: `translateX(-${index * 100}%)`,
            }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                style={{
                  minWidth: "100%",
                  width: "100%",
                  position: "relative",
                  height: BANNER_HEIGHT,
                  background: "#0f172a",
                  flexShrink: 0,
                }}
              >
                <img
                  src={slide.img}
                  alt={slide.title || ""}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: BANNER_BORDER_RADIUS,
                  }}
                />
                {(slide.title || slide.sub) && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "24px 32px",
                      background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                      color: "#fff",
                      borderRadius: `0 0 ${BANNER_BORDER_RADIUS}px ${BANNER_BORDER_RADIUS}px`,
                    }}
                  >
                    {slide.title && <h2 style={{ margin: 0, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700 }}>{slide.title}</h2>}
                    {slide.sub && <p style={{ margin: "4px 0 0", fontSize: "14px", opacity: 0.9 }}>{slide.sub}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              style={{
                position: "absolute",
                left: "28px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              style={{
                position: "absolute",
                right: "28px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 2 }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  style={{
                    width: i === index ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    border: "none",
                    background: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
