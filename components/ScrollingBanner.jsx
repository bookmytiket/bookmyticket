"use client";
import { useState, useEffect } from "react";

const BANNERS = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1240&h=260&fit=crop",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1240&h=260&fit=crop",
    "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?q=80&w=1240&h=260&fit=crop"
];

export default function ScrollingBanner() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const itv = setInterval(() => {
            setIndex(p => (p + 1) % BANNERS.length);
        }, 3000);
        return () => clearInterval(itv);
    }, []);

    return (
        <div style={{
            width: "100%",
            maxWidth: "1240px",
            height: "260px",
            overflow: "hidden",
            borderRadius: "16px",
            position: "relative",
            boxShadow: "0 12px 30px rgba(0,0,0,0.1)"
        }}>
            <div
                style={{
                    display: "flex",
                    transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: `translateX(-${(index * 100) / BANNERS.length}%)`,
                    width: `${BANNERS.length * 100}%`,
                    height: "100%"
                }}
            >
                {BANNERS.map((b, i) => (
                    <div key={i} style={{ width: `${100 / BANNERS.length}%`, height: "100%", flexShrink: 0 }}>
                        <img
                            src={b}
                            alt={`Banner ${i}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                ))}
            </div>

            {/* indicators */}
            <div style={{
                position: "absolute",
                bottom: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "8px"
            }}>
                {BANNERS.map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: index === i ? "#fff" : "rgba(255,255,255,0.4)",
                            transition: "all 0.3s"
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
