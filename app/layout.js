import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import SeoAnalyticsScripts from '@/components/SeoAnalyticsScripts';
import './globals.css';
import ConditionalNavbar from '@/components/ConditionalNavbar';
import CustomerAdPopup from '@/components/CustomerAdPopup';
import ConditionalLayoutWrapper from '@/components/ConditionalLayoutWrapper';
import MobileBottomNav from '@/components/MobileBottomNav';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from '@/components/AuthContext';
import MaintenanceGuard from '@/components/MaintenanceGuard';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import ToastContainer from '@/components/ui/ToastContainer';
import SocialFloatingWidget from '@/components/social/SocialFloatingWidget';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export async function generateMetadata() {
  const baseUrl = 'https://bookmyticket.net';
  
  let title = 'BookMyTicket – Event Booking, Turf & Services in India';
  let description = 'Book tickets for events, sports turf, and professional services near you. Discover trending shows and trusted providers on BookMyTicket.';
  let keywords = [
    'bookmyticket', 'event booking India', 'online ticket booking', 'book turfs online', 
    'professional artist booking', 'concert tickets', 'comedy show tickets', 
    'event management', 'venue booking', 'wedding services', 'mehendi artist booking',
    'cricket turf booking', 'football turf booking', 'live events India',
    'bookmyshow hyderabad', 'bookmyshow bangalore', 'bookmyshow mumbai', 
    'bookmyshow chennai', 'bookmyshow coimbatore', 'bookmyshow pune', 
    'bookmyshow vizag', 'movie ticket discounts', 'movie coupons',
    'ticket website with no fees', 'sell tickets online free', 'concerts near me',
    'shows near me', 'event ticketing software', 'best place to buy tickets',
    'ticket resale sites', 'buy concert tickets online', 'free event ticketing app',
    'online ticket sales platforms', 'sell event tickets online', 'ticket selling apps',
    'best ticket sites', 'upcoming concerts near me', 'local music events',
    'sports tickets', 'game tickets', 'buy resale tickets'
  ];

  try {
    if (supabase) {
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'seo_analytics')
        .maybeSingle();

      if (data?.value) {
        if (data.value.global_title) title = data.value.global_title;
        if (data.value.global_description) description = data.value.global_description;
        if (data.value.global_keywords) {
          const k = data.value.global_keywords;
          // Merge or replace based on config
          keywords = k.includes(',') ? k.split(',').map(s => s.trim()) : [k];
        }
      }
    }
  } catch (error) {
    console.error("Error fetching dynamic metadata:", error);
  }

  return {
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description,
    keywords,
    metadataBase: new URL(baseUrl),
    icons: {
      icon: [
        { url: '/favicon.jpeg?v=3', type: 'image/jpeg' },
      ],
      shortcut: ['/favicon.jpeg?v=3'],
      apple: [
        { url: '/favicon.jpeg?v=3', sizes: '180x180', type: 'image/jpeg' },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'BookMyTicket',
    },
    openGraph: {
      title: title,
      description: description,
      url: baseUrl,
      siteName: 'BookMyTicket',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'BookMyTicket - Your Event Partner',
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: ['/og-image.png'],
      creator: '@bookmyticket',
    },
  };
}

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta property="og:site_name" content="BookMyTicket" />
        <meta name="twitter:site" content="@bookmyticket" />
        <meta name="twitter:card" content="summary_large_image" />
        
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "BookMyTicket",
              "url": "https://bookmyticket.net",
              "logo": "https://bookmyticket.net/logo.png",
              "description": "BookMyTicket is the best platform for event booking, turf reservations, and professional artist services in India.",
              "keywords": "bookmyshow hyderabad, bookmyshow bangalore, bookmyshow mumbai, bookmyshow chennai, movie ticket discounts, movie coupons, event tickets India, online tickets for events, event ticketing platforms, buy tickets online, ticket selling platforms",
              "sameAs": [
                "https://facebook.com/bookmyticket",
                "https://twitter.com/bookmyticket",
                "https://instagram.com/bookmyticket"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-XXXXXXXXXX",
                "contactType": "customer service",
                "areaServed": "IN",
                "availableLanguage": ["en", "hi"]
              }
            }),
          }}
        />
        <Script
          id="website-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "BookMyTicket",
              "url": "https://bookmyticket.net",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://bookmyticket.net/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <MaintenanceGuard>

                <Suspense fallback={null}>
                  <SeoAnalyticsScripts />
                  <ConditionalNavbar />
                  <SocialFloatingWidget />
                  <CustomerAdPopup />
                </Suspense>
                <ToastContainer />
                <Suspense fallback={<div className="min-h-screen bg-white" />}>
                  <ConditionalLayoutWrapper>
                    {children}
                  </ConditionalLayoutWrapper>
                </Suspense>
              </MaintenanceGuard>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
