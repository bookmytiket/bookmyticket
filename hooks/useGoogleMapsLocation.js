"use client";
import { useState, useCallback, useRef } from "react";

async function nominatimReverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      { headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    const addr = data?.address || {};

    const suburb   = addr.suburb || addr.neighbourhood || addr.quarter || "";
    const city     = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    const district = addr.county || addr.state_district || city || "";
    const state    = addr.state || "";
    const country  = addr.country || "";

    return {
      fullAddress: data.display_name || "",
      city, district, state, 
      pincode: addr.postcode || "",
      country: country || "India",
    };
  } catch {
    return { fullAddress: "", city: "", district: "", state: "", pincode: "", country: "India" };
  }
}


/**
 * useLocationTracker — real-time GPS hook using watchPosition
 * Completely free, no Google API key needed.
 *
 * Returns:
 *   location       — { lat, lng, fullAddress, city, district, state, pincode, country, accuracy } | null
 *   tracking       — boolean (is watchPosition active)
 *   loading        — boolean
 *   error          — string | null
 *   startTracking  — () => void  — starts live GPS
 *   stopTracking   — () => void
 *   getOnce        — () => void  — single fix (getCurrentPosition)
 *   clearLocation  — () => void
 */
export function useLocationTracker() {
  const [location, setLocation]   = useState(null);
  const [tracking, setTracking]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const watchIdRef                = useRef(null);

  const handlePos = useCallback(async (pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    const geo = await nominatimReverseGeocode(latitude, longitude);
    setLocation({ lat: latitude, lng: longitude, accuracy, ...geo });
    setLoading(false);
  }, []);

  const handleErr = useCallback((err) => {
    setLoading(false);
    setTracking(false);
    if (err.code === err.PERMISSION_DENIED)
      setError("Location permission denied.");
    else if (err.code === err.POSITION_UNAVAILABLE)
      setError("Location signal unavailable.");
    else
      setError("Location request timed out.");
  }, []);

  const GEO_OPTS = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) { setError("Geolocation not supported."); return; }
    setLoading(true); setError(null); setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(handlePos, handleErr, GEO_OPTS);
  }, [handlePos, handleErr]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  const getOnce = useCallback(() => {
    if (!("geolocation" in navigator)) { setError("Geolocation not supported."); return; }
    setLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(handlePos, handleErr, GEO_OPTS);
  }, [handlePos, handleErr]);

  const clearLocation = useCallback(() => { setLocation(null); setError(null); }, []);

  return { location, tracking, loading, error, startTracking, stopTracking, getOnce, clearLocation };
}

/* Backward-compatible alias */
export function useGoogleMapsLocation() {
  return useLocationTracker();
}
