export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/organiser', '/vendor', '/api'],
    },
    sitemap: 'https://bookmyticket.net/sitemap.xml',
  }
}
