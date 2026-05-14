"use client";
import React from "react";
import { MapPin, Calendar, ArrowRight, Star, Heart } from "lucide-react";
import Link from "next/link";

export default function TicketCard({ event, router }) {
    if (!event) return null;

    const isFree = event.price === 0 || event.is_free;
    const displayPrice = isFree ? "FREE" : `₹${event.price}`;

    return (
        <div
            className="group relative"
            style={{
                background: "#fff",
                borderRadius: "24px",
                overflow: "hidden",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                cursor: "pointer"
            }}
            onClick={() => router?.push(`/events/detail?id=${event.id}`)}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(248, 68, 100, 0.1)";
                e.currentTarget.style.borderColor = "#fecdd3";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.03)";
                e.currentTarget.style.borderColor = "#f1f5f9";
            }}
        >
            {/* Image Wrapper */}
            <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                <img
                    src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80"}
                    alt={event.title}
                    style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover",
                        transition: "transform 0.6s ease"
                    }}
                    className="group-hover:scale-110"
                />
                
                {/* Overlay Badge */}
                <div style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#f84464",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                }}>
                    {event.type || "Event"}
                </div>

                {/* Price Badge */}
                <div style={{
                    position: "absolute",
                    bottom: "12px",
                    right: "12px",
                    padding: "6px 14px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
                    fontSize: "12px",
                    fontWeight: 900,
                    color: "#fff",
                    boxShadow: "0 8px 16px rgba(248, 68, 100, 0.3)"
                }}>
                    {displayPrice}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "11px", fontWeight: 700 }}>
                        <Calendar size={12} />
                        <span>{event.date}</span>
                    </div>
                    {event.verified && (
                        <div title="Verified Event">
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        </div>
                    )}
                </div>

                <h3 style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 12px",
                    lineHeight: "1.4",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    height: "44px"
                }}>
                    {event.title}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "12px", marginTop: "auto" }}>
                    <MapPin size={14} />
                    <span style={{ 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap",
                        fontWeight: 500
                    }}>
                        {event.location || event.city || "TBA"}
                    </span>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{
                padding: "12px 18px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button style={{ 
                        background: "none", 
                        border: "none", 
                        padding: 0, 
                        color: "#94a3b8", 
                        cursor: "pointer" 
                    }}>
                        <Heart size={18} />
                    </button>
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#f84464",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                }}>
                    Book Now <ArrowRight size={14} />
                </div>
            </div>
        </div>
    );
}
