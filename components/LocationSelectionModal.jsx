"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Target, ChevronDown } from "lucide-react";
import { COUNTRIES, POPULAR_CITIES, LANDMARK_ICONS } from "@/app/data/locationData";

export default function LocationSelectionModal({ 
  isOpen, 
  onClose, 
  selectedCity, 
  updateCity,
  allowClose = true 
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showOtherCities, setShowOtherCities] = useState(false);
  
  const [activeCountry, setActiveCountry] = useState("India");
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    console.log("Search term updated:", search);
    if (search.length <= 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      console.log("Fetching results for:", search);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(search)}&limit=8`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        console.log("Received data:", data);
        const suggestions = (data.features || []).map(f => ({
          name: f.properties.name,
          state: f.properties.state,
          country: f.properties.country,
          display: `${f.properties.name}${f.properties.state ? `, ${f.properties.state}` : ''}, ${f.properties.country}`,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0]
        }));
        setResults(suggestions);
      } catch (err) {
        console.error("Search error in fetch:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      console.log("Clearing timeout for:", search);
      clearTimeout(delayDebounceFn);
    };
  }, [search]);

  const handleGeoLocation = () => {
    setGeoLoading(true);
    if (!("geolocation" in navigator)) {
      setGeoLoading(false);
      alert("Geolocation is not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const addr = data?.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || "Your location";
          updateCity(city, { country: addr.country, state: addr.state, city: city, lat: latitude, lng: longitude });
          onClose();
        } catch (err) {
          alert("Could not detect location.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        alert("Location permission denied.");
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }} onClick={() => allowClose && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="loc-modal" onClick={(e) => e.stopPropagation()}
        style={{ 
            maxWidth: '900px', 
            width: '95%', 
            maxHeight: '90vh', 
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px', 
            backgroundColor: '#fff', 
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.15)', 
            position: 'relative', 
            padding: '32px', 
            border: '1px solid #f1f5f9',
            overflow: 'hidden'
        }}
      >
        {allowClose && <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1e293b'}><X size={24} /></button>}

        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '28px', letterSpacing: '-0.01em' }}>Select Your Location to Continue</h2>

        {/* 1. Search Bar */}
        <div style={{ position: 'relative', marginBottom: '32px', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', border: '1.5px solid #e2e8f0', borderRadius: '16px', backgroundColor: '#fff', transition: 'all 0.2s' }}>
            <Search size={22} color="#f84464" />
            <input ref={searchRef} type="text" placeholder="Search For A Location..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '18px', fontWeight: 600, color: '#334155', background: 'transparent' }} />
            {loading && <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%' }} />}
            {search.length > 0 && <X size={20} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setSearch("")} />}
            <div style={{ width: '1.5px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 8px' }} />
            <div onClick={handleGeoLocation} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              {geoLoading ? <div className="animate-spin" style={{ width: 22, height: 22, border: '2px solid #f84464', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <Target size={24} color="#f84464" />}
            </div>
          </div>
          
          <AnimatePresence>
            {(loading || results.length > 0) && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
                style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 10px)', 
                    left: 0, 
                    right: 0, 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                    zIndex: 1001, 
                    border: '1px solid #e2e8f0', 
                    maxHeight: '320px',
                    overflowY: 'auto'
                }}>
                {loading && (
                    <div style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Searching for "{search}"...</div>
                )}
                {results.map((loc, idx) => (
                  <button key={idx} onClick={() => { updateCity(loc.name, loc); onClose(); }} style={{ width: '100%', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderBottom: idx === results.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <MapPin size={20} color="#f84464" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{loc.name}</div>
                      <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{loc.display}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="no-scrollbar">
            {/* 2. Country Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              {COUNTRIES.map(c => (
                <button key={c.label} onClick={() => setActiveCountry(c.label)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '40px', border: activeCountry === c.label ? '2.5px solid #4f46e5' : '1.5px solid #e2e8f0', backgroundColor: '#fff', color: activeCountry === c.label ? '#4f46e5' : '#64748b', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeCountry === c.label ? '0 4px 10px rgba(79, 70, 229, 0.12)' : 'none' }}>
                  <span style={{ fontSize: '14px' }}>{c.flag}</span><span>{c.label}</span>
                </button>
              ))}
            </div>
            
            {/* 3. Popular Cities Grid */}
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '16px' }}>Popular Cities</p>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '12px', 
                marginBottom: '24px' 
            }}>
                {(POPULAR_CITIES[activeCountry] || POPULAR_CITIES["India"]).map(city => (
                    <button key={city.name} onClick={() => { updateCity(city.name); onClose(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }} onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        const img = e.currentTarget.querySelector('img');
                        if (img) img.style.transform = 'scale(1.1)';
                    }} onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        const img = e.currentTarget.querySelector('img');
                        if (img) img.style.transform = 'scale(1)';
                    }}>
                        <div style={{ 
                            width: '100%', 
                            aspectRatio: '1/1', 
                            backgroundColor: '#f8fafc', 
                            borderRadius: '16px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            border: selectedCity === city.name ? '2.5px solid #4f46e5' : '1.5px solid #f1f5f9', 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                            boxShadow: selectedCity === city.name ? '0 12px 24px -8px rgba(79, 70, 229, 0.4)' : 'none', 
                            overflow: 'hidden',
                            position: 'relative',
                            padding: city.img ? '0' : '12px'
                        }}>
                            {city.img ? (
                                <img 
                                    src={city.img} 
                                    alt={city.name} 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover', 
                                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        opacity: 0.95
                                    }} 
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedCity === city.name ? '#4f46e5' : '#94a3b8' }}>
                                    {LANDMARK_ICONS[city.icon]?.(selectedCity === city.name ? "#4f46e5" : "#94a3b8") || LANDMARK_ICONS.Generic()}
                                </div>
                            )}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: selectedCity === city.name ? '#4f46e5' : '#475569', textAlign: 'center', marginTop: '4px', width: '100%', display: 'block' }}>{city.name}</span>
                    </button>
                ))}
            </div>

            {/* Footer Premium Illustration with Integrated Logo */}
            <div style={{ position: 'relative', marginTop: 'auto', paddingBottom: '0', textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ 
                    position: 'absolute', 
                    bottom: '30px', 
                    left: '0', 
                    right: '0', 
                    zIndex: 2, 
                    display: 'flex', 
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <img src="/logo.png" alt="BookMyTicket Logo" style={{ height: '40px', width: 'auto', opacity: 0.8 }} />
                </div>
                <svg viewBox="0 0 800 120" width="100%" height="auto" style={{ fill: '#f1f5f9', opacity: 0.6, zIndex: 1 }}>
                    <path d="M0 120h800v-20h-40l-5-15h-30l-5 15h-60l-10-40h-40l-10 40h-80l-15-60h-50l-15 60h-100l-20-80h-60l-20 80h-100l-15-50h-40l-15 50H0v20z" />
                    <rect x="150" y="40" width="40" height="60" />
                    <rect x="220" y="20" width="30" height="80" />
                    <rect x="350" y="60" width="50" height="40" />
                    <rect x="450" y="10" width="40" height="90" />
                    <rect x="580" y="30" width="45" height="70" />
                </svg>
                <div style={{ borderBottom: '2.5px solid #f1f5f9', width: '100%', marginTop: '-2px', zIndex: 3 }} />
            </div>
        </div>
      </motion.div>
    </div>
  );
}
