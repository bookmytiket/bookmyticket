"use client";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({ position, updateLocation }) {
  const map = useMapEvents({
    click(e) {
      updateLocation(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Recentering map if position Prop changes externally
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  )
}

export default function MapPicker({ lat, lng, onLocationSelect }) {
  const [position, setPosition] = useState(lat && lng ? { lat, lng } : null);
  const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Default India

  const handleUpdate = async (latlng) => {
    setPosition(latlng);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      if (data.display_name) {
        onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address: data.display_name });
      } else {
        onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address: "" });
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address: "" });
    }
  };

  return (
    <div className="border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm relative z-0">
      <MapContainer 
        center={position || defaultCenter} 
        zoom={position ? 15 : 4} 
        scrollWheelZoom={true} 
        style={{ height: "350px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} updateLocation={handleUpdate} />
      </MapContainer>
      {!position && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center z-[1000] pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-sm text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg ">
            Tap or click on the map to drop a pin
          </div>
        </div>
      )}
    </div>
  );
}
