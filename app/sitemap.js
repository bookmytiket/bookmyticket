import { createClient } from "@supabase/supabase-js";
import { SERVICE_CATEGORIES } from './data/serviceCategories';

// Initialize Admin client for full data access in sitemap generation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = "https://bookmyticket.net";

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Cache for 24 hours (1 day)

/**
 * Automatically generates a valid XML sitemap for the application.
 * Dynamic fetching from Supabase ensures all public events, services, and turfs are indexed.
 * SEO optimized with proper priorities and change frequencies.
 */
export default async function sitemap() {
  // 1. Static Core Pages (Priority: 1.0 - 0.5)
  const staticPages = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: 'always', priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/branding`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    // 2. Dynamic Event Routes (Priority: 0.9)
    // Fetches active events to ensure Google only indexes valid, upcoming experiences.
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id, slug, updated_at, status')
      .eq('status', 'active')
      .limit(1000);

    const eventRoutes = (events || []).map((event) => ({
      url: `${BASE_URL}/events/detail?id=${event.id}`, // Using current app structure
      lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    }));

    // 3. Dynamic Professional Service / Provider Routes (Priority: 0.7)
    // Indexes verified artists and service providers.
    const { data: vendors } = await supabaseAdmin
      .from('service_providers')
      .select('id, updated_at, status')
      .in('status', ['Active', 'Approved', 'KYC Completed'])
      .limit(1000);

    const vendorRoutes = (vendors || []).map((vendor) => ({
      url: `${BASE_URL}/services/${vendor.id}`,
      lastModified: vendor.updated_at ? new Date(vendor.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 4. Dynamic Turf Routes (Priority: 0.7)
    // Indexes all sports facilities and turfs.
    const { data: turfs } = await supabaseAdmin
      .from('turfs')
      .select('id, updated_at')
      .limit(500);

    const turfRoutes = (turfs || []).map((turf) => ({
      url: `${BASE_URL}/turfs/${turf.id}`,
      lastModified: turf.updated_at ? new Date(turf.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 5. Service Category Routes
    const serviceCategoryRoutes = SERVICE_CATEGORIES.map((category) => ({
      url: `${BASE_URL}/services?category=${encodeURIComponent(category)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // 6. City-Based Event Routes
    const defaultCities = ['Coimbatore', 'Bengaluru', 'Chennai', 'Mumbai', 'Kochi', 'Delhi', 'Hyderabad'];
    const cityRoutes = defaultCities.map((city) => ({
      url: `${BASE_URL}/events/in/${city.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // Merge all routes into a single sitemap array
    return [
      ...staticPages,
      ...eventRoutes,
      ...vendorRoutes,
      ...turfRoutes,
      ...serviceCategoryRoutes,
      ...cityRoutes
    ];
  } catch (error) {
    console.error("Sitemap Generation Error:", error);
    // Fallback to static pages if DB fetch fails
    return staticPages;
  }
}
