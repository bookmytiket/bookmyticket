"use client";
import React, { useState, useEffect } from 'react';

export default function BrandingHeader({ style = {} }) {
  const [branding, setBranding] = useState({
    powered_by_logo_url: "/logo.png",
    powered_by_link: "https://www.bookmyticket.net"
  });

  useEffect(() => {
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => {
        if (data.powered_by_logo_url) setBranding(data);
      })
      .catch(console.error);
  }, []);

  if (!branding.powered_by_logo_url) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      gap: '12px',
      ...style
    }}>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: '800', 
        color: '#94a3b8', 
        textTransform: 'uppercase', 
        letterSpacing: '2px' 
      }}>
        Sponsors & Partners
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          branding.sponsor_logo_1,
          branding.sponsor_logo_2,
          branding.partner_logo_1,
          branding.partner_logo_2
        ].filter(Boolean).map((logo, idx) => (
          <img 
            key={idx}
            src={`${logo}?v=${Date.now()}`} 
            alt="Sponsor" 
            crossOrigin="anonymous"
            style={{ height: '40px', objectFit: 'contain', opacity: 0.8 }} 
          />
        ))}
      </div>
    </div>
  );
}
