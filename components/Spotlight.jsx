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

        {/* Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px",
            marginTop: "10px"
          }}
        >
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`/events/detail?id=${ev.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  height: '100%'
                }}
              >
                <div style={{
                  width: "100%",
                  aspectRatio: "2.3/3",
                  overflow: "hidden",
                  position: "relative"
                }}>
                  <img
                    src={ev.img}
                    alt={ev.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(248, 68, 100, 0.9)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    Spotlight
                  </div>
                </div>

                <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: "6px" }}>
                    <h3 style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#111827",
                      margin: 0,
                      lineHeight: "1.2",
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {ev.title}
                    </h3>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0, marginTop: "2px" }}>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.5l-4.2-4.2 1.4-1.4 2.8 2.8 6.1-6.1 1.4 1.4-7.5 7.5z" />
                    </svg>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.location}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>{ev.date}</span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#111827" }}>Paid</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
