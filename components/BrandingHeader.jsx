"use client";
import React from 'react';
import { useSupabaseQuery } from '@/hooks/useSupabase';

export default function BrandingHeader({ style = {} }) {
  const { data: brandingArr = [] } = useSupabaseQuery('site_branding', (q) => q, [], { realtime: false });
  const branding = (brandingArr && brandingArr[0] && brandingArr[0].powered_by_logo_url) 
    ? brandingArr[0] 
    : {
        powered_by_logo_url: "/logo.png",
        powered_by_link: "https://www.bookmyticket.net"
      };

  if (!branding.powered_by_logo_url) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      gap: '8px',
      ...style
    }}>
      <span style={{ 
        fontSize: '11px', 
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
          style={{ height: '48px', objectFit: 'contain' }} 
        />
      </a>
    </div>
  );
}
