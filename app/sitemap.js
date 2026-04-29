import { SERVICE_CATEGORIES } from './data/serviceCategories';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = 'https://bookmyticket.net';

  // 1. Core routes (Priority: 1.0 - 0.8)
  const coreRoutes = [
    '',
    '/services',
    '/branding',
    '/profile',
    '/signin',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'always' : 'daily',
    priority: route === '' ? 1.0 : 0.8,
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

  // 3b. City Event routes (Priority: 0.8)
  const defaultCities = ['Coimbatore', 'Bengaluru', 'Chennai', 'Mumbai', 'Kochi', 'Delhi', 'Hyderabad'];
  
  let dynamicCities = [...defaultCities];
  try {
    const { data: configData } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'seo_analytics')
      .single();
    
    if (configData?.value?.city_seo_overrides) {
      const extraCities = Object.keys(configData.value.city_seo_overrides).map(c => c.charAt(0).toUpperCase() + c.slice(1));
      dynamicCities = Array.from(new Set([...defaultCities, ...extraCities]));
    }
  } catch (err) {
    console.error("Error fetching city overrides for sitemap:", err);
  }

  const cityRoutes = dynamicCities.map((city) => ({
    url: `${baseUrl}/events/in/${city.toLowerCase()}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  if (!supabase) {
    return [
      ...coreRoutes,
      ...serviceCategoryRoutes,
      ...eventCategoryRoutes,
      ...cityRoutes
    ];
  }

  try {
    // 4. Dynamic Event routes (Priority: 0.9)
    const { data: events = [] } = await supabase.from('events').select('id, updated_at, img').limit(500);
    const eventRoutes = (events || []).map((event) => ({
      url: `${baseUrl}/events/detail?id=${event.id}`,
      lastModified: event.updated_at || new Date().toISOString(),
      changeFrequency: 'always',
      priority: 0.9,
      images: event.img ? [event.img] : [],
    }));

    // 5. Dynamic Professional Service routes (Priority: 0.9)
    const { data: vendors = [] } = await supabase
      .from('service_providers')
      .select('id, updated_at, status, category')
      .limit(500);
    
    const activeVendors = (vendors || []).filter(v => 
      v.category && 
      (v.status === 'KYC Completed' || v.status === 'Active' || v.status === 'Approved')
    );
    const vendorRoutes = activeVendors.map((vendor) => ({
      url: `${baseUrl}/services/${vendor.id}`,
      lastModified: vendor.updated_at || new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    // 6. Dynamic Turf routes (Priority: 0.9)
    const { data: turfs = [] } = await supabase.from('turfs').select('id, updated_at, images').limit(500);
    const turfRoutes = (turfs || []).map((turf) => ({
      url: `${baseUrl}/turfs/${turf.id}`,
      lastModified: turf.updated_at || new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
      images: Array.isArray(turf.images) ? turf.images.slice(0, 5) : [],
    }));

    return [
      ...coreRoutes, 
      ...serviceCategoryRoutes, 
      ...eventCategoryRoutes, 
      ...cityRoutes,
      ...eventRoutes, 
      ...vendorRoutes, 
      ...turfRoutes
    ];
  } catch (e) {
    console.error('Sitemap generation error:', e);
    return [
      ...coreRoutes,
      ...serviceCategoryRoutes,
      ...eventCategoryRoutes,
      ...cityRoutes
    ];
  }
}
