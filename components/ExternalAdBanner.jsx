"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BANNER_HEIGHT, BANNER_BORDER_RADIUS } from "./ImageHeroCarousel";

const AUTO_PLAY_MS = 3000;

export default function ExternalAdBanner({ ads = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), AUTO_PLAY_MS);
    return () => clearInterval(t);
  }, [ads.length]);

  if (!ads.length) return null;

  const go = (dir) => setIndex((i) => (i + dir + ads.length) % ads.length);

  return (
    <section style={{ width: "100%", padding: "24px 0", backgroundColor: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px", position: "relative" }}>
        {/* Same format & size as Spotlight: rounded card, image left 60%, content right 40% */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: BANNER_BORDER_RADIUS, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              transition: "transform 0.5s ease-out",
              transform: `translateX(-${index * 100}%)`,
            }}
          >
            {ads.map((ad) => (
              <div
                key={ad.id}
                style={{
                  minWidth: "100%",
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "60% 40%",
                  height: BANNER_HEIGHT,
                  flexShrink: 0,
                }}
              >
                {/* Left: image — same as Spotlight */}
                <div style={{ position: "relative", overflow: "hidden", borderRadius: `${BANNER_BORDER_RADIUS}px 0 0 ${BANNER_BORDER_RADIUS}px` }}>
                  <img
                    src={ad.img}
                    alt={ad.alt || "Advertisement"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                {/* Right: content panel — same style as Spotlight (white bg, title, CTA) */}
                <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#fff", borderRadius: `0 ${BANNER_BORDER_RADIUS}px ${BANNER_BORDER_RADIUS}px 0` }}>
                  <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 24px", lineHeight: 1.25 }}>{ad.title || ad.alt}</h3>
                  {ad.link ? (
                    <Link
                      href={ad.link}
                      style={{
                        display: "inline-block",
                        padding: "12px 28px",
                        backgroundColor: "#f84464",
                        color: "#fff",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: 700,
                        textAlign: "center",
                        textDecoration: "none",
                        boxShadow: "0 4px 14px rgba(248,68,100,0.35)",
                        alignSelf: "flex-start",
                      }}
                    >
                      Learn more
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {ads.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous ad"
                style={{
                  position: "absolute",
                  left: "12px",
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next ad"
                style={{
                  position: "absolute",
                  right: "12px",
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <div style={{ position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 2 }}>
                {ads.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ad ${i + 1}`}
                    style={{
                      width: i === index ? "24px" : "8px",
                      height: "8px",
                      borderRadius: "4px",
                      border: "none",
                      background: i === index ? "#f84464" : "rgba(255,255,255,0.6)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
