"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation, Search, X, Loader2, CheckCircle2,
  AlertTriangle, Route, Trash2, MapPin, Wifi, WifiOff,
  Crosshair, ZoomIn, ZoomOut, Radio,
} from "lucide-react";

async function nominatimReverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      { 
        headers: { "Accept-Language": "en" },
        signal: AbortSignal.timeout(10000)
      }
    );
    const data = await res.json();
    const addr = data?.address || {};

    const suburb    = addr.suburb || addr.neighbourhood || addr.quarter || "";
    const city      = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || "";
    const district  = addr.county || addr.state_district || city || "";
    const state     = addr.state || "";
    const country   = addr.country || "";

    return {
      fullAddress: data.display_name || "",
      city,
      district,
      state,
      pincode: addr.postcode || "",
      country: country || "India",
      sublocality: suburb,
      road: addr.road || addr.pedestrian || "",
    };
  } catch {
    return { fullAddress: "", city: "", district: "", state: "", pincode: "", country: "India" };
  }
}

/* ─── Photon autocomplete (free, no key) ─── */
async function photonSearch(query) {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`
    );
    const data = await res.json();
    return (data.features || []).map((f) => ({
      name: f.properties.name || f.properties.street || f.properties.city || "Point of Interest",
      display: [f.properties.name, f.properties.house_number, f.properties.street, f.properties.city, f.properties.state, f.properties.country]
        .filter(Boolean).join(", "),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  } catch {
    return [];
  }
}

/* ─── Custom SVG icons ─── */
const makeSvgIcon = (svg, size = [44, 56], anchor = [22, 56]) =>
  L.divIcon({
    html: svg,
    iconSize: size,
    iconAnchor: anchor,
    className: "",
  });

const PIN_ICON = makeSvgIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
    <defs>
      <radialGradient id="pg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f84464"/>
        <stop offset="100%" stop-color="#c0143c"/>
      </radialGradient>
      <filter id="ps"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#f84464" flood-opacity="0.45"/></filter>
    </defs>
    <path d="M22 2C12.06 2 4 10.06 4 20c0 12 18 34 18 34s18-22 18-34C40 10.06 31.94 2 22 2z" fill="url(#pg)" filter="url(#ps)"/>
    <circle cx="22" cy="20" r="7" fill="white" opacity="0.95"/>
  </svg>`);

const USER_ICON = makeSvgIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="#4f46e5" opacity="0.18"/>
    <circle cx="24" cy="24" r="12" fill="#4f46e5" stroke="white" stroke-width="3"/>
    <circle cx="24" cy="24" r="5" fill="white"/>
    <animateTransform attributeName="transform" type="scale" from="0.9 0.9 24 24" to="1.1 1.1 24 24" dur="1.4s" repeatCount="indefinite" additive="sum"/>
  </svg>`, [48, 48], [24, 24]);

const EXTRA_ICON = makeSvgIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
    <path d="M18 1C9.72 1 3 7.72 3 16c0 10 15 29 15 29s15-19 15-29C33 7.72 26.28 1 18 1z" fill="#64ffda" opacity="0.9"/>
    <circle cx="18" cy="16" r="5.5" fill="white" opacity="0.95"/>
  </svg>`, [36, 46], [18, 46]);

/* ─── MapController: programmatically fly to locations ─── */
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

/* ─── ClickHandler ─── */
function ClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [map, onMapClick]);
  return null;
}

/* ─── Address pill row ─── */
function AddressRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs font-semibold text-slate-700 flex-1 leading-snug">{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LeafletMapPicker — 100% free, zero API key
   Props:
     lat, lng           — initial coordinates
     onLocationSelect   — ({ lat, lng, address, city, district, state, pincode, country }) => void
     height             — CSS height (default "400px")
     showAutocomplete   — boolean (default true)
     showRouting        — boolean (default false)
     extraMarkers       — [{ lat, lng, label }]
     readOnly           — boolean
     liveTracking       — boolean — auto-start real-time watchPosition
   ══════════════════════════════════════════════════════ */
export default function LeafletMapPicker({
  lat,
  lng,
  onLocationSelect,
  height = "400px",
  showAutocomplete = true,
  showRouting = false,
  extraMarkers = [],
  readOnly = false,
  liveTracking = false,
}) {
  const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
  const initialPos = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;

  const [mapCenter, setMapCenter]         = useState(initialPos || DEFAULT_CENTER);
  const [mapZoom, setMapZoom]             = useState(initialPos ? 16 : 5);
  const [pinMarker, setPinMarker]         = useState(initialPos);
  const [userPos, setUserPos]             = useState(null);
  const [userAccuracy, setUserAccuracy]   = useState(null);
  const [address, setAddress]             = useState(null);
  const [addrLoading, setAddrLoading]     = useState(false);
  const [isDragging, setIsDragging]       = useState(false);

  // Tracking state
  const [tracking, setTracking]           = useState(false);
  const [trackLoading, setTrackLoading]   = useState(false);
  const [geoError, setGeoError]           = useState("");

  // Autocomplete state
  const [searchQuery, setSearchQuery]     = useState("");
  const [suggestions, setSuggestions]     = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const markerRef      = useRef(null);
  const watchIdRef     = useRef(null);
  const debounceRef    = useRef(null);
  const mounted        = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (lat && lng) {
      const newPos = { lat: Number(lat), lng: Number(lng) };
      setMapCenter(newPos);
      setPinMarker(newPos);
      fetchAddress(newPos.lat, newPos.lng, false);
    }
  }, [lat, lng]);

  const fetchAddress = useCallback(async (latitude, longitude, updatePin = true) => {
    if (updatePin) {
      setPinMarker({ lat: latitude, lng: longitude });
      setMapCenter({ lat: latitude, lng: longitude });
      setMapZoom(16);
    }
    setAddrLoading(true);
    const geo = await nominatimReverseGeocode(latitude, longitude);
    if (!mounted.current) return;
    setAddress(geo);
    setAddrLoading(false);
    if (onLocationSelect) {
      onLocationSelect({
        lat: latitude,
        lng: longitude,
        address: geo.fullAddress,
        city: geo.city,
        district: geo.district,
        state: geo.state,
        pincode: geo.pincode,
        country: geo.country,
      });
    }
  }, [onLocationSelect]);

  const handleMarkerDragEnd = useCallback((e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setIsDragging(false);
    fetchAddress(position.lat, position.lng);
  }, [fetchAddress]);

  const handleMapClick = useCallback((lat, lng) => {
    if (readOnly) return;
    fetchAddress(lat, lng);
  }, [readOnly, fetchAddress]);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("GPS not supported");
      return;
    }
    setTrackLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setUserAccuracy(accuracy);
        fetchAddress(latitude, longitude);
        setTrackLoading(false);
      },
      (err) => {
        setTrackLoading(false);
        setGeoError("Could not detect location");
      },
      { enableHighAccuracy: true }
    );
  }, [fetchAddress]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await photonSearch(searchQuery);
      if (mounted.current) { setSuggestions(results); setShowSuggestions(true); setSearchLoading(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  return (
    <div className="relative w-full h-full group/map">
      {/* ── Floating Search ── */}
      {showAutocomplete && (
        <div className="absolute top-4 left-4 right-4 z-[1000] max-w-lg mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#f84464]/20">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exact event venue..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder-slate-400"
              />
              {searchLoading && <Loader2 size={16} className="animate-spin text-[#f84464]" />}
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="text-slate-300 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 max-h-64 overflow-y-auto"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(s.display);
                        setShowSuggestions(false);
                        fetchAddress(s.lat, s.lng);
                      }}
                      className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <MapPin size={14} className="text-[#f84464] mt-1 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{s.display}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="absolute right-4 top-24 z-[1000] flex flex-col gap-2">
        <button
          onClick={startTracking}
          disabled={trackLoading}
          className="w-12 h-12 bg-white/90 backdrop-blur shadow-xl border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-[#f84464] transition-all active:scale-95"
        >
          {trackLoading ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
        </button>
      </div>

      {/* ── Map ── */}
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController center={mapCenter} zoom={mapZoom} />
        <ClickHandler onMapClick={handleMapClick} />

        {pinMarker && (
          <Marker 
            position={[pinMarker.lat, pinMarker.lng]} 
            icon={PIN_ICON}
            draggable={!readOnly}
            eventHandlers={{
              dragstart: () => setIsDragging(true),
              dragend: handleMarkerDragEnd
            }}
            ref={markerRef}
          />
        )}

        {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={USER_ICON} />}
      </MapContainer>

      {/* ── Set Location Button ── */}
      {pinMarker && (
        <div className="absolute bottom-6 right-6 z-[1000]">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onLocationSelect) {
                onLocationSelect({
                  lat: pinMarker.lat,
                  lng: pinMarker.lng,
                  address: address?.fullAddress || "",
                  city: address?.city || "",
                  district: address?.district || "",
                  state: address?.state || "",
                  pincode: address?.pincode || "",
                  country: address?.country || "India"
                });
              }
            }}
            className="px-6 py-3 bg-[#f84464] text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#ec4899] hover:scale-105 transition-all shadow-xl shadow-[#f84464]/30 flex items-center gap-2"
          >
            <MapPin size={16} />
            Set Location
          </button>
        </div>
      )}

      {/* ── Overlay ── */}
      {isDragging && (
        <div className="absolute inset-0 z-[1001] pointer-events-none flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
          <div className="px-4 py-2 bg-white shadow-2xl rounded-full text-[10px] font-black uppercase tracking-widest text-[#f84464] animate-bounce">
            Relocating Pin...
          </div>
        </div>
      )}
    </div>
  );
}
