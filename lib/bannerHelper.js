/**
 * Resolves a standardized banner redirection to a local or external URL.
 * 
 * @param {string} type - The type of redirect ('event', 'service', 'turf', 'url')
 * @param {string} id - The ID of the item or the URL itself
 * @param {string} fallback - The fallback URL if redirection cannot be resolved
 * @returns {string} The resolved URL
 */
export function resolveBannerRedirect(type, id, fallback = "#") {
  if (!type) return fallback;
  
  const cleanType = String(type).toLowerCase();
  const cleanId = String(id || '');

  switch (cleanType) {
    case 'event':
      return `/events/detail?id=${cleanId}`;
    case 'service':
    case 'provider':
    case 'vendor':
      return `/services/detail?id=${cleanId}`;
    case 'turf':
      return `/turf/detail?id=${cleanId}`;
    case 'branding':
    case 'url':
    case 'link':
      if (!cleanId || cleanId === 'undefined') return fallback;
      return cleanId.startsWith('http') ? cleanId : `https://${cleanId}`;
    default:
      return fallback;
  }
}
