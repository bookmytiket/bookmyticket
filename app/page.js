"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HeroBanner from '@/components/HeroBanner';
import VideoHeroBanner from '@/components/VideoHeroBanner';
import Spotlight from '@/components/Spotlight';
import FeaturedOrganisers from '@/components/FeaturedOrganisers';
import FeaturedEvents from '@/components/FeaturedEvents';
import RecentlyViewedEvents from '@/components/RecentlyViewedEvents';
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

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("category");
  const [newOrgEvents, setNewOrgEvents] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [eventPartners, setEventPartners] = useState([]);

  const allEventsForFilter = useMemo(() => [...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []), ...(Array.isArray(newOrgEvents) ? newOrgEvents : [])], [newOrgEvents]);

  const normalizedOrgEvents = useMemo(() => (Array.isArray(newOrgEvents) ? newOrgEvents : []).map((ev) => ({
    ...ev,
    id: ev._id || ev.id || ev.title?.slice(0, 8) + Date.now(),
    title: ev.title || "Event",
    img: ev.img || ev.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop",
    date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
    location: ev.location || ev.venue || ev.address || "Venue",
    featured: ev.featured !== false,
    trending: ev.trending !== false,
    spotlight: ev.spotlight === true,
    exclusive: ev.exclusive === true,
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

  const exclusiveEventsList = useMemo(() => [
    ...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS.filter((e) => e.exclusive) : []),
    ...normalizedOrgEvents.filter((e) => e.exclusive),
  ], [normalizedOrgEvents]);

  const popularEventsList = useMemo(() => [
    ...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []),
    ...normalizedOrgEvents,
  ], [normalizedOrgEvents]);

  const filteredEvents = useMemo(() => {
    if (!activeCat) return [];
    const cat = { name: activeCat, slug: activeCat.toLowerCase().trim().replace(/\s+/g, '-') };
    return allEventsForFilter.filter(ev => eventMatchesCategory(ev, cat));
  }, [activeCat, allEventsForFilter]);

  const convexEvents = useQuery(api.events.getActiveEvents) || [];

  useEffect(() => {
    if (convexEvents.length > 0) {
      setNewOrgEvents(convexEvents);
    }
  }, [convexEvents]);

  // Fallback or old local storage cleanup (Optional: keep using convexEvents instead, logic below handles parsing well)


  const heroSlidesConfig = useQuery(api.systemConfig.getConfig, { key: "admin_hero_slides" });
  const eventPartnersConfig = useQuery(api.systemConfig.getConfig, { key: "admin_event_partners" });

  useEffect(() => {
    if (heroSlidesConfig) {
      setHeroSlides(Array.isArray(heroSlidesConfig) ? heroSlidesConfig : HERO_BANNER_SLIDES);
    } else {
      setHeroSlides(Array.isArray(HERO_BANNER_SLIDES) ? HERO_BANNER_SLIDES : []);
    }
  }, [heroSlidesConfig]);

  useEffect(() => {
    if (eventPartnersConfig) {
      setEventPartners(Array.isArray(eventPartnersConfig) ? eventPartnersConfig : FEATURED_ORGANISERS);
    } else {
      setEventPartners(FEATURED_ORGANISERS);
    }
  }, [eventPartnersConfig]);

  // Removed focus event listener since Convex useQuery is reactive



  return (
    <>
      <main style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'var(--header-h)' }}>

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

            {/* Recently Viewed Events — image-based; populated when user clicks any event */}
            <div style={{ width: '100%' }}>
              <RecentlyViewedEvents />
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

            {/* 5) Explore Popular Events — includes Organiser events */}
            <div style={{ width: '100%' }}>
              <PopularEvents events={popularEventsList} />
            </div>

            {/* 6) Exclusive Events — includes Organiser events with exclusive flag */}
            <div style={{ width: '100%' }}>
              <ExclusiveEvents events={exclusiveEventsList} />
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
              <FeaturedOrganisers organisers={eventPartners} />
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
