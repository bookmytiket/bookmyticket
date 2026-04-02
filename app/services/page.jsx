"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Star, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 16; // 4×4 grid

export default function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "All Services";
  const [page, setPage] = useState(1);

  // Fetch all vendors for the category (uses listByCategory from Convex)
  const vendors = useQuery(api.vendors.listByCategory, {
    category: category === "All Services" ? "" : category,
  });

  // Client-side pagination
  const totalVendors = vendors?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalVendors / PAGE_SIZE));
  const pagedVendors = useMemo(() => {
    if (!vendors) return [];
    const start = (page - 1) * PAGE_SIZE;
    return vendors.slice(start, start + PAGE_SIZE);
  }, [vendors, page]);

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Build a category-word display: e.g. "Mehendi Artist" → "Mehendi" + "Artist"
  const words = category.split(" ");
  const lastWord = words.pop();
  const firstWords = words.join(" ");

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>

      {/* ── Self-contained Top Bar ─────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 24px",
          height: "72px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Back button — uses Next Link for reliable navigation */}
          <Link
            href="/"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              color: "#374151", fontWeight: 700, fontSize: "14px",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Back to Home
          </Link>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="BookMyTicket" style={{ height: "64px", width: "auto" }} />
          </Link>

          {/* Subtle breadcrumb */}
          <div style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>
            Professional Services
          </div>
        </div>
      </div>

      {/* ── Hero Header ────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "24px 24px 28px",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(248,68,100,0.15)", border: "1px solid rgba(248,68,100,0.3)",
            borderRadius: "100px", padding: "3px 12px", marginBottom: "10px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f84464", display: "inline-block" }} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#f84464", textTransform: "uppercase", letterSpacing: "1px" }}>
              Professional Services
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 3.5vw, 36px)",
            fontWeight: 900,
            color: "#fff",
            margin: "0 0 6px",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            fontFamily: "var(--font-heading)",
          }}>
            {firstWords && <span>{firstWords} </span>}
            <span style={{
              background: "linear-gradient(135deg,#f84464 0%,#c026d3 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {lastWord}
            </span>
            {" "}
            <span style={{ color: "#94a3b8" }}>Professionals</span>
          </h1>

          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0, fontWeight: 500 }}>
            {vendors === undefined
              ? "Loading experts..."
              : `${totalVendors} expert${totalVendors !== 1 ? "s" : ""} ready to serve you`}
          </p>
        </div>
      </div>

      {/* ── Grid Content ───────────────────────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Loading */}
        {vendors === undefined && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 44, height: 44,
              border: "4px solid #f1f5f9",
              borderTop: "4px solid #f84464",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ color: "#64748b", fontWeight: 600, fontSize: "15px" }}>Loading professionals...</p>
            <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Empty State */}
        {vendors !== undefined && vendors.length === 0 && (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "#fff", borderRadius: "28px",
            border: "1px dashed #cbd5e1",
          }}>
            <div style={{ fontSize: "60px", marginBottom: "20px" }}>🔍</div>
            <h3 style={{ fontSize: "26px", fontWeight: 900, color: "#1e293b", marginBottom: "10px" }}>
              No professionals found
            </h3>
            <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "440px", margin: "0 auto 28px", lineHeight: 1.6 }}>
              We couldn't find any experts in "{category}" yet. Please try another category or check back soon.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "linear-gradient(135deg,#f84464,#a855f7)",
                color: "#fff", padding: "14px 28px",
                borderRadius: "14px", fontSize: "15px", fontWeight: 700,
                textDecoration: "none", boxShadow: "0 8px 20px rgba(248,68,100,0.25)",
              }}
            >
              <ArrowLeft size={16} /> Explore All Services
            </Link>
          </div>
        )}

        {/* 4-Column Grid */}
        {vendors !== undefined && vendors.length > 0 && (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
            }}
              className="services-grid"
            >
              {pagedVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => router.push(`/services/${vendor.id}`)}
                  style={{
                    background: "#fff",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = "#f84464";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#f1f5f9" }}>
                    <img
                      src={vendor.portfolio?.[0]?.url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"}
                      alt={vendor.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                    {/* Rating badge */}
                    <div style={{
                      position: "absolute", top: "12px", right: "12px",
                      background: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(8px)",
                      padding: "4px 10px", borderRadius: "12px",
                      display: "flex", alignItems: "center", gap: "5px",
                      fontSize: "13px", fontWeight: 800, color: "#0f172a",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    }}>
                      <Star size={12} color="#fbbf24" fill="#fbbf24" />
                      {vendor.rating > 0 ? vendor.rating.toFixed(1) : "New"}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{
                      fontSize: "10px", fontWeight: 800, color: "#f84464",
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px",
                    }}>
                      {vendor.category}
                    </div>
                    <h3 style={{
                      fontSize: "16px", fontWeight: 900, color: "#0f172a",
                      margin: "0 0 8px", lineHeight: 1.2,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {vendor.name}
                    </h3>
                    <p style={{
                      color: "#64748b", fontSize: "12px", lineHeight: 1.6,
                      margin: "0 0 16px", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      flex: 1,
                    }}>
                      {vendor.bio || `${vendor.category} — premium professional services.`}
                    </p>

                    {/* Price + CTA */}
                    <div style={{
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>From</div>
                        <div style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a" }}>
                          ₹{vendor.pricing?.[0]?.price?.toLocaleString("en-IN") || "1,999"}
                        </div>
                      </div>
                      <div style={{
                        background: "linear-gradient(135deg,#f84464,#a855f7)",
                        color: "#fff", padding: "8px 16px",
                        borderRadius: "10px", fontSize: "12px", fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(248,68,100,0.25)",
                      }}>
                        View Profile
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ─────────────────────────────────────── */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", marginTop: "48px",
              }}>
                {/* Prev */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "10px 18px", borderRadius: "12px",
                    border: "1px solid #e2e8f0", background: "#fff",
                    color: page === 1 ? "#cbd5e1" : "#374151",
                    fontWeight: 700, fontSize: "13px",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <ChevronLeft size={15} /> Prev
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === page;
                  const isNear = Math.abs(p - page) <= 2 || p === 1 || p === totalPages;
                  if (!isNear) {
                    // Show ellipsis only once per gap
                    if (p === 2 && page > 4) return <span key={p} style={{ color: "#94a3b8", padding: "0 4px" }}>…</span>;
                    if (p === totalPages - 1 && page < totalPages - 3) return <span key={p} style={{ color: "#94a3b8", padding: "0 4px" }}>…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      style={{
                        width: "40px", height: "40px",
                        borderRadius: "10px",
                        border: isActive ? "none" : "1px solid #e2e8f0",
                        background: isActive ? "linear-gradient(135deg,#f84464,#a855f7)" : "#fff",
                        color: isActive ? "#fff" : "#374151",
                        fontWeight: 800, fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        boxShadow: isActive ? "0 4px 12px rgba(248,68,100,0.3)" : "none",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "10px 18px", borderRadius: "12px",
                    border: "1px solid #e2e8f0", background: "#fff",
                    color: page === totalPages ? "#cbd5e1" : "#374151",
                    fontWeight: 700, fontSize: "13px",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}

            {/* Page info */}
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginTop: "16px" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalVendors)} of {totalVendors} professionals
            </p>
          </>
        )}
      </div>

      {/* Responsive grid breakpoints */}
      <style>{`
        @media (max-width: 1100px) { .services-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 768px)  { .services-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px)  { .services-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </main>
  );
}
