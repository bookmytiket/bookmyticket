import { useRef, useEffect, useState } from "react";

const TEAM = [
    { id: 1, name: "Arun Kumar", role: "Founder & CEO", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face", glow: "#6366f1" },
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
        const width = 260; // card + gap
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
        }, 2000);
        return () => clearInterval(timer);
    }, [paused]);

    return (
        <section style={{ width: "100%", background: "#f9fafb", padding: "60px 0" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header with arrows */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "36px" }}>
                    <div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                            ✦ Meet the Team
                        </span>
                        <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#111827", margin: 0, fontFamily: "var(--font-heading)", lineHeight: 1.1 }}>
                            Business Breakthrough<br />Team
                        </h2>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        {["left", "right"].map(dir => (
                            <button key={dir} onClick={() => scroll(dir)} style={{
                                width: "44px", height: "44px", borderRadius: "50%",
                                border: "2px solid #e5e7eb", background: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all 0.25s ease",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.querySelector("svg").style.stroke = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.querySelector("svg").style.stroke = "#555"; }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
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
                        display: "flex", gap: "20px", overflowX: "auto",
                        scrollbarWidth: "none", msOverflowStyle: "none",
                        paddingBottom: "12px", scrollBehavior: "smooth"
                    }}
                >
                    {TEAM.map(member => (
                        <div key={member.id} style={{
                            minWidth: "240px", width: "240px", flexShrink: 0,
                            borderRadius: "20px", overflow: "hidden",
                            background: "#fff",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                            cursor: "pointer",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${member.glow}33`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
                        >
                            {/* Portrait image with neon glow bg */}
                            <div style={{
                                height: "280px", position: "relative", overflow: "hidden",
                                background: `radial-gradient(circle at 50% 80%, ${member.glow}55 0%, ${member.glow}11 60%, #1a1a2e 100%)`,
                            }}>
                                <img src={member.img} alt={member.name} style={{
                                    width: "100%", height: "100%", objectFit: "cover", objectPosition: "top",
                                    display: "block", transition: "transform 0.4s ease",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                />
                                {/* Neon bottom glow */}
                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", background: `linear-gradient(to top, ${member.glow}88, transparent)` }} />
                            </div>
                            {/* Info */}
                            <div style={{ padding: "16px 18px 20px", textAlign: "center" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>{member.name}</h3>
                                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: 500 }}>{member.role}</p>
                                {/* Social dots */}
                                <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
                                    {["f", "in", "t"].map(s => (
                                        <div key={s} style={{
                                            width: "28px", height: "28px", borderRadius: "50%",
                                            background: `${member.glow}22`, border: `1px solid ${member.glow}44`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "10px", fontWeight: 800, color: member.glow, cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}>{s}</div>
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
