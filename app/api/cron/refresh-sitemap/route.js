import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const baseUrl = 'https://bookmyticket.net';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    // Google Sitemap Ping (Note: Google deprecated the ping endpoint in late 2023, 
    // but many developers still use it or similar methods. 
    // The best way now is through the Search Console API or just updating the sitemap file)
    // We'll try to hit common ping endpoints for various search engines
    
    const pings = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ];
    
    const results = await Promise.allSettled(
      pings.map(url => fetch(url, { method: 'GET' }))
    );
    
    console.log("Sitemap ping results:", results);
    
    return NextResponse.json({ 
      success: true, 
      message: "Sitemap pings initiated",
      results: results.map(r => r.status)
    });
  } catch (error) {
    console.error("Sitemap refresh error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
