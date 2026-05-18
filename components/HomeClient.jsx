"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isVirtualEvent, isFreeEvent } from '@/app/utils/eventUtils';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import VideoHeroBanner from '@/components/VideoHeroBanner';
import FeaturedEvents from '@/components/FeaturedEvents';
import RecentlyViewedEvents from '@/components/RecentlyViewedEvents';
import ComingSoonEvents from '@/components/ComingSoonEvents';
import TrendingEvents from '@/components/TrendingEvents';
import ExclusiveEvents from '@/components/ExclusiveEvents';
import VirtualEvents from '@/components/VirtualEvents';
import VenueEventCard from '@/components/VenueEventCard';
import TournamentCard from '@/components/TournamentCard';
import SubscriptionBanner from '@/components/SubscriptionBanner';

import Footer from '@/components/Footer';
import { Trophy, Zap, TrendingUp, Map as MapIcon, Calendar as CalendarIcon, Activity } from 'lucide-react';
import { MEMORIES, FEATURED_ORGANISERS, HERO_BANNER_SLIDES, BRAND_COUPONS } from '@/app/data/homeEvents';
import { eventMatchesCategory } from '@/app/utils/categoryMatch';
import { useAuth } from '@/components/AuthContext';
import { Ticket, X, Sparkles } from 'lucide-react';

const EMPTY_ARRAY = [];
import TicketBookingDemo from '@/components/TicketBookingDemo';
import DigitalTicket from '@/components/DigitalTicket';
import BrandCouponsSection from '@/components/BrandCouponsSection';
import ServiceCategories from '@/components/ServiceCategories';
import PublicReviewsBanner from '@/components/PublicReviewsBanner';
import TopRatedServices from '@/components/TopRatedServices';
import { resolveBannerRedirect } from '@/lib/bannerHelper';
import { getEventPath } from '@/app/utils/seo';

function TicketCard({ event, router }) {
  return (
    <div 
      onClick={() => {
        const path = getEventPath(event);
        if (router) {
          router.push(path);
        } else {
          window.location.href = path;
        }
      }}
      style={{ 
        backgroundColor: "#fff", 
        borderRadius: "20px", 
        overflow: "hidden", 
        border: "1px solid #f1f5f9", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Image Area - Increased size to match Exclusive Events style */}
      <div style={{ width: '100%', aspectRatio: '2.3/3', position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
        <img 
          src={event.img} 
          alt={event.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div style={{ 
            position: 'absolute', top: '10px', left: '10px', 
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
            padding: '4px 10px', borderRadius: '8px', 
            fontSize: '10px', fontWeight: 900, color: '#f84464',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
            LIVE
        </div>
      </div>

      <div style={{ padding: "16px", flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h3 style={{ 
            fontSize: "16px", 
            fontWeight: 800, 
            margin: 0, 
            lineHeight: '1.2',
            color: '#111827',
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{event.title}</h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0 }}>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.5l-4.2-4.2 1.4-1.4 2.8 2.8 6.1-6.1 1.4 1.4-7.5 7.5z" />
          </svg>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{event.location || event.city || "TBA"}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{event.date?.split(' ')[0]}</span>
          </div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 900, 
            color: isFreeEvent(event) ? '#22c55e' : '#0f172a',
            backgroundColor: isFreeEvent(event) ? '#22c55e10' : '#f1f5f9',
            padding: '4px 10px',
            borderRadius: '100px',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            {isFreeEvent(event) ? "FREE" : "PAID"}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";

const parseEventDate = (dateStr, timeStr, event = null) => {
  try {
    const config = event?.dynamic_config ? (typeof event.dynamic_config === 'string' ? JSON.parse(event.dynamic_config) : event.dynamic_config) : {};
    const configBasic = config.basicInfo || {};
    let dt = event?.end_date || event?.endDate || configBasic.endDate || 
             event?.expiry_date || configBasic.expiryDate || 
             dateStr || event?.date || event?.start_date;
    let t = event?.end_time || event?.endTime || configBasic.endTime || 
            timeStr || event?.time || event?.startTime || '23:59';

    if (!dt) return null;
    dt = String(dt).trim();
    t = String(t).trim();
    
    if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
        const separator = dt.includes('/') ? '/' : '-';
        const parts = dt.split(separator);
        const [day, month, year] = parts;
        dt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const eventDate = new Date(`${dt.replace(/-/g, '/')} ${t}`);
    return isNaN(eventDate.getTime()) ? null : eventDate;
  } catch (err) {
    return null;
  }
};


function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, selectedCity, selectedDistrict } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, []);

  const activeCat = searchParams.get("category");
  const searchQuery = searchParams.get("q") || "";
  const [heroSlides, setHeroSlides] = useState([]);
  const [eventPartners, setEventPartners] = useState([]);

  const { data: allConfig } = useSupabaseQuery('system_config', (q) => q, []);

  const parseConfig = (val) => {
    if (val == null) return undefined;
    try { return typeof val === "string" ? JSON.parse(val) : val; } catch (_) { return val; }
  };

  const getConfigValue = (key) => {
    const item = allConfig?.find(c => c.key === key);
    return item ? item.value : undefined;
  };

  const homeSectionsOrderRaw = parseConfig(getConfigValue('admin_home_sections_order'));
  const homeSectionsOrder = Array.isArray(homeSectionsOrderRaw) ? homeSectionsOrderRaw : [
    "Hero Banner", "Sub Navigation", "Featured Events", "Venue Events", "Coming Soon", "Spotlight", "Top Hand-picked"
  ];
  const [siteBranding, setSiteBranding] = useState({
    name: "book my ticket",
    logo_color: "#111111",
    logo_url: "/logo.png"
  });

  useEffect(() => {
    fetch('/api/branding')
        .then(res => res.json())
        .then(data => { if (data && !data.error) setSiteBranding(data); });
  }, []);
  const metaSettings = parseConfig(getConfigValue('admin_meta_settings')) || {
    global: { title: "BookMyTicket", description: "Best Event Ticketing Platform" }
  };


  const { data: userBookings } = useSupabaseQuery('bookings', (q) => 
    user?.id 
      ? q.select('*, events(title, img, date, time)').eq('user_id', user.id).order('created_at', { ascending: false }) 
      : q.eq('id', '00000000-0000-0000-0000-000000000000'),
    [user?.id]
  );
  const [viewTicketModal, setViewTicketModal] = useState(null);

  const activeBooking = useMemo(() => {
    if (!userBookings || userBookings.length === 0) return null;
    const now = new Date();
    return userBookings
      .filter(b => {
        const isValidStatus = b.status === "Confirmed" || b.status === "Paid" || b.status === "Scanned";
        if (!isValidStatus) return false;
        
        // Date check: ensure event is not expired
        const eventDate = parseEventDate(b.events?.date, b.events?.time, b.events);
        if (eventDate && eventDate < now) return false;
        
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [userBookings]);

  useEffect(() => {
    if (metaSettings?.global?.title) {
      document.title = metaSettings.global.title;
    }
  }, [metaSettings]);

  // 1. Fetch data from unified API
  const [apiEvents, setApiEvents] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchPublicEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDistrict && selectedDistrict !== 'All' && selectedDistrict !== 'India') {
        params.append('district', selectedDistrict);
      } else if (selectedCity && selectedCity !== 'All Cities' && selectedCity !== 'India') {
        params.append('city', selectedCity);
      }
      
      // Cache buster for instant updates
      const url = `/api/events/public?${params.toString()}&t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setApiEvents(data || []);
    } catch (err) {
      console.error("Failed to fetch public events:", err);
      setApiError(err);
    } finally {
      setApiLoading(false);
    }
  }, [selectedDistrict, selectedCity]);

  // Initial fetch and city change fetch
  useEffect(() => {
    fetchPublicEvents();
  }, [fetchPublicEvents]);

  // 2. Realtime listener to trigger API re-fetch
  useEffect(() => {
    if (!supabase) return;

    const tables = ['events', 'tournament_events', 'marathon_events'];
    const channels = tables.map(table => {
        return supabase
            .channel(`public_sync_${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                console.log(`Realtime update detected in ${table}, re-fetching API...`);
                fetchPublicEvents();
            })
            .subscribe();
    });

    return () => {
        channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchPublicEvents]);

  // Keep other queries for branding, etc.
  const { data: brandingRaw } = useSupabaseQuery('site_branding', (q) => q, [], { realtime: false });


  // Professional services removed from event discovery feed


  const allLiveEvents = useMemo(() => {
    const list = Array.isArray(apiEvents) ? apiEvents : [];
    return list
      .filter(ev => {
        const s = String(ev.status || '').toLowerCase();
        if (s === "inactive" || s === "draft" || s === "expired") return false;

        const eventDate = parseEventDate(ev.date || ev.rawDate || ev.startDate, ev.time || ev.rawTime || ev.startTime, ev);
        if (eventDate) {
            const isToday = eventDate.toDateString() === now.toDateString();
            return eventDate >= now || isToday;
        }
        return false;
      })
      .map((ev, idx) => {
        const loc = String(ev.location || ev.venue || ev.address || ev.city || "").trim();
        const isVirtual = ev.virtual === true || 
                 String(ev.type || '').toLowerCase() === "online" || 
                 String(ev.type || '').toLowerCase() === "virtual" ||
                 loc.toLowerCase().includes("online") ||
                 loc.toLowerCase().includes("virtual");
        
        // Use normalized data from API
        return {
          ...ev,
          id: ev.id,
          title: ev.title || "Event",
          img: ev.img || "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=280&fit=crop",
          rawDate: ev.date,
          rawTime: ev.time,
          date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
          location: loc,
          featured: !!ev.featured,
          trending: !!ev.trending,
          spotlight: !!ev.spotlight || !!ev.is_spotlight,
          exclusive: !!ev.exclusive || !!ev.is_exclusive,
          is_spotlight: !!ev.is_spotlight,
          is_exclusive: !!ev.is_exclusive,
          virtual: isVirtual,
          // Hydrate nested objects for specific cards
          tournament_events: ev.tournament_data ? [ev.tournament_data] : [],
          marathon_events: ev.marathon_data ? [ev.marathon_data] : []
        };
      });
  }, [apiEvents, now]);


  const normalizedOrgEvents = useMemo(() => {
    return allLiveEvents;
  }, [allLiveEvents]);

  const allEventsForFilter = useMemo(() => [
    ...(Array.isArray(normalizedOrgEvents) ? normalizedOrgEvents : [])
  ], [normalizedOrgEvents]);



  const filteredEvents = useMemo(() => {
    let results = allEventsForFilter;

    // 0. Filter by Selected District/City
    if (selectedDistrict || selectedCity) {
      const target = (selectedDistrict || selectedCity).toLowerCase();
      
      results = results.filter(ev => {
        if (ev.virtual === true) return true;
        
        const evCity = String(ev.city || '').toLowerCase();
        const evDistrict = String(ev.district || '').toLowerCase();
        const evLoc = String(ev.location || '').toLowerCase();

        return evCity.includes(target) || evDistrict.includes(target) || evLoc.includes(target);
      });
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

    return results.filter(ev => {
      const eventDate = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time, ev);
      if (!eventDate) return false; // Hide expired/invalid
      
      const isToday = eventDate.toDateString() === now.toDateString();
      return eventDate >= now || isToday;
    });
  }, [activeCat, searchQuery, allEventsForFilter, selectedCity, now]);

  const featuredEventsList = useMemo(() => filteredEvents.filter((e) => e.featured || e.is_spotlight || e.is_exclusive), [filteredEvents]);

  const trendingEventsList = useMemo(() => filteredEvents.filter((e) => e.trending), [filteredEvents]);

  const spotlightEventsList = useMemo(() => filteredEvents.filter((e) => e.spotlight || e.is_spotlight), [filteredEvents]);

  const exclusiveEventsList = useMemo(() => filteredEvents.filter((e) => e.exclusive || e.is_exclusive), [filteredEvents]);
  
  const tournamentEventsList = useMemo(() => allLiveEvents.filter((e) => 
    e.type === "Tournament Event" || 
    e.type === "Tournament" || 
    e.tournament_data ||
    (Array.isArray(e.tournament_events) && e.tournament_events.length > 0)
  ), [allLiveEvents]);

  const trendingTournamentsList = useMemo(() => tournamentEventsList.filter((e) => e.trending || e.featured), [tournamentEventsList]);
  
  const sportsTournamentsList = useMemo(() => tournamentEventsList.filter((e) => 
    e.category === "Sports" || 
    e.category === "Tournament" ||
    String(e.type || '').toLowerCase().includes('tournament') ||
    String(e.type || '').toLowerCase().includes('sports')
  ), [tournamentEventsList]);
  
  const comingSoonList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredEvents.filter(e => {
      const eventDate = parseEventDate(e.rawDate || e.date, e.rawTime || e.time, e);
      return eventDate && eventDate >= today;
    });
  }, [filteredEvents]);



  const venueEventsList = useMemo(() => {
    return filteredEvents.filter(e => (e.venue || e.location || e.venue_data?.name) && !e.virtual);
  }, [filteredEvents]);




  // Fallback or old local storage cleanup (Optional: keep using convexEvents instead, logic below handles parsing well)


  const justInEventsList = useMemo(() => {
    return [...filteredEvents]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 4);
  }, [filteredEvents]);

  const heroSlidesConfig = getConfigValue("admin_hero_slides");
  const eventPartnersConfig = getConfigValue("admin_event_partners");
  const { data: activeBannersRaw } = useSupabaseQuery('branding_banners', (q) => q.eq('status', 'Active'), []);
  const activeBanners = useMemo(() => activeBannersRaw || EMPTY_ARRAY, [activeBannersRaw]);
  const { data: homeCouponsRaw } = useSupabaseQuery('branding_coupons', (q) => q.eq('status', 'Active'), []);
  const homeCoupons = useMemo(() => homeCouponsRaw || EMPTY_ARRAY, [homeCouponsRaw]);
  const allCoupons = useMemo(() => {
    // Merge Convex coupons with Static Partner deals
    return [...homeCoupons, ...BRAND_COUPONS.map(c => ({
      ...c,
      // Normalize dates if needed for BrandCouponsSection
      endDate: typeof c.endDate === 'number' ? c.endDate : Date.now() + 86400000 * 30
    }))];
  }, [homeCoupons]);


  // Stable key from activeBanners to prevent infinite re-renders
  const activeBannersKey = activeBanners.map(b => b.id).join(',');

  useEffect(() => {
    const parsed = heroSlidesConfig != null ? parseConfig(heroSlidesConfig) : null;
    let slides = Array.isArray(parsed) ? parsed : (Array.isArray(HERO_BANNER_SLIDES) ? HERO_BANNER_SLIDES : []);
    
    let mappedSlides = [];

    // Prepend active brand Premium Banners
    if (activeBanners.length > 0) {
      const brandSlides = activeBanners.map((b) => ({
        id: b.id,
        img: b.img || b.image_url,
        title: b.title || "",
        sub: "Premium Partner",
        alt: "Sponsored Brand",
        url: resolveBannerRedirect(b.redirect_type, b.redirect_id, b.redirect_url || "#")
      }));
      mappedSlides = [...mappedSlides, ...brandSlides];
    }
    
    // Inject active Home Coupons as advert banners
    if (homeCoupons.length > 0) {
      const couponSlides = homeCoupons.filter(c => c.bannerUrl || c.img).map((c) => ({
        id: c.id,
        img: c.bannerUrl || c.img,
        title: c.title,
        sub: c.discountType === "Percentage" ? `${c.discountValue}% OFF` : (c.discountValue ? `₹${c.discountValue} OFF` : c.discount || ""),
        alt: c.brandName || "Coupon Offer",
        url: resolveBannerRedirect(c.redirect_type, c.redirect_id, c.redirect_url || "#")
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <>
      <main style={{ minHeight: '100vh', backgroundColor: '#FAF9F6', color: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: isMobile ? '160px' : 'var(--header-h)' }}>
        
        {/* Community Trust: Public Reviews Banner */}
        {/* Moved PublicReviewsBanner below for better flow */}

        
        {/* Connection Diagnostic Warning */}
        {typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <div style={{ width: '100%', backgroundColor: '#fef2f2', borderBottom: '1px solid #fee2e2', padding: '12px 0', zIndex: 1000 }}>
            <div className="container mx-auto px-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#b91c1c' }}>⚠️ Connection Notice:</span>
              <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 500 }}>The booking system is currently in offline mode. Please verify environment variables in Vercel.</span>
            </div>
          </div>
        )}

        {/* Active Ticket Banner Surface */}
        {activeBooking && (
          <div style={{ 
            width: '100%', 
            background: 'linear-gradient(90deg, #111827 0%, #1e293b 100%)', 
            padding: '12px 0', 
            borderBottom: '1px solid rgba(255,255,255,0.1)', 
            position: 'relative', 
            zIndex: 100 
          }}>
            <div className="container mx-auto px-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                  <Ticket size={18} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#fff' }}>Upcoming Event: {activeBooking.events?.title || activeBooking.eventName}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Confirmed Booking #{String(activeBooking.id).slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewTicketModal(activeBooking)}
                style={{ 
                  height: '36px', 
                  padding: '0 16px', 
                  borderRadius: '8px', 
                  background: '#f43f5e', 
                  color: '#fff', 
                  fontSize: '12px', 
                  fontWeight: 900, 
                  border: 'none', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(244,63,94,0.3)' 
                }}
              >
                View Digital Ticket
              </button>
            </div>
          </div>
        )}

        <style>{`
          .syne-heading {
            font-family: 'Syne', sans-serif !important;
            animation: slideInLeft 0.8s ease-out forwards;
          }
          @keyframes slideInLeft {
            0% { transform: translateX(-30px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>






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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredEvents.map(ev => (
                  <TicketCard key={ev.id} event={ev} router={router} />
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
            <VideoHeroBanner />

            {/* 0) Tournament Spotlight Banner - Premium Highlight */}
            {trendingTournamentsList.length > 0 && (
                <section style={{ width: '100%', padding: '60px 0', background: 'linear-gradient(to bottom, #fff, #f8fafc)' }}>
                    <div className="container mx-auto px-6">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <div className="w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Tournaments in {selectedDistrict || 'Your District'}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">The most anticipated competitions happening now</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {trendingTournamentsList.slice(0, 3).map(event => (
                                <TournamentCard key={event.id} event={event} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 0.5) Sports Championships Section */}
            {sportsTournamentsList.length > 0 && (
                <section style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '40px 20px' }}>
                    <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                                Sports in <span style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'inline-block'
                                }}>{selectedDistrict || 'District'}</span> 🏆
                            </h2>
                            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, fontWeight: 500 }}>Join the most competitive sports events in your region</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {sportsTournamentsList.slice(0, 4).map(event => (
                            <TournamentCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}

            {/* 1) Recently Viewed */}
            <RecentlyViewedEvents liveEvents={allLiveEvents} />

            {/* 2) Featured Events */}
            {featuredEventsList.length > 0 && (
              <div id="featured-events">
                <FeaturedEvents events={featuredEventsList} />
              </div>
            )}

            {/* 3) Coming Soon */}
            {comingSoonList.length > 0 && (
              <div id="coming-soon">
                <ComingSoonEvents events={comingSoonList} />
              </div>
            )}

            {/* 3.2) Just In (Recently Published) */}
            <section style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.04em', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                            New Events in <span style={{
                                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}>{selectedDistrict || 'District'}</span> ⚡
                        </h2>
                        <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, fontWeight: 500 }}>The latest events added in your area</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {apiLoading ? (
                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            Checking for latest events...
                        </div>
                    ) : justInEventsList.length > 0 ? (
                        justInEventsList.map(event => (
                            <TicketCard key={event.id} event={event} router={router} />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e2e8f0', borderRadius: '16px' }}>
                            No new events at the moment.
                        </div>
                    )}
                </div>
            </section>

            {/* 3.5) Events Near You (ALL published events) */}
            <section style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.04em', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                        Events <span style={{
                            background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'inline-block'
                        }}>Near You</span> 📍
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, fontWeight: 500 }}>Discover everything happening in {selectedCity}</p>
                </div>
                
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.slice(0, 8).map(event => (
                            <TicketCard key={event.id} event={event} router={router} />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e2e8f0', borderRadius: '16px' }}>
                            No events found in this area.
                        </div>
                    )}
                </div>
                
                {filteredEvents.length > 8 && (
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Link href="/events" style={{
                            display: 'inline-block',
                            padding: '12px 32px',
                            background: 'linear-gradient(135deg, #f84464 0%, #ec4899 100%)',
                            color: '#fff',
                            fontWeight: 800,
                            borderRadius: '12px',
                            textDecoration: 'none',
                            boxShadow: '0 10px 20px rgba(248, 68, 164, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            View All Events
                        </Link>
                    </div>
                )}
            </section>

            {/* 4) Explore Popular Events removed */}

            {/* 5) Exclusive Events */}
            <ExclusiveEvents events={exclusiveEventsList} />

            {/* Marketplace and Services removed from main event discovery feed */}


            {/* --- DYNAMIC & ATTRACTIVE DISCOVERY SECTION (PINK & PURPLE UI) --- */}
            <section style={{ width: '100%', padding: '60px 20px', background: 'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)', position: 'relative', overflow: 'hidden' }}>
                <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                    
                    {/* Left: Top Categories */}
                    <div>
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'inline-block', padding: '4px 12px', background: '#fff1f2', borderRadius: '100px', color: '#f84464', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', border: '1px solid #fecdd3' }}>
                                Explore Your Passions
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                Top <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #f84464, #ec4899)' }}>Categories</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {[
                                { name: 'Music', icon: '🎵', color: '#f84464' },
                                { name: 'Sports', icon: '🏆', color: '#8b5cf6' },
                                { name: 'Workshops', icon: '🎓', color: '#f84464' },
                                { name: 'Comedy', icon: '😂', color: '#8b5cf6' },
                                { name: 'Concerts', icon: '🎸', color: '#f84464' },
                                { name: 'Wellness', icon: '🧘', color: '#8b5cf6' },
                                { name: 'Screening', icon: '🎬', color: '#f84464' },
                                { name: 'Festivals', icon: '🎉', color: '#8b5cf6' }
                            ].map(cat => (
                                <Link 
                                    key={cat.name} 
                                    href={`/?category=${cat.name}`}
                                    style={{ 
                                        padding: '16px', 
                                        background: '#ffffff', 
                                        borderRadius: '24px', 
                                        border: '1px solid #f1f5f9',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = cat.color;
                                        e.currentTarget.style.boxShadow = `0 12px 24px -10px ${cat.color}25`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#f1f5f9';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)';
                                    }}
                                >
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        background: `${cat.color}10`, 
                                        borderRadius: '12px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        flexShrink: 0
                                    }}>
                                        {cat.icon}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>{cat.name}</div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right: Popular Cities */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'inline-block', padding: '4px 12px', background: '#f5f3ff', borderRadius: '100px', color: '#8b5cf6', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', border: '1px solid #ddd6fe' }}>
                                Find Events Near You
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                Popular <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #8b5cf6, #d946ef)' }}>Cities</span>
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
                            {['Hyderabad', 'Bangalore', 'Mumbai', 'Chennai', 'Coimbatore', 'Pune', 'Vizag', 'Kochi', 'Delhi', 'Ahmedabad'].map((city, i) => (
                                <button 
                                    key={city}
                                    onClick={() => router.push(`/?q=${city}`)}
                                    style={{ 
                                        padding: '8px 18px', 
                                        background: '#ffffff', 
                                        borderRadius: '100px', 
                                        border: '1px solid #e2e8f0',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        const isEven = i % 2 === 0;
                                        e.currentTarget.style.borderColor = isEven ? '#f84464' : '#8b5cf6';
                                        e.currentTarget.style.color = isEven ? '#f84464' : '#8b5cf6';
                                        e.currentTarget.style.background = isEven ? '#fff1f2' : '#f5f3ff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.color = '#64748b';
                                        e.currentTarget.style.background = '#ffffff';
                                    }}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>

                        {/* Premium Guide Card (DYNAMC PINK & PURPLE UI) */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)', 
                            borderRadius: '32px', 
                            padding: '36px', 
                            color: '#fff',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.4)',
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'default'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 35px 60px -15px rgba(219, 39, 119, 0.5)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(124, 58, 237, 0.4)';
                        }}
                        >
                            {/* Animated Mesh Gradients using Framer Motion */}
                            <motion.div 
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    x: [0, 10, 0],
                                    y: [0, -10, 0],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                style={{ 
                                    position: 'absolute', top: '-50%', right: '-20%', 
                                    width: '300px', height: '300px', 
                                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                                    borderRadius: '50%', filter: 'blur(40px)'
                                }} 
                            />
                            <motion.div 
                                animate={{ 
                                    scale: [1.2, 1, 1.2],
                                    x: [10, 0, 10],
                                    y: [-10, 0, -10],
                                    opacity: [0.8, 0.5, 0.8]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                style={{ 
                                    position: 'absolute', bottom: '-20%', left: '-10%', 
                                    width: '250px', height: '250px', 
                                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                                    borderRadius: '50%', filter: 'blur(50px)'
                                }} 
                            />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ 
                                    width: '44px', height: '44px', 
                                    background: 'rgba(255,255,255,0.15)', 
                                    backdropFilter: 'blur(12px)', 
                                    borderRadius: '14px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    marginBottom: '24px',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles size={22} className="text-white" />
                                    </motion.div>
                                </div>
                                
                                <h3 style={{ 
                                    fontSize: '24px', 
                                    fontWeight: 950, 
                                    marginBottom: '16px', 
                                    letterSpacing: '-0.04em', 
                                    textTransform: 'uppercase',
                                    lineHeight: 1.1,
                                    color: '#fff',
                                    textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}>
                                    BookMyTicket – India's <span style={{ color: '#fbbf24', textShadow: '0 0 15px rgba(251, 191, 36, 0.6)' }}>PREMIER</span> <span style={{ color: '#fff', borderBottom: '4px solid #f472b6' }}>EVENT</span> DESTINATION
                                </h3>
                                
                                <p style={{ 
                                    fontSize: '15px', 
                                    color: '#f8fafc', 
                                    lineHeight: 1.7, 
                                    fontWeight: 600,
                                    letterSpacing: '0.01em',
                                    opacity: 0.95
                                }}>
                                    Discover the pulse of live entertainment. From electric music concerts to major sports and exclusive workshops, we bridge the gap with <span style={{ color: '#fbbf24', fontWeight: 900 }}>zero friction</span> and <span style={{ color: '#fff', fontWeight: 900, textDecoration: 'underline', textDecorationColor: '#f472b6' }}>verified trust</span>.
                                </p>
                                
                                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                                    <div style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.1)' }}>✨ 20+ Cities</div>
                                    <div style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.1)' }}>🛡️ Secure</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6) Virtual Events */}
            <VirtualEvents events={normalizedOrgEvents} />

            {/* Professional Services section removed as per requirement */}

            {/* Branding & Others removed */}

            {/* Promotional Image Hero Banners moved to bottom for better flow */}

          </div>
        )}
      </main>


      {/* Digital Ticket Modal */}
      {viewTicketModal && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px", backdropFilter: "blur(8px)" }} 
          onClick={() => setViewTicketModal(null)}
        >
          <div style={{ width: "100%", maxWidth: "850px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button 
                onClick={() => setViewTicketModal(null)} 
                style={{ 
                    position: "absolute", 
                    top: "-40px", 
                    right: "0", 
                    background: "none", 
                    border: "none", 
                    color: "#fff", 
                    cursor: "pointer", 
                    fontSize: "24px"
                }}
            >
                ✕
            </button>
            <DigitalTicket 
                booking={viewTicketModal}
                event={{
                    title: viewTicketModal.eventName,
                    img: viewTicketModal.eventImg || viewTicketModal.img,
                    date: viewTicketModal.eventDate || viewTicketModal.date,
                    time: viewTicketModal.eventTime || viewTicketModal.time,
                    location: viewTicketModal.eventLocation || viewTicketModal.location || "Venue"
                }}
                branding={siteBranding}
            />
          </div>
        </div>
      )}
    </>
  );
}

function DemoToggle() {
  return null;
}

export default HomeClient;
