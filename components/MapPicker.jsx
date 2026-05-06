"use client";
/**
 * MapPicker — always uses LeafletMapPicker (free, zero API key)
 * OpenStreetMap + Nominatim + Photon + browser Geolocation watchPosition
 */
import dynamic from "next/dynamic";

const LeafletMapPicker = dynamic(() => import("./LeafletMapPicker"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        borderRadius: "1.5rem",
        border: "1px solid #e2e8f0",
        color: "#94a3b8",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        Initializing Free Map Engine...
      </div>
    </div>
  ),
});

/**
 * Props forwarded to LeafletMapPicker:
 *   lat, lng           — initial coordinates
 *   onLocationSelect   — ({ lat, lng, address, city, district, state, pincode }) => void
 *   height             — CSS height (default "400px")
 *   showAutocomplete   — boolean (default true)
 *   showRouting        — boolean (default false)
 *   extraMarkers       — [{ lat, lng, label }]
 *   readOnly           — disable clicking
 *   liveTracking       — auto-start watchPosition on mount
 */
export default function MapPicker(props) {
  return (
    <>
      {/* 
         Injecting Leaflet CSS via CDN as a safety fallback for production environments 
         where local CSS imports might be inconsistent during dynamic loading.
      */}
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div style={{ height: props.height || "400px", width: "100%", position: "relative" }}>
        <LeafletMapPicker {...props} height={props.height || "400px"} />
      </div>
    </>
  );
}
