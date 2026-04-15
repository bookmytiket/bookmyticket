import { Suspense } from 'react';
import Script from 'next/script';
import './globals.css';
import ConditionalNavbar from '@/components/ConditionalNavbar';
import CustomerAdPopup from '@/components/CustomerAdPopup';

export const metadata = {
  title: 'BookMyTicket - Event Booking, Turf & Services Platform',
  description: 'Book events, turf grounds, and professional services online with BookMyTicket. Easy, fast, and secure booking platform in India.',
  keywords: 'event booking, ticket booking, turf booking, bookmyticket',
  metadataBase: new URL('https://bookmyticket.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'BookMyTicket',
    description: 'Book events, turf grounds, and professional services online with BookMyTicket.',
    url: 'https://bookmyticket.net',
    siteName: 'BookMyTicket',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'BookMyTicket Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookMyTicket',
    description: 'Book events, turf grounds, and professional services online with BookMyTicket.',
    images: ['/logo.png'],
  },
};

import { AuthProvider } from '@/components/AuthContext';
import MaintenanceGuard from '@/components/MaintenanceGuard';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import ToastContainer from '@/components/ui/ToastContainer';

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
                  {children}
                </Suspense>
              </MaintenanceGuard>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
