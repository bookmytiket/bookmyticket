"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BANNER_HEIGHT, BANNER_BORDER_RADIUS } from "./ImageHeroCarousel";

const ROTATE_MS = 6000;

function Countdown({ targetDate }) {
  const [left, setLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  useEffect(() => {
    const tick = () => {
      const end = new Date(targetDate).getTime();
      const now = Date.now();
      const d = Math.max(0, end - now);
      setLeft({
        days: Math.floor(d / 86400000),
        hours: Math.floor((d % 86400000) / 3600000),
        mins: Math.floor((d % 3600000) / 60000),
        secs: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "flex-start" }}>
      {[["DAY", left.days], ["HOUR", left.hours], ["MIN", left.mins], ["SEC", left.secs]].map(([label, val]) => (
        <div key={label} style={{ textAlign: "center", minWidth: "56px" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>{String(val).padStart(2, "0")}</div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Spotlight({ events = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (events.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % events.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [events.length]);

  const go = (dir) => setIndex((i) => (i + dir + events.length) % events.length);

  if (!events.length) return null;

  return (
    <section style={{ width: "100%", backgroundColor: "#f8fafc", padding: "48px 0", borderTop: "1px solid #e5e7eb" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ color: "#ef4444" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", margin: 0 }}>Spotlight</h2>
        </div>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>Handpicked experiences and standout events you won&apos;t want to miss!</p>

        {/* Image-based banner — same size & style as hero: rounded card, image left 60%, content right 40% */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: BANNER_BORDER_RADIUS, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              transition: "transform 0.5s ease-out",
              transform: `translateX(-${index * 100}%)`,
            }}
          >
            {events.map((ev) => {
              const targetDate = ev.date ? new Date(ev.date) : new Date(Date.now() + 7 * 86400000);
              targetDate.setHours(8, 0, 0, 0);
              return (
                <div
                  key={ev.id}
                  style={{
                    minWidth: "100%",
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "60% 40%",
                    height: BANNER_HEIGHT,
                    flexShrink: 0,
                  }}
                >
                  {/* Left: image */}
                  <div style={{ position: "relative", overflow: "hidden", borderRadius: `${BANNER_BORDER_RADIUS}px 0 0 ${BANNER_BORDER_RADIUS}px` }}>
                    <img
                      src={ev.img}
                      alt={ev.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                  {/* Right: event details */}
                  <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: `0 ${BANNER_BORDER_RADIUS}px ${BANNER_BORDER_RADIUS}px 0` }}>
                    <div>
                      <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 14px", lineHeight: 1.25 }}>{ev.title}</h3>
                      <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {ev.date}
                      </p>
                      <p style={{ fontSize: "14px", color: "#374151", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        {ev.location}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", margin: "0 0 10px" }}>Event starts in</p>
                      <Countdown targetDate={targetDate} />
                      <Link
                        href={`/events/${ev.id}`}
                        style={{
                          display: "inline-block",
                          marginTop: "20px",
                          padding: "12px 28px",
                          backgroundColor: "#f84464",
                          color: "#fff",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: 700,
                          textDecoration: "none",
                          boxShadow: "0 4px 14px rgba(248,68,100,0.35)",
                        }}
                      >
                        Get Ticket
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {events.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous"
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
                aria-label="Next"
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
                {events.map((_, i) => (
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
