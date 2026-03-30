"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Video, Calendar, ArrowRight, Heart, Zap } from "lucide-react";

function VirtualCard({ event }) {
    const [wished, setWished] = useState(false);
    
    // Check if event is free
    const isFree = !event.price || event.price === 0 || 
                  event.normalTicketPrice === 0 ||
                  event.seatCategories?.every(c => c.isFree);

    return (
        <Link
            href={`/events/detail?id=${event._id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
            <article
                style={{
                    minWidth: "300px",
                    width: "300px",
                    borderRadius: "24px",
                    border: "1px solid #f1f5f9",
                    background: "#fff",
                    overflow: "hidden",
                    flexShrink: 0,
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
                    e.currentTarget.style.borderColor = "#f1f5f9";
                }}
            >
                <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
                    <img
                        src={event.img || event.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"}
                        alt={event.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                    
                    {/* Badge Overlay */}
                    <div style={{
                        position: "absolute", top: "12px", left: "12px",
                        display: "flex", gap: "6px"
                    }}>
                        <div style={{
                            background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
                            color: "#fff", fontSize: "10px", fontWeight: 900, padding: "4px 10px",
                            borderRadius: "100px", display: "flex", alignItems: "center", gap: "4px",
                            letterSpacing: "0.05em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.1)"
                        }}>
                            <Zap size={10} fill="#facc15" stroke="#facc15" /> Virtual
                        </div>
                        <div style={{
                            background: isFree ? "rgba(34, 197, 94, 0.9)" : "rgba(99, 102, 241, 0.9)",
                            backdropFilter: "blur(8px)", color: "#fff", fontSize: "10px", fontWeight: 900,
                            padding: "4px 10px", borderRadius: "100px", letterSpacing: "0.05em",
                            textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.1)"
                        }}>
                            {isFree ? "Free" : "Paid"}
                        </div>
                    </div>

                    <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setWished(w => !w); }}
                        style={{
                            position: "absolute", top: "12px", right: "12px",
                            width: "36px", height: "36px", borderRadius: "12px",
                            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
                            border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            transition: "all 0.2s", zIndex: 10, color: wished ? "#ef4444" : "#64748b"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.9)"; }}
                    >
                        <Heart size={18} fill={wished ? "currentColor" : "none"} strokeWidth={2.5} />
                    </button>
                </div>

                <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b" }}>
                            <Calendar size={14} />
                            <span style={{ fontSize: "12px", fontWeight: 700 }}>{event.date || "TBA"}</span>
                        </div>
                        <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#cbd5e1" }} />
                        <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>Online</span>
                    </div>

                    <h3 style={{
                        fontSize: "18px", fontWeight: 900, color: "#0f172a",
                        margin: "0 0 12px", lineHeight: 1.25,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                        fontFamily: "'Figtree', sans-serif", letterSpacing: "-0.02em"
                    }}>
                        {event.title}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Started from</span>
                            <span style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>
                                {isFree ? "FREE" : `₹${event.price || event.normalTicketPrice || 0}`}
                            </span>
                        </div>
                        <div 
                          style={{ 
                            width: "40px", height: "40px", borderRadius: "14px", 
                            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            color: "#fff", boxShadow: "0 8px 16px -4px rgba(59, 130, 246, 0.5)"
                          }}
                        >
                            <ArrowRight size={20} strokeWidth={3} />
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default function VirtualEvents() {
    // using meetings query to filter for virtual events
    const virtualEvents = useQuery(api.meetings.getVirtualEvents) || [];
    const scrollRef = useRef(null);
    const scroll = dir =>
        scrollRef.current?.scrollBy({ left: dir === "left" ? -330 : 330, behavior: "smooth" });

    if (virtualEvents.length === 0) return null;

    return (
        <section style={{ width: "100%", backgroundColor: "#f8fafc", padding: "80px 0" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 24px" }}>

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(236, 72, 153, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ec4899" }}>
                                <Video size={18} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 900, color: "#ec4899", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Experiences</span>
                        </div>
                        <h2 style={{
                            fontSize: "36px",
                            fontWeight: 950,
                            color: "#0f172a",
                            margin: 0,
                            letterSpacing: "-0.05em",
                            lineHeight: 1,
                            fontFamily: "'Figtree', sans-serif"
                        }}>
                            Virtual <span style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Events</span>
                        </h2>
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={() => scroll("left")}
                            style={{
                                width: "48px", height: "48px", borderRadius: "16px",
                                background: "#fff", border: "1px solid #e2e8f0",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all 0.2s", color: "#64748b"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#3b82f6"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
                        >
                            <ArrowRight size={20} style={{ transform: "rotate(180deg)" }} />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            style={{
                                width: "48px", height: "48px", borderRadius: "16px",
                                background: "#fff", border: "1px solid #e2e8f0",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all 0.2s", color: "#64748b"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#3b82f6"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ position: "relative" }}>
                    <div
                        ref={scrollRef}
                        style={{ 
                            display: "flex", 
                            gap: "24px", 
                            overflowX: "auto", 
                            scrollbarWidth: "none", 
                            msOverflowStyle: "none", 
                            padding: "4px 4px 30px" 
                        }}
                    >
                        {virtualEvents.map(event => <VirtualCard key={event._id} event={event} />)}
                    </div>
                </div>

            </div>
        </section>
    );
}
