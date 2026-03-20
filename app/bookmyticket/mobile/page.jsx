"use client";
import React from 'react';
import TicketBookingDemo from '@/components/TicketBookingDemo';

export default function MobileDemoPage() {
  return (
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
  );
}
