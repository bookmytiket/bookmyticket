"use client";
import React from "react";
import Link from "next/link";

const CARD_SIZE = 140;
const GAP = 16;
const DURATION = 14; // 1x speed

export default function FeaturedOrganisers({ organisers = [] }) {
  if (!organisers.length) return null;

  // Combine the organisers array multiple times to ensure enough items for a wide screen text loop.
  const row1Items = Array(12).fill(organisers).flat();

  return (
    <section style={{ width: "100%", padding: "48px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "#f59e0b", fontSize: "20px" }}>★</span>
            <h2 style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              fontFamily: "var(--font-heading)"
            }}>
              Our Event <span style={{
                background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>Partners</span>
            </h2>
          </div>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Discover events from our trusted organisers worldwide</p>
        </div>

        {/* Row 1: scroll left to right (content moves left, so user sees flow L→R) */}
        <div style={{ marginBottom: GAP, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              gap: GAP,
              width: "max-content",
              animation: `scrollRow1 ${DURATION}s linear infinite`,
            }}
          >
            {row1Items.map((org, i) => (
              <Link
                key={`r1-${org.id}-${i}`}
                href={`/organiser?org=${org.id}`}
                style={{ textDecoration: "none", color: "inherit", flexShrink: 0 }}
              >
                <div
                  style={{
                    width: CARD_SIZE,
                    height: CARD_SIZE,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <div style={{ width: "80px", height: "80px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
                    <img src={org.logo} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply", backgroundColor: "transparent" }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes scrollRow1 {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
}
