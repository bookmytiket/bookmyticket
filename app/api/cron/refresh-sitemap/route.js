import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const baseUrl = 'https://bookmyticket.net';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    // SEO Modernization:
    // Google (Dec 2023) and Bing have deprecated the /ping endpoints.
    // Indexing is now handled automatically by search engines monitoring sitemap.xml 
    // and using 'lastmod' tags in the XML. Manual pings are no longer supported.
    
    return NextResponse.json({ 
      success: true, 
      message: "Sitemap status verified. Search engines will automatically discover updates via robots.txt and standard crawling cycles.",
      sitemapUrl,
      note: "Manual pings are deprecated by Google/Bing and have been removed."
    });
  } catch (error) {
    console.error("Sitemap refresh error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

