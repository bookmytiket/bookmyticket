"use client";
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Search,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Route,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Compass,
} from "lucide-react";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  DEFAULT_MAP_CENTER,
  MAP_ZOOM,
  reverseGeocode,
} from "@/lib/googleMaps";

/* ─── Custom map style (dark/neon for Cyber Noir theme) ─── */
const MAP_STYLES_DARK = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8892b0" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#ccd6f6" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64ffda" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#16213e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f3460" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0f3460" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#64ffda" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#64ffda" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#16213e" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#64ffda" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0e27" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4fc3f7" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0a0e27" }] },
];

const MAP_STYLES_LIGHT = [];

/* ─── Map container style ─── */
const mapContainerStyle = { width: "100%", height: "100%" };

/* ─── Default map options ─── */
function buildMapOptions(darkMode) {
  return {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: darkMode ? MAP_STYLES_DARK : MAP_STYLES_LIGHT,
  };
}

/* ─── Pulse marker icon (SVG Data URL) ─── */
const PRIMARY_ICON = {
  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
      <defs>
        <radialGradient id="g1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f84464"/>
          <stop offset="100%" stop-color="#c0143c"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#f84464" flood-opacity="0.5"/>
        </filter>
      </defs>
      <path d="M22 2C12.06 2 4 10.06 4 20c0 12 18 34 18 34s18-22 18-34C40 10.06 31.94 2 22 2z" fill="url(#g1)" filter="url(#shadow)"/>
      <circle cx="22" cy="20" r="7" fill="white" opacity="0.95"/>
    </svg>
  `),
  scaledSize: { width: 44, height: 56 },
  anchor: { x: 22, y: 56 },
};

const SECONDARY_ICON = {
  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <defs>
        <radialGradient id="g2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#64ffda"/>
          <stop offset="100%" stop-color="#00bcd4"/>
        </radialGradient>
      </defs>
      <path d="M18 1C9.72 1 3 7.72 3 16c0 10 15 29 15 29s15-19 15-29C33 7.72 26.28 1 18 1z" fill="url(#g2)" opacity="0.9"/>
      <circle cx="18" cy="16" r="5.5" fill="white" opacity="0.95"/>
    </svg>
  `),
  scaledSize: { width: 36, height: 46 },
  anchor: { x: 18, y: 46 },
};

const USER_ICON = {
  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#4f46e5" stroke="white" stroke-width="3"/>
      <circle cx="20" cy="20" r="8" fill="white" opacity="0.9"/>
      <circle cx="20" cy="20" r="28" fill="#4f46e5" opacity="0.15" stroke="#4f46e5" stroke-width="1" stroke-dasharray="4 2"/>
    </svg>
  `),
  scaledSize: { width: 40, height: 40 },
  anchor: { x: 20, y: 20 },
};

/* ─── Address display panel ─── */
function AddressPanel({ address, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 text-sm py-2">
        <Loader2 size={16} className="animate-spin text-[#f84464]" />
        <span>Fetching address…</span>
      </div>
    );
  }
  if (!address) return null;

  const rows = [
    { label: "Full Address", value: address.fullAddress },
    { label: "City", value: address.city },
    { label: "District", value: address.district },
    { label: "State", value: address.state },
    { label: "Pincode", value: address.pincode },
    { label: "Country", value: address.country },
  ].filter((r) => r.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2"
    >
      {rows.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
        </div>
      ))}
    </motion.div>
  );
}

/* ─── Main component ─── */

/**
 * GoogleMapPicker
 *
 * Props:
 *   lat, lng          – initial coordinates (optional)
 *   onLocationSelect  – callback({ lat, lng, address, city, district, state, pincode, country })
 *   height            – CSS height string (default "400px")
 *   darkMode          – boolean (default true – Cyber Noir)
 *   showAutocomplete  – boolean (default true)
 *   showRouting       – boolean – show multi-point route mode
 *   extraMarkers      – [{ lat, lng, label }] – read-only extra pins
 *   readOnly          – disable click-to-place
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
  const initialPos = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;

  const [center, setCenter] = useState(initialPos || DEFAULT_MAP_CENTER);
  const [zoom, setZoom] = useState(initialPos ? MAP_ZOOM.CITY : MAP_ZOOM.COUNTRY);
  const [primaryMarker, setPrimaryMarker] = useState(initialPos);
  const [userMarker, setUserMarker] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [activeInfoMarker, setActiveInfoMarker] = useState(null);

  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  /* Load initial address if lat/lng provided */
  useEffect(() => {
    if (lat && lng) {
      fetchAndEmit(Number(lat), Number(lng), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Emit data and fetch address */
  const fetchAndEmit = useCallback(
    async (latitude, longitude, updateState = true) => {
      if (updateState) {
        setPrimaryMarker({ lat: latitude, lng: longitude });
        setCenter({ lat: latitude, lng: longitude });
        setZoom(MAP_ZOOM.STREET);
      }
      setAddressLoading(true);
      const geocoded = await reverseGeocode(latitude, longitude);
      setAddress(geocoded);
      setAddressLoading(false);
      if (onLocationSelect) {
        onLocationSelect({
          lat: latitude,
          lng: longitude,
          address: geocoded.fullAddress,
          city: geocoded.city,
          district: geocoded.district,
          state: geocoded.state,
          pincode: geocoded.pincode,
          country: geocoded.country,
          sublocality: geocoded.sublocality,
        });
      }
    },
    [onLocationSelect]
  );

  /* Map click handler */
  const handleMapClick = useCallback(
    (e) => {
      if (readOnly) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (showRouting) {
        setRoutePoints((prev) => [...prev, { lat, lng }]);
      } else {
        fetchAndEmit(lat, lng);
      }
    },
    [readOnly, showRouting, fetchAndEmit]
  );

  /* Live geolocation */
  const handleDetectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserMarker({ lat: latitude, lng: longitude });
        fetchAndEmit(latitude, longitude);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError("Location permission denied. Please allow location access in your browser.");
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError("Location unavailable. Try again.");
            break;
          case err.TIMEOUT:
            setGeoError("Location request timed out. Try again.");
            break;
          default:
            setGeoError("Could not detect location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchAndEmit]);

  /* Autocomplete place select */
  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    fetchAndEmit(lat, lng);
  }, [fetchAndEmit]);

  /* Zoom controls */
  const handleZoom = useCallback((delta) => {
    if (mapRef.current) {
      const current = mapRef.current.getZoom() ?? 10;
      mapRef.current.setZoom(current + delta);
    }
  }, []);

  /* Center on user */
  const handleCenter = useCallback(() => {
    if (userMarker && mapRef.current) {
      mapRef.current.panTo(userMarker);
    } else if (primaryMarker && mapRef.current) {
      mapRef.current.panTo(primaryMarker);
    }
  }, [userMarker, primaryMarker]);

  /* Clear route */
  const clearRoute = useCallback(() => setRoutePoints([]), []);

  const mapOptions = useMemo(() => buildMapOptions(darkMode), [darkMode]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const routePath = useMemo(() => routePoints, [routePoints]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Autocomplete Search ── */}
      {showAutocomplete && scriptLoaded && (
        <div className="relative">
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={handlePlaceSelect}
            options={{
              componentRestrictions: { country: [] }, // worldwide
              fields: ["geometry", "formatted_address", "address_components"],
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus-within:border-[#f84464] transition-all">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input
                id="gmap-autocomplete-input"
                type="text"
                placeholder="Search for a venue or address…"
                className="flex-1 border-none outline-none text-sm font-semibold text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>
          </Autocomplete>
        </div>
      )}

      {/* ── Map Container ── */}
      <div
        className={`relative rounded-[1.5rem] overflow-hidden border ${
          darkMode ? "border-slate-700/60" : "border-slate-200"
        } shadow-xl`}
        style={{ height }}
      >
        {/* ── Custom Controls Overlay ── */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          {/* Zoom In */}
          <button
            onClick={() => handleZoom(1)}
            title="Zoom in"
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border transition-all ${
              darkMode
                ? "bg-[#0d1b2a] border-slate-700 text-slate-300 hover:text-[#64ffda] hover:border-[#64ffda]"
                : "bg-white border-slate-200 text-slate-600 hover:text-[#f84464] hover:border-[#f84464]"
            }`}
          >
            <ZoomIn size={16} />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => handleZoom(-1)}
            title="Zoom out"
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border transition-all ${
              darkMode
                ? "bg-[#0d1b2a] border-slate-700 text-slate-300 hover:text-[#64ffda] hover:border-[#64ffda]"
                : "bg-white border-slate-200 text-slate-600 hover:text-[#f84464] hover:border-[#f84464]"
            }`}
          >
            <ZoomOut size={16} />
          </button>

          {/* Center / Compass */}
          <button
            onClick={handleCenter}
            title="Center map"
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border transition-all ${
              darkMode
                ? "bg-[#0d1b2a] border-slate-700 text-slate-300 hover:text-[#64ffda] hover:border-[#64ffda]"
                : "bg-white border-slate-200 text-slate-600 hover:text-[#f84464] hover:border-[#f84464]"
            }`}
          >
            <Compass size={16} />
          </button>
        </div>

        {/* ── Detect Location Button ── */}
        {!readOnly && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <motion.button
              id="gmap-detect-location-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDetectLocation}
              disabled={geoLoading}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-2xl transition-all disabled:opacity-70"
              style={{
                background: geoLoading
                  ? "rgba(79,70,229,0.7)"
                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "#fff",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
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

        {/* ── Route Controls ── */}
        {showRouting && routePoints.length > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border ${
                darkMode
                  ? "bg-[#0d1b2a] border-slate-700 text-[#64ffda]"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <Route size={14} />
              <span>{routePoints.length} point{routePoints.length !== 1 ? "s" : ""}</span>
              <button
                onClick={clearRoute}
                className="ml-1 text-red-400 hover:text-red-600"
                title="Clear route"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ── No API Key warning ── */}
        {(!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl px-6 py-5 max-w-sm text-center shadow-2xl">
              <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
              <p className="font-bold text-slate-800 mb-1">Google Maps API Key Missing</p>
              <p className="text-sm text-slate-500">
                Set <code className="bg-slate-100 px-1 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{" "}
                <code className="bg-slate-100 px-1 rounded text-xs">.env.local</code> to activate this map.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Showing OpenStreetMap fallback below.
              </p>
            </div>
          </div>
        )}

        {/* ── Google Map ── */}
        <LoadScript
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={GOOGLE_MAPS_LIBRARIES}
          onLoad={() => setScriptLoaded(true)}
          loadingElement={
            <div
              className={`w-full h-full flex items-center justify-center ${
                darkMode ? "bg-[#0a0e27]" : "bg-slate-50"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={32}
                  className={`animate-spin ${darkMode ? "text-[#64ffda]" : "text-[#f84464]"}`}
                />
                <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Loading Google Maps…
                </p>
              </div>
            </div>
          }
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            options={mapOptions}
            onClick={handleMapClick}
            onLoad={onMapLoad}
          >
            {/* Primary selected marker */}
            {primaryMarker && (
              <Marker
                position={primaryMarker}
                icon={PRIMARY_ICON}
                animation={2} /* DROP */
                onClick={() =>
                  setActiveInfoMarker(
                    activeInfoMarker === "primary" ? null : "primary"
                  )
                }
              >
                {activeInfoMarker === "primary" && address && (
                  <InfoWindow
                    onCloseClick={() => setActiveInfoMarker(null)}
                  >
                    <div style={{ maxWidth: 220 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>
                        📍 Selected Location
                      </p>
                      {address.city && (
                        <p style={{ fontSize: 12, color: "#475569" }}>
                          {address.city}{address.state ? `, ${address.state}` : ""}
                        </p>
                      )}
                      {address.pincode && (
                        <p style={{ fontSize: 11, color: "#94a3b8" }}>PIN: {address.pincode}</p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            )}

            {/* User GPS marker */}
            {userMarker && (
              <Marker
                position={userMarker}
                icon={USER_ICON}
                title="Your current location"
                onClick={() =>
                  setActiveInfoMarker(
                    activeInfoMarker === "user" ? null : "user"
                  )
                }
              >
                {activeInfoMarker === "user" && (
                  <InfoWindow onCloseClick={() => setActiveInfoMarker(null)}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 12, color: "#4f46e5" }}>
                        📌 Your Location
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            )}

            {/* Extra read-only markers */}
            {extraMarkers.map((m, i) => (
              <Marker
                key={`extra-${i}`}
                position={{ lat: m.lat, lng: m.lng }}
                icon={SECONDARY_ICON}
                title={m.label || `Point ${i + 1}`}
                onClick={() =>
                  setActiveInfoMarker(
                    activeInfoMarker === `extra-${i}` ? null : `extra-${i}`
                  )
                }
              >
                {activeInfoMarker === `extra-${i}` && m.label && (
                  <InfoWindow
                    onCloseClick={() => setActiveInfoMarker(null)}
                  >
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                      {m.label}
                    </p>
                  </InfoWindow>
                )}
              </Marker>
            ))}

            {/* Route waypoint markers */}
            {showRouting &&
              routePoints.map((pt, i) => (
                <Marker
                  key={`route-${i}`}
                  position={pt}
                  icon={{
                    ...SECONDARY_ICON,
                    label: {
                      text: String(i + 1),
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "bold",
                    },
                  }}
                />
              ))}

            {/* Route polyline */}
            {showRouting && routePoints.length >= 2 && (
              <Polyline
                path={routePath}
                options={{
                  strokeColor: darkMode ? "#64ffda" : "#4f46e5",
                  strokeOpacity: 0.9,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* ── Geo Error ── */}
      <AnimatePresence>
        {geoError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600"
          >
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{geoError}</span>
            <button onClick={() => setGeoError("")} className="ml-auto text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Coordinates badge ── */}
      {primaryMarker && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <MapPin size={13} className="text-[#f84464]" />
            <span className="text-xs font-bold text-slate-600">
              {primaryMarker.lat.toFixed(6)}, {primaryMarker.lng.toFixed(6)}
            </span>
          </div>
          {address?.pincode && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <CheckCircle2 size={13} className="text-green-500" />
              <span className="text-xs font-bold text-green-700">PIN {address.pincode}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Address breakdown ── */}
      <AddressPanel address={address} isLoading={addressLoading} />
    </div>
  );
}
