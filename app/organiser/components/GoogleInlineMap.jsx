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
  const center = useMemo(() => ({ 
    lat: Number(lat) || 20.5937, 
    lng: Number(lng) || 78.9629 
  }), [lat, lng]);

  return (
    <div className="relative w-full h-full">
      <MapPicker 
        lat={center.lat} 
        lng={center.lng} 
        onLocationSelect={(data) => onLocationSelect(data.lat, data.lng)}
        height="100%"
      />
    </div>
  );
};

export default GoogleInlineMap;
