import { SERVICE_CATEGORIES } from './data/serviceCategories';

export default async function sitemap() {
  const baseUrl = 'https://bookmyticket.net';

  // Core routes
  const routes = [
    '',
    '/events',
    '/services',
    '/advertise',
    '/branding',
    '/profile',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  // Status/Category pages for Services
  const serviceCategoryRoutes = SERVICE_CATEGORIES.map((category) => ({
    url: `${baseUrl}/services?category=${encodeURIComponent(category)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Note: For fully dynamic event pages, you would fetch events from your database here.
  // Example (if server-side Convex is configured):
  // const events = await fetchQuery(api.events.getActiveEvents);
  // const eventRoutes = events.map(event => ({ url: `${baseUrl}/events/detail?id=${event._id}`, ... }))

  return [...routes, ...serviceCategoryRoutes];
}
