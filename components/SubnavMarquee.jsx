"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Marquee from "react-fast-marquee";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND_COUPONS } from "@/app/data/homeEvents";

const FALLBACK_NAV_ITEMS = [
    { label: "Events", icon: "🎟️" },
    { label: "Services", icon: "🛠️" },
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

function CouponFlipTicker() {
    const { data: coupons } = useSupabaseQuery('branding_coupons', (q) => q.eq('status', 'Active'), []);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!coupons || coupons.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % coupons.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [coupons]);

    if (!coupons || coupons.length === 0) return null;

    const current = coupons[index];

    const copyCode = () => {
        navigator.clipboard.writeText(current.code);
        alert(`Coupon code ${current.code} copied!`);
    };

    return (
        <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 20,
            pointerEvents: "none"
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    onClick={copyCode}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        backgroundColor: "#111827",
                        padding: "6px 20px",
                        borderRadius: "100px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        minWidth: "280px",
                        justifyContent: "center"
                    }}
                >
                    <div style={{
                        backgroundColor: "#f84464",
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                    }}>
                        CODE
                    </div>
                    <span style={{ 
                        color: "#fff", 
                        fontSize: "13px", 
                        fontWeight: 700,
                        letterSpacing: "0.02em"
                    }}>
                        {current.code}: <span style={{ color: "#f84464" }}>{current.title}</span>
                    </span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default function SubnavMarquee() {
    const router = useRouter();
    const { data: convexCategories } = useSupabaseQuery('categories', (q) => q.order('sort_order'), []);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            // Hide when scrolled more than 100px
            setIsVisible(window.scrollY < 100);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const items = useMemo(() => {
        if (convexCategories && convexCategories.length > 0) {
            return convexCategories.map(c => ({ label: c.name, icon: c.icon || "✨" }));
        }
        return FALLBACK_NAV_ITEMS;
    }, [convexCategories]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        width: "100%",
                        padding: "0",
                        backgroundColor: "transparent",
                        fontFamily: "var(--font-body), sans-serif",
                        overflow: "hidden",
                        zIndex: 10
                    }}
                >
                    <div style={{
                        backgroundColor: "#fff",
                        padding: "10px 0",
                        borderBottom: "1px solid #eaeaea",
                        borderTop: "1px solid #eaeaea",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden"
                    }}>
                        <CouponFlipTicker />
                        <Marquee
                            speed={50}
                            gradient={true}
                            gradientColor={[255, 255, 255]}
                            gradientWidth={50}
                            pauseOnHover={true}
                        >
                            {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => router.push(`/?category=${encodeURIComponent(item.label)}`)}
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
