/**
 * Resolves a standardized banner redirection for React Native.
 * 
 * @param {string} type - The type of redirect ('event', 'service', 'turf', 'url')
 * @param {string} id - The ID of the item or the URL itself
 * @returns {object} { url: string, isExternal: boolean, route: string, params: object }
 */
export function resolveMobileBannerRedirect(type, id) {
  if (!type || !id) return { url: null, isExternal: false };

  switch (type.toLowerCase()) {
    case 'event':
      return { 
        url: `bookmyticket://events/detail?id=${id}`, 
        isExternal: false, 
        route: 'EventDetail', 
        params: { eventId: String(id) } 
      };
    case 'service':
      return { 
        url: `bookmyticket://services/detail?id=${id}`, 
        isExternal: false, 
        route: 'ServiceDetail', 
        params: { vendorId: String(id) } 
      };
    case 'turf':
      return { 
        url: `bookmyticket://turf/detail?id=${id}`, 
        isExternal: false, 
        route: 'TurfDetail', 
        params: { turfId: String(id) } 
      };
    case 'url':
      const fullUrl = id.startsWith('http') ? id : `https://${id}`;
      return { url: fullUrl, isExternal: true };
    default:
      return { url: null, isExternal: false };
  }
}
