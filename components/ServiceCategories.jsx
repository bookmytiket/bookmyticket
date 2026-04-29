"use client";
import React, { useState, useEffect } from "react";
import { Camera, Palette, Sparkles, Users, ArrowUpRight, Waves } from "lucide-react";
import { motion } from "framer-motion";
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
  {
    name: "Turf Booking",
    icon: <Users size={24} />,
    description: "Book premium football, cricket, and multisport turfs near you.",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"
  },
  {
    name: "Swimming Pool",
    icon: <Waves size={24} />,
    description: "Find and book premium swimming pools with real-time slot updates.",
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0c4a6e 100%)",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800&auto=format&fit=crop"
  }
];

export default function ServiceCategories() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: isMobile ? "12px" : "24px",
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
              height: isMobile ? "180px" : "240px",
              borderRadius: isMobile ? "16px" : "24px",
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
              padding: isMobile ? "12px" : "20px",
              display: "flex", flexDirection: "column", gap: isMobile ? "4px" : "6px",
            }}>
              {/* Icon pill */}
              <motion.div 
                whileHover={{ scale: 1.1, rotate: -2 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: cat.gradient,
                  borderRadius: isMobile ? "10px" : "14px",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  width: "fit-content",
                  marginBottom: isMobile ? "4px" : "10px",
                  boxShadow: `0 8px 24px ${cat.color}66`,
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(8px)'
                }}>
                <span style={{ color: "#fff", display: "flex" }}>
                  {React.cloneElement(cat.icon, { size: isMobile ? 14 : 18 })}
                </span>
                <span style={{ fontSize: isMobile ? "9px" : "12px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {cat.name}
                </span>
              </motion.div>

              {!isMobile && (
                <p style={{
                  fontSize: "13px", color: "rgba(255,255,255,0.95)",
                  lineHeight: 1.6, margin: "0 0 12px", maxWidth: "240px",
                  fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  {cat.description}
                </p>
              )}

              {/* Explore row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: isMobile ? "2px" : "4px",
              }}>
                <span style={{
                  fontSize: isMobile ? "9px" : "11px", fontWeight: 800, color: "#fff",
                  textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.9,
                }}>
                  {isMobile ? "Explore →" : "Browse Experts →"}
                </span>
                {!isMobile && (
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
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
