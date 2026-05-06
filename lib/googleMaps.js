/**
 * Google Maps centralized configuration
 * APIs enabled: Maps JavaScript API, Geocoding API, Places API
 */

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/** Libraries loaded once by LoadScript / useJsApiLoader */
export const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

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
 * using the Google Geocoding API (REST).
 * Returns: { fullAddress, city, district, state, pincode, country }
 */
export async function reverseGeocode(lat, lng) {
  const apiKey = GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE" || apiKey.includes('api.postalpincode.in')) {
    console.warn("[GoogleMaps] API key not set or invalid. Falling back to Nominatim.");
    return nominatimFallback(lat, lng);
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      console.warn("[GoogleMaps] Geocoding returned:", data.status);
      return nominatimFallback(lat, lng);
    }

    const geo = parseGoogleAddressComponents(data.results);
    return geo;
  } catch (err) {
    console.error("[GoogleMaps] Reverse geocoding failed:", err);
    return nominatimFallback(lat, lng);
  }
}

/**
 * Parse Google Geocoding API `address_components` array
 * into structured fields.
 */
function parseGoogleAddressComponents(results) {
  const firstResult = results[0] || {};
  const fullAddress = firstResult.formatted_address || "";

  // Flatten all address_components from all results into a map for better coverage
  const componentMap = {};
  for (const result of results) {
    for (const comp of result.address_components || []) {
      for (const type of comp.types) {
        if (!componentMap[type]) {
          componentMap[type] = comp.long_name;
          componentMap[`${type}_short`] = comp.short_name;
        }
      }
    }
  }

  // City priority: locality > sublocality_level_1 > administrative_area_level_3
  const city =
    componentMap["locality"] ||
    componentMap["sublocality_level_1"] ||
    componentMap["administrative_area_level_3"] ||
    componentMap["administrative_area_level_2"] ||
    "";

  // District priority: administrative_area_level_3 > administrative_area_level_2
  const district =
    componentMap["administrative_area_level_3"] ||
    componentMap["administrative_area_level_2"] ||
    city ||
    "";

  const state = componentMap["administrative_area_level_1"] || "";
  const stateCode = componentMap["administrative_area_level_1_short"] || "";
  const pincode = componentMap["postal_code"] || "";
  const country = componentMap["country"] || "India";
  const countryCode = componentMap["country_short"] || "IN";

  return {
    fullAddress,
    city,
    district,
    state,
    stateCode,
    pincode,
    country,
    countryCode,
    streetNumber: componentMap["street_number"] || "",
    route: componentMap["route"] || "",
    sublocality: componentMap["sublocality_level_1"] || componentMap["sublocality_level_2"] || "",
  };
}

/**
 * Forward-geocode an address string into structured data
 * using the Google Geocoding API (REST).
 */
export async function geocode(address, countryCode = "") {
  const apiKey = GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE" || apiKey.includes('api.postalpincode.in')) {
    console.warn("[GoogleMaps] API key not set or invalid for geocode.");
    return null;
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    if (countryCode) {
      url += `&region=${countryCode.toLowerCase()}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      console.warn("[GoogleMaps] Geocoding search returned:", data.status);
      return null;
    }

    const first = data.results[0];
    const geo = parseGoogleAddressComponents(data.results);
    
    // REST API results use number fields for coordinates
    geo.lat = first.geometry.location.lat;
    geo.lng = first.geometry.location.lng;

    return geo;
  } catch (err) {
    console.error("[GoogleMaps] Geocoding search failed:", err);
    return null;
  }
}

/**
 * Fallback geocoder using Nominatim (OpenStreetMap).
 * Zero-dependency, used when Google API is unavailable or limits reached.
 */
async function nominatimFallback(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data?.address || {};

    const suburb   = addr.suburb || addr.neighbourhood || addr.quarter || "";
    const city     = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || "";
    const district = addr.county || addr.state_district || city || "";
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
    console.error("[Nominatim] Fallback failed:", err);
    return { 
      fullAddress: "", city: "", district: "", state: "", stateCode: "", pincode: "", country: "India", countryCode: "IN",
      streetNumber: "", route: "", sublocality: "" 
    };
  }
}
