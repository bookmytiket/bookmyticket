import { useState, useEffect } from "react";

const TESTIMONIALS = [
    {
        id: 1,
        name: "Aishwarya Rajan",
        role: "Entrepreneur, Chennai",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
        rating: 5,
        quote: "BookMyTicket made our event management seamless. The platform is intuitive, fast, and the team was incredibly supportive throughout our launch. Highly recommend it to anyone organizing events!",
        company: "Google",
        eventImg: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=420&fit=crop",
    },
    {
        id: 2,
        name: "Karthik Subramaniam",
        role: "Event Producer, Coimbatore",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
        rating: 5,
        quote: "The best ticketing platform I have used. Real-time analytics, beautiful event pages and instant payouts. Our concert sold out within hours of going live on BookMyTicket!",
        company: "Microsoft",
        eventImg: "https://images.unsplash.com/photo-1459749411177-042180ce673c?w=600&h=420&fit=crop",
    },
    {
        id: 3,
        name: "Meera Pillai",
        role: "Workshop Organizer, Bengaluru",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
        rating: 5,
        quote: "I was amazed by how easy it was to set up virtual events. The countdown timers, RSVPs and payment integrations worked perfectly. Our workshop had 500+ attendees — all through BookMyTicket!",
        company: "Amazon",
        eventImg: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=420&fit=crop",
    },
];

function StarRating({ count }) {
    return (
        <div style={{ display: "flex", gap: "3px" }}>
            {Array.from({ length: count }).map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </div>
    );
}

export default function Testimonials() {
    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const t = TESTIMONIALS[idx];
    const prev = () => setIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    const next = () => setIdx(i => (i + 1) % TESTIMONIALS.length);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(next, 2000);
        return () => clearInterval(timer);
    }, [paused]);

    return (
        <section
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{ width: "100%", background: "#FAF9F6", padding: "60px 0" }}
        >
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Section label */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em" }}>✦ Testimonials</span>
                    <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#111827", margin: "8px 0 0", fontFamily: "var(--font-heading)" }}>
                        What Our Attendees Say
                    </h2>
                </div>

                {/* Split layout */}
                <div style={{ display: "flex", gap: "40px", alignItems: "center", flexWrap: "wrap" }}>

                    {/* Left — Quote */}
                    <div style={{ flex: "1 1 420px" }}>
                        <StarRating count={t.rating} />

                        {/* Big quote mark */}
                        <div style={{ fontSize: "80px", lineHeight: 0.8, color: "#6366f1", margin: "16px 0 8px", fontFamily: "Georgia, serif" }}>"</div>

                        <p style={{
                            fontSize: "17px", color: "#374151", lineHeight: 1.75,
                            fontStyle: "italic", margin: "0 0 28px",
                            minHeight: "100px",
                            transition: "opacity 0.3s ease",
                        }}>
                            {t.quote}
                        </p>

                        {/* Author row */}
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
                            <img src={t.avatar} alt={t.name} style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: "3px solid #6366f1" }} />
                            <div>
                                <p style={{ fontSize: "15px", fontWeight: 800, color: "#111827", margin: 0 }}>{t.name}</p>
                                <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0" }}>{t.role}&nbsp;·&nbsp;
                                    <span style={{ fontWeight: 700, color: "#6366f1" }}>{t.company}</span>
                                </p>
                            </div>
                        </div>

                        {/* Prev / Next arrows */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            {[{ dir: "prev", action: prev, icon: "15 18 9 12 15 6" }, { dir: "next", action: next, icon: "9 18 15 12 9 6" }].map(({ dir, action, icon }) => (
                                <button key={dir} onClick={action} style={{
                                    width: "44px", height: "44px", borderRadius: "50%",
                                    border: "2px solid #e5e7eb", background: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", transition: "all 0.25s ease",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.borderColor = "#6366f1"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points={icon} />
                                    </svg>
                                </button>
                            ))}

                            {/* Dot indicators */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px" }}>
                                {TESTIMONIALS.map((_, i) => (
                                    <button key={i} onClick={() => setIdx(i)} style={{
                                        width: i === idx ? "22px" : "8px", height: "8px",
                                        borderRadius: "4px", background: i === idx ? "#6366f1" : "#d1d5db",
                                        border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                                    }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right — Event image with play overlay */}
                    <div style={{ flex: "1 1 380px", position: "relative", borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 50px rgba(99,102,241,0.15)" }}>
                        <img
                            key={t.id}
                            src={t.eventImg}
                            alt="Event"
                            style={{ width: "100%", height: "340px", objectFit: "cover", display: "block", transition: "opacity 0.4s ease" }}
                        />
                        {/* Play button */}
                        <div style={{
                            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.25)",
                        }}>
                            <div style={{
                                width: "64px", height: "64px", borderRadius: "50%",
                                background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                                transition: "transform 0.2s",
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#6366f1" stroke="none">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
