"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Target, Loader2, ChevronRight, Check, Map as MapIcon, LocateFixed } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { reverseGeocode } from "@/lib/googleMaps";
import { useAuth } from "./AuthContext";
import dynamic from "next/dynamic";

// Leaflet markers need CSS and icons fixed
const MapPicker = dynamic(() => import("./MapPicker"), { 
  ssr: false,
  loading: () => <div className="w-full h-[350px] bg-slate-50 animate-pulse rounded-2xl" />
});

export default function LocationSelectionModal({ 
  isOpen, 
  onClose, 
  selectedCity, 
  updateCity,
  allowClose = true 
}) {
  const { locationHierarchy } = useAuth();
  const [step, setStep] = useState("country"); // country, state, district, city, map
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCityData, setSelectedCityData] = useState(null);

  const [markerPos, setMarkerPos] = useState({ lat: 20.5937, lng: 78.9629 });

  useEffect(() => {
    if (isOpen) {
      fetchCountries();
      // Auto-detect on open with a small delay for browser stability
      const timer = setTimeout(() => {
        handleGeoLocation();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const fetchCountries = async () => {
    setLoading(true);
    const { data } = await supabase.from('countries').select('*').order('name');
    if (data) setCountries(data);
    setLoading(false);
  };

  const fetchStates = async (countryId) => {
    setLoading(true);
    const { data } = await supabase.from('states').select('*').eq('country_id', countryId).order('name');
    if (data) setStates(data);
    setLoading(false);
  };

  const fetchDistricts = async (stateId) => {
    setLoading(true);
    const { data } = await supabase.from('districts').select('*').eq('state_id', stateId).order('name');
    if (data) setDistricts(data);
    setLoading(false);
  };

  const fetchCities = async (districtId) => {
    setLoading(true);
    const { data } = await supabase.from('cities').select('*').eq('district_id', districtId).order('name');
    if (data) setCities(data);
    setLoading(false);
  };

  const handleGeoLocation = () => {
    if (geoLoading) return;
    setGeoLoading(true);
    if (!("geolocation" in navigator)) {
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await reverseGeocode(latitude, longitude);
          setMarkerPos({ lat: latitude, lng: longitude });
          
          // Try to match with our DB
          const { data: dbCountry } = await supabase.from('countries').select('*').ilike('name', geo.country).maybeSingle();
          if (dbCountry) {
            setSelectedCountry(dbCountry);
            const { data: dbState } = await supabase.from('states').select('*').eq('country_id', dbCountry.id).ilike('name', geo.state).maybeSingle();
            if (dbState) {
              setSelectedState(dbState);
              const { data: dbDistrict } = await supabase.from('districts').select('*').eq('state_id', dbState.id).ilike('name', geo.district).maybeSingle();
              if (dbDistrict) {
                setSelectedDistrict(dbDistrict);
                const { data: dbCity } = await supabase.from('cities').select('*').eq('district_id', dbDistrict.id).ilike('name', geo.city).maybeSingle();
                if (dbCity) setSelectedCityData(dbCity);
              }
            }
          }
          setStep("map");
        } catch (err) {
          console.error("Geo detect error:", err);
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirmLocation = () => {
    const hierarchy = {
      country: selectedCountry?.name,
      state: selectedState?.name,
      district: selectedDistrict?.name,
      city: selectedCityData?.name || selectedDistrict?.name || "Unknown",
      lat: markerPos.lat,
      lng: markerPos.lng,
      address: `${selectedCityData?.name || selectedDistrict?.name}, ${selectedState?.name}, ${selectedCountry?.name}`
    };
    updateCity(hierarchy.city, hierarchy);
    onClose();
  };

  const filteredItems = () => {
    const list = step === "country" ? countries : 
                 step === "state" ? states : 
                 step === "district" ? districts : 
                 step === "city" ? cities : [];
    return list.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => allowClose && onClose()}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Select Location</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {step === "country" ? "Choose your country" : 
               step === "state" ? `States in ${selectedCountry?.name}` : 
               step === "district" ? `Districts in ${selectedState?.name}` : 
               step === "city" ? `Cities in ${selectedDistrict?.name}` : "Confirm Location"}
            </p>
          </div>
          {allowClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Step Indicator / Breadcrumbs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setStep("country")} className={`text-xs font-bold whitespace-nowrap ${step === 'country' ? 'text-pink-500' : 'text-slate-400'}`}>Countries</button>
          {(selectedCountry || step !== 'country') && <ChevronRight size={14} className="text-slate-300" />}
          {selectedCountry && (
            <button onClick={() => { setStep("state"); fetchStates(selectedCountry.id); }} className={`text-xs font-bold whitespace-nowrap ${step === 'state' ? 'text-pink-500' : 'text-slate-400'}`}>{selectedCountry.name}</button>
          )}
          {selectedState && <ChevronRight size={14} className="text-slate-300" />}
          {selectedState && (
            <button onClick={() => { setStep("district"); fetchDistricts(selectedState.id); }} className={`text-xs font-bold whitespace-nowrap ${step === 'district' ? 'text-pink-500' : 'text-slate-400'}`}>{selectedState.name}</button>
          )}
          {selectedDistrict && <ChevronRight size={14} className="text-slate-300" />}
          {selectedDistrict && (
            <button onClick={() => { setStep("city"); fetchCities(selectedDistrict.id); }} className={`text-xs font-bold whitespace-nowrap ${step === 'city' ? 'text-pink-500' : 'text-slate-400'}`}>{selectedDistrict.name}</button>
          )}
        </div>

        {/* Search & Actions */}
        {step !== "map" && (
          <div className="p-6 flex flex-col gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder={`Search ${step}...`}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-pink-500/30 focus:bg-white transition-all font-semibold text-slate-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Auto-Detection Indicator */}
            <div className="flex items-center gap-3 px-2 py-1 text-slate-400 font-bold w-fit">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest">Auto-Detection Active</span>
              {geoLoading && <Loader2 size={16} className="animate-spin text-pink-500" />}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={40} className="animate-spin text-pink-500" />
              <p className="text-slate-400 font-bold">Loading locations...</p>
            </div>
          ) : step === "map" ? (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner h-[350px] relative">
                <MapPicker 
                  lat={markerPos.lat} 
                  lng={markerPos.lng} 
                  onLocationSelect={(pos) => setMarkerPos({ lat: pos.lat, lng: pos.lng })}
                  height="350px"
                />
                <div className="absolute top-4 left-4 z-[1000] bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20">
                  OpenStreetMap Active
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pink-100 rounded-xl">
                    <MapPin className="text-pink-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">Confirm Precise Location</h4>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                      {selectedCityData?.name || selectedDistrict?.name}, {selectedState?.name}, {selectedCountry?.name}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleConfirmLocation}
                  className="w-full mt-6 py-4 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
                >
                  SET LOCATION & CONTINUE
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems().map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSearch("");
                    if (step === "country") {
                      setSelectedCountry(item);
                      fetchStates(item.id);
                      setStep("state");
                    } else if (step === "state") {
                      setSelectedState(item);
                      fetchDistricts(item.id);
                      setStep("district");
                    } else if (step === "district") {
                      setSelectedDistrict(item);
                      fetchCities(item.id);
                      setStep("city");
                    } else if (step === "city") {
                      setSelectedCityData(item);
                      setStep("map");
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-white border-2 border-slate-50 rounded-2xl hover:border-pink-500/20 hover:bg-pink-50/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg group-hover:bg-white transition-colors">
                      {item.flag || <MapPin size={18} className="text-slate-400" />}
                    </div>
                    <span className="font-bold text-slate-700">{item.name}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-pink-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Branding */}
        <div className="p-4 bg-slate-50/50 border-t border-gray-100 flex justify-center items-center gap-2 opacity-50">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Powered by OpenStreetMap</span>
           <span className="text-sm font-black text-slate-500">book<span className="text-pink-500">my</span>ticket</span>
        </div>
      </motion.div>
    </div>
  );
}
