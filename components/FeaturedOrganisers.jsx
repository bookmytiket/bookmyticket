"use client";
import React from "react";
import Link from "next/link";

const CARD_SIZE = 140;
const GAP = 16;
const DURATION = 14;

export default function FeaturedOrganisers({ organisers = [] }) {
  if (!organisers.length) return null;

  // Duplicate list so infinite scroll has no gap
  const row1Items = [...organisers, ...organisers];
  const row2Items = [...organisers, ...organisers];

  return (
    <section style={{ width: "100%", padding: "48px 0", borderTop: "1px solid #e5e7eb", background: "linear-gradient(135deg, #fdf4ff 0%, #faf5ff 40%, #fff 100%)", overflow: "hidden" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ color: "#f59e0b", fontSize: "20px" }}>★</span>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", margin: 0 }}>Featured Organisers</h2>
        </div>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>Discover events from our trusted organisers worldwide</p>

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
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px",
                    transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, backgroundColor: "#f1f5f9" }}>
                    <img src={org.logo} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginTop: "8px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{org.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Row 2: scroll right to left */}
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              gap: GAP,
              width: "max-content",
              animation: `scrollRow2 ${DURATION}s linear infinite`,
            }}
          >
            {row2Items.map((org, i) => (
              <Link
                key={`r2-${org.id}-${i}`}
                href={`/organiser?org=${org.id}`}
                style={{ textDecoration: "none", color: "inherit", flexShrink: 0 }}
              >
                <div
                  style={{
                    width: CARD_SIZE,
                    height: CARD_SIZE,
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px",
                    transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, backgroundColor: "#f1f5f9" }}>
                    <img src={org.logo} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginTop: "8px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{org.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes scrollRow1 {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          @keyframes scrollRow2 {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
}
