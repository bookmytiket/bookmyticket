"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Footer from '@/components/Footer';

/* ─── Inline SVG Icons ─── */
const CheckCircleIcon = ({ color = "#22c55e" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill={color} opacity="0.15"/>
    <path d="M7 12.5l3.5 3.5L17 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="0.5"/>
  </svg>
);
const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="10" width="4" height="11" rx="1" fill="#ef4444"/>
    <rect x="10" y="6" width="4" height="15" rx="1" fill="#ef4444"/>
    <rect x="17" y="2" width="4" height="19" rx="1" fill="#ef4444"/>
  </svg>
);
const MoneyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#f59e0b" opacity="0.2"/>
    <path d="M12 6v12M9 8.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5S13.66 11 12 11s-3 1.12-3 2.5S10.34 16 12 16s3-1.12 3-2.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const TargetIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke="#6366f1" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill="#6366f1"/>
  </svg>
);
const TrendingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16,7 22,7 22,13" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#ec4899" strokeWidth="2" fill="#fce7f3"/>
  </svg>
);
const DollarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
    <path d="M12 6v12M9 9h4.5a2.25 2.25 0 0 1 0 4.5H9m0 2.25h6" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const MusicIcon = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="3" stroke="#6366f1" strokeWidth="2"/><circle cx="18" cy="16" r="3" stroke="#6366f1" strokeWidth="2"/></svg>;
const CodeIcon = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><polyline points="16,18 22,12 16,6" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8,6 2,12 8,18" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const FootballIcon = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/><path d="M12 2c0 0-4 4-4 10s4 10 4 10" stroke="#10b981" strokeWidth="1.5"/><path d="M2 12h20" stroke="#10b981" strokeWidth="1.5"/></svg>;
const PaletteIcon = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H17c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" stroke="#f59e0b" strokeWidth="2"/><circle cx="6.5" cy="11.5" r="1.5" fill="#f59e0b"/><circle cx="9.5" cy="7.5" r="1.5" fill="#ec4899"/><circle cx="14.5" cy="7.5" r="1.5" fill="#6366f1"/><circle cx="17.5" cy="11.5" r="1.5" fill="#10b981"/></svg>;

/* ─── Hero Illustration (pure SVG/HTML recreation) ─── */
const HeroIllustration = () => (
  <div style={{ position: 'relative', width: '100%', maxWidth: 540 }}>
    {/* coffee mug top right */}
    <div style={{ position: 'absolute', top: -20, right: -20, zIndex: 10 }}>
      <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#fda4af,#f472b6)', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', boxShadow: '0 4px 15px rgba(244,114,182,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>☕</div>
    </div>
    {/* Main card */}
    <div style={{ background: '#EEF0FF', borderRadius: 24, padding: '24px 20px', boxShadow: '0 20px 60px rgba(99,102,241,0.15)', position: 'relative', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>Coupons &amp; Sponsorships</span>
        <button style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create</button>
      </div>
      {/* Tab icons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {['🍔','🚀','✈️'].map((icon,i) => (
          <div key={i} style={{ width: 36, height: 36, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{icon}</div>
        ))}
      </div>
      {/* Two column layout */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Left info cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Coupon Status', val: 'Active', dot: '#22c55e' },
            { label: 'Platform', val: 'Website', dot: '#6366f1' },
            { label: 'QR Code', val: 'Enabled', dot: '#f59e0b' }
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.dot }}></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{item.val}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Right coupon card */}
        <div style={{ flex: 1.2 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', textAlign: 'center', marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 20 }}>🛍️</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#1f2937', letterSpacing: 1, marginBottom: 4 }}>COUPON</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></div>
              <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>Active</span>
            </div>
            <button style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 20px', fontSize: 12, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5 }}>VIEW</button>
          </div>
          {/* Performance */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Coupon performance</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ color: '#22c55e', fontSize: 10 }}>↑</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>83.33%</span>
                </div>
                <div style={{ fontSize: 9, color: '#9ca3af' }}>Availed</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ color: '#22c55e', fontSize: 10 }}>↑</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>33.33%</span>
                </div>
                <div style={{ fontSize: 9, color: '#9ca3af' }}>Redeemed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Plant decoration */}
    <div style={{ position: 'absolute', bottom: -10, left: -15, fontSize: 40 }}>🌿</div>
  </div>
);

/* ─── Step Illustration components ─── */
const SetupIllustration = () => (
  <div style={{ textAlign: 'center', padding: 20 }}>
    <div style={{ fontSize: 80, marginBottom: 16 }}>👩‍💻</div>
    <div style={{ background: '#f0f4ff', borderRadius: 16, padding: 16, display: 'inline-block', minWidth: 200 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 8, boxShadow: '0 2px 8px rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
        <div><div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Brand Profile</div><div style={{ fontSize: 9, color: '#9ca3af' }}>Setup complete</div></div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 8px rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
        <div><div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>KYC Verified</div><div style={{ fontSize: 9, color: '#9ca3af' }}>You&apos;re live!</div></div>
      </div>
    </div>
  </div>
);
const CreateIllustration = () => (
  <div style={{ textAlign: 'center', padding: 20 }}>
    <div style={{ fontSize: 80, marginBottom: 16 }}>👩‍🎨</div>
    <div style={{ background: '#fff0f6', borderRadius: 16, padding: 16, display: 'inline-block' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 14, boxShadow: '0 2px 8px rgba(236,72,153,0.1)', textAlign: 'center', minWidth: 180 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>%</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1f2937' }}>20% OFF</div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>Distribute via Web • Email • WhatsApp</div>
      </div>
    </div>
  </div>
);
const TrackIllustration = () => (
  <div style={{ textAlign: 'center', padding: 20 }}>
    <div style={{ fontSize: 80, marginBottom: 16 }}>📊</div>
    <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 16, display: 'inline-block', minWidth: 200 }}>
      {[{ label: 'Reach', val: '12,450', color: '#22c55e' }, { label: 'Redeemed', val: '4,890', color: '#6366f1' }, { label: 'ROI', val: '340%', color: '#f59e0b' }].map((s, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '8px 14px', marginBottom: i < 2 ? 8 : 0, display: 'flex', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</span>
        </div>
      ))}
    </div>
  </div>
);
const RepeatIllustration = () => (
  <div style={{ textAlign: 'center', padding: 20 }}>
    <div style={{ fontSize: 80, marginBottom: 16 }}>🔄</div>
    <div style={{ background: '#fffbeb', borderRadius: 16, padding: 16, display: 'inline-block', minWidth: 200 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 14, boxShadow: '0 2px 8px rgba(245,158,11,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🎯</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Adjust &amp; Retain</div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>Smart retargeting for long-term loyalty</div>
      </div>
    </div>
  </div>
);

const STEPS = [
  { id: 'setup', label: 'Setup', title: 'Brand Onboarding', desc: 'Launch your brand presence in minutes. Create your brand profile to showcase your identity and verify KYC to go live instantly.', illustration: <SetupIllustration /> },
  { id: 'create', label: 'Create', title: 'Design Digital Coupons', desc: 'Craft perfect offers for your audience. Design digital coupons and distribute across Website, Email, and WhatsApp for maximum visibility.', illustration: <CreateIllustration /> },
  { id: 'track', label: 'Track', title: 'Reach Customers', desc: 'Measure every interaction in real-time. Monitor and optimize coupon and event performance on your live dashboard.', illustration: <TrackIllustration /> },
  { id: 'repeat', label: 'Repeat', title: 'Coupon Refinement & Retention', desc: 'Scale your reach with smart automation. Target the right customers with tailored coupons and keep them coming back for more.', illustration: <RepeatIllustration /> }
];

const BENEFITS = [
  { icon: <TargetIcon />, title: 'Targeted Reach', desc: 'Focus on specific demographics that matter most to your brand to maximize campaign effectiveness.', bg: '#eef2ff' },
  { icon: <TrendingIcon />, title: 'Performance Tracking', desc: 'Real-time data and analytics to measure every click, view, and redemption instantly.', bg: '#f5f3ff' },
  { icon: <HeartIcon />, title: 'Brand Affinity', desc: 'Connect with audiences through shared experiences at exciting live events they love.', bg: '#fdf2f8' },
  { icon: <DollarIcon />, title: 'Cost-Effective', desc: 'Maximize ROI with strategic placements that fit any budget, from startup to enterprise.', bg: '#fffbeb' },
];

const EVENTS = [
  { icon: <MusicIcon />, label: 'Music', count: '240+ Events' },
  { icon: <CodeIcon />, label: 'Tech', count: '180+ Events' },
  { icon: <FootballIcon />, label: 'Sports', count: '320+ Events' },
  { icon: <PaletteIcon />, label: 'Arts', count: '150+ Events' },
];

const TRUST_BRANDS = ['AV', 'Carat', '9SKIN', 'WOX', '95KIN', 'Ozone', 'Zara', 'Nike'];

/* ─── MAIN PAGE ─── */
export default function BrandingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [scrollY, setScrollY] = useState(0);


  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navbarBg = scrollY > 20 ? 'rgba(255,255,255,0.95)' : '#fff';

  return (
    <div style={{ fontFamily: "'Inter', 'Figtree', sans-serif", background: '#fff', color: '#111827', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .brand-nav-link { font-size: 12px; font-weight: 700; color: #374151; text-decoration: none; transition: all 0.2s; padding: 7px 16px; border-radius: 9999px; border: 1.5px solid transparent; letter-spacing: 0.06em; text-transform: uppercase; }
        .brand-nav-link:hover { border-color: #fbbf24; color: #111827; }
        .brand-nav-link.active { border-color: #fbbf24; color: #111827; }
        .step-tab { padding: 10px 20px; border-radius: 9999px; font-size: 14px; font-weight: 600; border: 1.5px solid #e5e7eb; cursor: pointer; transition: all 0.25s; background: #fff; color: #6b7280; }
        .step-tab:hover { border-color: #6366f1; color: #4f46e5; }
        .step-tab.active { background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; border-color: transparent; box-shadow: 0 4px 15px rgba(79,70,229,0.35); }
        .benefit-card { background: #fff; border-radius: 20px; padding: 28px; border: 1.5px solid #f3f4f6; transition: all 0.3s; }
        .benefit-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: #e0e7ff; }
        .event-card { background: #fff; border-radius: 20px; padding: 32px 24px; border: 1.5px solid #f3f4f6; text-align: center; cursor: pointer; transition: all 0.3s; }
        .event-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); border-color: #e0e7ff; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-inner { display: flex; gap: 40px; animation: marquee 30s linear infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease-out forwards; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: navbarBg, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="BookMyTicket" style={{ height: 72, width: 'auto', display: 'block' }} />
          </Link>
          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { label: 'HOME', href: '#home' },
              { label: 'HOW IT WORKS', href: '#how-it-works' },
              { label: 'BENEFITS', href: '#benefits' },
              { label: 'EVENTS', href: '#events' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#1f2937', textDecoration: 'none',
                  padding: '7px 16px', borderRadius: 9999, border: '1.5px solid #d1d5db',
                  letterSpacing: '0.07em', textTransform: 'uppercase', transition: 'all 0.2s',
                  background: '#fff',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#111'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#1f2937'; }}
              >
                {item.label}
              </a>
            ))}
          </div>
          {/* Auth button */}
          <Link href="/branding/signin" style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 9999, padding: '9px 22px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(79,70,229,0.3)', transition: 'opacity 0.2s', letterSpacing: '0.08em', textTransform: 'uppercase' }}>GET STARTED</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ paddingTop: 100, paddingBottom: 80, maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>
          {/* Left content */}
          <div style={{ flex: '1 1 400px', maxWidth: 560 }}>
            <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: -1 }}>
              <span style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Promote Your Brand with
              </span>
              <br />
              <span style={{ color: '#111827' }}>Every Ticket Sold.</span>
            </h1>
            <p style={{ fontSize: 17, color: '#6b7280', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Boost your brand visibility through targeted coupon distribution and event sponsorship, reach engaged audiences right where they are.
            </p>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
              <Link href="/branding/signin" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 20px rgba(79,70,229,0.35)', transition: 'all 0.2s', display: 'inline-block' }}>
                Get Started
              </Link>
              <Link href="#how-it-works" style={{ background: '#fff', color: '#374151', padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1.5px solid #e5e7eb', transition: 'all 0.2s', display: 'inline-block' }}>
                Learn More
              </Link>
            </div>
            {/* Trust pills */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
              {[
                { icon: <ZapIcon />, label: 'Easy Setup' },
                { icon: <ChartIcon />, label: 'ROI effectively' },
                { icon: <MoneyIcon />, label: 'Fit any budget' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.icon}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.label}</span>
                </div>
              ))}
            </div>
            {/* Partner logos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex' }}>
                {['#4f46e5','#ec4899','#ef4444','#f59e0b','#10b981'].map((color, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: color, border: '2px solid #fff', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                    {TRUST_BRANDS[i][0]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Trusted by 100+ brands</span>
            </div>
          </div>
          {/* Right illustration */}
          <div style={{ flex: '1 1 360px', display: 'flex', justifyContent: 'center' }}>
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: '#f9fafb', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', padding: '20px 0', overflow: 'hidden' }}>
        <div style={{ marginBottom: 8, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Trusted by Innovative Brands Worldwide</div>
        <div style={{ overflow: 'hidden' }}>
          <div className="marquee-inner">
            {[...TRUST_BRANDS, ...TRUST_BRANDS].map((name, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', opacity: 0.6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#4b5563' }}>{name[0]}</div>
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#111827', letterSpacing: -0.5, marginBottom: 12 }}>
            How It <span style={{ background: 'linear-gradient(135deg,#4f46e5,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Works</span>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 520, margin: '0 auto' }}>
            Our streamlined process helps you go from zero to thousands of impressions in record time.
          </p>
        </div>
        {/* Step tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <button key={s.id} className={`step-tab${activeStep === i ? ' active' : ''}`} onClick={() => setActiveStep(i)}>
              <span style={{ marginRight: 6, fontSize: 12, fontWeight: 700, opacity: 0.7 }}>{i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>
        {/* Active step content */}
        <div style={{ background: '#f9fafb', borderRadius: 24, padding: '40px 48px', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', border: '1.5px solid #f3f4f6' }}>
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '4px 12px', borderRadius: 999, marginBottom: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              STEP {activeStep + 1}
            </div>
            <h3 style={{ fontSize: 30, fontWeight: 900, color: '#111827', marginBottom: 16, lineHeight: 1.2 }}>{STEPS[activeStep].title}</h3>
            <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7 }}>{STEPS[activeStep].desc}</p>
          </div>
          <div style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center' }}>
            {STEPS[activeStep].illustration}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section id="benefits" style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: '#111827', letterSpacing: -0.5, marginBottom: 12 }}>
              Why Choose <span style={{ background: 'linear-gradient(135deg,#4f46e5,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BookMyTicket Branding</span>
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>Everything you need to make your brand unforgettable at every live event.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} className="benefit-card">
                <div style={{ width: 56, height: 56, borderRadius: 16, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {b.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10 }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS ── */}
      <section id="events" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#111827', letterSpacing: -0.5, marginBottom: 12 }}>
            Reach Your Audience at <span style={{ background: 'linear-gradient(135deg,#4f46e5,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Every Major Event</span>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>Your brand, front and center, across all event categories.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {EVENTS.map((ev, i) => (
            <div key={i} className="event-card">
              <div style={{ margin: '0 auto 12px', width: 64, height: 64, background: '#f9fafb', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ev.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{ev.label}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{ev.count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AS SEEN ON ── */}
      <div style={{ background: '#f9fafb', borderTop: '1px solid #f3f4f6', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>As Seen On</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
          {['Forbes', 'Medium', 'MarketWatch', 'AdAge'].map((name, i) => (
            <span key={i} style={{ fontSize: 18, fontWeight: 900, color: '#d1d5db', letterSpacing: -0.5 }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#ec4899 100%)', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -0.5 }}>Ready to Transform Your Brand?</h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>Join 100+ brands already growing with BookMyTicket Branding</p>
        <Link href="/branding/signin" style={{ display: 'inline-block', background: '#fff', color: '#4f46e5', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}>
          Get Started Free →
        </Link>
      </section>

      {/* ── FOOTER (shared with homepage) ── */}
      <Footer />
    </div>
  );
}
