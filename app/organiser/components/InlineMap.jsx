"use client";
import React, { useEffect, useRef } from 'react';

const InlineMap = ({ lat, lng, onLocationSelect }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        
        return () => { if (link.parentNode) link.parentNode.removeChild(link); };
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        
        // Dynamic import to avoid SSR issues
        const initMap = async () => {
            const L = (await import('leaflet')).default;
            
            // Fix default icon issue
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
            });

            if (!mapRef.current) {
                mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 13);
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(mapRef.current);

                markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);

                markerRef.current.on('dragend', (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    onLocationSelect(lat, lng);
                });

                mapRef.current.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    markerRef.current.setLatLng([lat, lng]);
                    onLocationSelect(lat, lng);
                });
            } else {
                mapRef.current.setView([lat, lng]);
                markerRef.current.setLatLng([lat, lng]);
            }
        };

        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [lat, lng]);

    return (
        <div 
            ref={mapContainerRef} 
            className="w-full h-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50"
            style={{ zIndex: 1 }}
        />
    );
};

export default InlineMap;
