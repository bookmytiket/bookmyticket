import { SERVICE_CATEGORIES } from './data/serviceCategories';
import { getSitemapEvents, getSitemapVendors, getSitemapTurfs } from '../lib/convex-server';

export default async function sitemap() {
  const baseUrl = 'https://bookmyticket.net';

  // 1. Core routes (Priority: 1.0 - 0.8)
  const coreRoutes = [
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

  // 2. Service Category routes (Priority: 0.7)
  const serviceCategoryRoutes = SERVICE_CATEGORIES.map((category) => ({
    url: `${baseUrl}/services?category=${encodeURIComponent(category)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 3. Event Category routes (Priority: 0.7)
  const eventCategories = ['Concert', 'Sports', 'Comedy', 'Theater', 'Festivals', 'Virtual'];
  const eventCategoryRoutes = eventCategories.map((category) => ({
    url: `${baseUrl}/?category=${encodeURIComponent(category)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // 4. Dynamic Event routes (Priority: 0.9)
  const events = await getSitemapEvents();
  const eventRoutes = events.map((event) => ({
    url: `${baseUrl}/events/detail?id=${event._id}`,
    lastModified: new Date(event.updatedAt || Date.now()).toISOString(),
    changeFrequency: 'always',
    priority: 0.9,
  }));

  // 5. Dynamic Professional Service routes (Priority: 0.9)
  const allVendors = await getSitemapVendors();
  const vendors = allVendors.filter(v => 
    v.category && 
    (v.kycStatus === 'KYC Completed' || v.kycStatus === 'Active')
  );
  const vendorRoutes = vendors.map((vendor) => ({
    url: `${baseUrl}/services/${vendor._id}`,
    lastModified: new Date(vendor.updatedAt || Date.now()).toISOString(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 6. Dynamic Turf routes (Priority: 0.9)
  const turfs = await getSitemapTurfs();
  const turfRoutes = turfs.map((turf) => ({
    url: `${baseUrl}/turfs/${turf._id}`,
    lastModified: new Date(turf.updatedAt || Date.now()).toISOString(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [
    ...coreRoutes, 
    ...serviceCategoryRoutes, 
    ...eventCategoryRoutes, 
    ...eventRoutes, 
    ...vendorRoutes, 
    ...turfRoutes
  ];
}
