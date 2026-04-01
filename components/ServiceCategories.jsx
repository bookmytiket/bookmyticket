"use client";
import React from "react";
import { Camera, Flower2, Sparkles, ArrowRight, Star, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const STATIC_CATEGORIES = [
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
  
  // Safe way to reference query in case api.js hasn't been recompiled by convex dev
  const getActiveVendorsQuery = api.vendors?.getActiveVendors;
  
  // Use ANY known existing query as a safe dummy reference. api.events.getActiveEvents is guaranteed to exist.
  const safeQuery = getActiveVendorsQuery || api.events.getActiveEvents;
  const safeArgs = getActiveVendorsQuery ? {} : "skip";
  
  const vendors = useQuery(safeQuery, safeArgs);

  // While Loading
  if (vendors === undefined && getActiveVendorsQuery) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "24px", height: "24px", border: "3px solid #f1f5f9", borderTop: "3px solid #f84464", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ marginLeft: "12px", fontWeight: 600 }}>Loading services...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If we have vendors, show their profiles
  if (vendors && vendors.length > 0) {
    return (
      <div className="services-grid" style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
        gap: "24px", 
        paddingBottom: "20px" 
      }}>
        {vendors.map(vendor => {
          const mainImg = vendor.portfolio?.[0]?.url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop";
          return (
            <div 
              key={vendor.id}
              onClick={() => router.push(`/services/${vendor.id}`)}
              style={{
                background: "#fff",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(0,0,0,0.1)";
                e.currentTarget.querySelector('.explore-text').style.color = "#f84464";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)";
                e.currentTarget.querySelector('.explore-text').style.color = "#0f172a";
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
                <img src={mainImg} alt={vendor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ 
                  position: "absolute", 
                  top: "12px", right: "12px", 
                  background: "rgba(255,255,255,0.9)", 
                  padding: "4px 8px", 
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", gap: "4px",
                  fontSize: "12px", fontWeight: 700, color: "#0f172a",
                  backdropFilter: "blur(4px)"
                }}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  {vendor.rating > 0 ? vendor.rating.toFixed(1) : "New"}
                </div>
              </div>

              <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#f84464", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  {vendor.category}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0", lineHeight: 1.2 }}>
                  {vendor.name}
                </h3>
                
                <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 20px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {vendor.bio || `${vendor.category} providing premium services.`}
                </p>

                <div 
                  className="explore-text"
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: "14px",
                    transition: "color 0.2s"
                  }}
                >
                  View Profile <ArrowRight size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback if no vendors are available yet (shows the static categories)
  return (
    <div style={{ padding: "10px 0", overflowX: "auto", display: "flex", gap: "24px", paddingBottom: "20px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {STATIC_CATEGORIES.map((cat) => (
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
