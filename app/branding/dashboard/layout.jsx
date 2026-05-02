"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Ticket, Store, BarChart3, FileCheck,
  Settings, HelpCircle, QrCode, LogOut, Lock, Ghost, Image as ImageIcon
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';

/* ── Light theme tokens ── */
const C = {
  bg: '#f4f5f7',
  sidebar: '#f9fafb',
  sidebarBorder: '#e5e7eb',
  accent: '#ff5862',
  accentActive: '#82111b',
  accentGrad: '#ff5862',
  text: '#1e1b4b',
  muted: '#6b7280',
  subtext: '#9ca3af',
  card: '#ffffff',
  border: '#e5e7eb',
  activeText: '#ffffff',
};

const SidebarItem = ({ icon: Icon, label, active, disabled, onClick }) => (
  <button
    onClick={!disabled ? onClick : undefined}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 12, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: active ? C.accentActive : 'transparent',
      color: active ? C.activeText : disabled ? '#d1d5db' : C.muted,
      fontWeight: 600, fontSize: 13, transition: 'all 0.18s',
      marginBottom: 4, textAlign: 'left',
    }}
    onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = '#f3f4f6'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon size={17} />
      {label}
    </span>
    {disabled && <Lock size={12} style={{ color: '#d1d5db' }} />}
  </button>
);

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const tab = searchParams?.get('tab') || 'dashboard';

  const [kycStatus, setKycStatus] = useState('Verification Pending');
  const isVerified = kycStatus === 'Verified';

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('brand_kyc')
      .select('status')
      .eq('brand_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data?.status) setKycStatus(data.status); });
  }, [user?.id]);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push('/branding/signin');
      } else if (!['branding_partner', 'organiser', 'vendor', 'admin', 'super_admin'].includes(user.role)) {
        router.push('/profile');
      }
    }
  }, [user, loading, router, mounted]);

  if (!user) return null;

  const handleLogout = () => { logout(); router.push('/branding/signin'); };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 14 }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 260, background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, padding: '24px 16px' }}>
        
        {/* Logo */}
        <div style={{ padding: '8px 0 32px', textAlign: 'center' }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <img src="/logo.png" alt="BookMyTicket" style={{ height: 60, width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        {/* Dashboard label */}
        <div style={{ padding: '0 4px 8px', fontSize: 11, fontWeight: 700, color: C.subtext, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Dashboard
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarItem icon={LayoutDashboard} label="Branding Home" active={tab === 'dashboard' && pathname === '/branding/dashboard'} onClick={() => router.push('/branding/dashboard?tab=dashboard')} />
          {['organiser', 'admin', 'super_admin'].includes(user.role) && (
            <SidebarItem icon={Ghost} label="Organiser Portal" active={false} onClick={() => router.push('/organiser')} />
          )}
          <SidebarItem icon={Ticket}          label="My Tickets"     active={tab === 'my_booking'} onClick={() => router.push('/branding/dashboard?tab=my_booking')} />
          <SidebarItem icon={ImageIcon}       label="Banners"     active={tab === 'banners'}       disabled={!isVerified} onClick={() => router.push('/branding/dashboard?tab=banners')} />
          <SidebarItem icon={Ticket}          label="Coupons"     active={tab === 'coupons' || pathname.includes('coupon-creation')}   disabled={!isVerified} onClick={() => router.push('/branding/dashboard?tab=coupons')} />
          <SidebarItem icon={Store}           label="Stores"      active={tab === 'stores'}        disabled={!isVerified} onClick={() => router.push('/branding/dashboard?tab=stores')} />
          <SidebarItem icon={BarChart3}       label="Reports"     active={tab === 'reports'}       disabled={!isVerified} onClick={() => router.push('/branding/dashboard?tab=reports')} />
          <SidebarItem icon={FileCheck}       label="KYC"         active={pathname.includes('/kyc')}       onClick={() => router.push('/branding/kyc')} />
          <SidebarItem icon={Settings}        label="Settings"    active={tab === 'settings'}      onClick={() => router.push('/branding/dashboard?tab=settings')} />
          <SidebarItem icon={HelpCircle}      label="Help"        active={tab === 'help'}          onClick={() => router.push('/branding/dashboard?tab=help')} />
          <SidebarItem icon={QrCode}          label="QR Scanner"  active={tab === 'scanner'}       disabled={!isVerified} onClick={() => router.push('/branding/dashboard?tab=scanner')} />
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 10, border: 'none', background: 'transparent',
            color: C.muted, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            width: '100%', transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          height: 80, background: '#ffffff', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <img src="/logo.png" alt="BookMyTicket" style={{ height: 48, width: "auto", objectFit: "contain" }} />
          </Link>

          <div style={{ position: 'absolute', right: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              style={{ 
                background: '#fff', color: '#1e1b4b', border: '1px solid #e5e7eb', 
                padding: '8px 24px', borderRadius: 24, fontWeight: 700, 
                fontSize: 13, cursor: 'pointer' 
              }}
            >
              Signup
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
