import React from "react";
import CardSwap, { Card } from './CardSwap';

const MEMORIES = [
    { id: 1, img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80", alt: "Concert VIPs" },
    { id: 2, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80", alt: "Music Festival" },
    { id: 3, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", alt: "Tech Conference" },
    { id: 4, img: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80", alt: "Night Party" },
    { id: 5, img: "https://images.unsplash.com/photo-1459749411177-042180ce673c?w=800&q=80", alt: "Live Music" }
];

export default function RecentMemories() {
    return (
        <section style={{ width: "100%", background: "#fff", padding: "80px 0", overflow: "hidden" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header */}
                <div style={{ marginBottom: "40px", textAlign: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 750, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "10px" }}>✦ Our Gallery</span>
                    <h2 style={{ fontSize: "40px", fontWeight: 900, color: "#111827", margin: 0, fontFamily: "var(--font-heading)", lineHeight: 1 }}>
                        Recent Memories 2024
                    </h2>
                </div>

                {/* Animated Cards Container */}
                <div style={{ height: '350px', position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '80px' }}>
                    <CardSwap
                        width={280}
                        height={200}
                        cardDistance={30}
                        verticalDistance={40}
                        delay={5000}
                        pauseOnHover={false}
                    >
                        {MEMORIES.map((mem) => (
                            <Card key={mem.id} style={{ padding: '0', overflow: 'hidden' }}>
                                <img
                                    src={mem.img}
                                    alt={mem.alt}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '30px 20px',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', color: '#fff'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{mem.alt}</h3>
                                </div>
                            </Card>
                        ))}
                    </CardSwap>
                </div>

                {/* View all button */}
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <button style={{
                        padding: "16px 40px", borderRadius: "50px",
                        background: "#fff", border: "2px solid #f97316",
                        color: "#f97316", fontSize: "15px", fontWeight: 800,
                        cursor: "pointer", transition: "all 0.35s ease",
                        boxShadow: "0 4px 15px rgba(249,115,22,0.1)"
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(249,115,22,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#f97316"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(249,115,22,0.1)"; }}
                    >
                        Explore Full Gallery ➔
                    </button>
                </div>

            </div>
        </section>
    );
}
