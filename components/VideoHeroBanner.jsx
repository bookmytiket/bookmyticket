"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Ticket, Users, Briefcase, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, animate } from "framer-motion";
import Script from "next/script";

const Counter = ({ value, suffix = "+" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
};

const StatBadge = ({ icon: Icon, label, value, suffix, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '160px'
    }}
  >
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      background: `${color}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color
    }}>
      <Icon size={18} strokeWidth={2.5} />
    </div>
    <div>
      <h4 style={{ 
        margin: 0, 
        fontSize: '18px', 
        fontWeight: 800, 
        color: '#fff',
        lineHeight: 1
      }}>
        <Counter value={value} suffix={suffix} />
      </h4>
      <p style={{ 
        margin: 0, 
        fontSize: '10px', 
        color: 'rgba(255,255,255,0.6)', 
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.05em'
      }}>
        {label}
      </p>
    </div>
  </motion.div>
);

export default function VideoHeroBanner() {
    const router = useRouter();
    const [stats, setStats] = useState({
      tickets: 1000,
      organisers: 30,
      services: 22
    });

    useEffect(() => {
      async function fetchStats() {
        try {
          const [ticketsRes, organisersRes, servicesRes] = await Promise.all([
            supabase.from('bookings').select('id', { count: 'exact', head: true }),
            supabase.from('organisers').select('id', { count: 'exact', head: true }),
            supabase.from('vendors').select('id', { count: 'exact', head: true })
          ]);

          setStats({
            tickets: (ticketsRes.count || 0) + 1000,
            organisers: (organisersRes.count || 0) + 30,
            services: (servicesRes.count || 0) + 22
          });
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      }
      fetchStats();
    }, []);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const videoRef = useRef(null);
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            if (video.currentTime < 3) video.currentTime = 3;
            video.play().catch(e => console.log("Video auto-play prevented:", e));
        };

        const handleTimeUpdate = () => {
            if (video.currentTime >= 30) video.currentTime = 3;
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("timeupdate", handleTimeUpdate);

        if (video.readyState >= 1) {
            if (video.currentTime < 3) video.currentTime = 3;
            video.play().catch(e => console.log("Video auto-play prevented:", e));
        }

        return () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("timeupdate", handleTimeUpdate);
        };
    }, []);

    const videoSchema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "BookMyTicket - Your Event Partner",
      "description": "Experience the best online event ticketing and service booking platform with BookMyTicket.",
      "thumbnailUrl": "https://bookmyticket.net/og-image.png",
      "uploadDate": "2024-01-01T08:00:00+08:00",
      "duration": "PT0M30S",
      "contentUrl": "https://bookmyticket.net/bookmyticket/videoplayback.mp4",
      "embedUrl": "https://bookmyticket.net/",
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": { "@type": "WatchAction" },
        "userInteractionCount": 10000
      }
    };

    return (
        <section style={{
            position: "relative",
            width: "100%",
            height: isMobile ? "50vh" : "70vh",
            minHeight: isMobile ? "400px" : "600px",
            maxHeight: "800px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            fontFamily: "var(--font-body), sans-serif"
        }}>
            <Script
              id="video-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
            />
            {/* Background Video */}
            <video
                ref={videoRef}
                src="/bookmyticket/videoplayback.mp4"
                poster="/og-image.png"
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

            {/* Premium Gradient Overlay */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)",
                zIndex: 1
            }}></div>

            {/* Content Container */}
            <div style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                maxWidth: "1240px",
                margin: "0 auto",
                padding: isMobile ? "0 24px" : "0 20px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start"
            }}>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    fontSize: isMobile ? "36px" : "clamp(48px, 6vw, 72px)",
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1.05,
                    marginBottom: "20px",
                    fontFamily: "var(--font-heading), sans-serif",
                    letterSpacing: "-0.04em"
                  }}
                >
                    Book Your Next <br />
                    <span style={{
                        background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        display: "inline-block"
                    }}>
                        Experience on BookMyTicket
                    </span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  style={{
                    fontSize: isMobile ? "15px" : "18px",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontWeight: 400,
                    marginBottom: "48px",
                    maxWidth: "600px",
                    lineHeight: 1.6
                  }}
                >
                    Explore concerts, shows, nightlife, and exclusive experiences happening around you. Join the fastest growing community.
                </motion.p>

                {/* Statisticsbadges Grid - The "Image Details" inside the banner */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  width: "100%"
                }}>
                  <StatBadge 
                    icon={Ticket} 
                    label="Tickets Booked" 
                    value={stats.tickets} 
                    suffix="+" 
                    color="#f84464"
                  />
                  <StatBadge 
                    icon={Users} 
                    label="Organisers" 
                    value={stats.organisers} 
                    suffix="+" 
                    color="#8b5cf6"
                  />
                  <StatBadge 
                    icon={Briefcase} 
                    label="Pro Services" 
                    value={stats.services} 
                    suffix="+" 
                    color="#c026d3"
                  />
                  {!isMobile && (
                    <StatBadge 
                      icon={TrendingUp} 
                      label="Engagement" 
                      value={98} 
                      suffix="%" 
                      color="#ec4899"
                    />
                  )}
                </div>
            </div>
        </section>
    );
}
