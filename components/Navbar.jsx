"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SUBNAV_LINKS = [
  { href: "/", label: "Events" },
  { href: "/#rsvp", label: "RSVP" },
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

const POPULAR_CITIES_BY_COUNTRY = {
  "India": [
    { name: "Bengaluru", icon: "🏙️" },
    { name: "Chennai", icon: "🌊" },
    { name: "Coimbatore", icon: "🏔️" },
    { name: "Hyderabad", icon: "🕌" },
    { name: "Kochi", icon: "⛵" },
    { name: "Kolkata", icon: "🌉" },
    { name: "New Delhi", icon: "🏛️" },
    { name: "Mumbai", icon: "🌃" },
  ],
  "UAE": [
    { name: "Dubai", icon: "🏗️" },
    { name: "Abu Dhabi", icon: "🌴" },
    { name: "Sharjah", icon: "🕌" },
    { name: "Al Ain", icon: "🌿" },
    { name: "Ajman", icon: "🏝️" },
  ],
  "Singapore": [
    { name: "Central", icon: "🌆" },
    { name: "North", icon: "🌳" },
    { name: "South", icon: "🏖️" },
    { name: "East", icon: "✈️" },
    { name: "West", icon: "🌉" },
  ],
  "Malaysia": [
    { name: "Kuala Lumpur", icon: "🗼" },
    { name: "George Town", icon: "🎨" },
    { name: "Ipoh", icon: "🏛️" },
    { name: "Johor Bahru", icon: "🌁" },
  ],
  "Thailand": [
    { name: "Bangkok", icon: "⛩️" },
    { name: "Phuket Town", icon: "🏝️" },
    { name: "Chiang Mai", icon: "🌸" },
    { name: "Pattaya", icon: "🎪" },
  ],
  "Germany": [
    { name: "Berlin", icon: "🚪" },
    { name: "Hamburg", icon: "⚓" },
    { name: "Munich", icon: "🍺" },
    { name: "Cologne", icon: "⛪" },
  ],
  "United States": [
    { name: "New York City", icon: "🗽" },
    { name: "Los Angeles", icon: "🎬" },
    { name: "Chicago", icon: "🌬️" },
    { name: "Houston", icon: "🚀" },
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

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("admin_categories") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed.map((c) => (c && c.name) ? String(c.name).trim() : "").filter(Boolean);
          if (names.length > 0) setNavCategories(names);
        }
      }
    } catch (_) { }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e) => {
      if (e.key === "admin_categories" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const names = parsed.map((c) => (c && c.name) ? String(c.name).trim() : "").filter(Boolean);
            if (names.length > 0) setNavCategories(names);
          }
        } catch (_) { }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setActiveCat = (cat) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === activeCat || !cat) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };


  /* Location modal */
  const [locOpen, setLocOpen] = useState(false);
  const [locSearch, setLocSearch] = useState("");
  const [activeCountry, setActiveCountry] = useState("India");
  const [showOtherCities, setShowOtherCities] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

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
    document.body.style.overflow = (locOpen || orgOpen) ? "hidden" : "";
  }, [locOpen, orgOpen]);



  const handleOrgSubmit = (e) => {
    e.preventDefault();
    setOrgSent(true);
    setTimeout(() => {
      setOrgSent(false);
      setOrgOpen(false);
      setOrgForm({ firstName: "", lastName: "", email: "", phone: "", category: "", role: "Organiser", remarks: "" });
    }, 2600);
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
        <div className="header-top">
          <Link href="/" className="header-logo" onClick={handleLogoClick}>
            <img src="/logo.png" alt="Logo" style={{ height: "65px", width: "auto", display: "block" }} />
          </Link>

          <div className="nav-search-wrap">
            <span className="nav-search-icon">🔍</span>
            <input
              id="nav-search"
              className="nav-search-input"
              placeholder="Search events, artists, venues…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="nav-search-btn">Search</button>
          </div>

          <div className="header-actions">
            <button id="location-btn" className="nav-location-btn" onClick={() => setLocOpen(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {selectedCity}
              <svg className="nav-loc-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            <button id="become-organiser-btn" className="nav-action-organiser" onClick={() => setOrgOpen(true)}>
              Become an Organiser
            </button>

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link href={user.role === "admin" ? "/admin" : user.role === "user" ? "/profile" : "/organiser"} className="nav-action-signin">Dashboard</Link>
                <div style={{ position: "relative" }}>
                  <div
                    onClick={() => setProfileOpen(!profileOpen)}
                    title={user.name}
                    style={{ width: "35px", height: "35px", borderRadius: "50%", background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", cursor: "pointer", fontSize: "14px", userSelect: "none" }}
                  >
                    {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : "U"}
                  </div>

                  {/* Public User Profile Dropdown */}
                  {profileOpen && (
                    <div style={{
                      position: "absolute",
                      top: "45px",
                      right: "0",
                      background: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      border: "1px solid #e2e8f0",
                      width: "180px",
                      overflow: "hidden",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                      transformOrigin: "top right",
                      animation: "dropdownFadeIn 0.2s ease"
                    }}>
                      <Link href="/profile?tab=my_booking" style={{ padding: "12px 16px", textDecoration: "none", color: "#1e293b", fontSize: "14px", fontWeight: "500", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setProfileOpen(false)}>
                        🎟️ My Booking
                      </Link>
                      <Link href="/profile?tab=change_password" style={{ padding: "12px 16px", textDecoration: "none", color: "#1e293b", fontSize: "14px", fontWeight: "500", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setProfileOpen(false)}>
                        🔒 Change Password
                      </Link>
                      <button onClick={() => { setProfileOpen(false); logout(); }} style={{ padding: "12px 16px", textDecoration: "none", color: "#ef4444", fontSize: "14px", fontWeight: "600", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                        🚪 Logout
                      </button>
                    </div>
                  )}
                  {/* Close dropdown when clicking outside (simple implementation by detecting any scroll or using a full screen overlay) */}
                  {profileOpen && (
                    <div
                      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                      onClick={() => setProfileOpen(false)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <Link href="/signin" className="nav-action-signin">Sign In</Link>
            )}
          </div>
        </div>


        {(isHome || pathname === "/") && (
          <div className="header-subnav">
            <div className="header-subnav-inner">
              <div className="header-subnav-left">
                {SUBNAV_LINKS.map(({ href, label }) => (
                  <Link key={label} href={href} className="subnav-link" onClick={label === "Events" ? handleEventsClick : undefined}>
                    {label}
                  </Link>
                ))}
                <span className="subnav-sep" />
                {navCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`subnav-cat${activeCat === cat ? " active" : ""}`}
                    onClick={() => setActiveCat(cat === activeCat ? "" : cat)}
                  >{cat}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {locOpen && (
        <div className="modal-backdrop" onClick={() => setLocOpen(false)}>
          <div className="loc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="loc-close-x" onClick={() => setLocOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="loc-title">Select Your Location to Continue</h2>

            <div className="loc-search-group">
              <div className="loc-search-box">
                <svg className="loc-icon-search" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  className="loc-input"
                  placeholder="Seach city or location..."
                  value={locSearch}
                  onChange={(e) => {
                    setLocSearch(e.target.value);
                    if (e.target.value.length > 0) setShowOtherCities(true);
                  }}
                  autoFocus
                />
                <button className="loc-search-clear-mini" onClick={() => { setLocSearch(""); setShowOtherCities(false); }} style={{ opacity: locSearch ? 1 : 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="loc-gps-divider"></div>
              <button
                className={`loc-gps-target ${geoLoading ? 'animating' : ''}`}
                onClick={handleGeoLocation}
                disabled={geoLoading}
                title="Use current location"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="12" y1="1" x2="12" y2="5"></line>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="1" y1="12" x2="5" y2="12"></line>
                  <line x1="19" y1="12" x2="23" y2="12"></line>
                </svg>
              </button>
            </div>

            <div className="loc-country-tabs">
              {COUNTRIES.map((c) => (
                <button
                  key={c.label}
                  className={`loc-tab${activeCountry === c.label ? " active" : ""}`}
                  onClick={() => setActiveCountry(c.label)}
                >
                  <span className="loc-tab-flag">{c.flag}</span>
                  <span className="loc-tab-label">{c.label}</span>
                </button>
              ))}
            </div>

            <p className="loc-section-label">Popular Cities</p>

            <div className="loc-cities-grid">
              {(POPULAR_CITIES_BY_COUNTRY[activeCountry] || []).filter(c => c.name.toLowerCase().includes(locSearch.toLowerCase())).map((city) => (
                <button
                  key={city.name}
                  className={`loc-city-card${selectedCity === city.name ? " active" : ""}`}
                  onClick={() => { updateCity(city.name); setLocOpen(false); }}
                >
                  <div className="loc-city-icon-wrap" style={{ background: CITY_GRADIENTS[(POPULAR_CITIES_BY_COUNTRY[activeCountry] || []).indexOf(city) % CITY_GRADIENTS.length] }}>
                    <span className="loc-city-emoji">{city.icon}</span>
                  </div>
                  <span className="loc-city-name">{city.name}</span>
                </button>
              ))}
            </div>

            <div className="loc-others-wrapper">
              <button className="loc-others-btn" onClick={() => setShowOtherCities(!showOtherCities)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span>{selectedCity && !(POPULAR_CITIES_BY_COUNTRY[activeCountry] || []).find(c => c.name === selectedCity) ? selectedCity : "Events in other cities"}</span>
                <svg className={`loc-chevron-down ${showOtherCities ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {showOtherCities && (
                <div className="loc-select-dropdown">
                  <div className="loc-dropdown-inner">
                    {(ALL_CITIES_BY_COUNTRY[activeCountry] || []).filter(c => c.toLowerCase().includes(locSearch.toLowerCase())).map(city => (
                      <div
                        key={city}
                        className={`loc-dropdown-item ${selectedCity === city ? 'selected' : ''}`}
                        onClick={() => { updateCity(city); setLocOpen(false); setShowOtherCities(false); }}
                      >
                        {city}
                        {selectedCity === city && <span className="loc-check">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="loc-footer-graphic">
              <div className="loc-skyline">
                <svg viewBox="0 0 800 200" className="skyline-svg">
                  <path d="M0,200 L800,200 L800,100 L760,100 L760,120 L720,120 L720,80 L680,80 L680,140 L640,140 L640,110 L600,110 L600,130 L560,130 L560,70 L520,70 L520,150 L480,150 L480,100 L440,100 L440,130 L400,130 L400,80 L360,80 L360,140 L320,140 L320,110 L280,110 L280,130 L240,130 L240,70 L200,70 L200,150 L160,150 L160,100 L120,100 L120,130 L80,130 L80,90 L40,90 L40,140 L0,140 Z" fill="#eeeeee" />
                </svg>
                <div className="loc-master-pin">
                  <div className="pin-pulse"></div>
                  <div className="pin-main">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="#ef4444" stroke="#fff" strokeWidth="1">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" fill="#fff" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {orgOpen && (
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
      )}
    </>
  );
}
