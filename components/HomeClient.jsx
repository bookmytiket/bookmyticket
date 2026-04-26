"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isVirtualEvent, isFreeEvent } from '@/app/utils/eventUtils';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import VideoHeroBanner from '@/components/VideoHeroBanner';
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
import { MEMORIES, FEATURED_ORGANISERS, HERO_BANNER_SLIDES, BRAND_COUPONS } from '@/app/data/homeEvents';
import { eventMatchesCategory } from '@/app/utils/categoryMatch';
import { useAuth } from '@/components/AuthContext';
import { Ticket, X } from 'lucide-react';

const EMPTY_ARRAY = [];
import TicketBookingDemo from '@/components/TicketBookingDemo';
import DigitalTicket from '@/components/DigitalTicket';
import BrandCouponsSection from '@/components/BrandCouponsSection';
import ServiceCategories from '@/components/ServiceCategories';
import PublicReviewsBanner from '@/components/PublicReviewsBanner';
import { resolveBannerRedirect } from '@/lib/bannerHelper';

function TicketCard({ event }) {
  return (
    <div style={{ 
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
    }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: '#f8fafc' }}>
        <img 
          src={event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=660&fit=crop"} 
          alt={event.title} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
        />
        <div style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          color: '#fff', 
          fontSize: '10px', 
          fontWeight: 800, 
          padding: '4px 12px', 
          borderRadius: '20px', 
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {event.category || 'Featured'}
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{event.date}</span>
          </div>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 800, 
            color: '#111827',
            background: '#f1f5f9',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {isFreeEvent(event) ? "FREE" : "PAID"}
          </span>
        </div>
      </div>
    </div>
  );
}

import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";

const parseEventDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    let dt = String(dateStr).trim();
    let t = String(timeStr || '23:59').trim();

    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
        const separator = dt.includes('/') ? '/' : '-';
        const [day, month, year] = dt.split(separator);
        dt = `${year}-${month}-${day}`;
    }
    
    let normalizedTime = t;
    if (t.includes(' ')) {
        let [timePart, modifier] = t.split(' ');
        let [hours, mins] = timePart.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        normalizedTime = `${String(hours).padStart(2, '0')}:${String(mins || 0).padStart(2, '0')}`;
    }
    
    const eventDate = new Date(`${dt}T${normalizedTime}`);
    return isNaN(eventDate.getTime()) ? null : eventDate;
  } catch (e) {
    return null;
  }
};

const WhyChooseUs = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);

  const features = [
    { 
      title: "Lowest Platform Fees", 
      icon: "💎", 
      sub: "Save more on every ticket with our transparent pricing.",
      details: "We believe in fair pricing. BookMyTicket offers the industry's lowest convenience fees, ensuring you and your fans get the best value for every rupee spent.",
      color: "#f84464"
    },
    { 
      title: "Verified Services", 
      icon: "🛡️", 
      sub: "All turfs and artists are handpicked and verified by our team.",
      details: "Quality you can trust. Every sports turf and professional artist listed on our platform undergoes a rigorous 5-point verification check for your peace of mind.",
      color: "#8b5cf6"
    },
    { 
      title: "Instant E-Tickets", 
      icon: "⚡", 
      sub: "Get your digital ticket instantly via email and your dashboard.",
      details: "No more waiting. Once your payment is confirmed, your secure QR-coded digital ticket is generated instantly and sent to your registered email and WhatsApp.",
      color: "#fb923c"
    },
    { 
      title: "24/7 Priority Support", 
      icon: "💬", 
      sub: "Our dedicated team is always here to help with your bookings.",
      details: "We're here for you around the clock. Whether it's a booking query or a venue issue, our priority support team is just a call or chat away, 24 hours a day.",
      color: "#22c55e"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveTab((curr) => (curr + 1) % features.length);
          return 0;
        }
        return prev + 1;
      });
    }, 50); // 5 seconds total (100 * 50ms)

    return () => clearInterval(interval);
  }, [features.length]);

  const handleTabClick = (index) => {
    setActiveTab(index);
    setProgress(0);
  };

  return (
    <div style={{ marginTop: '100px', padding: '0 20px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em', textAlign: 'center' }}>
          <span style={{ background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Why Book with BookMyTicket?
          </span>
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' }}>
          {/* Left Side: Auto-Clicking Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {features.map((f, i) => (
              <div 
                key={i} 
                onClick={() => handleTabClick(i)}
                style={{ 
                  padding: '24px', 
                  borderRadius: '24px', 
                  cursor: 'pointer',
                  backgroundColor: activeTab === i ? '#fff' : 'transparent',
                  border: '1px solid',
                  borderColor: activeTab === i ? '#e2e8f0' : 'transparent',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: activeTab === i ? '0 10px 25px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {/* Progress Bar (Visible when active) */}
                {activeTab === i && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    height: '3px', 
                    width: `${progress}%`, 
                    backgroundColor: f.color,
                    transition: 'width 0.05s linear'
                  }}></div>
                )}
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: '28px', 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '16px', 
                    backgroundColor: activeTab === i ? `${f.color}15` : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: activeTab === i ? '#0f172a' : '#64748b' }}>{f.title}</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>{f.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Dynamic Visual Display */}
          <div style={{ position: 'relative', minHeight: '400px' }}>
            <div style={{
              background: '#fff',
              borderRadius: '40px',
              padding: '60px 40px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 30px 60px rgba(0,0,0,0.06)',
              position: 'relative',
              zIndex: 2,
              animation: 'fadeInUp 0.5s ease-out'
            }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '32px',
                width: '120px',
                height: '120px',
                borderRadius: '32px',
                backgroundColor: `${features[activeTab].color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {features[activeTab].icon}
              </div>
              <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                {features[activeTab].title}
              </h3>
              <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.8, margin: 0 }}>
                {features[activeTab].details}
              </p>
              
              <div style={{ marginTop: '40px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#22c55e20', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Verified & Recommended Platform</span>
              </div>
            </div>
            
            {/* Background Glow */}
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '80%', 
              height: '80%', 
              backgroundColor: features[activeTab].color,
              filter: 'blur(100px)',
              opacity: 0.1,
              zIndex: 1,
              transition: 'background-color 0.5s ease'
            }}></div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("category");
  const searchQuery = searchParams.get("q") || "";
  const [newOrgEvents, setNewOrgEvents] = useState([]);
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
  const siteBranding = parseConfig(getConfigValue('admin_site_branding')) || {
    name: "book my ticket",
    logoColor: "#111111",
    logoUrl: "/logo.png"
  };
  const metaSettings = parseConfig(getConfigValue('admin_meta_settings')) || {
    global: { title: "BookMyTicket", description: "Best Event Ticketing Platform" }
  };

  const { user } = useAuth();
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
        const eventDate = parseEventDate(b.events?.date, b.events?.time);
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

  const { data: supabaseEventsRaw } = useSupabaseQuery('events', (q) => q, []);
  const supabaseEvents = useMemo(() => supabaseEventsRaw || EMPTY_ARRAY, [supabaseEventsRaw]);

  const normalizedOrgEvents = useMemo(() => {
    const now = new Date();
    return (Array.isArray(newOrgEvents) ? newOrgEvents : [])
      .filter(ev => {
        // permissive status check during migration
        const s = String(ev.status || '').toLowerCase();
        if (s === "inactive" || s === "expired" || s === "draft") return false;
        
        const eventDate = parseEventDate(ev.date || ev.rawDate, ev.time || ev.rawTime);
        if (!eventDate) return true; // Keep if we can't parse it
        
        // Use a 2-hour buffer for "end time" if not explicitly provided
        const endTs = ev.end_date_time || ev.endDateTime || (eventDate.getTime() + (2 * 60 * 60 * 1000));
        return endTs > now.getTime();
      })
      .map((ev, idx) => {
        const loc = String(ev.location || ev.venue || ev.address || "Venue").trim();
        const isVirtual = ev.virtual === true || 
                 String(ev.type || '').toLowerCase() === "online" || 
                 String(ev.type || '').toLowerCase() === "virtual" ||
                 loc.toLowerCase().includes("online") ||
                 loc.toLowerCase().includes("virtual");
        return {
          ...ev,
          id: ev.id || ev._id || `org-${idx}-${Date.now()}`,
          title: ev.title || "Event",
          img: ev.img || ev.banner_preview || ev.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop",
          rawDate: ev.date,
          rawTime: ev.time,
          date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
          location: loc,
          featured: ev.featured !== false,
          trending: ev.trending === true,
          spotlight: ev.spotlight === true,
          exclusive: ev.exclusive === true,
          virtual: isVirtual,
        };
      });
  }, [newOrgEvents]);

  const allEventsForFilter = useMemo(() => [
    ...(Array.isArray(normalizedOrgEvents) ? normalizedOrgEvents : [])
  ], [normalizedOrgEvents]);

  const { selectedCity } = useAuth();

  const filteredEvents = useMemo(() => {
    let results = allEventsForFilter;

    // 0. Filter by Selected City
    if (selectedCity && selectedCity !== "All Cities") {
      const cityLower = selectedCity.toLowerCase();
      // Expanded city map for common variations
      const cityVariations = {
        'bengaluru': ['bangalore', 'bengaluru'],
        'bangalore': ['bangalore', 'bengaluru'],
        'new delhi': ['delhi', 'new delhi', 'ncr'],
        'delhi': ['delhi', 'new delhi', 'ncr'],
        'mumbai': ['bombay', 'mumbai'],
        'chennai': ['madras', 'chennai'],
        'kochi': ['cochin', 'kochi'],
        'coimbatore': ['coimbatore', 'pollachi'],
      };
      
      const targetCities = cityVariations[cityLower] || [cityLower];

      results = results.filter(ev => {
        if (ev.virtual === true || ev.featured === true || ev.spotlight === true) return true;
        
        const evCity = String(ev.city || '').toLowerCase().trim();
        const evLoc = String(ev.location || '').toLowerCase().trim();
        const evVenue = String(ev.venue || '').toLowerCase().trim();
        const evDistrict = String(ev.district || '').toLowerCase().trim();

        return targetCities.some(tc => 
          evCity.includes(tc) || 
          evDistrict.includes(tc) || 
          evLoc.includes(tc) || 
          evVenue.includes(tc)
        ) || !ev.city; // Show if city info is missing (Global)
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    results = results.filter(ev => {
      const eventDate = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time);
      if (!eventDate) return true;
      
      const evDateOnly = new Date(eventDate);
      evDateOnly.setHours(0, 0, 0, 0);
      return evDateOnly >= today;
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
    setNewOrgEvents(supabaseEvents);
  }, [supabaseEvents]);

  // Fallback or old local storage cleanup (Optional: keep using convexEvents instead, logic below handles parsing well)


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
      <main style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: isMobile ? '142px' : 'var(--header-h)' }}>
        
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
        `}</style>

        {/* 0) Top Video Hero (Primary) */}
        <div style={{ width: '100%', paddingTop: isMobile ? '0' : '0' }}>
          <VideoHeroBanner />
        </div>

        {/* Search & Category Filter Results Section */}

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
            <RecentlyViewedEvents liveEvents={supabaseEvents} />

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
            <section id="services" style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '40px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.04em', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                    Professional <span style={{
                      background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block'
                    }}>Services</span>
                  </h2>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, fontWeight: 500 }}>Top rated artists and studios for your special occasions</p>
                </div>
                <Link href="/services" style={{ 
                  padding: '12px 24px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  color: '#0f172a', 
                  fontWeight: 700, 
                  fontSize: '14px', 
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f84464';
                  e.currentTarget.style.color = '#f84464';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#0f172a';
                }}
                >
                  View All Services →
                </Link>
              </div>
              <ServiceCategories />
            </section>

             {/* Branding & Others */}
            <div style={{ width: '100%' }}>
              <FeaturedOrganisers organisers={eventPartners} />
            </div>
            <RecentMemories />
            <div style={{ width: '100%' }}>
              <Sponsors />
            </div>

            {/* Promotional Image Hero Banners moved to bottom for better flow */}

            {/* DYNAMIC UI SECTION: About BookMyTicket */}
            <section style={{ width: '100%', backgroundColor: '#ffffff', padding: '80px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  style={{ textAlign: 'left', marginBottom: '60px' }}
                >
                  <h2 id="platform-intro-heading" style={{ fontSize: 'clamp(42px, 5vw, 64px)', fontWeight: 900, color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    BookMyTicket – <br />
                    <span style={{ background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Book Events, Turf & Services
                    </span>
                  </h2>
                  <p style={{ color: '#475569', fontSize: '18px', maxWidth: '800px', margin: '0 0 40px', lineHeight: 1.6, fontWeight: 500 }}>
                    BookMyTicket helps you discover and book live events, sports turf slots, and professional services near you. 
                    Find concerts, local events, and trusted service providers easily in India's top cities.
                  </p>
                </motion.div>

                
                {/* SLIDING UI SECTION: Features */}
                <div className="sliding-features-wrap" style={{ 
                  display: 'flex', 
                  overflowX: 'auto', 
                  gap: '32px', 
                  paddingBottom: '20px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  {[
                    {
                      title: "Online Event Ticketing",
                      icon: "🎟️",
                      color: "#f84464",
                      desc: "BookMyTicket is the premier destination for **online ticket sales** in India. We help fans find the best **concerts near me**, live shows, and community events with the **lowest platform fees**. Sell tickets online free with our advanced **event ticketing software**.",
                      sub: "Events in Coimbatore & Chennai",
                      subDesc: "Discover regional theaters, local art exhibits, and sports matches. Whether it's a cricket tournament in Coimbatore or a music gala in Chennai, BookMyTicket is your trusted partner."
                    },
                    {
                      title: "Sports Turf Booking",
                      icon: "⚽",
                      color: "#8b5cf6",
                      desc: "Looking to play? Our platform offers the easiest way to **book cricket turfs**, football grounds, and badminton courts. Get real-time availability and instant confirmation for the top sports venues in **Hyderabad, Bangalore, and Chennai**.",
                      sub: "Best Sports Venues Near You",
                      subDesc: "We partner with top-rated sports facilities across India to ensure you play on the best surfaces. From floodlit night matches to weekend morning drills, find the perfect slot today."
                    },
                    {
                      title: "Professional Services",
                      icon: "🤝",
                      color: "#c026d3",
                      desc: "Beyond tickets, we connect you with **professional artist booking** services. Hire verified Mehendi artists, wedding photographers, and event planners. Browse portfolios and book experts directly on **BookMyTicket**.",
                      sub: "Verified & Rated Providers",
                      subDesc: "Every service provider on our platform undergoes a verification process. Read real reviews, browse portfolios, and book with confidence knowing you are getting the best talent in the industry."
                    }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      className="sliding-card"
                      whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      style={{ 
                        flex: '0 0 380px',
                        background: '#fff', 
                        padding: '40px', 
                        borderRadius: '32px', 
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.02em' }}>{item.title}</h3>
                        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.8, margin: 0 }}>
                          {item.desc.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#334155', fontWeight: 700 }}>{part}</strong> : part)}
                        </p>
                      </div>
                      
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>{item.sub}</h4>
                        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{item.subDesc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <style>{`
                  .dynamic-card:hover {
                    transform: translateY(-12px);
                    border-color: rgba(248,68,100,0.2);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.08);
                    background: linear-gradient(to bottom right, #ffffff, #fdf2f8);
                  }
                `}</style>

                {/* DYNAMIC UI SECTION: Why Book With BookMyTicket? */}
                <WhyChooseUs />

                {/* Content Expansion for Text-to-Code Ratio Improvement */}
                <div style={{ marginTop: '100px', backgroundColor: '#f8fafc', padding: '60px 40px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                  <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '24px' }}>Discover the Best Events & Services Near You</h2>
                    <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, marginBottom: '32px' }}>
                      Whether you are looking for the latest <strong>music concerts</strong>, high-energy <strong>sports events</strong>, or a quiet evening at the <strong>theater</strong>, BookMyTicket is your ultimate destination. We specialize in providing a seamless <strong>online ticketing platform</strong> that connects fans with their favorite experiences. From the pulse of <strong>nightlife events</strong> to the strategic thrill of <strong>board game meetups</strong>, our platform covers every niche of entertainment.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', textAlign: 'left' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>🏟️ Sports & Turf Booking</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                          Looking to play? Book <strong>cricket turfs</strong>, football grounds, and badminton courts instantly. We provide real-time availability for the best sports venues in your city, ensuring you never miss a game.
                        </p>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>🎨 Professional Services</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                          Need an expert? Browse our directory of <strong>verified service providers</strong>. From professional photographers to wedding mehendi artists, we help you find and book the right talent for your special occasions.
                        </p>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>🎟️ Seamless Ticketing</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                          Experience the future of <strong>digital ticketing</strong>. Our platform offers instant confirmations, secure payments, and easy entry with e-tickets, making your <strong>event experience</strong> stress-free from start to finish.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', maxWidth: '1240px', margin: '60px auto 0' }}>
                  <PublicReviewsBanner />
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center', overflow: 'hidden', padding: '20px 0' }}>

                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#f84464', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '4px' }}>Serving Cities Across India</h4>
                  
                  <div className="city-marquee-container" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                    <div style={{
                      display: 'flex',
                      gap: '30px',
                      width: 'max-content',
                      animation: 'cityMarquee 30s linear infinite',
                    }}
                    onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
                    onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
                    >
                      {[...Array(4)].map((_, i) => (
                        <React.Fragment key={i}>
                          {[
                            { name: 'Coimbatore', code: 'CBE', img: 'https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=400&auto=format' },
                            { name: 'Bengaluru', code: 'BLR', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=400&auto=format' },
                            { name: 'Chennai', code: 'MAA', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&auto=format' },
                            { name: 'Mumbai', code: 'BOM', img: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&auto=format' },
                            { name: 'Kochi', code: 'COK', img: 'https://images.pexels.com/photos/10557457/pexels-photo-10557457.jpeg?auto=compress&cs=tinysrgb&w=400' },
                            { name: 'Delhi', code: 'DEL', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&auto=format' },
                            { name: 'Hyderabad', code: 'HYD', img: 'https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=400&auto=format' },
                            { name: 'Pune', code: 'PNQ', img: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=400&auto=format' },
                            { name: 'Ahmedabad', code: 'AMD', img: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=400&auto=format' },
                            { name: 'Kolkata', code: 'CCU', img: 'https://images.pexels.com/photos/14101851/pexels-photo-14101851.jpeg?auto=compress&cs=tinysrgb&w=400' }
                          ].map(city => (
                            <div key={city.name + i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '120px' }}>
                              <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                overflow: 'hidden', border: '4px solid #fff',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                background: '#f1f5f9',
                                transition: 'all 0.4s ease'
                              }}
                              className="city-img-circle"
                              >
                                <img 
                                  src={city.img} 
                                  alt={city.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${city.code}&background=f84464&color=fff&size=100&bold=true`;
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>{city.name}</span>
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <style>{`
                    @keyframes cityMarquee {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-25%); }
                    }
                    .city-img-circle:hover {
                      transform: scale(1.15) rotate(5deg);
                      border-color: #f84464 !important;
                      box-shadow: 0 15px 35px rgba(248, 68, 100, 0.3) !important;
                    }
                  `}</style>
                </div>
              </div>
            </section>

            {/* Image Banner removed from here - moved to top under video */}
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
