"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { Star, ArrowLeft, MapPin, Navigation, Waves, Clock, Info } from "lucide-react";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function SwimmingPoolsPage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState("distance"); // distance, rating, availability

  const { data: pools = [], loading } = useSupabaseQuery('swimming_pools', (q) => q.eq('status', 'active'), []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  const processedPools = useMemo(() => {
    let list = (pools || []).map(pool => ({
      ...pool,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, pool.lat, pool.lng) : null
    }));

    if (sortBy === "distance" && userLocation) {
      list.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [pools, userLocation, sortBy]);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Abstract Background Element */}
        <div style={{
          position: "absolute", top: "-20%", right: "-10%", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)",
          borderRadius: "50%"
        }} />

        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 10 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              color: "#94a3b8", fontSize: "14px", fontWeight: 700,
              textDecoration: "none", marginBottom: "24px",
              transition: "color 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "rgba(14, 165, 233, 0.15)", border: "1px solid rgba(14, 165, 233, 0.3)",
                borderRadius: "100px", padding: "4px 14px", marginBottom: "16px",
              }}>
                <Waves size={14} color="#0ea5e9" />
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Dedicated Category
                </span>
              </div>
              <h1 style={{
                fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#fff",
                margin: "0 0 12px", letterSpacing: "-0.04em", lineHeight: 1.1
              }}>
                Swimming <span style={{ color: "#0ea5e9" }}>Pools</span>
              </h1>
              <p style={{ color: "#94a3b8", fontSize: "16px", margin: 0, fontWeight: 500, maxWidth: "500px" }}>
                Discover premium swimming facilities near you. Sort by distance, ratings, and check real-time availability.
              </p>
            </div>

            {/* Sorting Controls */}
            <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "6px", borderRadius: "14px", backdropFilter: "blur(10px)" }}>
              {["distance", "rating"].map(type => (
                <button
                  key={type}
                  onClick={() => setSortBy(type)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", border: "none",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                    textTransform: "capitalize", transition: "all 0.2s",
                    background: sortBy === type ? "#0ea5e9" : "transparent",
                    color: sortBy === type ? "#fff" : "#94a3b8"
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div className="loader" />
            <style>{`
              .loader { border: 4px solid #f1f5f9; border-top: 4px solid #0ea5e9; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : processedPools.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 20px", background: "#fff", borderRadius: "24px", border: "1px dashed #cbd5e1" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏊‍♂️</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>No Swimming Pools Found</h2>
            <p style={{ color: "#64748b", marginTop: "8px" }}>Try adjusting your filters or checking back later.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px"
          }}>
            {processedPools.map(pool => (
              <div
                key={pool.id}
                onClick={() => router.push(`/services/swimming-pools/${pool.id}`)}
                style={{
                  background: "#fff", borderRadius: "24px", overflow: "hidden",
                  border: "1px solid #e2e8f0", cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)";
                }}
              >
                {/* Image Gallery/Banner */}
                <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden" }}>
                  <img
                    src={pool.images?.[0] || "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80"}
                    alt={pool.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {pool.distance && (
                    <div style={{
                      position: "absolute", top: "16px", left: "16px",
                      background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
                      color: "#fff", padding: "6px 12px", borderRadius: "100px",
                      fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px"
                    }}>
                      <Navigation size={12} fill="#fff" />
                      {pool.distance < 1 ? `${(pool.distance * 1000).toFixed(0)}m away` : `${pool.distance.toFixed(1)} km away`}
                    </div>
                  )}
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    background: "#fff", padding: "6px 12px", borderRadius: "100px",
                    display: "flex", alignItems: "center", gap: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}>
                    <Star size={14} fill="#fbbf24" color="#fbbf24" />
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>{pool.rating || "5.0"}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>{pool.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                    <MapPin size={14} />
                    {pool.city}, {pool.address}
                  </div>

                  {/* Amenities (Chips) */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                    {(pool.amenities || []).slice(0, 3).map(amenity => (
                      <span key={amenity} style={{
                        background: "#f1f5f9", color: "#475569", padding: "4px 10px",
                        borderRadius: "8px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize"
                      }}>
                        {amenity}
                      </span>
                    ))}
                    {pool.amenities?.length > 3 && (
                      <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 700 }}>+{pool.amenities.length - 3} more</span>
                    )}
                  </div>

                  {/* Price and CTA */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Starting From</span>
                      <span style={{ fontSize: "18px", fontWeight: 900, color: "#0ea5e9" }}>₹{pool.price_per_hour || 200}<small style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>/hr</small></span>
                    </div>
                    <button style={{
                      background: "#0ea5e9", color: "#fff", padding: "10px 20px", borderRadius: "12px",
                      border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(14, 165, 233, 0.2)"
                    }}>
                      Check Slots
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
