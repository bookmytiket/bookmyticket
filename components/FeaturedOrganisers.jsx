"use client";
import React from "react";
import Link from "next/link";

const CARD_SIZE = 140;
const GAP = 16;
const DURATION = 14; // 1x speed

export default function FeaturedOrganisers({ organisers = [] }) {
  if (!organisers.length) return null;

  return (
    <section style={{ width: "100%", padding: "48px 0" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <h2 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1f2937",
              margin: 0,
              fontFamily: "var(--font-heading)"
            }}>
              Featured Organizers 🌟
            </h2>
          </div>
          <p style={{ fontSize: "15px", color: "#6b7280", margin: 0 }}>Discover events from our trusted organizers worldwide</p>
        </div>

        <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", 
            gap: "24px" 
        }}>
          {organisers.map((org, i) => (
            <Link
              key={org.id || i}
              href={`/?organiser=${org.id}`}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #f3f4f6",
                  borderRadius: "16px",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.03)";
                }}
              >
                <div style={{ 
                    width: "80px", height: "80px", 
                    borderRadius: "16px", 
                    overflow: "hidden", 
                    marginBottom: "20px",
                    background: "#000" // Fallback if no logo or dark logo
                }}>
                  <img src={org.logo_url || org.logo} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                
                <h3 style={{ 
                    fontSize: "16px", 
                    fontWeight: 800, 
                    color: "#1f2937", 
                    marginBottom: "16px",
                    textAlign: "center"
                }}>
                    {org.name || "Organizer Name"}
                </h3>
                
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    color: "#6b7280", 
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "20px"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {org.eventsCount || 1} event{org.eventsCount !== 1 ? 's' : ''}
                </div>
                
                <div style={{ width: "24px", height: "2px", background: "#e5e7eb", marginBottom: "16px" }}></div>
                
                <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                    Click to explore events →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
