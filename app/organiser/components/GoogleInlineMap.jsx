"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from "@/lib/googleMaps";
import MapPicker from "@/components/MapPicker"; // Leaflet Fallback

/**
 * GoogleInlineMap — High-fidelity Google Maps component with robust initialization
 * and seamless fallback to Leaflet if API fails or is unavailable.
 */
const GoogleInlineMap = ({ lat, lng, onLocationSelect }) => {
  const [map, setMap] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  
  // Robust JS API Loader
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const center = useMemo(() => ({ 
    lat: Number(lat) || 20.5937, 
    lng: Number(lng) || 78.9629 
  }), [lat, lng]);

  // Listen for Google Maps Authentication Failures (Billing/Key issues)
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn("[GoogleMaps] Auth failure detected. Switching to fallback.");
      setUseFallback(true);
    };
    return () => { delete window.gm_authFailure; };
  }, []);

  const onLoad = React.useCallback(function callback(m) {
    setMap(m);
  }, []);

  const onUnmount = React.useCallback(function callback(m) {
    setMap(null);
  }, []);

  // Handle GPS location using browser native API (safe from 'google' undefined)
  const handleLiveLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (onLocationSelect) {
            onLocationSelect(latitude, longitude);
          }
          if (map) {
            map.panTo({ lat: latitude, lng: longitude });
            map.setZoom(17);
          }
        },
        (err) => {
          console.error("[Location] GPS error:", err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Safe handlers using event latLng
  const handleMapClick = (e) => {
    if (onLocationSelect && e.latLng) {
      onLocationSelect(e.latLng.lat(), e.latLng.lng());
    }
  };

  const handleMarkerDragEnd = (e) => {
    if (onLocationSelect && e.latLng) {
      onLocationSelect(e.latLng.lat(), e.latLng.lng());
    }
  };

  // Fallback Logic: Triggered if Load Error happens or key is invalid
  const triggerFallback = useFallback || loadError || !GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes('api.postalpincode.in');

  if (triggerFallback) {
    return (
      <div className="relative w-full h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden bg-slate-50">
        <MapPicker 
          lat={lat} 
          lng={lng} 
          onLocationSelect={(data) => onLocationSelect(data.lat, data.lng)}
          height="100%"
        />
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Standard Map Fallback Active
          </div>
          {loadError && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-widest shadow-xl">
              Google Maps Script Error
            </div>
          )}
        </div>
        <button 
          onClick={() => {
            setUseFallback(false);
            window.location.reload(); // Hard reload often helps with Google initialization
          }}
          className="absolute bottom-4 right-4 z-[1000] bg-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-200 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          Try Google Maps Again
        </button>
      </div>
    );
  }

  // Loading State
  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-pink-500 rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Initializing Google Maps...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] group">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        }}
      >
        <Marker
          position={center}
          draggable={!!onLocationSelect}
          onDragEnd={handleMarkerDragEnd}
          animation={2} // Drop Animation (Constant value for safety)
        />
      </GoogleMap>

      {/* Floating Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[50]">
        <button
          type="button"
          onClick={handleLiveLocation}
          className="w-12 h-12 bg-white rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-pink-600 hover:border-pink-200 transition-all"
          title="Detect My Location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
        </button>
      </div>

      <button 
        onClick={() => setUseFallback(true)}
        className="absolute top-4 right-4 z-[50] bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
      >
        Switch to Free Map
      </button>
    </div>
  );
};

export default GoogleInlineMap;
