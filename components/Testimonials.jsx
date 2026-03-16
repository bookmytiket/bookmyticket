import { useState } from "react";

const TESTIMONIALS = [
    {
        id: 1,
        name: "Aishwarya Rajan",
        role: "Entrepreneur, Chennai",
        rating: 5,
        quote: "BookMyTicket made our event management seamless. The platform is intuitive, fast, and the team was incredibly supportive throughout our launch. Highly recommend it to anyone organizing events!",
        company: "Google",
    },
    {
        id: 2,
        name: "Karthik Subramaniam",
        role: "Event Producer, Coimbatore",
        rating: 5,
        quote: "The best ticketing platform I have used. Real-time analytics, beautiful event pages and instant payouts. Our concert sold out within hours of going live on BookMyTicket!",
        company: "Microsoft",
    },
    {
        id: 3,
        name: "Meera Pillai",
        role: "Workshop Organizer, Bengaluru",
        rating: 5,
        quote: "I was amazed by how easy it was to set up virtual events. The countdown timers, RSVPs and payment integrations worked perfectly. Our workshop had 500+ attendees — all through BookMyTicket!",
        company: "Amazon",
    },
];

export default function Testimonials() {
    const t = TESTIMONIALS[0];

    return (
        <section style={{ width: "100%", background: "#FAF9F6", padding: "60px 0" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Minimalist Slide Container */}
                <div style={{
                    background: "#fff",
                    borderRadius: "32px",
                    overflow: "hidden",
                    boxShadow: "0 25px 70px rgba(0,0,0,0.06)",
                    position: "relative",
                }}>
                    <div style={{ padding: "60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center" }}>

                        {/* Quote Text */}
                        <div style={{ maxWidth: "900px", marginBottom: "40px" }}>
                            <p style={{
                                fontSize: "24px",
                                color: "#111827",
                                lineHeight: 1.6,
                                fontWeight: 600,
                                fontStyle: "italic",
                                transition: "all 0.5s ease"
                            }}>
                                "{t.quote}"
                            </p>
                        </div>

                        {/* Author Info */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <h4 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", margin: 0 }}>{t.name}</h4>
                            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, fontWeight: 500 }}>
                                {t.role} @ <span style={{ color: "#6366f1", fontWeight: 800 }}>{t.company}</span>
                            </p>
                        </div>


                    </div>
                </div>
            </div>
        </section>
    );
}
