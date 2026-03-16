import { useRef, useEffect, useState } from "react";

const TEAM = [
    { id: 1, name: "Raja", role: "Managing Director", img: "/bookmyticket/Raja.jpeg", glow: "#6366f1" },
    { id: 2, name: "Priya Sharma", role: "Head of Events", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face", glow: "#a855f7" },
    { id: 3, name: "Vikram Nair", role: "Lead Developer", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face", glow: "#3b82f6" },
    { id: 4, name: "Sneha Reddy", role: "Marketing Director", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face", glow: "#ec4899" },
    { id: 5, name: "Rahul Menon", role: "Operations Head", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face", glow: "#10b981" },
    { id: 6, name: "Divya Joseph", role: "Creative Director", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&crop=face", glow: "#f59e0b" },
];

export default function TeamSection() {
    const scrollRef = useRef(null);
    const [paused, setPaused] = useState(false);

    const scroll = dir => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.clientWidth / 3; // 3-item view
        scrollRef.current.scrollBy({ left: dir === "left" ? -width : width, behavior: "smooth" });
    };

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
                } else {
                    scroll("right");
                }
            }
        }, 2000); // 2s interval as requested previously
        return () => clearInterval(timer);
    }, [paused]);

    return (
        <section style={{ width: "100%", background: "#f9fafb", padding: "80px 0" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header with arrows similar to Eventify */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
                    <div>
                        <span style={{ fontSize: "14px", fontWeight: 750, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "10px" }}>
                            ✦ Meet Our Team
                        </span>
                        <h2 style={{ fontSize: "40px", fontWeight: 900, color: "#111827", margin: 0, fontFamily: "var(--font-heading)", lineHeight: 1 }}>
                            Business Breakthrough<br />Team
                        </h2>
                    </div>
                    {/* Navigation Arrows */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        {["left", "right"].map(dir => (
                            <button key={dir} onClick={() => scroll(dir)} style={{
                                width: "50px", height: "50px", borderRadius: "50%",
                                border: "2px solid #e5e7eb", background: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.querySelector("svg").style.stroke = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.querySelector("svg").style.stroke = "#555"; }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
                                    {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    style={{
                        display: "flex",
                        gap: "24px",
                        overflowX: "hidden", // Hidden to feel like a banner/carousel
                        scrollBehavior: "smooth",
                        padding: "10px 0 30px"
                    }}
                >
                    {TEAM.map(member => (
                        <div key={member.id} style={{
                            minWidth: "calc(33.333% - 16px)", // 3-item view
                            borderRadius: "24px", overflow: "hidden",
                            background: "#fff",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "pointer",
                            position: "relative"
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-10px)";
                                e.currentTarget.style.boxShadow = `0 20px 50px ${member.glow}44`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.04)";
                            }}
                        >
                            {/* Portrait image with neon glow bg */}

                            {/* Info */}
                            <div style={{ padding: "24px 20px 30px", textAlign: "center" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>{member.name}</h3>
                                <p style={{ fontSize: "15px", color: "#6b7280", margin: 0, fontWeight: 500 }}>{member.role}</p>

                                {/* Social dots */}
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                                    {["f", "in", "t"].map(s => (
                                        <div key={s} style={{
                                            width: "36px", height: "36px", borderRadius: "50%",
                                            background: `${member.glow}15`, border: `1px solid ${member.glow}33`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "12px", fontWeight: 800, color: member.glow, cursor: "pointer",
                                            transition: "all 0.3s ease",
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background = member.glow; e.currentTarget.style.color = "#fff"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = `${member.glow}15`; e.currentTarget.style.color = member.glow; }}
                                        >{s}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
