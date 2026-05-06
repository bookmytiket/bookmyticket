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
      Loading map…
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
  return <LeafletMapPicker {...props} height={props.height || "400px"} />;
}
