"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HeroBanner from '@/components/HeroBanner';
import VideoHeroBanner from '@/components/VideoHeroBanner';
import Spotlight from '@/components/Spotlight';
import FeaturedOrganisers from '@/components/FeaturedOrganisers';
import FeaturedEvents from '@/components/FeaturedEvents';
import ComingSoonEvents from '@/components/ComingSoonEvents';
import TrendingEvents from '@/components/TrendingEvents';
import PopularEvents from '@/components/PopularEvents';
import ExclusiveEvents from '@/components/ExclusiveEvents';
import VirtualEvents from '@/components/VirtualEvents';
import RecentMemories from '@/components/RecentMemories';
import Sponsors from '@/components/Sponsors';
import Footer from '@/components/Footer';
import { HOME_EVENTS, MEMORIES, FEATURED_ORGANISERS, HERO_BANNER_SLIDES } from '@/app/data/homeEvents';
import { eventMatchesCategory } from '@/app/utils/categoryMatch';

function TicketCard({ event }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      <img src={event.img} alt={event.title} style={{ width: "100%", height: "160px", objectFit: "cover" }} />
      <div style={{ padding: "16px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px" }}>{event.title}</h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{event.date}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("category");
  const [newOrgEvents, setNewOrgEvents] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);

  const allEventsForFilter = useMemo(() => [...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []), ...(Array.isArray(newOrgEvents) ? newOrgEvents : [])], [newOrgEvents]);

  const normalizedOrgEvents = useMemo(() => (Array.isArray(newOrgEvents) ? newOrgEvents : []).map((ev) => ({
    ...ev,
    id: ev.id ?? ev.title?.slice(0, 8) + Date.now(),
    title: ev.title || "Event",
    img: ev.img || ev.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop",
    date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
    location: ev.location || ev.venue || ev.address || "Venue",
    featured: ev.featured !== false,
    trending: ev.trending !== false,
    spotlight: ev.spotlight === true,
  })), [newOrgEvents]);

  const featuredEventsList = useMemo(() => [
    ...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS.filter((e) => e.featured) : []),
    ...normalizedOrgEvents.filter((e) => e.featured),
  ], [normalizedOrgEvents]);

  const trendingEventsList = useMemo(() => [
    ...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS.filter((e) => e.trending) : []),
    ...normalizedOrgEvents.filter((e) => e.trending),
  ], [normalizedOrgEvents]);

  const spotlightEventsList = useMemo(() => [
    ...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS.filter((e) => e.spotlight) : []),
    ...normalizedOrgEvents.filter((e) => e.spotlight),
  ], [normalizedOrgEvents]);

  const filteredEvents = useMemo(() => {
    if (!activeCat) return [];
    const cat = { name: activeCat, slug: activeCat.toLowerCase().trim().replace(/\s+/g, '-') };
    return allEventsForFilter.filter(ev => eventMatchesCategory(ev, cat));
  }, [activeCat, allEventsForFilter]);

  const loadOrganiserEvents = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("organiser_events");
      setNewOrgEvents(saved ? JSON.parse(saved) : []);
    } catch (_) { setNewOrgEvents([]); }
  }, []);

  useEffect(() => {
    loadOrganiserEvents();
  }, [loadOrganiserEvents]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("admin_hero_slides");
      if (saved) {
        const parsed = JSON.parse(saved);
        setHeroSlides(Array.isArray(parsed) ? parsed : []);
      } else setHeroSlides(Array.isArray(HERO_BANNER_SLIDES) ? HERO_BANNER_SLIDES : []);
    } catch (_) { setHeroSlides(Array.isArray(HERO_BANNER_SLIDES) ? HERO_BANNER_SLIDES : []); }
  }, []);

  useEffect(() => {
    const onFocus = () => loadOrganiserEvents();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadOrganiserEvents]);

  return (
    <>
      <main style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '102px' }}>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap');
          .syne-heading {
            font-family: 'Syne', sans-serif !important;
            animation: slideInLeft 0.8s ease-out forwards;
          }
          @keyframes slideInLeft {
            0% { transform: translateX(-30px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* 0) Hero Banner (Carousel) — uses Admin Home Page > Hero Banner slides when set */}
        <div style={{ width: '100%' }}>
          <HeroBanner slides={heroSlides.length > 0 ? heroSlides : HERO_BANNER_SLIDES} />
        </div>

        {/* Dynamic: Newly Published by Organisers */}
        {newOrgEvents.length > 0 && (
          <section style={{ padding: "60px 0", backgroundColor: "#f8fafc", width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ maxWidth: "1240px", width: "100%", padding: "0 20px" }}>
              <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px", color: "#1e293b" }}>Newly Published Events</h2>
              <p style={{ color: "#64748b", fontSize: "15px", marginBottom: "32px" }}>Directly from our verified event organisers</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                {newOrgEvents.map(ev => (
                  <div key={ev.id} style={{ backgroundColor: "#fff", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", transition: "0.2s" }}>
                    <div style={{ position: "relative", height: "180px" }}>
                      <img src={ev.img || "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=650&fit=crop"} alt={ev.title || "Event"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,255,255,0.9)", color: "#f84464", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800 }}>LIVE</div>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 800, color: "#f84464", letterSpacing: "1px" }}>{(ev.type || "Venue").toUpperCase()}</p>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>{ev.title}</h3>
                      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>{ev.venue || "Online Access"}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>STARTING FROM</p>
                          <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{ev.date}</p>
                        </div>
                        <button style={{ padding: "10px 18px", background: "linear-gradient(90deg,#f84464,#ef4444)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(248,68,100,0.2)" }}>Details</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeCat ? (
          <section style={{ width: '100%', maxWidth: '1240px', padding: '40px 20px', minHeight: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827' }}>{activeCat} Events</h1>
                <p style={{ color: '#666', marginTop: '4px' }}>Discover the best {activeCat.toLowerCase()} experiences in your city.</p>
              </div>
              <button
                onClick={() => router.push('/')}
                style={{ background: '#eee', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
              >
                Clear Filter
              </button>
            </div>

            {filteredEvents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                {filteredEvents.map(event => (
                  <div key={event.id} style={{ transform: 'scale(1.1)', transformOrigin: 'top left' }}>
                    <TicketCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎪</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>No {activeCat} events found right now.</h3>
                <p style={{ color: '#666' }}>Try selecting another category or check back later!</p>
              </div>
            )}
          </section>
        ) : (
          <>

            {/* 1) Video Hero Banner */}
            <div style={{ width: '100%' }}>
              <VideoHeroBanner />
            </div>

            {/* 2) Featured Events — includes Organiser panel events */}
            <div style={{ width: '100%' }}>
              <FeaturedEvents events={featuredEventsList} />
            </div>

            {/* Spotlight — 3D sliding, below Featured Events; includes Organiser events with spotlight */}
            <div style={{ width: '100%' }}>
              <Spotlight events={spotlightEventsList} />
            </div>

            {/* 3) Coming Soon Events */}
            <div style={{ width: '100%' }}>
              <ComingSoonEvents />
            </div>

            {/* 4) Trending Events — includes Organiser panel events */}
            <div style={{ width: '100%' }}>
              <TrendingEvents events={trendingEventsList} />
            </div>

            {/* 5) Explore Popular Events */}
            <div style={{ width: '100%' }}>
              <PopularEvents />
            </div>

            {/* 6) Exclusive Events */}
            <div style={{ width: '100%' }}>
              <ExclusiveEvents />
            </div>

            {/* 7) Virtual Events */}
            <div style={{ width: '100%' }}>
              <VirtualEvents />
            </div>

            {/* 8) Recent Memories */}
            <div style={{ width: '100%' }}>
              <RecentMemories memories={MEMORIES} />
            </div>

            {/* Featured Organisers */}
            <div style={{ width: '100%' }}>
              <FeaturedOrganisers organisers={FEATURED_ORGANISERS} />
            </div>

            {/* 9) Our Official Sponsors */}
            <div style={{ width: '100%' }}>
              <Sponsors />
            </div>

            {/* Dynamic Ticket Element before Footer */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <img
                src="/ticket.png"
                alt="Floating Ticket"
                style={{ width: '450px', height: 'auto', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.1))' }}
              />
            </div>
          </>
        )}

      </main>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}
