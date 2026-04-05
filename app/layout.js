import { Suspense } from 'react';
import Script from 'next/script';
import './globals.css';
import ConditionalNavbar from '@/components/ConditionalNavbar';
import CustomerAdPopup from '@/components/CustomerAdPopup';

export const metadata = {
  title: 'BookMyTicket — Your Gateway to Amazing Events',
  description: 'Book tickets for the best conferences, summits and professional events.',
};

import { AuthProvider } from '@/components/AuthContext';
import ConvexClientProvider from '@/components/ConvexClientProvider';

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
          <AuthProvider>
            <Suspense fallback={null}>
              <ConditionalNavbar />
              <CustomerAdPopup />
              {children}
            </Suspense>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
