/**
 * Resolves a standardized banner redirection to a local or external URL.
 * 
 * @param {string} type - The type of redirect ('event', 'service', 'turf', 'url')
 * @param {string} id - The ID of the item or the URL itself
 * @param {string} fallback - The fallback URL if redirection cannot be resolved
 * @returns {string} The resolved URL
 */
export function resolveBannerRedirect(type, id, fallback = "#") {
  if (!type || !id) return fallback;

  switch (type.toLowerCase()) {
    case 'event':
      return `/events/detail?id=${id}`;
    case 'service':
      return `/services/detail?id=${id}`;
    case 'turf':
      return `/turf/detail?id=${id}`;
    case 'url':
      return id.startsWith('http') ? id : `https://${id}`;
    default:
      return fallback;
  }
}
