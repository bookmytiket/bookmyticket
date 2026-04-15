import { SERVICE_CATEGORIES } from './data/serviceCategories';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
  const eventCategoryRoutes = ['Concert', 'Sports', 'Comedy', 'Theater', 'Festivals', 'Virtual'].map((category) => ({
    url: `${baseUrl}/?category=${encodeURIComponent(category)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // If supabase is not initialized (e.g. during build without env vars), return only core routes
  if (!supabase) {
    return [
      ...coreRoutes,
      ...serviceCategoryRoutes,
      ...eventCategoryRoutes
    ];
  }

  // 4. Dynamic Event routes (Priority: 0.9)
  const { data: events = [] } = await supabase.from('events').select('id');
  const eventRoutes = (events || []).map((event) => ({
    url: `${baseUrl}/events/detail?id=${event.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'always',
    priority: 0.9,
  }));

  // 5. Dynamic Professional Service routes (Priority: 0.9)
  const { data: vendors = [] } = await supabase
    .from('service_providers')
    .select('id, status, category');
  
  const activeVendors = (vendors || []).filter(v => 
    v.category && 
    (v.status === 'KYC Completed' || v.status === 'Active' || v.status === 'Approved')
  );
  const vendorRoutes = activeVendors.map((vendor) => ({
    url: `${baseUrl}/services/${vendor.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 6. Dynamic Turf routes (Priority: 0.9)
  const { data: turfs = [] } = await supabase.from('turfs').select('id');
  const turfRoutes = (turfs || []).map((turf) => ({
    url: `${baseUrl}/turfs/${turf.id}`,
    lastModified: new Date().toISOString(),
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
