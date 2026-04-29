export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin/', 
          '/organiser/', 
          '/api/', 
          '/profile/',
          '/_next/',
          '/reset-password'
        ],
      },
    ],
    sitemap: 'https://bookmyticket.net/sitemap.xml',
  }
}
