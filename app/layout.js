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
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookMyTicket',
    description: 'Book events, turf grounds, and professional services online with BookMyTicket.',
  },
};

import { AuthProvider } from '@/components/AuthContext';
import ConvexClientProvider from '@/components/ConvexClientProvider';
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
      </head>
      <body style={{ ['--font-heading']: '"Space Grotesk", sans-serif', ['--font-body']: '"Figtree", sans-serif' }} suppressHydrationWarning>
        <ConvexClientProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <Suspense fallback={null}>
                  <ConditionalNavbar />
                  <CustomerAdPopup />
                  <ToastContainer />
                  {children}
                </Suspense>
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
