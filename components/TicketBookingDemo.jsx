"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  CreditCard, 
  Smartphone, 
  MapPin, 
  Calendar,
  User,
  Mail,
  Phone,
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
    if (!convexEvents) return DEFAULT_EVENTS;
    
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

  const [step, setStep] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 100, y: 100 });
  const [isClicking, setIsClicking] = useState(false);
  const [typedInfo, setTypedInfo] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    let timer;
    if (step === 0) {
      timer = setTimeout(() => {
        setCursorPos({ x: 200, y: 350 });
        setTimeout(() => {
          setIsClicking(true);
          setTimeout(() => {
            setIsClicking(false);
            setStep(1);
          }, 300);
        }, 1000);
      }, 1500);
    } else if (step === 1) {
      timer = setTimeout(() => {
        setCursorPos({ x: 170, y: 580 });
        setTimeout(() => {
          setIsClicking(true);
          setTimeout(() => {
            setIsClicking(false);
            setStep(2);
          }, 300);
        }, 1000);
      }, 1000);
    } else if (step === 2) {
      timer = setTimeout(() => {
        const name = "bookmyticket";
        const email = "bookmyticket@example.com";
        const phone = "9876543210";
        let i = 0;
        const typeTimer = setInterval(() => {
          if (i < name.length) setTypedInfo(prev => ({ ...prev, name: name.slice(0, i + 1) }));
          else if (i < name.length + email.length) setTypedInfo(prev => ({ ...prev, email: email.slice(0, i - name.length + 1) }));
          else if (i < name.length + email.length + phone.length) setTypedInfo(prev => ({ ...prev, phone: phone.slice(0, i - name.length - email.length + 1) }));
          else {
            clearInterval(typeTimer);
            setCursorPos({ x: 170, y: 550 });
            setTimeout(() => {
              setIsClicking(true);
              setTimeout(() => {
                setIsClicking(false);
                setStep(3);
              }, 300);
            }, 800);
          }
          i++;
        }, 60);
      }, 1000);
    } else if (step === 3) {
      timer = setTimeout(() => {
        setCursorPos({ x: 170, y: 320 });
        setTimeout(() => {
          setIsClicking(true);
          setTimeout(() => {
            setIsClicking(false);
            setStep(4);
          }, 300);
        }, 1000);
      }, 1000);
    } else if (step === 4) {
      timer = setTimeout(() => {
        setStep(0);
        setTypedInfo({ name: '', email: '', phone: '' });
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [step]);

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
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <img src={events[0].img} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>{events[0].title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}><Calendar size={12} /> {events[0].date}</div>
              <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{events[0].loc}</span></div>
            </div>
            <div style={{ marginTop: 'auto', padding: 16, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ fontSize: 16, fontWeight: 900, color: C.primarySolid }}>{events[0].price}</div>
               <button style={{ background: C.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 12 }}>Book Now</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20 }}>Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input readOnly value={typedInfo.name} placeholder="Name" style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
              <input readOnly value={typedInfo.email} placeholder="Email" style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
              <input readOnly value={typedInfo.phone} placeholder="Phone" style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
            </div>
            <button style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontWeight: 800, marginTop: 24, fontSize: 12 }}>Continue</button>
          </div>
        )}
        {step === 3 && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20 }}>Payment</div>
            <div style={{ padding: 12, borderRadius: 12, border: `1.5px solid ${C.primarySolid}`, background: '#fff5f7', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Smartphone color={C.primarySolid} size={18} />
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primarySolid }}>UPI (GPay / PhonePe)</div>
            </div>
            <button style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontWeight: 800, marginTop: 40, fontSize: 12 }}>Pay {events[0].price}</button>
          </div>
        )}
        {step === 4 && (
          <div style={{ padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CheckCircle size={40} color={C.success} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Confirmed!</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>BMT-6429-XT</div>
            <div style={{ width: '100%', aspectRatio: '1', background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, position: 'relative' }}>
              <Ticket size={60} color={C.primarySolid} strokeWidth={1} />
              
              {events[0].virtual && (
                <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                  <button style={{ width: '100%', background: '#22c55e', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
                    <Video size={14} /> Join Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ 
        position: 'absolute', top: cursorPos.y, left: cursorPos.x, 
        width: 24, height: 24, background: 'rgba(248, 68, 100, 0.4)', borderRadius: 12, 
        border: '2px solid #f84464', pointerEvents: 'none', zIndex: 100,
        transform: `scale(${isClicking ? 0.8 : 1})`,
        transition: 'top 0.8s ease-in-out, left 0.8s ease-in-out, transform 0.2s'
      }} />
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
