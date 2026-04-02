"use client";
import React from "react";
import { Camera, Palette, Sparkles, Users, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  {
    name: "Mehendi Artist",
    icon: <Palette size={24} />,
    description: "Traditional & modern henna designs for every occasion.",
    color: "#f84464",
    gradient: "linear-gradient(135deg, #f84464 0%, #ff7eb3 100%)",
    image: "https://images.unsplash.com/photo-1766100465798-c323de2860c7?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Photographer/Studio",
    icon: <Camera size={24} />,
    description: "Capture timeless moments with expert professional photography.",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7 0%, #da77f2 100%)",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
  },
  {
    name: "Makeup Artist",
    icon: <Sparkles size={24} />,
    description: "Flawless bridal and party makeovers for every occasion.",
    color: "#c026d3",
    gradient: "linear-gradient(135deg, #c026d3 0%, #f783ac 100%)",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80"
  },

];

export default function ServiceCategories() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "24px",
      width: "100%"
    }}>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.name}
          href={`/services?category=${encodeURIComponent(cat.name)}`}
          style={{ textDecoration: "none", display: "block" }}
        >
          <div
            style={{
              position: "relative",
              height: "240px",
              borderRadius: "24px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            className="category-card"
            onMouseEnter={(e) => {
              const overlay = e.currentTarget.querySelector('.card-overlay');
              const img = e.currentTarget.querySelector('.card-img');
              const arrow = e.currentTarget.querySelector('.card-arrow');
              if (overlay) overlay.style.background = "rgba(0,0,0,0.25)";
              if (img) img.style.transform = "scale(1.08)";
              if (arrow) { arrow.style.opacity = "1"; arrow.style.transform = "translate(0, 0)"; }
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 24px 48px -12px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              const overlay = e.currentTarget.querySelector('.card-overlay');
              const img = e.currentTarget.querySelector('.card-img');
              const arrow = e.currentTarget.querySelector('.card-arrow');
              if (overlay) overlay.style.background = "rgba(0,0,0,0.45)";
              if (img) img.style.transform = "scale(1)";
              if (arrow) { arrow.style.opacity = "0"; arrow.style.transform = "translate(-4px, 4px)"; }
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.15)";
            }}
          >
            {/* Background Image */}
            <img
              src={cat.image}
              alt={cat.name}
              className="card-img"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%", objectFit: "cover",
                transition: "transform 0.8s cubic-bezier(0.2, 0, 0.2, 1)"
              }}
            />

            {/* Gradient Overlay */}
            <div
              className="card-overlay"
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.45)",
                transition: "background 0.4s ease"
              }}
            />

            {/* Gradient tint from bottom */}
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)`
            }} />

            {/* Content */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "20px",
              display: "flex", flexDirection: "column", gap: "6px",
            }}>
              {/* Icon pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                background: cat.gradient,
                borderRadius: "12px",
                padding: "6px 12px",
                width: "fit-content",
                marginBottom: "6px",
                boxShadow: `0 6px 16px ${cat.color}55`,
              }}>
                <span style={{ color: "#fff", display: "flex" }}>
                  {React.cloneElement(cat.icon, { size: 16 })}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {cat.name}
                </span>
              </div>

              <p style={{
                fontSize: "12px", color: "rgba(255,255,255,0.8)",
                lineHeight: 1.5, margin: 0, maxWidth: "220px"
              }}>
                {cat.description}
              </p>

              {/* Explore row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: "4px",
              }}>
                <span style={{
                  fontSize: "11px", fontWeight: 800, color: "#fff",
                  textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.9,
                }}>
                  Browse Experts →
                </span>
                <div
                  className="card-arrow"
                  style={{
                    width: 30, height: 30,
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0,
                    transform: "translate(-4px, 4px)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <ArrowUpRight size={15} color="#fff" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
