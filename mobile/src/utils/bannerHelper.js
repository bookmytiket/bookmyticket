/**
 * Resolves a standardized banner redirection for React Native.
 * 
 * @param {string} type - The type of redirect ('event', 'service', 'turf', 'url')
 * @param {string} id - The ID of the item or the URL itself
 * @returns {object} { url: string, isExternal: boolean, route: string, params: object }
 */
export function resolveMobileBannerRedirect(type, id) {
  const fallbackHome = { 
    url: null, 
    isExternal: false, 
    route: 'MainTabs', 
    params: { screen: 'Home' } 
  };

  if (!type) return fallbackHome;
  
  const cleanType = String(type).toLowerCase();
  const cleanId = String(id || '').trim();

  if (cleanType.includes('event')) {
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return fallbackHome;
    return { 
      url: `bookmyticket://events/detail?id=${cleanId}`, 
      isExternal: false, 
      route: 'EventDetail', 
      params: { eventId: cleanId } 
    };
  }

  if (cleanType.includes('service') || cleanType.includes('vendor') || cleanType.includes('provider') || cleanType.includes('artist')) {
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return fallbackHome;
    return { 
      url: `bookmyticket://services/detail?id=${cleanId}`, 
      isExternal: false, 
      route: 'ServiceDetail', 
      params: { vendorId: cleanId } 
    };
  }

  if (cleanType.includes('turf')) {
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return fallbackHome;
    return { 
      url: `bookmyticket://turf/detail?id=${cleanId}`, 
      isExternal: false, 
      route: 'TurfDetail', 
      params: { turfId: cleanId } 
    };
  }

  if (cleanType === 'branding' || cleanType === 'url' || cleanType === 'link') {
    // If no ID/URL, fallback to Home
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      return { 
        url: null, 
        isExternal: false, 
        route: 'Events', 
        params: { category: 'All' } 
      };
    }
    const fullUrl = cleanId.startsWith('http') ? cleanId : `https://${cleanId}`;
    return { url: fullUrl, isExternal: true };
  }

  // Final fallback to Events list for any unknown type/ID combination
  return { 
    url: null, 
    isExternal: false, 
    route: 'Events', 
    params: { category: 'All' } 
  };
}
