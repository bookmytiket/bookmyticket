"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  MapPin, Navigation, Search, X, Loader2, 
  AlertTriangle, CheckCircle2, Compass, ZoomIn, ZoomOut 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { reverseGeocode } from "@/lib/googleMaps";

const MapPicker = dynamic(() => import("./MapPicker"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-[1.5rem]" />
});

/**
 * GoogleMapPicker (Redeveloped with OpenStreetMap/Leaflet)
 * Free, unlimited, and high-performance mapping.
 */
export default function GoogleMapPicker({
  lat,
  lng,
  onLocationSelect,
  height = "420px",
  darkMode = true,
  showAutocomplete = true,
  showRouting = false,
  extraMarkers = [],
  readOnly = false,
}) {
  const [markerPos, setMarkerPos] = useState({ 
    lat: Number(lat) || 20.5937, 
    lng: Number(lng) || 78.9629 
  });
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (lat && lng) {
      setMarkerPos({ lat: Number(lat), lng: Number(lng) });
    }
  }, [lat, lng]);

  const handleLocationChange = useCallback(async (data) => {
    setMarkerPos({ lat: data.lat, lng: data.lng });
    setLoading(true);
    const geocoded = await reverseGeocode(data.lat, data.lng);
    setAddress(geocoded);
    setLoading(false);
    
    if (onLocationSelect) {
      onLocationSelect({
        ...data,
        ...geocoded,
        address: geocoded.fullAddress
      });
    }
  }, [onLocationSelect]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleLocationChange({ lat: latitude, lng: longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Fallback - Nominatim Search could be added here if needed */}
      
      <div className={`relative rounded-[1.5rem] overflow-hidden border ${darkMode ? 'border-slate-700/60' : 'border-slate-200'} shadow-xl`} style={{ height }}>
        <MapPicker 
          lat={markerPos.lat}
          lng={markerPos.lng}
          onLocationSelect={handleLocationChange}
          height="100%"
          readOnly={readOnly}
          extraMarkers={extraMarkers}
        />

        {/* OSM Branding */}
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 shadow-2xl flex items-center gap-2">
            <MapPin size={12} className="text-indigo-400" />
            OpenStreetMap Active
          </div>
        </div>

        {/* Live Location Button */}
        {!readOnly && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDetectLocation}
              disabled={geoLoading}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-2xl transition-all disabled:opacity-70 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border border-white/20 backdrop-blur-sm"
            >
              {geoLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Detecting…
                </>
              ) : (
                <>
                  <Navigation size={16} />
                  Detect My Location
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Address Panel */}
      {address && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm grid grid-cols-2 gap-4"
        >
          <div className="col-span-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Full Address</p>
            <p className="text-sm font-bold text-slate-800">{address.fullAddress}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">City</p>
            <p className="text-sm font-bold text-slate-800">{address.city}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pincode</p>
            <p className="text-sm font-bold text-slate-800">{address.pincode}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
