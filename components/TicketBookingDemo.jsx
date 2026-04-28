"use client";
import React, { useMemo } from 'react';
import { 
  CheckCircle, 
  Smartphone, 
  MapPin, 
  Calendar,
  Ticket,
  Video
} from 'lucide-react';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from './AuthContext';

const C = {
  bg: '#f8fafc',
  primary: 'linear-gradient(135deg, #f844a4 0%, #a855f7 100%)', 
  primarySolid: '#f844a4',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  white: '#ffffff',
  success: '#22c55e'
};

const DEFAULT_EVENTS = [
  { id: 1, title: 'Sunburn Arena ft. Alan Walker', date: 'Sat, 28 Sep', loc: 'DY Patil Stadium, Mumbai', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=300&fit=crop', price: '₹1,500' },
  { id: 2, title: 'Zomaland by Zomato', date: 'Sun, 15 Oct', loc: 'JLN Stadium, Delhi', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&h=300&fit=crop', price: '₹799' }
];

export default function TicketBookingDemo({ scale = 1, showFrame = true }) {
  const { selectedCity } = useAuth();
  const { data: convexEventsRaw } = useSupabaseQuery('events', (q) => q.eq('status', 'Active'), []);
  const convexEvents = convexEventsRaw || [];
  
  const events = useMemo(() => {
    if (!convexEvents || convexEvents.length === 0) return DEFAULT_EVENTS;
    
    let filtered = convexEvents;
    if (selectedCity && selectedCity !== "All Cities") {
      filtered = convexEvents.filter(ev => 
        ev.virtual || 
        (ev.city && ev.city.toLowerCase() === selectedCity.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(selectedCity.toLowerCase()))
      );
    }
    
    if (filtered.length === 0) return DEFAULT_EVENTS;

    return filtered.slice(0, 2).map(ev => ({
        id: ev.id,
        title: ev.title,
        date: ev.date,
        loc: ev.location || ev.venue || ev.city,
        img: ev.img || ev.bannerPreview || DEFAULT_EVENTS[0].img,
        price: '₹' + (ev.price || '999'),
        virtual: ev.virtual || String(ev.type || '').toLowerCase() === 'online' || String(ev.location || '').toLowerCase().includes('online')
    }));
  }, [convexEvents, selectedCity]);

  // Static view for the demo
  const step = 0; 
  const typedInfo = { name: 'bookmyticket', email: 'hello@bookmyticket.net', phone: '9876543210' };

  const content = (
    <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: showFrame ? 32 : 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo.png" alt="logo" style={{ height: 26 }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
        {step === 0 && (
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Recommended in {selectedCity || "Global"}</div>
            {events.map(ev => (
              <div key={ev.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <img src={ev.img} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{ev.date}</div>
                  </div>
                  {ev.virtual && (
                    <button style={{ 
                      background: 'linear-gradient(135deg, #f844a4 0%, #a855f7 100%)', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '9px', 
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <Video size={10} /> Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!showFrame) return content;

  return (
    <div style={{ 
      width: 340, height: 700, background: '#1e1b4b', borderRadius: 48, padding: 12, 
      position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: `8px solid #2d2d2d`,
      transform: `scale(${scale})`, transformOrigin: 'top left'
    }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 28, background: '#2d2d2d', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, zIndex: 50 }} />
      {content}
    </div>
  );
}
