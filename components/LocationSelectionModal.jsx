"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Target, Loader2, ChevronDown, LocateFixed, Globe, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { reverseGeocode, searchLocations } from "@/lib/googleMaps";
import { useAuth } from "./AuthContext";

const POPULAR_CITIES = [
  // India
  { name: "Bengaluru", image: "/cities/bengaluru.png", country: "India" },
  { name: "Chennai", image: "/cities/chennai.png", country: "India" },
  { name: "Coimbatore", image: "/cities/coimbatore.png", country: "India" },
  { name: "Hyderabad", image: "/cities/hyderabad.png", country: "India" },
  { name: "Kochi", image: "/cities/kochi.png", country: "India" },
  { name: "Kolkata", image: "/cities/kolkata.png", country: "India" },
  { name: "New Delhi", image: "/cities/new-delhi.png", country: "India" },
  { name: "Mumbai", image: "/cities/mumbai.png", country: "India" },
  
  // USA
  { name: "New York", image: "/cities/new-york.png", country: "United States" },
  { name: "Los Angeles", image: "/cities/los-angeles.png", country: "United States" },
  { name: "Chicago", image: "/cities/chicago.png", country: "United States" },
  
  // UAE
  { name: "Dubai", image: "/cities/dubai.png", country: "UAE" },
  
  // Singapore
  { name: "Singapore", image: "/cities/singapore-city.png", country: "Singapore" },
  
  // Malaysia
  { name: "Kuala Lumpur", image: "/cities/kuala-lumpur.png", country: "Malaysia" },
  
  // Thailand
  { name: "Bangkok", image: "/cities/bangkok.png", country: "Thailand" },
  
  // Germany
  { name: "Berlin", image: "/cities/berlin.png", country: "Germany" },
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
        } else {
            alert("Detecting location is taking longer than usual. Please try searching for your city manually.");
        }
      },
      { 
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const filteredPopularCities = useMemo(() => {
    return POPULAR_CITIES.filter(c => 
        c.country === selectedCountry && 
        c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, selectedCountry]);

  const combinedResults = useMemo(() => {
    if (!search) return [];
    
    // DB matches
    const dbMatches = allCities
        .filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
            
            // If a country is selected, optionally filter by it if the full address contains it
            // But don't be too strict if the joining failed
            const countryFilter = selectedCountry.toLowerCase();
            const hasCountryInfo = c.full.toLowerCase().includes('india') || c.full.toLowerCase().includes('uae') || c.full.toLowerCase().includes('united states');
            
            if (hasCountryInfo) {
                return matchesSearch && c.full.toLowerCase().includes(countryFilter);
            }
            
            // Fallback: if no country info in string, just match search
            return matchesSearch;
        })
        .map(c => ({ ...c, type: 'database' }));

    // Sort: Exact name matches first
    const sortedDb = dbMatches.sort((a, b) => {
        const aExact = a.name.toLowerCase() === search.toLowerCase();
        const bExact = b.name.toLowerCase() === search.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
    });

    const apiMatches = liveResults
        .filter(lr => !sortedDb.some(dm => dm.name.toLowerCase() === lr.name.toLowerCase()))
        .map(lr => ({ ...lr, type: 'live' }));

    return [...sortedDb, ...apiMatches].slice(0, 10);
  }, [search, allCities, liveResults, selectedCountry]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-0 md:p-4 z-[9999]" onClick={() => allowClose && onClose()}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-[1024px] md:rounded-[2.5rem] shadow-[0_20px_70px_rgba(219,39,119,0.2)] overflow-hidden flex flex-col relative border border-pink-100/50"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-body), sans-serif' }}
      >
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/20 blur-[100px] pointer-events-none" />

        {allowClose && (
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-pink-50 rounded-full transition-colors z-50">
                <X size={24} className="text-pink-400" />
            </button>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20">
            <div className="w-full p-4 md:p-6 flex flex-col items-center max-w-4xl mx-auto">
                <h2 className="text-base md:text-xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center leading-tight uppercase tracking-tight">Select Your City to Continue</h2>

                {/* Search Engine */}
                <div className="w-full relative mb-6">
                    <div className="relative z-30 group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:scale-110 transition-transform">
                            <Search size={20} className="text-pink-500" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Search for your city..."
                            className="w-full h-11 pl-12 pr-32 bg-white/80 backdrop-blur-sm border-2 border-pink-100/50 rounded-xl text-base font-bold text-slate-700 outline-none focus:border-purple-300 focus:bg-white transition-all shadow-md shadow-pink-100/10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-4">
                            {search && (
                                <button onClick={() => setSearch("")} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                                    <X size={16} className="text-slate-400" />
                                </button>
                            )}
                            <div className="w-[2px] h-8 bg-slate-200" />
                            <button 
                                onClick={handleGeoLocation}
                                disabled={geoLoading}
                                className={`flex items-center gap-2 ${geoLoading ? 'text-slate-300' : 'text-pink-500 hover:text-indigo-600'} transition-all hover:scale-110 active:scale-95`}
                            >
                                {geoLoading ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {(search && combinedResults.length > 0) || isSearching ? (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-pink-100 rounded-2xl shadow-2xl z-[60] overflow-hidden max-h-[400px] overflow-y-auto no-scrollbar"
                            >
                                {isSearching && combinedResults.length === 0 && (
                                    <div className="p-8 flex items-center justify-center gap-4 text-slate-400 font-bold">
                                        <Loader2 size={16} className="animate-spin text-pink-500" />
                                        <span className="text-xs tracking-widest uppercase">Scanning...</span>
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
                                        className="w-full px-6 py-4 flex flex-col items-start hover:bg-pink-50/50 transition-colors border-b last:border-none border-pink-50 group"
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            <div className={`p-2 rounded-lg ${city.type === 'database' ? 'bg-pink-50 text-pink-500' : 'bg-slate-50 text-slate-400'}`}>
                                                <MapPin size={16} />
                                            </div>
                                            <span className="font-bold text-slate-800 text-sm group-hover:text-pink-600 transition-colors">{city.name}</span>
                                            {city.type === 'live' && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Global</span>}
                                            {city.type === 'database' && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">Verified</span>}
                                        </div>
                                        <div className="pl-12 text-[11px] text-slate-400 font-medium truncate w-full text-left mt-1">
                                            {city.full.split(',').slice(1).join(',').trim()}
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* Regional Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full mb-6 px-2 pb-1">
                    {COUNTRIES.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCountry(c.name)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all whitespace-nowrap ${
                                selectedCountry === c.name 
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-transparent text-white font-black shadow-lg shadow-pink-200' 
                                : 'bg-white border-pink-50 text-slate-400 font-bold hover:border-pink-200 hover:bg-pink-50/30'
                            }`}
                        >
                            <span className="text-lg leading-none">{c.flag}</span>
                            <span className="text-[9px] uppercase tracking-wider">{c.name}</span>
                        </button>
                    ))}
                </div>

                {/* Popular Destinations Grid */}
                <div className="w-full mb-4">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-6 h-[2px] bg-pink-500 rounded-full" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Top Destinations</span>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                        {filteredPopularCities.map((city) => (
                            <button
                                key={city.name}
                                onClick={() => {
                                    updateCity(city.name, { city: city.name });
                                    onClose();
                                }}
                                className="group flex flex-col items-center gap-3"
                            >
                                <div className={`w-full aspect-square rounded-3xl overflow-hidden border-2 flex items-center justify-center transition-all duration-300 ${
                                    selectedCity === city.name 
                                    ? 'border-pink-500 ring-4 ring-pink-100 bg-white shadow-xl' 
                                    : 'border-pink-50 bg-white group-hover:border-purple-300 group-hover:shadow-lg'
                                }`}>
                                    <img 
                                        src={city.image} 
                                        alt={city.name}
                                        className="w-full h-full object-cover select-none pointer-events-none group-active:scale-90 transition-transform"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="hidden w-full h-full items-center justify-center bg-pink-50 text-pink-400">
                                        <MapPin size={24} />
                                    </div>
                                </div>
                                <span className={`text-[9px] md:text-[11px] font-black tracking-tight transition-colors ${
                                    selectedCity === city.name ? 'text-pink-600' : 'text-slate-500 group-hover:text-purple-600'
                                } text-center truncate w-full uppercase`}>{city.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full mt-6 mb-4 flex flex-col items-center justify-center gap-3">
                    <img 
                        src="/logo.png" 
                        alt="BookMyTicket" 
                        className="h-8 w-auto object-contain select-none pointer-events-none"
                    />
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-[1px] bg-pink-100" />
                        <span className="text-[9px] font-black text-pink-300 uppercase tracking-[0.4em]">Worldwide Experience</span>
                        <div className="w-12 h-[1px] bg-pink-100" />
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
