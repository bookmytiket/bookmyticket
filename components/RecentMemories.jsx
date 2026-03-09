"use client";
import React from "react";
import dynamic from "next/dynamic";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const CircularGallery = dynamic(() => import("./CircularGallery"), { ssr: false });

export default function RecentMemories({ memories: propMemories = [] }) {
    const convexMemories = useQuery(api.memories.getMemories);

    // Prioritize memories from Convex, fallback to props (static data)
    const displayMemories = (convexMemories && convexMemories.length > 0)
        ? convexMemories
        : propMemories;

    const galleryItems = displayMemories.length > 0
        ? displayMemories.map(mem => ({
            image: mem.imageUrl || mem.img,
            text: mem.altText || mem.alt
        }))
        : undefined;

    return (
        <section style={{ width: "100%", background: "#fff", padding: "40px 0 24px", overflow: "hidden" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header */}
                <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    <span style={{
                        fontSize: "14px", fontWeight: 750, color: "#f97316",
                        textTransform: "uppercase", letterSpacing: "0.15em",
                        display: "block", marginBottom: "10px"
                    }}>✦ Our Gallery</span>
                    <h2 style={{
                        fontSize: "40px", fontWeight: 900, color: "#111827",
                        margin: 0, fontFamily: "var(--font-heading)", lineHeight: 1,
                        letterSpacing: "-0.04em"
                    }}>
                        Recent Memories <span style={{
                            background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'inline-block'
                        }}>2024</span>
                    </h2>
                </div>
            </div>

            {/* Circular Gallery */}
            <div style={{ height: "350px", position: "relative" }}>
                <CircularGallery
                    items={galleryItems}
                    bend={1}
                    textColor="#000000"
                    borderRadius={0.05}
                    scrollSpeed={2}
                    scrollEase={0.05}
                    autoScroll={true}
                    autoScrollSpeed={0.08}
                />
            </div>

            {/* Explore Button */}
            <div style={{ textAlign: "center", marginTop: "30px" }}>
                <button style={{
                    padding: "16px 40px", borderRadius: "50px",
                    background: "transparent", border: "2px solid #f97316",
                    color: "#f97316", fontSize: "15px", fontWeight: 800,
                    cursor: "pointer", transition: "all 0.35s ease",
                    boxShadow: "0 4px 15px rgba(249,115,22,0.1)"
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(249,115,22,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#f97316"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(249,115,22,0.1)"; }}
                >
                    Explore Full Gallery ➔
                </button>
            </div>
        </section>
    );
}
