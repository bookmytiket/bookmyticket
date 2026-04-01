"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
import VenueEventCard from '@/components/VenueEventCard';
import Sponsors from '@/components/Sponsors';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import SubnavMarquee from '@/components/SubnavMarquee';
import Footer from '@/components/Footer';
import { MEMORIES, FEATURED_ORGANISERS, HERO_BANNER_SLIDES, HOME_EVENTS, BRAND_COUPONS } from './data/homeEvents';
import { eventMatchesCategory } from './utils/categoryMatch';
import { useAuth } from '@/components/AuthContext';
import { Ticket, X } from 'lucide-react';
import TicketBookingDemo from '@/components/TicketBookingDemo';
import BrandCouponsSection from '@/components/BrandCouponsSection';
import ServiceCategories from '@/components/ServiceCategories';
import { isVirtualEvent } from './utils/eventUtils';

function TicketCard({ event }) {
  return (
    <div style={{ 
      backgroundColor: "#fff", 
      borderRadius: "12px", 
      overflow: "hidden", 
      border: "1px solid #e2e8f0", 
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2.3/3' }}>
        <img src={event.img} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ padding: "10px", flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '6px' }}>
          <h3 style={{ 
            fontSize: "14px", 
            fontWeight: 700, 
            margin: 0, 
            lineHeight: '1.2',
            color: '#111827',
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>{event.title}</h3>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.5l-4.2-4.2 1.4-1.4 2.8 2.8 6.1-6.1 1.4 1.4-7.5 7.5z" />
          </svg>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{event.location || event.city || "TBA"}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{event.date}</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>Paid</span>
        </div>
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
    "Hero Banner", "Sub Navigation", "Featured Events", "Venue Events", "Coming Soon", "Spotlight", "Top Hand-picked"
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

  const convexEventsRaw = useQuery(api.events.getActiveEvents);
  const convexEvents = useMemo(() => convexEventsRaw || [], [convexEventsRaw]);

  const parseEventDate = (dateStr, timeStr) => {
    if (!dateStr) return null;
    try {
      let dt = String(dateStr).trim();
      // Handle DD/MM/YYYY or DD-MM-YYYY
      if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
        const parts = dt.split(/[-/]/);
        dt = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      // If dt already has T or a space + time, don't append default time
      if (dt.includes('T') || dt.includes(' ')) {
        const d = new Date(dt.replace(' ', 'T'));
        return isNaN(d.getTime()) ? null : d;
      }

      let normalizedTime = "23:59";
      if (timeStr) {
        let t = String(timeStr).trim().toUpperCase();
        const ampmMatch = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
        if (ampmMatch) {
          let [_, hours, mins = "00", ampm] = ampmMatch;
          hours = parseInt(hours);
          if (ampm === "PM" && hours < 12) hours += 12;
          if (ampm === "AM" && hours === 12) hours = 0;
          normalizedTime = `${String(hours).padStart(2, '0')}:${mins}`;
        } else {
          normalizedTime = t.includes(':') ? t : `${t}:00`;
        }
      }
      
      const eventDate = new Date(`${dt}T${normalizedTime}`);
      return isNaN(eventDate.getTime()) ? null : eventDate;
    } catch (_) { return null; }
  };

  const normalizedOrgEvents = useMemo(() => {
    const now = new Date();
    return (Array.isArray(newOrgEvents) ? newOrgEvents : [])
      .filter(ev => {
        const eventDate = parseEventDate(ev.date, ev.time);
        if (!eventDate) return true;
        return eventDate >= now;
      })
      .map((ev, idx) => {
        const loc = ev.location || ev.venue || ev.address || "Venue";
        const isVirtual = ev.virtual === true || 
                 String(ev.type || '').toLowerCase() === "online" || 
                 String(ev.type || '').toLowerCase() === "virtual" ||
                 loc.toLowerCase().includes("online") ||
                 loc.toLowerCase().includes("virtual");
        return {
          ...ev,
          id: ev._id || ev.id || `${ev.title?.slice(0, 8)}-${idx}`,
          title: ev.title || "Event",
          img: ev.img || ev.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop",
          rawDate: ev.date,
          rawTime: ev.time,
          date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
          location: loc,
          featured: ev.featured !== false,
          trending: ev.trending !== false,
          spotlight: ev.spotlight === true,
          exclusive: ev.exclusive === true,
          virtual: isVirtual,
        };
      });
  }, [newOrgEvents]);

  const allEventsForFilter = useMemo(() => [
    ...(Array.isArray(HOME_EVENTS) ? HOME_EVENTS.map(h => ({ ...h, rawDate: h.date, rawTime: h.time })) : []),
    ...(Array.isArray(normalizedOrgEvents) ? normalizedOrgEvents : [])
  ], [normalizedOrgEvents]);

  const { selectedCity } = useAuth();

  const filteredEvents = useMemo(() => {
    let results = allEventsForFilter;

    // 0. Filter by Selected City
    if (selectedCity && selectedCity !== "All Cities") {
      results = results.filter(ev =>
        ev.virtual === true ||
        !ev.city || // Show events with no city data as global/TBA
        (ev.city.toLowerCase() === selectedCity.toLowerCase()) ||
        (ev.district && ev.district.toLowerCase() === selectedCity.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(selectedCity.toLowerCase())) ||
        (ev.venue && ev.venue.toLowerCase().includes(selectedCity.toLowerCase()))
      );
    }

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

    const now = new Date();
    results = results.filter(ev => {
      const eventDate = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time);
      if (!eventDate) return true;
      return eventDate >= now;
    });
    return results;
  }, [activeCat, searchQuery, allEventsForFilter, selectedCity]);

  const featuredEventsList = useMemo(() => filteredEvents.filter((e) => e.featured), [filteredEvents]);

  const trendingEventsList = useMemo(() => filteredEvents.filter((e) => e.trending), [filteredEvents]);

  const spotlightEventsList = useMemo(() => filteredEvents.filter((e) => e.spotlight), [filteredEvents]);

  const exclusiveEventsList = useMemo(() => filteredEvents.filter((e) => e.exclusive), [filteredEvents]);

  const popularEventsList = useMemo(() => filteredEvents, [filteredEvents]);

  const venueEventsList = useMemo(() => {
    return filteredEvents.filter(e => (e.venue || e.location) && !e.virtual);
  }, [filteredEvents]);


  useEffect(() => {
    setNewOrgEvents(convexEvents);
  }, [convexEvents]);

  // Fallback or old local storage cleanup (Optional: keep using convexEvents instead, logic below handles parsing well)


  const heroSlidesConfig = useQuery(api.systemConfig.getConfig, { key: "admin_hero_slides" });
  const eventPartnersConfig = useQuery(api.systemConfig.getConfig, { key: "admin_event_partners" });
  const activeBannersRaw = useQuery(api.branding.getActiveBanners);
  const activeBanners = useMemo(() => activeBannersRaw || [], [activeBannersRaw]);
  const homeCouponsRaw = useQuery(api.branding.getHomeCoupons);
  const homeCoupons = useMemo(() => homeCouponsRaw || [], [homeCouponsRaw]);
  const allCoupons = useMemo(() => {
    // Merge Convex coupons with Static Partner deals
    return [...homeCoupons, ...BRAND_COUPONS.map(c => ({
      ...c,
      // Normalize dates if needed for BrandCouponsSection
      endDate: typeof c.endDate === 'number' ? c.endDate : Date.now() + 86400000 * 30
    }))];
  }, [homeCoupons]);


  // Stable key from activeBanners to prevent infinite re-renders
  const activeBannersKey = activeBanners.map(b => b._id).join(',');

  useEffect(() => {
    const parsed = heroSlidesConfig != null ? parseConfig(heroSlidesConfig) : null;
    let slides = Array.isArray(parsed) ? parsed : (Array.isArray(HERO_BANNER_SLIDES) ? HERO_BANNER_SLIDES : []);
    
    let mappedSlides = [];

    // Prepend active brand Premium Banners
    if (activeBanners.length > 0) {
      const brandSlides = activeBanners.map((b) => ({
        id: b._id,
        img: b.imageUrl,
        title: "",
        sub: "Premium Partner",
        alt: "Sponsored Brand",
        url: b.redirectUrl || "#"
      }));
      mappedSlides = [...mappedSlides, ...brandSlides];
    }
    
    // Inject active Home Coupons as advert banners
    if (homeCoupons.length > 0) {
      const couponSlides = homeCoupons.filter(c => c.bannerUrl).map((c) => ({
        id: c._id,
        img: c.bannerUrl,
        title: c.title,
        sub: c.discountType === "Percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`,
        alt: c.brandName || "Coupon Offer",
        url: c.redirectUrl || "#"
      }));
      mappedSlides = [...mappedSlides, ...couponSlides];
    }
    
    if (mappedSlides.length > 0) {
        slides = [...mappedSlides, ...slides];
    }

    setHeroSlides(slides);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroSlidesConfig, activeBannersKey, homeCoupons]);

  useEffect(() => {
    const parsed = eventPartnersConfig != null ? parseConfig(eventPartnersConfig) : null;
    const partners = Array.isArray(parsed) ? parsed : FEATURED_ORGANISERS;
    setEventPartners(partners);
  }, [eventPartnersConfig]);

  // Removed focus event listener since Convex useQuery is reactive



  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <>
      <main style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'var(--header-h)' }}>

        <style>{`
          .syne-heading {
            font-family: 'Syne', sans-serif !important;
            animation: slideInLeft 0.8s ease-out forwards;
          }
          @keyframes slideInLeft {
            0% { transform: translateX(-30px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* 0) Hero Banners */}
        <div style={{ width: '100%', paddingTop: '20px' }}>
          <HeroBanner slides={heroSlides.length > 0 ? heroSlides : HERO_BANNER_SLIDES} />
        </div>
        
        <div style={{ width: '100%', paddingTop: '40px' }}>
          <VideoHeroBanner />
        </div>

        <SubnavMarquee />


        {/* Search & Category Filter Results Section */}
        {(activeCat || searchQuery) ? (
          <section style={{ width: '100%', maxWidth: '1240px', padding: '40px 20px', minHeight: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1.1 }}>
                  {searchQuery ? `Search Results for "${searchQuery}"` : (
                    <>
                      {activeCat} <span style={{
                        background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>Events</span>
                    </>
                  )}
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
              <div className="event-grid-adaptive" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                {filteredEvents.map(ev => (
                  <div key={ev.id} onClick={() => router.push(`/events/detail?id=${ev.id}`)} style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}>
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
            {/* Cloned Brand Coupons Section (Top Trending Offers) - Placed under Hero Banner */}
            <BrandCouponsSection 
               coupons={allCoupons} 
               title="Top Trending Offers" 
               subtitle="Grab these limited time deals before they expire!" 
            />

            {/* 1) Recently Viewed */}
            <RecentlyViewedEvents />

            {/* 2) Featured Events */}
            <FeaturedEvents events={featuredEventsList} />

            {/* 3) Coming Soon */}
            <ComingSoonEvents events={filteredEvents} />

            {/* 4) Explore Popular Events */}
            <div id="explore-popular-events">
              <PopularEvents events={popularEventsList} />
            </div>

            {/* 5) Exclusive Events */}
            <ExclusiveEvents events={exclusiveEventsList} />

            {/* 6) Virtual Events */}
            <VirtualEvents events={normalizedOrgEvents} />

            {/* Professional Services Section */}
            <section id="services" style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '60px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Professional Services</h2>
                  <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>Top rated artists and studios for your special occasions</p>
                </div>
                <Link href="/services" style={{ color: '#f84464', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>View All Services →</Link>
              </div>
              <ServiceCategories />
            </section>

            {/* Branding & Others */}
            <div style={{ width: '100%' }}>
              <FeaturedOrganisers organisers={eventPartners} />
            </div>
            <div style={{ width: '100%' }}>
              <Sponsors />
            </div>

            {/* Subscription Banner before Footer */}
            <BrandCouponsSection coupons={allCoupons} />
            <SubscriptionBanner />
          </div>
        )}
      </main>
      <Footer />
      <DemoToggle demoVisible={true} />
    </>
  );
}

function DemoToggle() {
  const [minimized, setMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) return null;

  if (minimized) {
    return (
      <div 
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '18px',
          boxShadow: '0 10px 30px rgba(248, 68, 100, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          fontSize: '13px',
          animation: 'slideUp 0.5s ease-out'
        }}
      >
        <Ticket size={16} />
        Live Demo
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '40px',
        zIndex: 1000,
        width: '204px', // 340 * 0.6
        height: '420px', // 700 * 0.6
        animation: 'slideUp 0.8s ease-out',
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      {/* Minimize Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          width: '32px',
          height: '32px',
          borderRadius: '16px',
          background: '#fff',
          border: '2px solid #f84464',
          color: '#f84464',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <X size={16} strokeWidth={3} />
      </button>

      {/* Scaled Phone Demo */}
      <TicketBookingDemo scale={0.6} />
    </div>
  );
}
