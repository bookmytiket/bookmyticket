import { INDIAN_STATES, INDIAN_DISTRICTS } from '../data/indianLocations';

const BASE_URL = "https://bookmyticket.net";

export async function GET() {
  const urls = [{ loc: `${BASE_URL}/india`, changefreq: "monthly", priority: "0.5" }];

  INDIAN_STATES.forEach(state => {
    // State URL
    urls.push({
      loc: `${BASE_URL}/india/${state.slug}`,
      changefreq: "monthly",
      priority: "0.4"
    });

    // District URLs
    const districts = INDIAN_DISTRICTS[state.slug] || [];
    districts.forEach(district => {
      urls.push({
        loc: `${BASE_URL}/india/${state.slug}/${district}`,
        changefreq: "monthly",
        priority: "0.3"
      });
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400"
    },
  });
}
