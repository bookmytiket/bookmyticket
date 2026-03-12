"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Country, State, City } from "country-state-city";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const SUBNAV_LINKS = [
  { href: "/", label: "Events" },
  { href: "/#rsvp", label: "RSVP" },
];

import PromotionBanner from "./PromotionBanner";

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.6 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className="header-actions-area">
            <button
              className="nav-cta-btn hide-mobile"
              onClick={() => setOrgOpen(true)}
              style={{ height: '45px', padding: '0 20px', fontSize: '0.75rem' }}
            >
              Become an Organiser
            </button>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link href={user.role === "admin" ? "/admin" : user.role === "user" ? "/profile" : "/organiser"} className="nav-action-signin hide-mobile" style={{ textDecoration: 'none', color: '#000', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  Dashboard
                </Link>
                <div style={{ position: "relative" }}>
                  <div
                    onClick={() => setProfileOpen(!profileOpen)}
                    style={{ width: "35px", height: "35px", borderRadius: "50%", background: "var(--evente-pink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", cursor: "pointer", fontSize: "14px" }}
                  >
                    {user.name && user.name[0].toUpperCase()}
                  </div>
                  {profileOpen && (
                    <div className="profile-dropdown" style={{
                      position: "absolute", top: "45px", right: "0", background: "#fff",
                      borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      border: "1px solid #e2e8f0", width: "160px", zIndex: 100, display: "flex", flexDirection: "column"
                    }}>
                      <Link href="/profile" style={{ padding: "10px 15px", textDecoration: "none", color: "#1e293b", fontSize: "14px" }} onClick={() => setProfileOpen(false)}>My Profile</Link>
                      <button onClick={logout} style={{ padding: "10px 15px", textAlign: "left", background: "none", border: "none", color: "#ef4444", fontWeight: "600", cursor: "pointer" }}>Logout</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/signin" className="nav-cta-btn" style={{ height: '45px', padding: '0 30px' }}>Sign In</Link>
            )}

            <button className="show-mobile" onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", padding: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
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
      </header>
      {isHome && !scrolled && (
        <div style={{ position: "fixed", top: "calc(var(--header-h) - 40px)", left: 0, right: 0, zIndex: 999, background: "transparent", pointerEvents: "auto" }}>
          <PromotionBanner />
        </div>
      )}
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


              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Navigation</p>
              {SUBNAV_LINKS.map(({ href, label }) => (
                <Link key={label} href={href} className="mobile-nav-link" onClick={() => { setMenuOpen(false); if (label === "Events") handleEventsClick(); }}>
                  {label}
                </Link>
              ))}

              <button className="mobile-nav-link" style={{ textAlign: "left", background: "none", borderBottom: "1px solid var(--border)" }} onClick={() => { setLocOpen(true); setMenuOpen(false); }}>
                Location: {selectedCity}
              </button>

              <button className="mobile-nav-link" style={{ textAlign: "left", background: "none", borderBottom: "1px solid var(--border)" }} onClick={() => { setOrgOpen(true); setMenuOpen(false); }}>
                Become an Organiser
              </button>

              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "1rem", marginBottom: "0.5rem" }}>Categories</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {navCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`mobile-nav-cat${activeCat === cat ? " active" : ""}`}
                    onClick={() => { setActiveCat(cat === activeCat ? "" : cat); setMenuOpen(false); }}
                  >{cat}</button>
                ))}
              </div>

              <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                {user ? (
                  <button className="nav-action-signin" style={{ width: "100%", justifyContent: "center" }} onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button>
                ) : (
                  <Link href="/signin" className="nav-action-signin" style={{ width: "100%", justifyContent: "center" }} onClick={() => setMenuOpen(false)}>Sign In</Link>
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

              <div className="loc-country-tabs" style={{ marginBottom: '20px' }}>
                {COUNTRIES.map((c) => (
                  <button
                    key={c.label}
                    className={`loc-tab${activeCountry === c.label ? " active" : ""}`}
                    onClick={() => setActiveCountry(c.label)}
                    style={{ border: activeCountry === c.label ? '1.5px solid #6366f1' : '1px solid #e2e8f0', color: activeCountry === c.label ? '#6366f1' : '#64748b' }}
                  >
                    <span className="loc-tab-flag">{c.flag}</span>
                    <span className="loc-tab-label" style={{ fontWeight: activeCountry === c.label ? '700' : '500' }}>{c.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', width: '100%', marginBottom: '24px' }}></div>

              <p className="loc-section-label">Popular Cities</p>

              <div className="loc-cities-grid">
                {(POPULAR_CITIES_BY_COUNTRY[activeCountry] || []).map((city) => (
                  <button
                    key={city.name}
                    className={`loc-city-card${selectedCity === city.name ? " active" : ""}`}
                    onClick={() => { updateCity(city.name); setLocOpen(false); }}
                    style={{ border: selectedCity === city.name ? '1.5px solid #6366f1' : '1px solid transparent' }}
                  >
                    <div className="loc-city-icon-wrap" style={{ background: '#f8fafc', border: selectedCity === city.name ? '1.5px solid #6366f1' : '1px solid #f1f5f9' }}>
                      <span className="loc-city-svg" style={{ color: '#94a3b8' }}>{CITY_ICONS[city.iconId] || CITY_ICONS.Generic}</span>
                    </div>
                    <span className="loc-city-name" style={{ color: selectedCity === city.name ? "#6366f1" : "#475569", fontWeight: selectedCity === city.name ? "700" : "500", fontSize: '12px' }}>{city.name}</span>
                  </button>
                ))}
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', width: '100%', marginTop: '32px', marginBottom: '24px' }}></div>

              <div className="loc-others-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 20px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  width: 'fit-content',
                  cursor: 'pointer'
                }} onClick={() => setShowOtherCities(!showOtherCities)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Events in other cities</span>
                  <svg className={`loc-chevron-down ${showOtherCities ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9" /></svg>
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
                    <h2 className="org-modal-title">Request to Become an Organiser</h2>
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
