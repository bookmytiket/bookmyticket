import { Suspense } from 'react';
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
import ChangePasswordModal from '@/components/ChangePasswordModal';

export async function generateMetadata() {
  const baseUrl = 'https://bookmyticket.net';
  
  let title = 'BookMyTicket - Best Online Event Ticketing, Turf & Service Booking Platform';
  let description = 'Book the latest events, sports turfs, and professional services online with BookMyTicket. Secure, fast, and easy booking for concerts, comedy shows, and specialized services across India.';
  let keywords = [
    'bookmyticket', 'event booking India', 'online ticket booking', 'book turfs online', 
    'professional artist booking', 'concert tickets', 'comedy show tickets', 
    'event management', 'venue booking', 'wedding services', 'mehendi artist booking',
    'cricket turf booking', 'football turf booking', 'live events India'
  ];

  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'seo_analytics')
      .single();

    if (data?.value) {
      if (data.value.global_title) title = data.value.global_title;
      if (data.value.global_description) description = data.value.global_description;
      if (data.value.global_keywords) {
        const k = data.value.global_keywords;
        keywords = k.includes(',') ? k.split(',').map(s => s.trim()) : [k];
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
              "description": "BookMyTicket is India's leading platform for event ticketing, turf bookings, and professional artist services.",
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
      </head>
      <body style={{ ['--font-heading']: '"Space Grotesk", sans-serif', ['--font-body']: '"Figtree", sans-serif' }} suppressHydrationWarning>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <MaintenanceGuard>
                <Suspense fallback={null}>
                  <SeoAnalyticsScripts />
                  <ConditionalNavbar />
                  <CustomerAdPopup />
                  <ToastContainer />
                  <ChangePasswordModal />
                  <ConditionalLayoutWrapper>
                    {children}
                  </ConditionalLayoutWrapper>
                  <MobileBottomNav />
                </Suspense>
              </MaintenanceGuard>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
