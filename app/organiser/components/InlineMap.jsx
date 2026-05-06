"use client";
import React, { useEffect, useRef } from "react";

/**
 * InlineMap — free Leaflet-based embedded map with draggable marker.
 * No API key required. Uses OpenStreetMap tiles.
 *
 * Props:
 *   lat, lng           — initial coordinates (required)
 *   onLocationSelect   — (lat, lng) => void
 */
const InlineMap = ({ lat, lng, onLocationSelect }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let cleanup = () => {};

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Custom pin icon
      const pinIcon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
          <defs>
            <radialGradient id="ig" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#f84464"/>
              <stop offset="100%" stop-color="#c0143c"/>
            </radialGradient>
            <filter id="is"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#f84464" flood-opacity="0.4"/></filter>
          </defs>
          <path d="M22 2C12.06 2 4 10.06 4 20c0 12 18 34 18 34s18-22 18-34C40 10.06 31.94 2 22 2z" fill="url(#ig)" filter="url(#is)"/>
          <circle cx="22" cy="20" r="7" fill="white" opacity="0.95"/>
        </svg>`,
        iconSize: [44, 56],
        iconAnchor: [22, 56],
        className: "",
      });

      const startLat = Number(lat) || 20.5937;
      const startLng = Number(lng) || 78.9629;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { zoomControl: true }).setView([startLat, startLng], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        markerRef.current = L.marker([startLat, startLng], {
          icon: pinIcon,
          draggable: !!onLocationSelect,
        }).addTo(mapRef.current);

        if (onLocationSelect) {
          markerRef.current.on("dragend", (e) => {
            const { lat, lng } = e.target.getLatLng();
            onLocationSelect(lat, lng);
          });

          mapRef.current.on("click", (e) => {
            const { lat, lng } = e.latlng;
            markerRef.current.setLatLng([lat, lng]);
            onLocationSelect(lat, lng);
          });
        }
      } else {
        mapRef.current.setView([startLat, startLng], 14);
        markerRef.current?.setLatLng([startLat, startLng]);
      }

      cleanup = () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    };

    initMap();
    return () => cleanup();
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50"
      style={{ zIndex: 1 }}
    />
  );
};

export default InlineMap;
