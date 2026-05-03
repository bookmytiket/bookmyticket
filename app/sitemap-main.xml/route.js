import { createClient } from "@supabase/supabase-js";
import { SERVICE_CATEGORIES } from '../data/serviceCategories';

const BASE_URL = "https://bookmyticket.net";

function escapeXml(url) {
  return url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const urls = [
    { loc: `${BASE_URL}`, changefreq: "always", priority: "1.0" },
    { loc: `${BASE_URL}/events`, changefreq: "daily", priority: "0.8" },
    { loc: `${BASE_URL}/services`, changefreq: "daily", priority: "0.8" },
    { loc: `${BASE_URL}/branding`, changefreq: "monthly", priority: "0.6" },
  ];

  try {
    const [{ data: events }, { data: vendors }, { data: turfs }] = await Promise.all([
      supabaseAdmin.from('events').select('id, slug, updated_at').eq('status', 'active').limit(5000),
      supabaseAdmin.from('service_providers').select('id, updated_at').in('status', ['Active', 'Approved', 'KYC Completed']).limit(5000),
      supabaseAdmin.from('turfs').select('id, updated_at').limit(2000)
    ]);

    if (events) {
      events.forEach(e => {
        // Prioritize slug for the sitemap URL
        const path = e.slug ? `/events/${e.slug}` : `/events/detail?id=${e.id}`;
        urls.push({ 
          loc: `${BASE_URL}${path}`, 
          lastmod: e.updated_at, 
          changefreq: "always", 
          priority: "0.9" 
        });
      });
    }

    if (vendors) vendors.forEach(v => urls.push({ loc: `${BASE_URL}/services/${v.id}`, lastmod: v.updated_at, changefreq: "weekly", priority: "0.7" }));
    if (turfs) turfs.forEach(t => urls.push({ loc: `${BASE_URL}/turfs/${t.id}`, lastmod: t.updated_at, changefreq: "weekly", priority: "0.7" }));
    SERVICE_CATEGORIES.forEach(cat => urls.push({ loc: `${BASE_URL}/services?category=${encodeURIComponent(cat)}`, changefreq: "weekly", priority: "0.6" }));

  } catch (err) { console.error("Main sitemap error:", err); }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
