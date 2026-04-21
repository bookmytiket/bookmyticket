"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, ChevronDown, User, LogOut, Menu, X, Calendar, Ticket as TicketIcon, Handshake, Globe, Wrench, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Country, State, City } from "country-state-city";

import { supabase } from "@/lib/supabase";

const SUBNAV_LINKS = [
  { href: "/#explore-popular-events", label: "Events" },
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

import { useAuth } from "./AuthContext";
import LocationSelectionModal from "./LocationSelectionModal";
import BecomePartnerModal from "./BecomePartnerModal";

const ALL_CITIES_BY_COUNTRY = {
  "India": ["Coimbatore", "Chennai", "Salem", "Madurai", "Trichy", "Tirupur", "Erode", "Bengaluru", "Hyderabad", "Mumbai", "Pune", "Kolkata", "Delhi", "Gurgaon", "Noida", "Ahmedabad", "Surat", "Jaipur", "Lucknow", "Kochi", "Thiruvananthapuram", "Chandigarh", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Ludhiana", "Agra", "Nashik", "Rajkot", "Varanasi", "Srinagar", "Amritsar", "Aurangabad", "Solapur"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Ajman"],
  "Singapore": ["Central", "North", "South", "East", "West"],
  "Malaysia": ["Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Petaling Jaya", "Malacca City", "Johor Bahru", "Kuching", "Kota Kinabalu"],
  "Thailand": ["Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai", "Udon Thani", "Hat Yai", "Pattaya", "Phuket Town", "Suphan Buri", "Surat Thani"],
  "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen"],
  "United States": ["New York City", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"]
};

const DEFAULT_CATEGORIES = [
  "Concert", "Sports", "Comedy", "Theatre",
  "Music", "Workshop", "Festival", "Live Shows",
];

export default function Navbar() {
  const { user, logout, selectedCity, updateCity } = useAuth();
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

  return (
    <>
      <header className={`site-header${scrolled ? " header-scrolled" : ""}`}>
        {/* Main Navbar */}
        <div className="header-main" style={{ justifyContent: 'space-between' }}>
          <Link href="/" className="header-logo" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ height: scrolled ? "45px" : "65px", width: "auto", display: "block", transition: "all 0.3s ease" }} />
          </Link>


          {/* Desktop Searchbar - Premium Version */}
          <div className="nav-search-wrap hide-mobile" style={{
            marginLeft: '20px',
            marginRight: '20px',
            maxWidth: '450px',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: scrolled ? 'rgba(255,255,255,0.1)' : '#f8fafc',
            borderRadius: '12px',
            padding: '4px 6px',
            border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: '8px' }}>
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
                  padding: '8px 12px',
                  fontSize: '14px',
                  width: '100%',
                  color: scrolled ? '#fff' : '#1e293b'
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
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Search
            </button>
          </div>

          {/* Location Selection Button */}
          <button
            className="nav-loc-btn hide-mobile"
            onClick={() => setLocOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: scrolled ? '#fff' : '#1e293b',
              marginRight: 'auto'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span suppressHydrationWarning style={{ fontWeight: 700, fontSize: '15px' }}>{mounted ? (selectedCity || "Select Location") : "Select Location"}</span>
          </button>

          {/* New Desktop Navigation Buttons - gated on mounted to prevent SSR/localStorage hydration mismatch */}
          <div className="nav-desktop-actions hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginRight: '20px' }}>
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
                {/* Persistent Join Now Button - Pink */}
                <button
                    onClick={() => {
                        if (nextMeeting) {
                        const url = nextMeeting.customer_details?.meeting_url;
                        const target = url.startsWith("http") ? url : `/${url}`;
                        window.open(target, '_blank', 'noopener,noreferrer');
                        } else {
                            router.push('/meeting/join');
                        }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(248, 68, 164, 0.2)',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(248, 68, 164, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(248, 68, 164, 0.2)';
                    }}
                  >
                    <Video size={16} /> Join Now
                </button>

                {user ? (
                    <Link
                      href={
                        user.role === "organiser" || user.role === "staff" ? "/organiser" :
                        user.role === "vendor" ? "/vendor/dashboard" :
                        user.role === "admin" || user.role === "super_admin" ? "/admin" :
                        user.role === "branding_partner" ? "/branding/dashboard" :
                        "/profile"
                      }
                      style={{
                        background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
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
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(248, 68, 164, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(248, 68, 164, 0.2)';
                      }}
                    >
                      {
                        user.role === "organiser" || user.role === "staff" ? "Organiser Panel" :
                        user.role === "vendor" ? "Partner Portal" :
                        user.role === "admin" || user.role === "super_admin" ? "Admin Panel" :
                        user.role === "branding_partner" ? "Partner Dashboard" :
                        "Dashboard"
                      }
                    </Link>
                ) : (
                    <Link
                      href="/signin"
                      style={{
                        background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
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
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(248, 68, 164, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(248, 68, 164, 0.2)';
                      }}
                    >
                      Sign In
                    </Link>
                )}
                </>
            )}
          </div>

          <div className="header-actions-area" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="show-mobile"
              onClick={() => setLocOpen(true)}
              style={{ background: 'none', border: 'none', padding: '6px 2px', color: scrolled ? '#fff' : '#1e293b' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={scrolled ? "#fff" : "#ef4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span suppressHydrationWarning style={{ fontSize: '13px', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {mounted ? (selectedCity || "Select") : "Select"}
                </span>
              </div>
            </button>
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
                            user.role === "organiser" || user.role === "staff" ? "/organiser" :
                            user.role === "vendor" ? "/vendor/dashboard" :
                            user.role === "admin" || user.role === "super_admin" ? "/admin" :
                            user.role === "branding_partner" ? "/branding/dashboard" :
                            "/profile"
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
                            user.role === "vendor" ? "Partner Portal" :
                            user.role === "admin" || user.role === "super_admin" ? "Admin Panel" :
                            user.role === "branding_partner" ? "Partner Dashboard" :
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

        {/* Mobile Search - Persistent */}
        <div className="show-mobile" style={{
          padding: '10px 16px 16px',
          background: 'transparent'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: scrolled ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
            borderRadius: '12px',
            padding: '4px 6px',
            border: scrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: '8px' }}>
              <Search size={16} color="#f844a4" />
              <input
                placeholder="Find events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/?q=${encodeURIComponent(search)}`)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '8px 10px',
                  fontSize: '14px',
                  width: '100%',
                  color: scrolled ? '#fff' : '#1e293b'
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
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Sub-navbar with Animation - Moved Inside Header */}
        <nav className="header-subnav">
          <div className="subnav-container">
            <div className="subnav-links">
              {SUBNAV_LINKS.map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="subnav-item"
                >
                  <Link
                    href={link.href}
                    className={`subnav-link ${(pathname === link.href || (pathname === '/' && link.label === 'Events')) ? "active" : ""}`}
                  >
                    {link.label === "Events" && <Calendar size={14} style={{ marginRight: '6px' }} />}
                    {link.label === "RSVP" && <TicketIcon size={14} style={{ marginRight: '6px' }} />}
                    {link.label === "Services" && <Wrench size={14} style={{ marginRight: '6px' }} />}
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="subnav-actions hide-mobile">
              <button
                onClick={() => setOrgOpen(true)}
                className={`subnav-action${orgOpen ? " active" : ""}`}
              >
                <Handshake size={16} className="subnav-action-icon" />
                Become a Partner
              </button>
              <Link
                href="/branding"
                className={`subnav-action${pathname?.startsWith("/branding") ? " active" : ""}`}
              >
                <Globe size={16} className="subnav-action-icon" />
                Branding
              </Link>
            </div>
          </div>
        </nav>
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

              <button
                className="mobile-nav-link"
                style={{ textAlign: "left", background: "none", borderBottom: "1px solid var(--border)" }}
                onClick={() => {
                  if (nextMeeting) {
                      const url = nextMeeting.meetingUrl;
                      const target = url.startsWith("http") ? url : `/${url}`;
                      window.open(target, '_blank', 'noopener,noreferrer');
                  } else {
                      router.push('/meeting/join');
                  }
                  setMenuOpen(false);
                }}
              >
                Join Now
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
