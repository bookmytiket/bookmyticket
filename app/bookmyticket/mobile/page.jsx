"use client";
import React from 'react';
import TicketBookingDemo from '@/components/TicketBookingDemo';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const SUBNAV_LINKS = [
  { href: "/#explore-popular-events", label: "Events" },
];

function MobileSubnav() {
  const pathname = usePathname();

  return (
    <nav style={{
      background: 'transparent',
      borderBottom: 'none',
      display: 'flex',
      alignItems: 'center',
      height: '44px',
      position: 'relative',
      zIndex: 90,
      marginTop: '4px',
      padding: '0 16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
      }}>
        {SUBNAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (pathname === '/' && link.label === 'Events');
          return (
            <motion.div
              key={link.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '44px' }}
            >
              <Link
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#000',
                  textDecoration: 'none',
                  padding: '0 4px',
                  transition: 'all 0.2s ease',
                }}
              >
                {link.label === 'Events' && <Calendar size={14} style={{ marginRight: '6px' }} />}
                {link.label}
              </Link>
              {isActive && (
                <motion.div
                  layoutId="mobile-subnav-underline"
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: 0,
                    right: 0,
                    height: '3.2px',
                    background: '#fde047',
                    borderRadius: '4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}

export default function MobileDemoPage() {
  return (
    <>
      {/* Force sub-navbar visible on all screen sizes for this page */}
      <style>{`
        @media (max-width: 768px) {
          .site-header .header-subnav {
            display: flex !important;
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60 }}>
          {/* Phone UI Component */}
          <TicketBookingDemo scale={1} />

          {/* Side Content */}
          <div style={{ maxWidth: 350 }}>
            <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
              Experience the <span style={{ color: '#f84464' }}>Seamless</span> Booking Flow.
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, marginBottom: 32 }}>
              Our automated simulation demonstrates how quickly users can discover and book amazing events on bookmyticket.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { step: 1, title: 'Discovery', desc: 'Find trending events around you.' },
                { step: 2, title: 'Selection', desc: 'Detailed info and seat options.' },
                { step: 3, title: 'Checkout', desc: 'Secure and ultra-fast payments.' }
              ].map(f => (
                <div key={f.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: '#f84464', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    {f.step}
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>{f.title}</h4>
                    <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
