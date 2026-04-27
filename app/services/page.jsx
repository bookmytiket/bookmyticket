"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { Star, ArrowLeft, ChevronLeft, ChevronRight, Briefcase } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/app/data/serviceCategories";
import BecomePartnerModal from "@/components/BecomePartnerModal";

const PAGE_SIZE = 4; // 2x2 grid (or 4 columns)

export default function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "All Services";
  const [page, setPage] = useState(1);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  // Fetch all vendors for the category
  const { data: vendors = [], loading: vendorsLoading } = useSupabaseQuery('service_providers', (q) => {
    if (category !== "All Services") {
      return q.eq('category', category);
    }
    return q;
  }, [category]);

  // Fetch all active turfs
  const { data: turfsRaw = [], loading: turfsLoading } = useSupabaseQuery('turfs', (q) => q.eq('status', 'active'), []);

  // Normalize and merge data
  const mergedItems = useMemo(() => {
    const vList = vendors || [];
    const tList = (turfsRaw || []).map(t => ({
      id: t.id,
      name: t.name,
      category: "Turf Booking",
      city: t.city || "",
      bio: t.description || "Premium sports facility with great amenities.",
      portfolio: (Array.isArray(t.images) ? t.images : [t.images]).filter(Boolean).map(img => ({ url: img, type: "image" })) || [],
      pricing: [{ name: "Standard", price: t.price_per_hour || 0 }],
      rating: 5.0, // Placeholder
      reviewsCount: 0,
      isTurf: true
    }));

    if (category === "Turf Booking") {
      return tList;
    }

    if (category === "All Services") {
      // Merge and shuffle or sort by rating
      return [...vList, ...tList].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Default to vendor list for specific categories
    return vList;
  }, [vendors, turfsRaw, category]);

  // Client-side pagination
  const totalItems = mergedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return mergedItems.slice(start, start + PAGE_SIZE);
  }, [mergedItems, page]);

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Build a category-word display: e.g. "Mehendi Artist" → "Mehendi" + "Artist"
  const words = category.split(" ");
  const lastWord = words.pop();
  const firstWords = words.join(" ");

  // Determine if we are actually waiting for data we need
  const isDataLoading = useMemo(() => {
    if (category === "All Services") return vendorsLoading || turfsLoading;
    if (category === "Turf Booking") return turfsLoading;
    return vendorsLoading;
  }, [category, vendorsLoading, turfsLoading]);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>

      {/* ── Self-contained Top Bar ─────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <div className="top-bar-content" style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "12px 24px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          {/* Back button */}
          <Link
            href="/"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              color: "#374151", fontWeight: 700, fontSize: "12px",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Home
          </Link>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }} className="top-bar-logo">
            <img src="/logo.png" alt="BookMyTicket" style={{ height: "48px", width: "auto" }} />
          </Link>

          {/* Become a Partner Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }} className="desktop-only-text">
                Professional Services
              </div>
              <button 
                onClick={() => setIsPartnerModalOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
                  color: "#fff", border: "none", borderRadius: "10px",
                  padding: "8px 14px", fontSize: "12px", fontWeight: "700",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
                  whiteSpace: "nowrap"
                }}
              >
                <Briefcase size={14} />
                Partner
              </button>
          </div>
        </div>
      </div>

      <BecomePartnerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} />

      {/* ── Category Pill List (Scrollable) ────────────────────────── */}
      <div style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          overflowX: "auto",
          whiteSpace: "nowrap",
          padding: "12px 24px",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none"
      }} className="hide-scrollbar">
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          <div style={{ display: "flex", gap: "10px", maxWidth: "1280px", margin: "0 auto" }}>
              <Link 
                  href="/services?category=All Services"
                  style={{
                      padding: "8px 18px",
                      borderRadius: "100px",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      background: category === "All Services" ? "linear-gradient(135deg, #f84464, #a855f7)" : "#f1f5f9",
                      color: category === "All Services" ? "#fff" : "#475569",
                      boxShadow: category === "All Services" ? "0 4px 12px rgba(248,68,100,0.25)" : "none",
                      transition: "all 0.2s"
                  }}
              >
                  All
              </Link>
              {SERVICE_CATEGORIES.map(cat => (
                  <Link 
                      key={cat}
                      href={`/services?category=${cat}`}
                      style={{
                          padding: "8px 18px",
                          borderRadius: "100px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 700,
                          background: category === cat ? "linear-gradient(135deg, #f84464, #a855f7)" : "#f1f5f9",
                          color: category === cat ? "#fff" : "#475569",
                          boxShadow: category === cat ? "0 4px 12px rgba(248,68,100,0.25)" : "none",
                          transition: "all 0.2s"
                      }}
                  >
                      {cat}
                  </Link>
              ))}
          </div>
      </div>

      {/* ── Hero Header ────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "32px 24px 36px",
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
            {isDataLoading
              ? "Loading experts..."
              : `${totalItems} result${totalItems !== 1 ? "s" : ""} ready to serve you`}
          </p>


        </div>
      </div>

      {/* ── Grid Content ───────────────────────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Loading */}
        {isDataLoading && (
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
        {!isDataLoading && totalItems === 0 && (
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
        {!isDataLoading && totalItems > 0 && (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
            }}
              className="services-grid"
            >
              {pagedItems.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => {
                    if (vendor.isTurf) {
                      router.push(`/turfs/${vendor.id}`);
                    } else {
                      router.push(`/services/${vendor.id}`);
                    }
                  }}
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
                    {/* Status badge */}
                    {(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isBlockedToday = (vendor.advanced_settings?.blocked_dates || []).includes(todayStr);
                        if (isBlockedToday) {
                            return (
                                <div style={{
                                    position: "absolute", top: "12px", left: "12px",
                                    background: "rgba(239, 68, 68, 0.9)",
                                    backdropFilter: "blur(8px)",
                                    padding: "4px 10px", borderRadius: "12px",
                                    fontSize: "10px", fontWeight: 900, color: "#fff",
                                    textTransform: "uppercase", letterSpacing: "0.5px",
                                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)",
                                    zIndex: 10
                                }}>
                                    Busy Today
                                </div>
                            );
                        }
                        return (
                            <div style={{
                                position: "absolute", top: "12px", left: "12px",
                                background: "rgba(34, 197, 94, 0.9)",
                                backdropFilter: "blur(8px)",
                                padding: "4px 10px", borderRadius: "12px",
                                fontSize: "10px", fontWeight: 900, color: "#fff",
                                textTransform: "uppercase", letterSpacing: "0.5px",
                                boxShadow: "0 2px 8px rgba(34, 197, 94, 0.2)",
                                zIndex: 10
                            }}>
                                Available
                            </div>
                        );
                    })()}
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
                      {vendor.business_name || vendor.name}
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
                        {vendor.isTurf ? "Book Slot" : "View Profile"}
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} professionals
            </p>
          </>
        )}
      </div>

      {/* Responsive grid breakpoints */}
      <style>{`
        @media (max-width: 1100px) { .services-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 768px)  { .services-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 600px)  { 
           .services-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; } 
           .top-bar-content { justify-content: center !important; }
           .desktop-only-text { display: none !important; }
           .top-bar-logo { order: -1; width: 100%; justify-content: center; margin-bottom: 4px; }
        }
      `}</style>
    </main>
  );
}
