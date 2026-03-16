"use client";
import React from "react";
import Marquee from "react-fast-marquee";

const NAV_ITEMS = [
    { label: "Live Concerts", icon: "🎵" },
    { label: "Standup Comedy", icon: "🎭" },
    { label: "Sporting Events", icon: "🏆" },
    { label: "Movie Premieres", icon: "🎬" },
    { label: "Workshops", icon: "🎪" },
    { label: "Podcasts Live", icon: "🎙️" },
    { label: "Nightlife", icon: "🎉" },
    { label: "Food Festivals", icon: "🍽️" },
    { label: "Exclusive Experiences", icon: "✨" },
];

export default function SubnavMarquee() {
    return (
        <div style={{
            width: "100%",
            backgroundColor: "#fff",
            borderBottom: "1px solid #eaeaea",
            borderTop: "1px solid #eaeaea",
            padding: "16px 0",
            fontFamily: "var(--font-body), sans-serif",
            overflow: "hidden"
        }}>
            <Marquee
                speed={50}
                gradient={true}
                gradientColor={[255, 255, 255]}
                gradientWidth={50}
                pauseOnHover={true}
            >
                {NAV_ITEMS.map((item, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            margin: "0 24px",
                            padding: "8px 16px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "50px",
                            border: "1px solid #f3f4f6",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap"
                        }}
                        className="hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff1f2";
                            e.currentTarget.style.borderColor = "#fecdd3";
                            e.currentTarget.style.color = "#e11d48";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                            e.currentTarget.style.borderColor = "#f3f4f6";
                            e.currentTarget.style.color = "#111827";
                        }}
                    >
                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{item.label}</span>
                    </div>
                ))}
            </Marquee>
        </div>
    );
}
