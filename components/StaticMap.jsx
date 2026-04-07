"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function StaticMap({ lat, lng }) {
  if (!lat || !lng) return <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Coordinates Available</div>;
  
  return (
    <MapContainer 
      center={{ lat, lng }} 
      zoom={15} 
      scrollWheelZoom={false} 
      zoomControl={false}
      dragging={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={{ lat, lng }} icon={customIcon} />
    </MapContainer>
  );
}
