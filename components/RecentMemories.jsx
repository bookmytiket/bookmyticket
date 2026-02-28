import { useState, useEffect, useRef } from "react";

const MEMORIES = [
    { id: 1, img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80", alt: "Concert" },
    { id: 2, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80", alt: "Festival" },
    { id: 3, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", alt: "Conference" },
    { id: 4, img: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80", alt: "Party" },
    { id: 5, img: "https://images.unsplash.com/photo-1459749411177-042180ce673c?w=800&q=80", alt: "Music" },
    { id: 6, img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80", alt: "Singer" },
    { id: 7, img: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80", alt: "Dance" },
    { id: 8, img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80", alt: "Artist" },
    { id: 9, img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80", alt: "Summit" },
];

export default function RecentMemories() {
    const [hovered, setHovered] = useState(null);
    const scrollRef = useRef(null);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
                } else {
                    scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
                }
            }
        }, 3000);
        return () => clearInterval(timer);
    }, [paused]);

    return (
        <section style={{ width: "100%", background: "#fff", padding: "60px 0" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.1em" }}>📸 Gallery</span>
                    <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#111827", margin: "8px 0 6px", fontFamily: "var(--font-heading)" }}>
                        Recent Memories 2024
                    </h2>
                    <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
                        Moments captured from our most unforgettable events this year
                    </p>
                </div>

                {/* Sliding Carousel */}
                <div
                    ref={scrollRef}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    style={{
                        display: "flex",
                        gap: "20px",
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        padding: "10px 0",
                        scrollBehavior: "smooth"
                    }}
                >
                    {MEMORIES.map((mem) => (
                        <div
                            key={mem.id}
                            style={{
                                minWidth: "320px",
                                width: "320px",
                                height: "240px",
                                position: "relative",
                                borderRadius: "14px",
                                overflow: "hidden",
                                cursor: "pointer",
                                flexShrink: 0
                            }}
                            onMouseEnter={() => setHovered(mem.id)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <img
                                src={mem.img}
                                alt={mem.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    transition: "transform 0.5s ease",
                                    transform: hovered === mem.id ? "scale(1.1)" : "scale(1)",
                                }}
                            />
                            {/* Hover overlay */}
                            <div style={{
                                position: "absolute", inset: 0,
                                background: hovered === mem.id ? "rgba(99,102,241,0.4)" : "rgba(0,0,0,0)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.3s ease",
                            }}>
                                {hovered === mem.id && (
                                    <div style={{
                                        width: "48px", height: "48px", borderRadius: "50%",
                                        background: "rgba(255,255,255,0.9)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* View all button */}
                <div style={{ textAlign: "center", marginTop: "32px" }}>
                    <button style={{
                        padding: "12px 32px", borderRadius: "50px",
                        background: "transparent", border: "2px solid #6366f1",
                        color: "#6366f1", fontSize: "14px", fontWeight: 700,
                        cursor: "pointer", transition: "all 0.25s ease",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6366f1"; }}
                    >
                        View All Memories →
                    </button>
                </div>
            </div>
        </section>
    );
}
