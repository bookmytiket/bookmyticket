"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function VideoHeroBanner() {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const bannerConfig = useQuery(api.systemConfig.getConfig, { key: "admin_video_banner" });
    const defaultConfig = {
        videoUrl: "/bookmyticket/videoplayback.mp4",
        title1: "Discover Your Next",
        title2: "Unforgettable Experience",
        subtitle: "Explore concerts, shows, nightlife, and exclusive experiences happening around you.",
        categories: ["Event Posted", "Event Booked", "Sponsors"]
    };
    const config = React.useMemo(() => {
        if (bannerConfig == null || bannerConfig === undefined) return defaultConfig;
        try {
            const parsed = typeof bannerConfig === "string" ? JSON.parse(bannerConfig) : bannerConfig;
            return typeof parsed === "object" && parsed !== null ? { ...defaultConfig, ...parsed } : defaultConfig;
        } catch (_) {
            return defaultConfig;
        }
    }, [bannerConfig]);

    const categories = config.categories || ["Event Posted", "Event Booked", "Sponsors"];

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleCategoryClick = (cat) => {
        router.push(`/?category=${encodeURIComponent(cat)}`);
    };

    const videoRef = React.useRef(null);
    React.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            if (video.currentTime < 3) {
                video.currentTime = 3;
            }
            video.play().catch(e => console.log("Video auto-play prevented:", e));
        };

        const handleTimeUpdate = () => {
            if (video.currentTime >= 30) {
                video.currentTime = 3;
            }
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("timeupdate", handleTimeUpdate);

        // Fallback in case properties are already loaded
        if (video.readyState >= 1) {
            if (video.currentTime < 3) {
                video.currentTime = 3;
            }
            video.play().catch(e => console.log("Video auto-play prevented:", e));
        }

        return () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("timeupdate", handleTimeUpdate);
        };
    }, []);

    return (
        <section style={{
            position: "relative",
            width: "100%",
            minHeight: "560px",
            height: "75vh",
            maxHeight: "800px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            fontFamily: "var(--font-body), sans-serif"
        }}>
            {/* Background Video */}
            <video
                ref={videoRef}
                src={config.videoUrl || "/bookmyticket/videoplayback.mp4"}
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 0
                }}
            />

            {/* Dark Overlay for Text Readability */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)",
                zIndex: 1
            }}></div>

            {/* Content Container */}
            <div style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                maxWidth: "1240px",
                margin: "0 auto",
                padding: "0 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
            }}>
                {/* Main Heading */}
                <h1 style={{
                    fontSize: "clamp(36px, 5vw, 64px)",
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1.1,
                    marginBottom: "20px",
                    fontFamily: "var(--font-heading), sans-serif",
                    letterSpacing: "-0.04em"
                }}>
                    {config.title1 || "Discover Your Next"} <br />
                    <span style={{
                        background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        display: "inline-block"
                    }}>
                        {config.title2 || "Unforgettable Experience"}
                    </span>
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: "clamp(16px, 2vw, 20px)",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontWeight: 400,
                    marginBottom: "40px",
                    maxWidth: "800px",
                    lineHeight: 1.5
                }}>
                    {config.subtitle || "Explore concerts, shows, nightlife, and exclusive experiences happening around you."}
                </p>


            </div>
        </section>
    );
}
