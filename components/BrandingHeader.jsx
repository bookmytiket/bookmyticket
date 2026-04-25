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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      gap: '12px',
      ...style
    }}>
      <span style={{ 
        fontSize: '12px', 
        fontWeight: '800', 
        color: '#94a3b8', 
        textTransform: 'uppercase', 
        letterSpacing: '1px' 
      }}>
        Powered By
      </span>
      <a href={branding.powered_by_link || '#'} target="_blank" rel="noopener noreferrer">
        <img 
          src={`${branding.powered_by_logo_url}?v=${Date.now()}`} 
          alt="Branding" 
          crossOrigin="anonymous"
          style={{ height: '80px', objectFit: 'contain' }} 
        />
      </a>
    </div>
  );
}
