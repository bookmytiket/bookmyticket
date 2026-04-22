import { Suspense } from 'react';
import Script from 'next/script';
import './globals.css';
import ConditionalNavbar from '@/components/ConditionalNavbar';
import CustomerAdPopup from '@/components/CustomerAdPopup';
import ConditionalLayoutWrapper from '@/components/ConditionalLayoutWrapper';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata = {
  title: {
    template: '%s | BookMyTicket - Online Event & Service Booking',
    default: 'BookMyTicket - Best Event Ticketing, Turf & Service Booking Platform',
  },
  description: 'Book the latest events, sports turfs, and professional artists online with BookMyTicket. Secure, fast, and easy booking for concerts, comedy shows, and more across India.',
  keywords: [
    'bookmyticket', 'event booking India', 'online ticket booking', 'book turfs online', 
    'professional artist booking', 'concert tickets', 'comedy show tickets', 
    'event management', 'venue booking', 'wedding services'
  ],
  metadataBase: new URL('https://bookmyticket.net'),
  alternates: {
    canonical: '/',
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
    title: 'BookMyTicket - Online Event & Service Booking',
    description: 'Book events, turf grounds, and professional services online with BookMyTicket. Easy, fast, and secure.',
    url: 'https://bookmyticket.net',
    siteName: 'BookMyTicket',
    images: [
      {
        url: '/og-image.png', // Should be a high-quality brand image
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
    title: 'BookMyTicket',
    description: 'Book events, turf grounds, and professional services online with BookMyTicket.',
    images: ['/og-image.png'],
    creator: '@bookmyticket',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AuthProvider } from '@/components/AuthContext';
import MaintenanceGuard from '@/components/MaintenanceGuard';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import ToastContainer from '@/components/ui/ToastContainer';
import ChangePasswordModal from '@/components/ChangePasswordModal';

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
                  <ConditionalNavbar />
                  <CustomerAdPopup />
                  <ToastContainer />
                  <ChangePasswordModal />
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
