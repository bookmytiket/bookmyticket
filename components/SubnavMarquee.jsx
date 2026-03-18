"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Marquee from "react-fast-marquee";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const FALLBACK_NAV_ITEMS = [
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
    const router = useRouter();
    const convexCategories = useQuery(api.homeSettings.getCategories);

    const items = useMemo(() => {
        if (convexCategories && convexCategories.length > 0) {
            return convexCategories.map(c => ({ label: c.name, icon: c.icon || "✨" }));
        }
        return FALLBACK_NAV_ITEMS;
    }, [convexCategories]);

    return (
        <div style={{
            width: "100%",
            padding: "0",
            backgroundColor: "transparent",
            fontFamily: "var(--font-body), sans-serif",
            overflow: "hidden"
        }}>
            <div style={{
                backgroundColor: "#fff",
                padding: "16px 0",
                borderBottom: "1px solid #eaeaea",
                borderTop: "1px solid #eaeaea",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)"
            }}>
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
        </div>
    );
}
