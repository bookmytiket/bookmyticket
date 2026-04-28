"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BADGES = [
    { label: "Trending", color: "#fff", bg: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)" },
    { label: "Recommended", color: "#fff", bg: "linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)" },
    { label: "Exclusive", color: "#fff", bg: "linear-gradient(90deg, #f43f5e 0%, #d946ef 100%)" },
    { label: "Sports", color: "#fff", bg: "linear-gradient(90deg, #f84464 0%, #c026d3 100%)" }
];

export default function DynamicBadge({ size = "small" }) {
    const [badgeIdx, setBadgeIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => {
            setBadgeIdx(prev => (prev + 1) % BADGES.length);
        }, 3000);
        return () => clearInterval(t);
    }, []);

    const isLarge = size === "large";
    const isSmall = size === "small";
    const isMedium = size === "medium";

    let fontSize = "11px";
    let padding = "4px 14px";
    let minWidth = "100px";

    if (isLarge) {
        fontSize = "14px";
        padding = "8px 24px";
        minWidth = "140px";
    } else if (isMedium) {
        fontSize = "12px";
        padding = "6px 18px";
        minWidth = "120px";
    } else if (isSmall) {
        fontSize = "9px";
        padding = "2px 8px";
        minWidth = "70px";
    }

    return (
        <div style={{ perspective: "1000px", display: "inline-block" }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={badgeIdx}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{
                        background: BADGES[badgeIdx].bg,
                        color: BADGES[badgeIdx].color,
                        fontSize: fontSize,
                        fontWeight: 900,
                        padding: padding,
                        borderRadius: "24px",
                        textTransform: "capitalize",
                        letterSpacing: "0.04em",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: minWidth,
                        backfaceVisibility: "hidden",
                        transformStyle: "preserve-3d"
                    }}
                >
                    {BADGES[badgeIdx].label}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
