"use client";
import React from "react";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VenueEventCard({ event }) {
    if (!event) return null;

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.05)";
            }}
        >
            {/* Image Section */}
            <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                <img
                    src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"}
                    alt={event.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(4px)",
                        color: "#f84464",
                        padding: "4px 12px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 800,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <span
                        style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: "#f84464",
                            display: "inline-block",
                            animation: "pulse 1.5s infinite",
                        }}
                    ></span>
                    LIVE
                </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: "20px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "11px",
                            fontWeight: 800,
                            color: "#f84464",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        {event.category || "VENUE EVENT"}
                    </p>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                        {event.price && event.price !== "0" ? `₹${event.price}` : "FREE"}
                    </span>
                </div>

                <h3
                    style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        margin: "0 0 8px",
                        color: "#0f172a",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        height: "50px",
                    }}
                >
                    {event.title}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", marginBottom: "4px" }}>
                    <MapPin size={14} color="#64748b" />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {event.venue || event.location}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                    <Calendar size={14} color="#64748b" />
                    <span>{event.date}</span>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                        borderTop: "1px solid #f1f5f9",
                        paddingTop: "16px",
                    }}
                >
                    <div>
                        <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>STARTING FROM</p>
                        <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{event.time || "Join Now"}</p>
                    </div>
                    <Link href={`/events/${event.id}`} style={{ textDecoration: "none" }}>
                        <button
                            style={{
                                padding: "10px 18px",
                                background: "linear-gradient(90deg, #f84464, #ef4444)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "12px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(248,68,100,0.2)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateX(2px)";
                                e.currentTarget.style.boxShadow = "0 6px 16px rgba(248,68,100,0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateX(0)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(248,68,100,0.2)";
                            }}
                        >
                            Details <ArrowRight size={14} />
                        </button>
                    </Link>
                </div>
            </div>

            <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
