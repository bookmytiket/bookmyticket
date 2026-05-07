"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Target, Loader2, ChevronDown, LocateFixed, Globe, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { reverseGeocode } from "@/lib/googleMaps";
import { useAuth } from "./AuthContext";

const POPULAR_CITIES = [
  { name: "Bengaluru", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 54h44M14 54V24l8-4v34M22 54V10l10-4 10 4v44M42 54V30l8-4v28" />
      <rect x="25" y="14" width="2" height="2" fill="currentColor" opacity="0.3" />
    </svg>
  )},
  { name: "Chennai", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 56h48M16 56V20l16-8 16 8v36M24 56V40h16v16" />
      <circle cx="32" cy="30" r="4" fill="currentColor" opacity="0.1" />
    </svg>
  )},
  { name: "Coimbatore", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="24" y="20" width="16" height="36" />
      <circle cx="32" cy="30" r="4" />
      <path d="M24 20l8-8 8 8" />
    </svg>
  )},
  { name: "Hyderabad", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 56h40M16 56V28l16-12 16 12v28" />
      <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.1" />
      <path d="M24 40a8 8 0 1 1 16 0" />
    </svg>
  )},
  { name: "Kochi", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 56h48M12 56L32 12l20 44" />
      <path d="M20 56l12-24 12 24" />
    </svg>
  )},
  { name: "Kolkata", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 54h48M12 54V20l12 10V54M40 54V10l12 10v34" />
      <path d="M24 30h16" />
    </svg>
  )},
  { name: "New Delhi", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 56h40M32 8l20 48H12L32 8z" />
      <circle cx="32" cy="32" r="6" />
    </svg>
  )},
  { name: "Mumbai", icon: (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 56h48M12 56V28l12-10 12 10v28M36 56V32l8-6 8 6v26" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  )},
];

const COUNTRIES = [
  { id: "india", name: "India", flag: "🇮🇳" },
  { id: "usa", name: "United States", flag: "🇺🇸" },
  { id: "uae", name: "UAE", flag: "🇦🇪" },
  { id: "singapore", name: "Singapore", flag: "🇸🇬" },
  { id: "malaysia", name: "Malaysia", flag: "🇲🇾" },
  { id: "thailand", name: "Thailand", flag: "🇹🇭" },
  { id: "germany", name: "Germany", flag: "🇩🇪" },
];

export default function LocationSelectionModal({ 
  isOpen, 
  onClose, 
  selectedCity, 
  updateCity,
  allowClose = true 
}) {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [geoLoading, setGeoLoading] = useState(false);
  const [allCities, setAllCities] = useState([]);
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
        supabase.from('cities')
            .select('name, district:districts(name, state:states(name, country:countries(name)))')
            .order('name')
            .then(({ data }) => {
                if (data) {
                    const formatted = data.map(c => ({
                        name: c.name,
                        full: `${c.name}, ${c.district?.name || ''}, ${c.district?.state?.name || ''}, ${c.district?.state?.country?.name || ''}`.replace(/, , /g, ', ').replace(/, $/g, '')
                    }));
                    setAllCities(formatted);
                }
            });
    }
  }, [isOpen]);

  // Worldwide live search with debounce
  useEffect(() => {
    if (search.length >= 3) {
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchLocations(search);
                setLiveResults(results);
            } catch (err) {
                console.error("Live search failed:", err);
            } finally {
                setIsSearching(false);
            }
        }, 600);
        return () => clearTimeout(timer);
    } else {
        setLiveResults([]);
    }
  }, [search]);

  const handleGeoLocation = () => {
    if (geoLoading) return;
    setGeoLoading(true);
    
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      setGeoLoading(false);
      return;
    }

    // Use a multi-stage approach: try fast (low accuracy) first
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await new Promise(r => setTimeout(r, 400));
          const geo = await reverseGeocode(latitude, longitude);
          
          const detectedCity = geo.city || geo.town || geo.village || geo.district || geo.state_district;
          
          if (detectedCity) {
            updateCity(detectedCity, {
                city: detectedCity,
                state: geo.state,
                country: geo.country,
                lat: latitude,
                lng: longitude,
                address: geo.fullAddress
            });
            onClose();
          } else {
            alert("Detected your location, but couldn't identify the city. Please select manually.");
          }
        } catch (err) {
          console.error("Geo detect error:", err);
          alert("Location service busy. Please try manual selection.");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeoLoading(false);
        if (error.code === 1) {
            alert("Location access denied. Please enable permissions in your browser.");
        } else if (error.code === 3 || error.code === 2) {
            // If high accuracy failed or timed out, try one more time with low accuracy
            alert("Detecting location is taking longer than usual. Please try searching for your city manually.");
        }
      },
      { 
        enableHighAccuracy: false, // Much faster for city-level detection
        timeout: 15000,            // Increased to 15s to be safe
        maximumAge: 60000          // Use cached location if available within 1 min
      }
    );
  };

  const filteredPopularCities = useMemo(() => {
    return POPULAR_CITIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const combinedResults = useMemo(() => {
    if (!search) return [];
    
    // DB matches
    const dbMatches = allCities
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        .map(c => ({ ...c, type: 'database' }));

    // API matches (exclude if already in DB matches)
    const apiMatches = liveResults
        .filter(lr => !dbMatches.some(dm => dm.name.toLowerCase() === lr.name.toLowerCase()))
        .map(lr => ({ ...lr, type: 'live' }));

    return [...dbMatches, ...apiMatches].slice(0, 10);
  }, [search, allCities, liveResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => allowClose && onClose()}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-white w-full max-w-[1024px] h-[564px] rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-body), sans-serif' }}
      >
        {/* Close Button */}
        {allowClose && (
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-20">
                <X size={20} className="text-slate-400" />
            </button>
        )}

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col items-center">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 text-center">Select Your City to Continue</h2>

            {/* Search Bar Container */}
            <div className="w-full max-w-xl relative mb-6">
                <div className="relative z-30">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Search size={20} className="text-pink-500" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search for your city..."
                        className="w-full h-12 pl-12 pr-28 bg-white border-2 border-slate-100 rounded-xl text-lg font-bold text-slate-700 outline-none focus:border-indigo-500/30 transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        {search && (
                            <button onClick={() => setSearch("")} className="p-1 hover:bg-slate-100 rounded-full">
                                <X size={16} className="text-slate-400" />
                            </button>
                        )}
                        <div className="w-[2px] h-6 bg-slate-100" />
                        <button 
                            onClick={handleGeoLocation}
                            disabled={geoLoading}
                            className={`flex items-center gap-2 ${geoLoading ? 'text-slate-300' : 'text-pink-500 hover:text-indigo-600'} transition-colors`}
                        >
                            {geoLoading ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={22} />}
                        </button>
                    </div>
                </div>

                {/* Instant Search Results Dropdown */}
                <AnimatePresence>
                    {(search && combinedResults.length > 0) || isSearching ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-40 overflow-hidden max-h-[360px] overflow-y-auto no-scrollbar"
                        >
                            {isSearching && combinedResults.length === 0 && (
                                <div className="p-6 flex items-center justify-center gap-3 text-slate-400 font-bold">
                                    <Loader2 size={18} className="animate-spin text-pink-500" />
                                    <span>Searching worldwide...</span>
                                </div>
                            )}

                            {combinedResults.map((city) => (
                                <button
                                    key={`${city.type}-${city.name}-${city.full}`}
                                    onClick={() => {
                                        updateCity(city.name, { 
                                            city: city.name,
                                            fullAddress: city.full,
                                            lat: city.lat,
                                            lng: city.lng
                                        });
                                        onClose();
                                    }}
                                    className="w-full px-6 py-4 flex flex-col items-start hover:bg-slate-50 transition-colors border-b last:border-none border-slate-50 group"
                                >
                                    <div className="flex items-center gap-4 w-full">
                                        <MapPin size={18} className={city.type === 'database' ? "text-pink-500" : "text-slate-300"} />
                                        <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{city.name}</span>
                                        {city.type === 'live' && (
                                            <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-50 px-2 py-1 rounded-md">Global Result</span>
                                        )}
                                        {city.type === 'database' && (
                                            <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-50 px-2 py-1 rounded-md">Verified</span>
                                        )}
                                    </div>
                                    <div className="pl-8.5 ml-8.5 text-xs text-slate-400 font-medium truncate w-full text-left">
                                        {city.full.split(',').slice(1).join(',').trim()}
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Country Pill Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full justify-start md:justify-center mb-8 px-4">
                {COUNTRIES.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedCountry(c.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap ${
                            selectedCountry === c.name 
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-black shadow-md shadow-indigo-100' 
                            : 'bg-white border-slate-100 text-slate-500 font-bold hover:border-slate-200'
                        }`}
                    >
                        <span className="text-lg">{c.flag}</span>
                        <span className="text-[11px] uppercase tracking-wider">{c.name}</span>
                    </button>
                ))}
            </div>

            {/* Popular Cities Section */}
            <div className="w-full mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Popular Cities</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                    {filteredPopularCities.map((city) => (
                        <button
                            key={city.name}
                            onClick={() => {
                                updateCity(city.name, { city: city.name });
                                onClose();
                            }}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-full aspect-[4/3] rounded-xl border-2 flex items-center justify-center transition-all ${
                                selectedCity === city.name 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                : 'border-slate-50 bg-slate-50/50 text-slate-400 group-hover:border-indigo-200 group-hover:bg-indigo-50/30'
                            }`}>
                                <div className="transform group-hover:scale-105 group-active:scale-95 transition-transform duration-300">
                                    {city.icon}
                                </div>
                            </div>
                            <span className={`text-[11px] font-black tracking-tight ${
                                selectedCity === city.name ? 'text-indigo-600' : 'text-slate-600'
                            }`}>{city.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Other Cities Section */}
            <div className="w-full max-w-sm relative">
                <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full h-11 px-6 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-between text-slate-500 font-black text-xs hover:border-indigo-100 transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-pink-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <Globe size={14} className="text-pink-500 group-hover:text-indigo-600" />
                        </div>
                        <span>Events in other cities</span>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {dropdownOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-50 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-50 p-2 no-scrollbar"
                        >
                            {allCities.filter(c => !POPULAR_CITIES.some(p => p.name === c)).map((city) => (
                                <button
                                    key={city}
                                    onClick={() => {
                                        updateCity(city, { city });
                                        onClose();
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 rounded-lg text-[13px] font-black text-slate-600 hover:text-indigo-700 transition-all border-b border-slate-50 last:border-none"
                                >
                                    {city}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Branding */}
            <div className="w-full flex flex-col items-center select-none pointer-events-none mt-auto pt-6 pb-2">
                <div className="relative w-full max-w-sm flex flex-col items-center">
                    <img 
                        src="/logo.png" 
                        alt="BookMyTicket" 
                        className="h-10 w-auto object-contain opacity-30 grayscale contrast-125"
                    />
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
