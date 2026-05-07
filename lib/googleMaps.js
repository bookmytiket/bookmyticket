/**
 * Map Utility - OpenStreetMap / Nominatim based
 * Zero-dependency, zero-billing solution.
 */

/** Default India center */
export const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629 };

/** Default zoom levels */
export const MAP_ZOOM = {
  COUNTRY: 5,
  STATE: 8,
  CITY: 12,
  STREET: 16,
};

/**
 * Reverse-geocode a lat/lng into structured address components
 * using Nominatim (OpenStreetMap).
 * Returns: { fullAddress, city, district, state, pincode, country }
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      { 
        headers: { "Accept-Language": "en" },
        signal: AbortSignal.timeout(10000)
      }
    );
    const data = await res.json();
    const addr = data?.address || {};

    const suburb   = addr.suburb || addr.neighbourhood || addr.quarter || "";
    const city     = addr.city || addr.town || addr.village || addr.municipality || "";
    const district = addr.state_district || addr.county || city || "";
    const state    = addr.state || "";
    const country  = addr.country || "India";
    const pincode  = addr.postcode || "";

    return {
      fullAddress:  data.display_name || "",
      city,
      district,
      state,
      stateCode: addr.state_code || "",
      pincode,
      country,
      countryCode: addr.country_code?.toUpperCase() || "IN",
      streetNumber: addr.house_number || "",
      route:        addr.road || addr.pedestrian || "",
      sublocality:  suburb,
    };
  } catch (err) {
    console.error("[Nominatim] Reverse geocoding failed:", err);
    return { 
      fullAddress: "", city: "", district: "", state: "", stateCode: "", pincode: "", country: "India", countryCode: "IN",
      streetNumber: "", route: "", sublocality: "" 
    };
  }
}

/**
 * Forward-geocode an address string into structured data
 * using Nominatim (OpenStreetMap).
 */
export async function geocode(address, countryCode = "") {
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    if (countryCode) {
      url += `&countrycodes=${countryCode.toLowerCase()}`;
    }

    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data?.length) {
      console.warn("[Nominatim] Geocoding search returned no results");
      return null;
    }

    const first = data[0];
    const addr = first.address || {};

    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      fullAddress: first.display_name,
      city: addr.city || addr.town || addr.village || "",
      district: addr.state_district || addr.county || "",
      state: addr.state || "",
      country: addr.country || "",
      pincode: addr.postcode || ""
    };
  } catch (err) {
    console.error("[Nominatim] Geocoding search failed:", err);
    return null;
  }
}

/**
 * Search for locations worldwide
 * Returns a list of structured location results
 */
export async function searchLocations(query) {
    if (!query || query.length < 3) return [];
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
            { 
                headers: { "Accept-Language": "en" },
                signal: AbortSignal.timeout(8000)
            }
        );
        const data = await res.json();
        return data.map(item => {
            const addr = item.address || {};
            const cityName = addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0];
            return {
                name: cityName,
                full: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                details: addr
            };
        });
    } catch (err) {
        console.error("[Nominatim] Search failed:", err);
        return [];
    }
}

export const GOOGLE_MAPS_API_KEY = ""; // Kept for compatibility but unused
export const GOOGLE_MAPS_LIBRARIES = []; // Kept for compatibility but unused
