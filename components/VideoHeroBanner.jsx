"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";

export default function VideoHeroBanner() {
    const [searchQuery, setSearchQuery] = useState("");

    const categories = ["Concert", "Sports", "Musics", "Live Shows", "Comedy Show"];

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
                src="/bookmyticket/videoplayback.mp4"
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
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1.1,
                    marginBottom: "20px",
                    fontFamily: "var(--font-heading), sans-serif",
                    letterSpacing: "-0.02em"
                }}>
                    Discover Your Next <br />
                    <span style={{
                        background: "linear-gradient(90deg, #f97316 0%, #ef4444 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        display: "inline-block"
                    }}>
                        Unforgettable Experience
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
                    Explore concerts, shows, nightlife, and exclusive experiences happening around you.
                </p>

                {/* Search Bar */}
                <div style={{
                    display: "flex",
                    width: "100%",
                    maxWidth: "600px",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    padding: "6px",
                    marginBottom: "32px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        flex: 1,
                        paddingLeft: "12px"
                    }}>
                        <Search size={20} color="#6b7280" />
                        <input
                            type="text"
                            placeholder="Search For Any Event"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: "none",
                                outline: "none",
                                width: "100%",
                                padding: "12px 14px",
                                fontSize: "16px",
                                color: "#111827",
                                background: "transparent"
                            }}
                        />
                    </div>
                    <button style={{
                        background: "linear-gradient(90deg, #f97316 0%, #ef4444 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0 28px",
                        fontSize: "16px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "opacity 0.2s"
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                        <Search size={18} />
                        Search
                    </button>
                </div>

                {/* Category Pills */}
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px"
                }}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            style={{
                                background: "rgba(0, 0, 0, 0.4)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                color: "#fff",
                                padding: "10px 24px",
                                borderRadius: "50px",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
