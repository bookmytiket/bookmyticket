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
import { MEMORIES, FEATURED_ORGANISERS, HERO_BANNER_SLIDES, HOME_EVENTS } from '@/app/data/homeEvents';
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
  const searchQuery = searchParams.get("q") || "";
  const [newOrgEvents, setNewOrgEvents] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [eventPartners, setEventPartners] = useState([]);

  const allConfig = useQuery(api.systemConfig.getAllConfig);
  const parseConfig = (val) => {
    if (val == null) return undefined;
    try { return typeof val === "string" ? JSON.parse(val) : val; } catch (_) { return val; }
  };
  const homeSectionsOrderRaw = parseConfig(allConfig?.admin_home_sections_order);
  const homeSectionsOrder = Array.isArray(homeSectionsOrderRaw) ? homeSectionsOrderRaw : [
    "Hero Banner", "Sub Navigation", "Featured Events", "Coming Soon", "Spotlight", "Top Hand-picked"
  ];
  const siteBranding = parseConfig(allConfig?.admin_site_branding) || {
    name: "book my ticket",
    logoColor: "#111111",
    logoUrl: "/logo.png"
  };
  const metaSettings = parseConfig(allConfig?.admin_meta_settings) || {
    global: { title: "BookMyTicket", description: "Best Event Ticketing Platform" }
  };

  useEffect(() => {
    if (metaSettings?.global?.title) {
      document.title = metaSettings.global.title;
    }
  }, [metaSettings]);

  const convexEvents = useQuery(api.events.getActiveEvents) || [];

  const normalizedOrgEvents = useMemo(() => (Array.isArray(newOrgEvents) ? newOrgEvents : []).map((ev) => ({
    ...ev,
    id: ev._id || ev.id || ev.title?.slice(0, 8) + Math.random().toString(36).substring(7),
    title: ev.title || "Event",
    img: ev.img || ev.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop",
    date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
    location: ev.location || ev.venue || ev.address || "Venue",
    featured: ev.featured !== false,
    trending: ev.trending !== false,
    spotlight: ev.spotlight === true,
    exclusive: ev.exclusive === true,
  })), [newOrgEvents]);

  const featuredEventsList = useMemo(() => normalizedOrgEvents.filter((e) => e.featured), [normalizedOrgEvents]);

  const trendingEventsList = useMemo(() => normalizedOrgEvents.filter((e) => e.trending), [normalizedOrgEvents]);

  const spotlightEventsList = useMemo(() => normalizedOrgEvents.filter((e) => e.spotlight), [normalizedOrgEvents]);

  const exclusiveEventsList = useMemo(() => normalizedOrgEvents.filter((e) => e.exclusive), [normalizedOrgEvents]);

  const popularEventsList = useMemo(() => normalizedOrgEvents, [normalizedOrgEvents]);

  const allEventsForFilter = useMemo(() => [
    ...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []),
    ...(Array.isArray(normalizedOrgEvents) ? normalizedOrgEvents : [])
  ], [normalizedOrgEvents]);

  const filteredEvents = useMemo(() => {
    let results = allEventsForFilter;

    // 1. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(ev =>
        (ev.title && ev.title.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Category
    if (activeCat) {
      const cat = { name: activeCat, slug: activeCat.toLowerCase().trim().replace(/\s+/g, '-') };
      results = results.filter(ev => eventMatchesCategory(ev, cat));
    }

    return results;
  }, [activeCat, searchQuery, allEventsForFilter]);


  useEffect(() => {
    setNewOrgEvents(convexEvents);
  }, [convexEvents]);

  // Fallback or old local storage cleanup (Optional: keep using convexEvents instead, logic below handles parsing well)


  const heroSlidesConfig = useQuery(api.systemConfig.getConfig, { key: "admin_hero_slides" });
  const eventPartnersConfig = useQuery(api.systemConfig.getConfig, { key: "admin_event_partners" });

  useEffect(() => {
    const parsed = heroSlidesConfig != null ? parseConfig(heroSlidesConfig) : null;
    const slides = Array.isArray(parsed) ? parsed : (Array.isArray(HERO_BANNER_SLIDES) ? HERO_BANNER_SLIDES : []);
    setHeroSlides(slides);
  }, [heroSlidesConfig]);

  useEffect(() => {
    const parsed = eventPartnersConfig != null ? parseConfig(eventPartnersConfig) : null;
    const partners = Array.isArray(parsed) ? parsed : FEATURED_ORGANISERS;
    setEventPartners(partners);
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


        {/* Search & Category Filter Results Section */}
        {(activeCat || searchQuery) ? (
          <section style={{ width: '100%', maxWidth: '1240px', padding: '40px 20px', minHeight: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: '#0f172a' }}>
                  {searchQuery ? `Search Results for "${searchQuery}"` : `${activeCat} Events`}
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
                  Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} {searchQuery ? '' : `in this category`}
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                Clear Filters ✕
              </button>
            </div>

            {filteredEvents.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {filteredEvents.map(ev => (
                  <div key={ev.id} onClick={() => router.push(`/events/${ev.id}`)} style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <TicketCard event={ev} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>No events found</h3>
                <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>
                  We couldn&apos;t find any events matching your criteria. Try adjusting your search term or exploring other categories.
                </p>
              </div>
            )}
          </section>
        ) : (
          <div style={{ width: '100%' }}>
            {homeSectionsOrder.map((section, idx) => {
              switch (section) {
                case "Hero Banner":
                  return <div key={idx} style={{ width: '100%' }}><VideoHeroBanner /></div>;
                case "Sub Navigation":
                  return <div key={idx} style={{ width: '100%' }}><RecentlyViewedEvents /></div>;
                case "Featured Events":
                  return <div key={idx} style={{ width: '100%' }}><FeaturedEvents events={featuredEventsList} /></div>;
                case "Spotlight":
                  return <div key={idx} style={{ width: '100%' }}><Spotlight events={spotlightEventsList} /></div>;
                case "Coming Soon":
                  return <div key={idx} style={{ width: '100%' }}><ComingSoonEvents events={normalizedOrgEvents} /></div>;
                case "Top Hand-picked":
                  return <div key={idx} style={{ width: '100%' }}><PopularEvents events={popularEventsList} /></div>;
                default:
                  return null;
              }
            })}

            {/* Other sections that might not be in the reorderable list yet */}
            <div style={{ width: '100%' }}>
              <TrendingEvents events={trendingEventsList} />
            </div>
            <div style={{ width: '100%' }}>
              <ExclusiveEvents events={exclusiveEventsList} />
            </div>
            <div style={{ width: '100%' }}>
              <VirtualEvents events={normalizedOrgEvents} />
            </div>
            <div style={{ width: '100%' }}>
              <RecentMemories memories={MEMORIES} />
            </div>
            <div style={{ width: '100%' }}>
              <FeaturedOrganisers organisers={eventPartners} />
            </div>
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
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}
