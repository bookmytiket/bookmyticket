import { Space_Grotesk, Figtree } from 'next/font/google';
import './globals.css';
import ConditionalNavbar from '@/components/ConditionalNavbar';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'BookMyTicket — Your Gateway to Amazing Events',
  description: 'Book tickets for the best conferences, summits and professional events.',
};

import { AuthProvider } from '@/components/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${figtree.variable}`}>
        <AuthProvider>
          <ConditionalNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
