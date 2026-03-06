"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tag, Zap, Gift } from "lucide-react";

export default function PromotionBanner() {
    const promotions = useQuery(api.systemConfig.getConfig, { key: "admin_promotions" }) || [];

    if (!Array.isArray(promotions) || promotions.length === 0) return null;

    // Filter valid promotions (could add date check here if needed)
    const activePromos = promotions;

    return (
        <div style={{
            width: "100%",
            backgroundColor: "transparent",
            padding: "min(12px, 2vh) 0",
            borderBottom: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            position: "relative"
        }}>
            <div style={{
                display: "flex",
                gap: "min(24px, 4vw)",
                alignItems: "center",
                whiteSpace: "nowrap",
                animation: "blink 3s step-end infinite",
                padding: "0 10px"
            }}>
                {activePromos.map((promo, idx) => (
                    <div key={idx} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "min(10px, 2vw)",
                        fontSize: "clamp(12px, 2.5vw, 18px)",
                        fontWeight: 900,
                        padding: "0 min(20px, 4vw)",
                        background: "linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundSize: "200% auto",
                        animation: "rainbow 3s linear infinite"
                    }}>
                        <span style={{ fontSize: "clamp(14px, 3vw, 20px)", filter: "none", WebkitTextFillColor: "initial" }}>{promo.bogo ? "⚡" : "🏷️"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {promo.bogo ? (
                                <>BUY 1 GET 1 FREE! Code: <span style={{ textDecoration: "underline" }}>{promo.code}</span></>
                            ) : (
                                <>GET {promo.type === "percent" ? `${promo.value}%` : `₹${promo.value}`} OFF! Code: <span style={{ textDecoration: "underline" }}>{promo.code}</span></>
                            )}
                        </span>
                        {idx < activePromos.length - 1 && activePromos.length > 1 && (
                            <span style={{ opacity: 0.3, margin: "0 10px", WebkitTextFillColor: "#000" }}>•</span>
                        )}
                    </div>
                ))}
            </div>


            <style>{`
                @keyframes rainbow {
                    to { background-position: 200% center; }
                }
                @keyframes blink {
                    from, to { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
