"use client";
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, LocateFixed } from 'lucide-react';

const EventMap = ({ lat, lng, venueName, address }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [userLoc, setUserLoc] = useState(null);
    const [distance, setDistance] = useState(null);

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        
        return () => { if (link.parentNode) link.parentNode.removeChild(link); };
    }, []);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    useEffect(() => {
        if (!mapContainerRef.current || !lat || !lng) return;
        
        const initMap = async () => {
            const L = (await import('leaflet')).default;
            
            // Fix default icon issue
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
            });

            if (mapContainerRef.current && !mapRef.current) {
                const centerLat = parseFloat(lat);
                const centerLng = parseFloat(lng);
                
                if (!isNaN(centerLat) && !isNaN(centerLng)) {
                    mapRef.current = L.map(mapContainerRef.current).setView([centerLat, centerLng], 14);
                    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution: '© OpenStreetMap'
                    }).addTo(mapRef.current);

                    // Event Marker
                    const eventIcon = L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        iconSize: [40, 40],
                        iconAnchor: [20, 40],
                        popupAnchor: [0, -40]
                    });
                    
                    L.marker([centerLat, centerLng], { icon: eventIcon }).addTo(mapRef.current);
                }
            } else if (mapRef.current) {
                mapRef.current.setView([parseFloat(lat), parseFloat(lng)]);
            }
        };

        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [lat, lng, venueName, address]);

    const getMyLocation = async () => {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLoc({ lat: latitude, lng: longitude });
            
            const dist = calculateDistance(latitude, longitude, lat, lng);
            setDistance(dist.toFixed(1));

            const L = (await import('leaflet')).default;
            if (mapRef.current) {
                const userIcon = L.divIcon({
                    html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
                    className: 'user-location-marker',
                    iconSize: [16, 16]
                });
                L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current);
                
                // Fit bounds
                const bounds = L.latLngBounds([latitude, longitude], [lat, lng]);
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
        });
    };

    const openDirections = () => {
        const dLat = parseFloat(lat);
        const dLng = parseFloat(lng);
        let url = `https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}`;
        
        if (userLoc) {
            url += `&origin=${userLoc.lat},${userLoc.lng}`;
        }
        
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-[#ec4899]">
                        <MapPin size={16} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Venue Map</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {distance ? `${distance} km away` : 'Locate the event'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <button 
                        onClick={getMyLocation}
                        className="p-2 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-pink-500 hover:border-pink-200 transition-all shadow-sm"
                        title="Show my location"
                    >
                        <LocateFixed size={14} />
                    </button>
                    <button 
                        onClick={openDirections}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
                    >
                        <Navigation size={12} /> Directions
                    </button>
                </div>
            </div>
            
            <div 
                ref={mapContainerRef} 
                className="w-full h-[240px] rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50 relative z-10"
            />
        </div>
    );
};

export default EventMap;
