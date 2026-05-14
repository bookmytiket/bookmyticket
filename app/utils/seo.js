/**
 * Utility functions for SEO and URL optimization
 */

/**
 * Generates a URL-friendly slug from a string.
 * Example: "Marathon 2026 @ Coimbatore" -> "marathon-2026-coimbatore"
 */
export const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w-]+/g, "")        // Remove all non-word chars
    .replace(/--+/g, "-")           // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start of text
    .replace(/-+$/, "");            // Trim - from end of text
};

/**
 * Generates the relative event path based on its slug or ID.
 */
export const getEventPath = (event) => {
  if (!event) return "/events";
  const id = event.id || event._id || event.event_id;
  if (event.slug && typeof event.slug === 'string' && event.slug.length > 2) {
    return `/events/${event.slug}`;
  }
  return `/events/detail?id=${id}`;
};

/**
 * Generates the full event URL based on its slug or ID.
 * Prioritizes slugs for better SEO.
 */
export const getEventUrl = (event) => {
  const baseUrl = "https://bookmyticket.net";
  return `${baseUrl}${getEventPath(event)}`;
};

/**
 * Common SEO meta descriptions and keywords
 */
export const SEO_CONFIG = {
  defaultDescription: "Discover and book tickets for the best events, concerts, sports, and workshops near you. Fast, secure, and reliable ticketing with BookMyTicket.",
  defaultTitle: "BookMyTicket | Best Event Ticketing Platform",
  siteName: "BookMyTicket",
  twitterHandle: "@bookmyticket",
};
