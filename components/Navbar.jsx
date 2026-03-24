"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, ChevronDown, User, LogOut, Menu, X, Calendar, Ticket as TicketIcon, Handshake, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Country, State, City } from "country-state-city";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const SUBNAV_LINKS = [
  { href: "/#explore-popular-events", label: "Events" },
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

const EVENT_CATEGORIES = [
  "Concert", "Sports", "Comedy", "Theatre", "Music",
  "Workshop", "Festival", "Conference", "Exhibition", "Other",
];

import { useAuth } from "./AuthContext";

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

  useEffect(() => {
    if (!selectedCity && !locOpen) {
      setLocOpen(true);
    }
  }, [selectedCity, locOpen]);


  const convexCategories = useQuery(api.systemConfig.getConfig, { key: "admin_categories" });

  useEffect(() => {
    if (convexCategories && Array.isArray(convexCategories)) {
      const names = convexCategories.map((c) => (c && c.name) ? String(c.name).trim() : "").filter(Boolean);
      if (names.length > 0) setNavCategories(names);
    }
  }, [convexCategories]);

  const setActiveCat = (cat) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === activeCat || !cat) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };


  /* Location modal states */
  const [locSearch, setLocSearch] = useState("");
  const [activeCountry, setActiveCountry] = useState("India");
  const [showOtherCities, setShowOtherCities] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // country-state-city states
  const [selCountry, setSelCountry] = useState("");
  const [selCountryCode, setSelCountryCode] = useState("");
  const [selState, setSelState] = useState("");
  const [selStateCode, setSelStateCode] = useState("");
  const [selCity, setSelCity] = useState("");

  const handleGeoLocation = () => {
    setGeoLoading(true);
    if (!("geolocation" in navigator)) {
      setGeoLoading(false);
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en", "User-Agent": "BookMyTicket/1.0" } }
          );
          const data = await res.json();
          const addr = data?.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || data?.name || "Your location";
          const country = (addr.country || "").trim();
          updateCity(city);
          if (country && COUNTRIES.some((c) => c.label === country)) setActiveCountry(country);
          setLocOpen(false);
        } catch {
          updateCity("Coimbatore");
          setLocOpen(false);
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        alert("Location permission denied or unavailable. Please search manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /* Organiser modal */
  const [orgOpen, setOrgOpen] = useState(false);
  const [orgSent, setOrgSent] = useState(false);
  const [orgForm, setOrgForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    category: "", role: "Organiser", remarks: "",
  });

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



  const createOrgRequest = useMutation(api.organiserRequests.create);
  const [orgLoading, setOrgLoading] = useState(false);

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    if (!orgForm.firstName || !orgForm.lastName || !orgForm.email || !orgForm.phone || !orgForm.category || !orgForm.role) {
      alert("Please fill all required fields");
      return;
    }
    setOrgLoading(true);
    try {
      await createOrgRequest(orgForm);
      setOrgSent(true);
      setTimeout(() => {
        setOrgSent(false);
        setOrgOpen(false);
        setOrgForm({ firstName: "", lastName: "", email: "", phone: "", category: "", role: "Organiser", remarks: "" });
      }, 2600);
    } catch (err) {
      alert("Failed to send request. Please try again later.");
      console.error(err);
    } finally {
      setOrgLoading(false);
    }
  };

  const field = (key) => ({
    value: orgForm[key],
    onChange: (e) => setOrgForm({ ...orgForm, [key]: e.target.value }),
  });

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
          <Link href="/" className="header-logo" onClick={handleLogoClick}>
            <img src="/logo.png" alt="Logo" style={{ height: scrolled ? "60px" : "70px", width: "auto", display: "block", transition: "height 0.3s ease" }} />
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
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{selectedCity || "Select Location"}</span>
          </button>

          {/* New Desktop Navigation Buttons */}
          <div className="nav-desktop-actions hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginRight: '20px' }}>
            {user?.role === "user" ? (
              <Link 
                href="/profile" 
                style={{
                  background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
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
                Dashboard
              </Link>
            ) : (
              <Link 
                href="/signin" 
                style={{
                  background: 'linear-gradient(135deg, #f844a4 0%, #c026d3 100%)',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
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
                Book Now
              </Link>
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
                <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedCity || "Select"}
                </span>
              </div>
            </button>



            {user ? (
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
                  {user.name && user.name[0].toUpperCase()}
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
                        href="/profile" 
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
                        <User size={18} /> My Profile
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
                    {link.label}
                  </Link>
                  {(pathname === link.href || (pathname === '/' && link.label === 'Events')) && (
                    <motion.div
                      layoutId="subnav-underline"
                      className="subnav-underline"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="subnav-actions hide-mobile">
              <button onClick={() => setOrgOpen(true)} className="subnav-action">
                <Handshake size={16} className="subnav-action-icon" />
                Become a Partner
              </button>
              <Link href="/branding" className="subnav-action">
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

              <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                {user ? (
                  <button className="nav-action-signin" style={{ width: "100%", justifyContent: "center" }} onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button>
                ) : (
                  <Link href="/signin" className="nav-action-signin" style={{ width: "100%", justifyContent: "center" }} onClick={() => setMenuOpen(false)}>Book Now</Link>
                )}
              </div>
            </div>
          </div>
        )
      }



      {
        locOpen && (
          <div className="modal-backdrop" onClick={() => selectedCity && setLocOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loc-modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
              <div className="mobile-handle show-mobile"></div>
              {selectedCity && (
                <button className="loc-close-x" onClick={() => setLocOpen(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}

              <h2 className="loc-title" style={{ marginTop: '10px' }}>Select Your Location to Continue</h2>

              <div className="loc-search-group" style={{ marginBottom: '24px' }}>
                <div className="loc-search-box">
                  <svg className="loc-icon-search" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    className="loc-input"
                    placeholder="Search For A Location..."
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                    autoFocus
                  />
                  {locSearch && (
                    <button className="loc-search-clear-mini" onClick={() => setLocSearch("")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  )}
                </div>
                <div className="loc-gps-divider"></div>
                <button
                  className={`loc-gps-target ${geoLoading ? 'animating' : ''}`}
                  onClick={handleGeoLocation}
                  disabled={geoLoading}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="12" y1="1" x2="12" y2="5"></line>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="1" y1="12" x2="5" y2="12"></line>
                    <line x1="19" y1="12" x2="23" y2="12"></line>
                  </svg>
                </button>
              </div>

              <div className="loc-country-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', padding: '0 4px' }}>
                {COUNTRIES.map((c) => (
                  <button
                    key={c.label}
                    className={`loc-tab${activeCountry === c.label ? " active" : ""}`}
                    onClick={() => setActiveCountry(c.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: activeCountry === c.label ? '1px solid #6366f1' : '1px solid #e2e8f0',
                      backgroundColor: activeCountry === c.label ? '#eef2ff' : '#fff',
                      color: activeCountry === c.label ? '#6366f1' : '#64748b',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', width: '100%', marginBottom: '24px' }}></div>

              <p className="loc-section-label">Popular Cities</p>

              <div className="loc-cities-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '12px',
                padding: '0 4px'
              }}>
                {(POPULAR_CITIES_BY_COUNTRY[activeCountry] || []).map((city) => (
                  <button
                    key={city.name}
                    className={`loc-city-card${selectedCity === city.name ? " active" : ""}`}
                    onClick={() => { updateCity(city.name); setLocOpen(false); }}
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 4px',
                      borderRadius: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div className="loc-city-icon-wrap" style={{ 
                      width: '100%',
                      aspectRatio: '1/1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc', 
                      borderRadius: '12px',
                      border: selectedCity === city.name ? '1.5px solid #6366f1' : '1px solid #f1f5f9',
                      padding: '10px'
                    }}>
                      <span className="loc-city-svg" style={{ color: selectedCity === city.name ? '#6366f1' : '#94a3b8' }}>{CITY_ICONS[city.iconId] || CITY_ICONS.Generic}</span>
                    </div>
                    <span className="loc-city-name" style={{ 
                      color: selectedCity === city.name ? "#6366f1" : "#475569", 
                      fontWeight: selectedCity === city.name ? "700" : "500", 
                      fontSize: '11px',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>{city.name}</span>
                  </button>
                ))}
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', width: '100%', marginTop: '32px', marginBottom: '24px' }}></div>

              <div className="loc-others-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '14px 24px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  width: '100%',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }} onClick={() => setShowOtherCities(!showOtherCities)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>Events in other cities</span>
                  <svg className={`loc-chevron-down ${showOtherCities ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ transition: 'transform 0.3s', transform: showOtherCities ? 'rotate(180deg)' : 'rotate(0)' }}><polyline points="6 9 12 15 18 9" /></svg>
                </div>

                {showOtherCities && (
                  <div className="loc-select-group">
                    <select
                      className="loc-select-input"
                      value={selCountry}
                      onChange={(e) => {
                        const code = Country.getAllCountries().find(c => c.name === e.target.value)?.isoCode || "";
                        setSelCountry(e.target.value);
                        setSelCountryCode(code);
                        setSelState("");
                        setSelStateCode("");
                        setSelCity("");
                      }}
                    >
                      <option value="">Select Country</option>
                      {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                    </select>
                    <select
                      className="loc-select-input"
                      value={selState}
                      disabled={!selCountryCode}
                      onChange={(e) => {
                        const code = State.getStatesOfCountry(selCountryCode).find(s => s.name === e.target.value)?.isoCode || "";
                        setSelState(e.target.value);
                        setSelStateCode(code);
                        setSelCity("");
                      }}
                    >
                      <option value="">Select State</option>
                      {selCountryCode && State.getStatesOfCountry(selCountryCode).map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                    </select>
                    <select
                      className="loc-select-input"
                      value={selCity}
                      disabled={!selStateCode}
                      onChange={(e) => {
                        setSelCity(e.target.value);
                        updateCity(e.target.value, { country: selCountry, state: selState, city: e.target.value });
                        setLocOpen(false);
                        setShowOtherCities(false);
                      }}
                    >
                      <option value="">Select City</option>
                      {selCountryCode && selStateCode && City.getCitiesOfState(selCountryCode, selStateCode).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ paddingBottom: '32px' }}></div>
            </div>
          </div>
        )
      }

      {
        orgOpen && (
          <div className="modal-backdrop" onClick={() => setOrgOpen(false)}>
            <div className="org-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setOrgOpen(false)}>✕</button>

              {orgSent ? (
                <div className="org-success">
                  <div className="org-success-icon">✅</div>
                  <h3>Request Submitted!</h3>
                  <p>Our team will get in touch with you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="org-modal-head">
                    <h2 className="org-modal-title">Request to Become a Partner</h2>
                    <p className="org-modal-sub">Fill in your details — our team will reach out to you within 24 hours.</p>
                  </div>

                  <form className="org-form" onSubmit={handleOrgSubmit} noValidate>
                    <div className="org-row">
                      <div className="org-field">
                        <label htmlFor="fn">First Name <span>*</span></label>
                        <input id="fn" required placeholder="John" {...field("firstName")} />
                      </div>
                      <div className="org-field">
                        <label htmlFor="ln">Last Name <span>*</span></label>
                        <input id="ln" required placeholder="Doe" {...field("lastName")} />
                      </div>
                    </div>

                    <div className="org-row">
                      <div className="org-field">
                        <label htmlFor="em">Email ID <span>*</span></label>
                        <input id="em" required type="email" placeholder="john@example.com" {...field("email")} />
                      </div>
                      <div className="org-field">
                        <label htmlFor="ph">Contact Number <span>*</span></label>
                        <input id="ph" required type="tel" placeholder="+91 98765 43210" {...field("phone")} />
                      </div>
                    </div>

                    <div className="org-row">
                      <div className="org-field">
                        <label htmlFor="cat">Event Category <span>*</span></label>
                        <select id="cat" required {...field("category")}>
                          <option value="">Select a category</option>
                          {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="org-field">
                        <label htmlFor="role">Role <span>*</span></label>
                        <select id="role" required {...field("role")}>
                          <option>Organiser</option>
                          <option>Individual</option>
                          <option>Pvt Ltd</option>
                          <option>Others</option>
                        </select>
                      </div>
                    </div>

                    <div className="org-field org-field-full">
                      <label htmlFor="rem">Remarks</label>
                      <textarea id="rem" rows={3} placeholder="Tell us about your events..." {...field("remarks")} />
                    </div>

                    <button type="submit" className="org-submit-btn">Send Request →</button>
                  </form>
                </>
              )}
            </div>
          </div>
        )
      }
    </>
  );
}
