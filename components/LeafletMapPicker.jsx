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
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
    );
    const data = await res.json();
    return (data.features || []).map((f) => ({
      name: f.properties.name || "",
      display: [f.properties.name, f.properties.city, f.properties.state, f.properties.country]
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
  const [mapZoom, setMapZoom]             = useState(initialPos ? 15 : 5);
  const [pinMarker, setPinMarker]         = useState(initialPos);
  const [userPos, setUserPos]             = useState(null);
  const [userAccuracy, setUserAccuracy]   = useState(null);
  const [address, setAddress]             = useState(null);
  const [addrLoading, setAddrLoading]     = useState(false);
  const [routePoints, setRoutePoints]     = useState([]);

  // Tracking state
  const [tracking, setTracking]           = useState(false);
  const [trackLoading, setTrackLoading]   = useState(false);
  const [geoError, setGeoError]           = useState("");

  // Autocomplete state
  const [searchQuery, setSearchQuery]     = useState("");
  const [suggestions, setSuggestions]     = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const lastGeocodePos = useRef(null);
  const watchIdRef     = useRef(null);
  const debounceRef    = useRef(null);
  const mounted        = useRef(true);

  // Distance helper
  const getDist = (p1, p2) => {
    if (!p1 || !p2) return 9999;
    const R = 6371e3;
    const φ1 = p1.lat * Math.PI/180, φ2 = p2.lat * Math.PI/180;
    const Δφ = (p2.lat-p1.lat) * Math.PI/180, Δλ = (p2.lng-p1.lng) * Math.PI/180;
    const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopTracking();
    };
  }, []);

  /* Initial geocode */
  useEffect(() => {
    if (lat && lng) fetchAddress(Number(lat), Number(lng), false);
  }, []);

  /* Auto-start live tracking if prop set */
  useEffect(() => {
    if (liveTracking) startTracking();
  }, [liveTracking]);

  /* ─── Geocode & emit ─── */
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

  /* ─── Map click ─── */
  const handleMapClick = useCallback((lat, lng) => {
    if (readOnly) return;
    if (showRouting) {
      setRoutePoints(prev => [...prev, { lat, lng }]);
    } else {
      fetchAddress(lat, lng);
    }
  }, [readOnly, showRouting, fetchAddress]);

  /* ─── Start real-time GPS watchPosition ─── */
  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation not supported by this browser.");
      return;
    }
    setTrackLoading(true);
    setGeoError("");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mounted.current) return;
        const { latitude, longitude, accuracy } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setUserAccuracy(accuracy);
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(17);
        setTracking(true);
        setTrackLoading(false);

        // Continuous geocoding: update address if moved > 30m
        const distMoved = getDist(lastGeocodePos.current, { lat: latitude, lng: longitude });
        if (distMoved > 30) {
          lastGeocodePos.current = { lat: latitude, lng: longitude };
          fetchAddress(latitude, longitude, false);
        }

        setPinMarker(prev => {
          if (!prev) return { lat: latitude, lng: longitude };
          return prev;
        });
      },
      (err) => {
        if (!mounted.current) return;
        setTrackLoading(false);
        setTracking(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Please allow access in browser settings.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError("Location signal unavailable. Move to open area and retry.");
        } else {
          setGeoError("Location request timed out. Retry.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [fetchAddress]);

  /* ─── Stop tracking ─── */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  /* ─── Toggle tracking button ─── */
  const toggleTracking = useCallback(() => {
    if (tracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [tracking, startTracking, stopTracking]);

  /* ─── Center on user ─── */
  const centerOnUser = useCallback(() => {
    if (userPos) {
      setMapCenter({ ...userPos });
      setMapZoom(17);
    }
  }, [userPos]);

  /* ─── Autocomplete search debounce ─── */
  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await photonSearch(searchQuery);
      if (mounted.current) { setSuggestions(results); setShowSuggestions(true); setSearchLoading(false); }
    }, 420);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const selectSuggestion = useCallback((s) => {
    setSearchQuery(s.display);
    setSuggestions([]);
    setShowSuggestions(false);
    fetchAddress(s.lat, s.lng);
  }, [fetchAddress]);

  /* ─── Snap current pin to user location ─── */
  const snapPinToUser = useCallback(() => {
    if (!userPos) return;
    fetchAddress(userPos.lat, userPos.lng);
  }, [userPos, fetchAddress]);

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── Autocomplete ── */}
      {showAutocomplete && (
        <div className="relative">
          <div className={`flex items-center gap-3 px-4 py-3 bg-white border-2 rounded-2xl shadow-sm transition-all ${showSuggestions ? "border-[#f84464]" : "border-slate-100 focus-within:border-[#f84464]"}`}>
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              id="leaflet-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search venue, address, city…"
              className="flex-1 border-none outline-none text-sm font-semibold text-slate-800 bg-transparent placeholder-slate-400"
              autoComplete="off"
            />
            {searchLoading && <Loader2 size={14} className="animate-spin text-[#f84464]" />}
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="text-slate-300 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => selectSuggestion(s)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <MapPin size={13} className="text-[#f84464] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{s.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{s.display}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Map Container ── */}
      <div
        className="relative rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-xl"
        style={{ height }}
        onClick={() => setShowSuggestions(false)}
      >
        {/* ── Tracking Status Badge ── */}
        <div className="absolute top-3 left-3 z-[800] flex flex-col gap-2">
          {tracking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg"
            >
              <Radio size={10} className="animate-pulse" />
              Live Tracking
            </motion.div>
          )}
          {userAccuracy && tracking && (
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded-lg shadow border border-slate-100">
              <Crosshair size={9} className="text-indigo-500" />
              ±{Math.round(userAccuracy)}m accuracy
            </div>
          )}
          {showRouting && routePoints.length > 0 && (
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur text-slate-700 text-[9px] font-bold px-2.5 py-1.5 rounded-xl shadow border border-slate-100">
              <Route size={10} className="text-[#f84464]" />
              {routePoints.length} pts
              <button onClick={(e) => { e.stopPropagation(); setRoutePoints([]); }} className="text-red-400 hover:text-red-600">
                <Trash2 size={9} />
              </button>
            </div>
          )}
        </div>

        {/* ── Right Controls ── */}
        <div className="absolute top-3 right-3 z-[800] flex flex-col gap-2">
          {/* Snap pin to user */}
          {userPos && !readOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); snapPinToUser(); }}
              title="Set pin to my location"
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#f84464] hover:border-[#f84464] shadow flex items-center justify-center transition-all"
            >
              <Crosshair size={15} />
            </button>
          )}
          {/* Center on user */}
          {userPos && (
            <button
              onClick={(e) => { e.stopPropagation(); centerOnUser(); }}
              title="Center on my location"
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-500 hover:border-indigo-400 shadow flex items-center justify-center transition-all"
            >
              <Navigation size={14} />
            </button>
          )}
        </div>

        {/* ── Detect Location Button ── */}
        {/* Button Removed for Auto-Detection */}

        {/* ── Leaflet Map ── */}
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={mapZoom}
          scrollWheelZoom
          zoomControl={false}
          style={{ width: "100%", height: height }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={20}
          />

          <MapController center={mapCenter} zoom={mapZoom} />
          <ClickHandler onMapClick={handleMapClick} />

          {/* Selected pin */}
          {pinMarker && (
            <Marker position={[pinMarker.lat, pinMarker.lng]} icon={PIN_ICON}>
              {address?.fullAddress && (
                <Popup className="leaflet-popup-custom">
                  <div style={{ maxWidth: 200 }}>
                    <p style={{ fontWeight: 800, fontSize: 12, color: "#1e293b", marginBottom: 4 }}>📍 Selected Location</p>
                    {address.city && <p style={{ fontSize: 11, color: "#475569" }}>{address.city}{address.state ? `, ${address.state}` : ""}</p>}
                    {address.pincode && <p style={{ fontSize: 10, color: "#94a3b8" }}>PIN: {address.pincode}</p>}
                  </div>
                </Popup>
              )}
            </Marker>
          )}

          {/* User live position */}
          {userPos && (
            <>
              <Marker position={[userPos.lat, userPos.lng]} icon={USER_ICON}>
                <Popup>
                  <p style={{ fontWeight: 800, fontSize: 12, color: "#4f46e5" }}>📌 You are here</p>
                  {userAccuracy && <p style={{ fontSize: 10, color: "#64748b" }}>Accuracy: ±{Math.round(userAccuracy)}m</p>}
                </Popup>
              </Marker>
              {userAccuracy && (
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={userAccuracy}
                  pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.08, weight: 1, dashArray: "4 4" }}
                />
              )}
            </>
          )}

          {/* Extra markers */}
          {extraMarkers.map((m, i) => (
            <Marker key={`extra-${i}`} position={[m.lat, m.lng]} icon={EXTRA_ICON}>
              {m.label && <Popup><p style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</p></Popup>}
            </Marker>
          ))}

          {/* Route waypoints */}
          {showRouting && routePoints.map((pt, i) => (
            <Marker key={`rt-${i}`} position={[pt.lat, pt.lng]} icon={PIN_ICON}>
              <Popup><p style={{ fontSize: 11, fontWeight: 700 }}>Waypoint {i + 1}</p></Popup>
            </Marker>
          ))}

          {/* Route polyline */}
          {showRouting && routePoints.length >= 2 && (
            <Polyline
              positions={routePoints.map(p => [p.lat, p.lng])}
              pathOptions={{ color: "#f84464", weight: 3, opacity: 0.85, dashArray: "6 4" }}
            />
          )}

          {/* Live trail polyline */}
          {tracking && userPos && pinMarker && (
            <Polyline
              positions={[[pinMarker.lat, pinMarker.lng], [userPos.lat, userPos.lng]]}
              pathOptions={{ color: "#4f46e5", weight: 2, opacity: 0.5, dashArray: "4 4" }}
            />
          )}
        </MapContainer>

        {/* ── Attribution watermark override ── */}
        <style>{`.leaflet-control-attribution { font-size: 9px !important; opacity: 0.6; }`}</style>
      </div>

      {/* ── Geo Error ── */}
      <AnimatePresence>
        {geoError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600"
          >
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span className="font-semibold text-xs">{geoError}</span>
            <button onClick={() => setGeoError("")} className="ml-auto text-red-400 hover:text-red-600"><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Coordinate + PIN badges ── */}
      {(pinMarker || userPos) && (
        <div className="flex flex-wrap gap-2">
          {pinMarker && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
              <MapPin size={12} className="text-[#f84464]" />
              <span className="text-[11px] font-bold text-slate-600">
                {pinMarker.lat.toFixed(5)}, {pinMarker.lng.toFixed(5)}
              </span>
            </div>
          )}
          {address?.pincode && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-1.5">
              <CheckCircle2 size={12} className="text-green-500" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-green-700 leading-none">PIN {address.pincode}</span>
                <span className="text-[7px] font-black text-green-400 uppercase tracking-tighter mt-0.5">India Post Verified</span>
              </div>
            </div>
          )}
          {tracking && userPos && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
              <Radio size={11} className="text-indigo-500 animate-pulse" />
              <span className="text-[11px] font-bold text-indigo-600">
                {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Address breakdown ── */}
      {addrLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
          <Loader2 size={13} className="animate-spin text-[#f84464]" />
          Fetching address…
        </div>
      )}
      {address && !addrLoading && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-x-4">
          <AddressRow label="Address"  value={address.fullAddress} />
          <AddressRow label="City"     value={address.city} />
          <AddressRow label="District" value={address.district} />
          <AddressRow label="State"    value={address.state} />
          <AddressRow label="Pincode"  value={address.pincode} />
          <AddressRow label="Country"  value={address.country} />
        </motion.div>
      )}

      {/* ── Free stack badge ── */}
      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
        Free · No API Key · OpenStreetMap + Nominatim + Photon
      </div>
    </div>
  );
}
