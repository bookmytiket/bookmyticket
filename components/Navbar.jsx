"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, ChevronDown, User, LogOut, Menu, X, Calendar, Ticket as TicketIcon, Handshake, Globe, Wrench, Video, Headset, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Country, State, City } from "country-state-city";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import NotificationsDrawer from "@/components/NotificationsDrawer";

const SUBNAV_LINKS = [
  { href: "/#featured-events", label: "Events" },
  { href: "/#services", label: "Services" },
];



const COUNTRIES = [
  { flag: "🇮🇳", label: "India" },
  { flag: "🇦🇪", label: "UAE" },
  { flag: "🇸🇬", label: "Singapore" },
  { flag: "🇲🇾", label: "Malaysia" },
  { flag: "🇹🇭", label: "Thailand" },
  { flag: "🇩🇪", label: "Germany" },
  { flag: "🇺🇸", label: "United States" },
];

const CITY_GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #ffecd2, #fcb69f)",
  "linear-gradient(135deg, #ff9a9e, #fecfef)",
];

const CITY_ICONS = {
  "Bengaluru": (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="1.5">
      <path d="M10 54h44M14 54V24l8-4v34M22 54V10l10-4 10 4v44M42 54V30l8-4v28" />
      <rect x="25" y="14" width="2" height="2" fill="currentColor" opacity="0.3" />
      <rect x="37" y="14" width="2" height="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  Mumbai: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="1.5">
      <path d="M8 56h48M12 56V28l12-10 12 10v28M36 56V32l8-6 8 6v26" />
      <circle cx="24" cy="24" r="3" />
    </svg>
  ),
  Delhi: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="1.5">
      <path d="M12 56h40M16 56V20l16-8 16 8v36" />
      <path d="M24 56V40h16v16" />
    </svg>
  ),
  Coimbatore: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="1.5">
      <rect x="24" y="20" width="16" height="36" />
      <circle cx="32" cy="30" r="4" />
      <path d="M24 20l8-8 8 8" />
    </svg>
  ),
  Generic: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="1.5">
      <path d="M12 56h40M16 56V24l16-10 16 10v32" />
    </svg>
  )
};

const POPULAR_CITIES_BY_COUNTRY = {
  "India": [
    { name: "Bengaluru", iconId: "Bengaluru" },
    { name: "Mumbai", iconId: "Mumbai" },
    { name: "Delhi", iconId: "Delhi" },
    { name: "Chennai", iconId: "Generic" },
    { name: "Hyderabad", iconId: "Generic" },
    { name: "Coimbatore", iconId: "Coimbatore" },
    { name: "Kochi", iconId: "Generic" },
    { name: "Kolkata", iconId: "Generic" },
  ],
  "UAE": [
    { name: "Dubai", iconId: "Dubai" },
    { name: "Abu Dhabi", iconId: "Generic" },
    { name: "Sharjah", iconId: "Generic" },
    { name: "Al Ain", iconId: "Generic" },
    { name: "Ajman", iconId: "Generic" },
  ],
  "Singapore": [
    { name: "Central", iconId: "Singapore" },
    { name: "North", iconId: "Generic" },
    { name: "South", iconId: "Generic" },
    { name: "East", iconId: "Generic" },
    { name: "West", iconId: "Generic" },
  ],
  "Malaysia": [
    { name: "Kuala Lumpur", iconId: "Generic" },
    { name: "George Town", iconId: "Generic" },
    { name: "Ipoh", iconId: "Generic" },
    { name: "Johor Bahru", iconId: "Generic" },
  ],
  "Thailand": [
    { name: "Bangkok", iconId: "Generic" },
    { name: "Phuket Town", iconId: "Generic" },
    { name: "Chiang Mai", iconId: "Generic" },
    { name: "Pattaya", iconId: "Generic" },
  ],
  "Germany": [
    { name: "Berlin", iconId: "Generic" },
    { name: "Hamburg", iconId: "Generic" },
    { name: "Munich", iconId: "Generic" },
    { name: "Cologne", iconId: "Generic" },
  ],
  "United States": [
    { name: "New York City", iconId: "Generic" },
    { name: "Los Angeles", iconId: "Generic" },
    { name: "Chicago", iconId: "Generic" },
    { name: "Houston", iconId: "Generic" },
  ]
};

import { SERVICE_CATEGORIES, isServiceProvider } from "@/app/data/serviceCategories";

const EVENT_CATEGORIES = [...SERVICE_CATEGORIES, "Other"];

import LocationSelectionModal from "./LocationSelectionModal";
import BecomePartnerModal from "./BecomePartnerModal";

const ALL_CITIES_BY_COUNTRY = {
  "India": ["Coimbatore", "Chennai", "Salem", "Madurai", "Trichy", "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Tirunelveli", "Bengaluru", "Hyderabad", "Mumbai", "Pune", "Kolkata", "Delhi", "Gurgaon", "Noida", "Ahmedabad", "Surat", "Jaipur", "Lucknow", "Kochi", "Thiruvananthapuram", "Chandigarh", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Ludhiana", "Agra", "Nashik", "Rajkot", "Varanasi", "Srinagar", "Amritsar", "Aurangabad", "Solapur"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Ajman"],
  "Singapore": ["Central", "North", "South", "East", "West"],
  "Malaysia": ["Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Petaling Jaya", "Malacca City", "Johor Bahru", "Kuching", "Kota Kinabalu"],
  "Thailand": ["Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai", "Udon Thani", "Hat Yai", "Pattaya", "Phuket Town", "Suphan Buri", "Surat Thani"],
  "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen"],
  "United States": ["New York City", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"]
};

import { BRAND_COUPONS } from "@/app/data/homeEvents";

const DEFAULT_CATEGORIES = [
  "Concert", "Sports", "Comedy", "Theatre",
  "Music", "Workshop", "Festival", "Live Shows",
];

export default function Navbar({ compact = false }) {
  const { user, logout, selectedCity, selectedDistrict, updateCity } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [navCategories, setNavCategories] = useState(DEFAULT_CATEGORIES);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("category") || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mark as mounted after hydration to avoid SSR/localStorage mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Open location modal once on mount if no city is stored — no locOpen dependency to avoid infinite loop
  useEffect(() => {
    if (!selectedCity) {
      setLocOpen(true);
    }
  }, [selectedCity]);


  const [userBookings, setUserBookings] = useState([]);
  const [nextMeeting, setNextMeeting] = useState(null);

  const { data: activeJobs = [] } = useSupabaseQuery('jobs', (q) => q.eq('status', 'open'), []);
  const { data: bannerConfigRaw } = useSupabaseQuery('system_config', (q) => q.eq('key', 'careers_banner_settings'), []);
  const bannerConfig = bannerConfigRaw?.[0]?.value || { is_enabled: true };
  const isPortalEnabled = bannerConfig.is_enabled === true || bannerConfig.is_enabled === 'true';
  const hasActiveJobs = activeJobs.length > 0 && isPortalEnabled;

  useEffect(() => {
    const fetchNavbarData = async () => {
      // 1. Fetch Categories
      const { data: catData } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'admin_categories')
        .maybeSingle();
      
      if (catData?.value && Array.isArray(catData.value)) {
        const names = catData.value.map(c => c?.name ? String(c.name).trim() : "").filter(Boolean);
        if (names.length > 0) setNavCategories(names);
      }

      // 2. Fetch User Bookings (if logged in and valid ID)
      if (mounted && user?.id && user.id !== "none") {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (bookings) {
          setUserBookings(bookings);
          const meeting = bookings.find(b => b.status !== "Cancelled" && b.customer_details?.meeting_url);
          setNextMeeting(meeting);
        }
      }
    };

    if (mounted) fetchNavbarData();
  }, [mounted, user]);

  const setActiveCat = (cat) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === activeCat || !cat) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };


  /* Organiser modal */

  /* Organiser modal */
  const [orgOpen, setOrgOpen] = useState(false);

  /* scroll detection */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* lock body scroll when any modal open */
  useEffect(() => {
    document.body.style.overflow = (locOpen || orgOpen || menuOpen) ? "hidden" : "";
  }, [locOpen, orgOpen, menuOpen]);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    if (!profileOpen) return;
    const handleClose = () => setProfileOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [profileOpen]);



  const [orgLoading, setOrgLoading] = useState(false);

  const pathname = usePathname();
  const isHome = pathname === "/";

  const handleLogoClick = (e) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEventsClick = (e) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Countdown hook for the Coming Soon ticker
  const useTickerCountdown = (targetDate) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    useEffect(() => {
      if (!targetDate) return;
      const calc = () => {
        const diff = new Date(targetDate) - new Date();
        if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          mins: Math.floor((diff % 3600000) / 60000),
          secs: Math.floor((diff % 60000) / 1000),
        });
      };
      calc();
      const t = setInterval(calc, 1000);
      return () => clearInterval(t);
    }, [targetDate]);
    return timeLeft;
  };

  const ComingSoonCountdown = () => {
    const { data: events } = useSupabaseQuery('events', (q) => q.order('date', { ascending: true }).limit(20), []);
    const [idx, setIdx] = useState(0);

    const upcoming = useMemo(() => {
      if (!events) return [];
      return events.filter(e => new Date(e.date) >= new Date()).slice(0, 5);
    }, [events]);

    useEffect(() => {
      if (!upcoming || upcoming.length <= 1) return;
      const timer = setInterval(() => {
        setIdx((prev) => (prev + 1) % upcoming.length);
      }, 8000);
      return () => clearInterval(timer);
    }, [upcoming?.length]);


    const currentEvent = upcoming[idx];
    const timeLeft = useTickerCountdown(currentEvent?.date);

    if (upcoming.length === 0) return null;

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              backgroundPosition: ['0% center', '200% center']
            }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ 
              opacity: { duration: 0.5 },
              x: { duration: 0.5 },
              backgroundPosition: {
                duration: 4,
                repeat: Infinity,
                ease: 'linear'
              }
            }}
            style={{ 
              background: 'linear-gradient(90deg, #f844a4, #c026d3, #f844a4)', 
              backgroundSize: '200% auto',
              padding: '0 18px', 
              borderRadius: '10px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 15px rgba(248, 68, 164, 0.3)',
              height: '38px',
              whiteSpace: 'nowrap',
              border: 'none'
            }}

          >
            <motion.span 
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ 
                fontSize: '9px', 
                fontWeight: 950, 
                color: '#fff', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
              }}
            >
              Coming Soon
            </motion.span>

            <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.3)' }} />

            <div style={{ 
              fontSize: '13px', 
              fontWeight: 800, 
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {currentEvent?.title}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };



  const CouponFlipTicker = ({ isScrolled = false, isMobileMode = false }) => {
    const { data: supabaseCoupons } = useSupabaseQuery('branding_coupons', (q) => q, []);
    const [currentIndex, setCurrentIndex] = useState(0);

    const coupons = useMemo(() => {
        if (supabaseCoupons && supabaseCoupons.length > 0) return supabaseCoupons;
        return BRAND_COUPONS;
    }, [supabaseCoupons]);

    const lengthRef = useRef(coupons?.length || 0);
    useEffect(() => {
        lengthRef.current = coupons?.length || 0;
    }, [coupons?.length]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (lengthRef.current > 1) {
                setCurrentIndex((prev) => (prev + 1) % lengthRef.current);
            }
        }, 5000);

        return () => clearInterval(timer);
    }, []);




    if (!coupons || coupons.length === 0) return null;

    const current = coupons[currentIndex];
    if (!current) return null;
    const brandName = current.brand_name || current.brandName || "Special Offer";
    const title = current.title || "Limited Time Deal";
    const bannerUrl = current.banner_url || current.bannerUrl || 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=400';
    const discount = current.discountValue ? `${current.discountValue}${current.discountType === 'Percentage' ? '%' : '₹'} OFF` : (current.discount || 'OFFER');

    const handleCouponClick = () => {
        if (!user) {
            router.push("/signin?redirect=/coupons");
        } else {
            router.push("/coupons");
        }
    };

    return (
        <div style={{ perspective: '1000px', display: 'flex', justifyContent: 'center', flex: 1, width: isMobileMode ? '100%' : 'auto' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    onClick={handleCouponClick}
                    initial={{ rotateX: 90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: -90, opacity: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        width: isMobileMode ? '100%' : '480px',
                        height: '50px',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >


                    <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#f84464', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                {brandName}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: '4px' }}>
                                {discount}
                            </span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {current.code ? `${current.code}: ` : ""}{title}
                        </span>
                    </div>

                    <div style={{ 
                        background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)', 
                        color: '#fff', 
                        width: '30px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                    }}>
                        →
                    </div>

                    <div className="shimmer-effect" style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        transform: 'translateX(-100%)',
                        animation: 'shimmer 4s infinite linear',
                        pointerEvents: 'none'
                    }} />
                </motion.div>
            </AnimatePresence>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    30% { transform: translateX(100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
  };

  return (
    <>
      <header className={`site-header${scrolled ? " header-scrolled" : ""}${compact ? " header-compact" : ""}`}>
        {/* Main Navbar */}
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 100, height: '64px', gap: '20px' }}>
          {/* Logo & Location Group for Mobile Alignment */}
          <div style={{ display: 'flex', alignItems: 'center', flex: isMobile ? 1 : 'none' }}>
            <Link href="/" className="header-logo" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center' }}>
              <motion.img
                src="/logo.png"
                alt="BookMyTicket"
                initial={{ y: -60, opacity: 0, scale: 0.7 }}
                animate={{ y: [null, 0], opacity: 1, scale: 1 }}
                transition={{
                  y: { type: 'spring', stiffness: 320, damping: 14, duration: 0.7 },
                  opacity: { duration: 0.3 },
                  scale: { type: 'spring', stiffness: 280, damping: 16 },
                }}
                whileHover={{ y: -5, scale: 1.06, transition: { type: 'spring', stiffness: 400, damping: 12 } }}
                whileTap={{ scale: 0.95 }}
                style={{
                  height: scrolled ? (isMobile ? '32px' : '44px') : (isMobile ? '40px' : '64px'),
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  transition: 'height 0.3s ease, filter 0.3s ease',
                  filter: scrolled ? 'brightness(0) invert(1)' : 'none',
                  cursor: 'pointer',
                }}
              />
            </Link>

            {/* Location Selection Button - Mobile Only (next to logo) */}
            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.05, background: scrolled ? 'rgba(255,255,255,0.2)' : 'rgba(248, 68, 100, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="nav-loc-btn"
                onClick={() => setLocOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.4)',
                  border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: scrolled ? '#fff' : '#1e293b',
                  marginLeft: '8px',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  height: '44px'
                }}
              >
                <MapPin size={12} color={scrolled ? "#fff" : "#f84464"} strokeWidth={2.5} />
                <div suppressHydrationWarning style={{ 
                  fontWeight: 800, 
                  fontSize: '10px', 
                  letterSpacing: '-0.01em', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {mounted ? (selectedDistrict || selectedCity || "Location") : "Location"}
                </div>
              </motion.button>
            )}
          </div>

          <div className="nav-search-wrap hide-mobile" style={{
            margin: '0 20px',
            maxWidth: '500px',
            flex: 1.5,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
            borderRadius: '16px',
            padding: '0 4px 0 8px',
            border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.5)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            boxShadow: scrolled ? 'none' : '0 4px 15px rgba(0,0,0,0.05)',
            height: '48px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Search size={18} color={scrolled ? "#fff" : "#f84464"} />
              <input
                className="nav-search-input"
                placeholder="Search events, artists, venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/?q=${encodeURIComponent(search)}`)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '10px 12px',
                  fontSize: '14px',
                  width: '100%',
                  color: scrolled ? '#fff' : '#1e293b',
                  fontWeight: 500
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(248, 68, 164, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/?q=${encodeURIComponent(search)}`)}
              style={{
                background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0 24px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 12px rgba(248, 68, 164, 0.2)',
                height: '40px',
                margin: '4px'
              }}
            >
              Search
            </motion.button>
          </div>
          
          {/* Location Selection Button - Desktop (next to search) */}
          {!isMobile && (
            <motion.button
              whileHover={{ scale: 1.05, background: scrolled ? 'rgba(255,255,255,0.2)' : 'rgba(248, 68, 100, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="nav-loc-btn hide-mobile"
              onClick={() => setLocOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.4)',
                border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                padding: '0 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                color: scrolled ? '#fff' : '#1e293b',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)',
                flexShrink: 0,
                height: '44px'
              }}
            >
              <MapPin size={18} color={scrolled ? "#fff" : "#f84464"} strokeWidth={2.5} />
              <div suppressHydrationWarning style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.01em' }}>
                {mounted ? (selectedDistrict || selectedCity || "Select Location") : "Select Location"}
              </div>
              <ChevronDown size={14} opacity={0.5} />
            </motion.button>
          )}

          {/* Desktop Actions Area */}
          <div className="nav-desktop-actions hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* Dynamic Support Icon */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(248, 68, 164, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/contact-us')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.4)',
                border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(248, 68, 164, 0.5)',
                color: scrolled ? '#fff' : '#f844a4',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: scrolled ? 'none' : '0 4px 12px rgba(248, 68, 164, 0.1)'
              }}
              title="24/7 Support"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -15, 15, -15, 15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <Headset size={20} strokeWidth={2.5} />
              </motion.div>
              
              {/* Pulse Ring */}
              <motion.div
                animate={{ 
                  boxShadow: ['0 0 0 0 rgba(248, 68, 164, 0.4)', '0 0 0 12px rgba(248, 68, 164, 0)']
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  pointerEvents: 'none'
                }}
              />
              
              {/* Notification Dot */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: scrolled ? '2px solid rgba(255,255,255,0.1)' : '2px solid #fff'
                }}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(248, 68, 164, 0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOrgOpen(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '13px', 
                fontWeight: 800, 
                color: scrolled ? '#fff' : '#1e293b', 
                background: scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.4)', 
                border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(248, 68, 164, 0.3)', 
                backdropFilter: 'blur(8px)',
                padding: '0 16px',
                height: '44px',
                borderRadius: '12px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Handshake size={18} style={{ color: '#f84464' }} />
              </motion.div>
              <span style={{ position: 'relative', zIndex: 1 }}>Become a Partner</span>
              
              {/* Dynamic Highlight Shimmer */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(248, 68, 164, 0.2), transparent)',
                  transform: 'skewX(-20deg)',
                  zIndex: 0
                }}
              />
            </motion.button>
            {!mounted ? (
              /* Render a neutral placeholder during SSR / before hydration */
              <Link
                href="/signin"
                style={{
                  background: 'linear-gradient(135deg, #f844a4 0%, #a855f7 100%)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(248, 68, 164, 0.2)',
                  transition: 'all 0.3s',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              >
                Sign In
              </Link>
            ) : (
                <>
                {user ? (
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                    <Link
                      href={
                        ["organiser", "staff"].includes(user.role?.toLowerCase()) ? "/organiser" :
                        ["admin", "super_admin"].includes(user.role?.toLowerCase()) ? "/admin" :
                        "/profile?tab=my_booking"
                      }
                      style={{
                        background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '13px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(248, 68, 164, 0.2)',
                        transition: 'all 0.3s',
                        height: '44px'
                      }}
                    >
                      {
                        user.role === "organiser" || user.role === "staff" ? "Organiser Panel" :
                        user.role === "admin" || user.role === "super_admin" ? "Admin Panel" :
                        "Dashboard"
                      }
                    </Link>
                    </motion.div>
                ) : (
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/signin"
                        style={{
                          background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
                          color: '#fff',
                          padding: '10px 24px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '13px',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(248, 68, 164, 0.25)',
                          transition: 'all 0.3s',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        Sign In
                      </Link>
                    </motion.div>
                )}
                </>
            )}
          </div>

          <div className="header-actions-area" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mounted && user && <NotificationsDrawer />}
            {mounted && user ? (
              <div style={{ position: 'relative' }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(!profileOpen);
                  }}
                  style={{ 
                    width: "36px", 
                    height: "36px", 
                    borderRadius: "50%", 
                    background: "var(--evente-pink)", 
                    color: "#fff", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontWeight: "700", 
                    cursor: "pointer", 
                    fontSize: "14px",
                    boxShadow: '0 4px 12px rgba(248, 68, 100, 0.2)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        right: 0,
                        width: '240px',
                        background: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        border: '1px solid #f1f5f9',
                        padding: '12px',
                        zIndex: 1000,
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', marginBottom: '2px' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all', opacity: 0.8 }}>{user.identifier}</div>
                      </div>
                      
                        <Link 
                          href={
                            ["organiser", "staff"].includes(user.role?.toLowerCase()) ? "/organiser" :
                            ["admin", "super_admin"].includes(user.role?.toLowerCase()) ? "/admin" :
                            "/profile?tab=my_booking"
                          } 
                          onClick={() => setProfileOpen(false)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '12px', 
                            borderRadius: '10px', 
                            textDecoration: 'none', 
                            color: '#475569', 
                            fontSize: '14px', 
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#f844a4'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <User size={18} /> {
                            user.role === "organiser" || user.role === "staff" ? "Organiser Panel" :
                            user.role === "admin" || user.role === "super_admin" ? "Admin Panel" :
                            "My Profile"
                          }
                        </Link>
                      
                      <Link 
                        href="/profile?tab=my_booking" 
                        onClick={() => setProfileOpen(false)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '12px', 
                          borderRadius: '10px', 
                          textDecoration: 'none', 
                          color: '#475569', 
                          fontSize: '14px', 
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#f844a4'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                      >
                        <TicketIcon size={18} /> My Bookings
                      </Link>

                      <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />

                      <button
                        onClick={() => { logout(); setProfileOpen(false); }}
                        style={{ 
                          width: '100%',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '12px', 
                          borderRadius: '10px', 
                          border: 'none',
                          background: 'transparent',
                          color: '#ef4444', 
                          fontSize: '14px', 
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <LogOut size={18} /> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button
                  className="show-mobile"
                  onClick={() => setMenuOpen(true)}
                  style={{ background: 'none', border: 'none', padding: '6px', color: scrolled ? '#fff' : '#1e293b' }}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1.5px solid ${scrolled ? '#fff' : '#1e293b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                </button>
              </>
            )}

            <button className="show-mobile" onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", padding: '6px', color: scrolled ? '#fff' : '#1e293b' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Persistent Scrolled Ticker removed as requested */}

        {/* Mobile View - Home Only Ticker & Search */}
        <div className="show-mobile" style={{
          padding: '4px 12px',
          background: 'transparent',
          marginTop: scrolled ? '0' : '0',
          paddingTop: scrolled ? '4px' : '4px'
        }}>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: scrolled ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
            borderRadius: '10px',
            padding: '2px 4px',
            border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: '8px' }}>
                <input
                  placeholder="Find events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/?q=${encodeURIComponent(search)}`)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    padding: '10px 12px',
                    fontSize: '14px',
                    width: '100%',
                    color: scrolled ? '#fff' : '#1e293b',
                    fontWeight: 500
                  }}
                />
            </div>
            <button
              onClick={() => router.push(`/?q=${encodeURIComponent(search)}`)}
              style={{
                background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(248, 68, 164, 0.2)'
              }}
            >
              Search
            </button>
          </div>
        </div>


      </header>

      {/* Mobile Menu Overlay */}
      {
        menuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
            <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>Menu</span>
                <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", padding: "0.5rem" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>


              <button className="mobile-nav-link" style={{ textAlign: "left", background: "none", borderBottom: "1px solid var(--border)" }} onClick={() => { setOrgOpen(true); setMenuOpen(false); }}>
                Become a Partner
              </button>



              <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem", paddingBottom: "2rem" }}>
                {user ? (
                  <button className="nav-action-signin" style={{ width: "100%", justifyContent: "center", borderRadius: "12px", height: "48px", background: 'linear-gradient(135deg, #f844a4 0%, #a855f7 100%)', color: "#fff", fontWeight: 800 }} onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button>
                ) : (
                  <Link href="/signin" className="nav-action-signin" style={{ width: "100%", justifyContent: "center", borderRadius: "12px", height: "48px", background: 'linear-gradient(135deg, #f844a4 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', gap: '8px', color: "#fff", fontWeight: 800 }} onClick={() => setMenuOpen(false)}>Sign In</Link>
                )}
              </div>
            </div>
          </div>
        )
      }



      <LocationSelectionModal
        isOpen={locOpen}
        onClose={() => setLocOpen(false)}
        selectedCity={selectedCity}
        updateCity={updateCity}
        allowClose={!!selectedCity}
      />

      <BecomePartnerModal 
        isOpen={orgOpen} 
        onClose={() => setOrgOpen(false)} 
      />
    </>
  );
}
