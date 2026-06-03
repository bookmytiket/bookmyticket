"use client";
import React from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

export default function RecentMemories({ memories: propMemories = [] }) {
    const { data: convexMemories } = useSupabaseQuery('memories', (q) => q, []);

    // Prioritize memories from Supabase, fallback to props (static data)
    const displayMemories = (convexMemories && convexMemories.length > 0)
        ? convexMemories
        : propMemories;

    const galleryItems = displayMemories.length > 0
        ? displayMemories.map(mem => ({
            image: mem.image_url || mem.img || mem.imageUrl,
            text: mem.alt_text || mem.alt || mem.altText
        }))
        : [];

    if (galleryItems.length === 0) return null;

    return (
        <section style={{ width: "100%", background: "#FAF9F6", padding: "60px 0 40px", overflow: "hidden" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>

                {/* Header */}
                <div style={{ marginBottom: "40px", textAlign: "center" }}>
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
                        }}>2026</span>
                    </h2>
                </div>

                <div style={{ margin: '0 auto', maxWidth: '100%', paddingBottom: '30px' }}>
                    <style>{`
                        .memories-swiper .swiper-pagination-bullet {
                            background: #cbd5e1;
                            opacity: 1;
                        }
                        .memories-swiper .swiper-pagination-bullet-active {
                            background: #f43f5e;
                        }
                    `}</style>
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={24}
                        slidesPerView={1}
                        loop={galleryItems.length > 3}
                        autoplay={{ delay: 2500, disableOnInteraction: false }}
                        pagination={{ clickable: true, dynamicBullets: true }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2,
                            },
                            1024: {
                                slidesPerView: 3,
                            },
                        }}
                        className="memories-swiper"
                        style={{ paddingBottom: '40px', paddingLeft: '10px', paddingRight: '10px' }}
                    >
                        {galleryItems.map((item, idx) => (
                            <SwiperSlide key={idx}>
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: '4/3',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                                    transition: 'transform 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <img 
                                        src={item.image} 
                                        alt={item.text || 'Memory'} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {item.text && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0, left: 0, right: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                                            padding: '40px 20px 20px',
                                            color: '#fff',
                                            textAlign: 'center',
                                            backdropFilter: 'blur(2px)'
                                        }}>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}>{item.text}</h3>
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Explore Button */}
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <button style={{
                        padding: "14px 36px", borderRadius: "50px",
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
            </div>
        </section>
    );
}
