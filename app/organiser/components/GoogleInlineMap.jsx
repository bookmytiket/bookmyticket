"use client";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { LocateFixed } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[300px] bg-slate-50 animate-pulse rounded-3xl" />
});

/**
 * OSMInlineMap — OpenStreetMap replacement for GoogleInlineMap.
 * Zero-billing, robust, and performs exactly like the original.
 */
const GoogleInlineMap = ({ lat, lng, onLocationSelect }) => {
  const [geoLoading, setGeoLoading] = useState(false);

  const center = useMemo(() => ({ 
    lat: Number(lat) || 20.5937, 
    lng: Number(lng) || 78.9629 
  }), [lat, lng]);

  const handleLiveLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (onLocationSelect) {
            onLocationSelect(latitude, longitude);
          }
          setGeoLoading(false);
        },
        (err) => {
          console.error("[Location] GPS error:", err);
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-100 shadow-xl bg-slate-50" style={{ height: "350px" }}>
      <MapPicker 
        lat={center.lat} 
        lng={center.lng} 
        onLocationSelect={(data) => onLocationSelect(data.lat, data.lng)}
        height="350px"
      />

      {/* Badge */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-2xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          OpenStreetMap Engine Active
        </div>
      </div>

      {/* Floating Controls Removed for Auto-Detection */}
    </div>
  );
};

export default GoogleInlineMap;
