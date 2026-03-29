"use client";
import React from "react";
import { Camera, Flower2, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  {
    name: "Mehendi Artists",
    slug: "mehendi-artists",
    icon: <Flower2 size={32} />,
    description: "Traditional & modern henna designs for all occasions.",
    color: "#f84464",
    gradient: "linear-gradient(135deg, #f84464 0%, #ff7eb3 100%)",
  },
  {
    name: "Photographers/Studios",
    slug: "photographers",
    icon: <Camera size={32} />,
    description: "Capture your precious moments with professional expertise.",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7 0%, #da77f2 100%)",
  },
  {
    name: "Makeup Artists",
    slug: "makeup-artists",
    icon: <Sparkles size={32} />,
    description: "Stunning bridal & party makeovers tailored for you.",
    color: "#c026d3",
    gradient: "linear-gradient(135deg, #c026d3 0%, #f783ac 100%)",
  },
];

export default function ServiceCategories() {
  const router = useRouter();

  return (
    <div style={{ padding: "10px 0", overflowX: "auto", display: "flex", gap: "24px", paddingBottom: "20px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {CATEGORIES.map((cat) => (
        <div
          key={cat.slug}
          onClick={() => router.push(`/services?category=${encodeURIComponent(cat.name)}`)}
          style={{
            flex: "1 0 350px", // Maintains horizontal width
            position: "relative",
            padding: "32px",
            borderRadius: "28px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            cursor: "pointer",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-10px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 30px 60px -12px rgba(50, 50, 93, 0.15), 0 18px 36px -18px rgba(0, 0, 0, 0.2)";
            e.currentTarget.style.borderColor = cat.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          {/* Background Glow */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              right: "-10%",
              width: "180px",
              height: "180px",
              background: cat.gradient,
              filter: "blur(70px)",
              opacity: 0.08,
              zIndex: 0,
            }}
          />

          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: cat.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              marginBottom: "28px",
              position: "relative",
              zIndex: 1,
              boxShadow: `0 12px 24px ${cat.color}33`,
            }}
          >
            {cat.icon}
          </div>

          <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "14px", position: "relative", zIndex: 1, letterSpacing: "-0.01em" }}>
            {cat.name}
          </h3>
          <p style={{ color: "#64748b", fontSize: "16px", lineHeight: "1.6", marginBottom: "28px", position: "relative", zIndex: 1 }}>
            {cat.description}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: cat.color,
              fontWeight: 800,
              fontSize: "15px",
              position: "relative",
              zIndex: 1,
              transition: "transform 0.2s"
            }}
          >
            Explore Artists <ArrowRight size={18} />
          </div>
        </div>
      ))}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
