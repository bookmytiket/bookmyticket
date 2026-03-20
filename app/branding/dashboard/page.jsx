"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Ticket, Store, BarChart3, FileCheck,
  Settings, HelpCircle, QrCode, LogOut, Bell,
  User, AlertCircle, Clock, CheckCircle2, Lock, ChevronRight, Rocket, Search
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/* ── Light theme tokens ── */
const C = {
  bg: '#f4f5f7',
  sidebar: '#ffffff',
  sidebarBorder: '#e8eaed',
  accent: '#f84464',
  accentGrad: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
  text: '#1a1a2e',
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
      padding: '10px 14px', borderRadius: 10, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: active ? C.accentGrad : 'transparent',
      color: active ? C.activeText : disabled ? '#d1d5db' : C.muted,
      fontWeight: 600, fontSize: 14, transition: 'all 0.18s',
      marginBottom: 2, textAlign: 'left',
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

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = { blue: '#3b82f6', pink: '#f84464', emerald: '#10b981', purple: '#a855f7' };
  const c = colors[color] || '#3b82f6';
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.border}`, flex: '1 1 160px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.subtext, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ padding: 8, borderRadius: 10, background: `${c}15`, color: c }}>
          <Icon size={18} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: C.text }}>{value}</div>
    </div>
  );
};

export default function BrandingDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const kycData = useQuery(api.branding.getKYC, { brandId: user?.id || '' });
  const kycStatus = kycData?.status || 'Verification Pending';
  const isVerified = kycStatus === 'Verified';
  const isPending = kycStatus === 'Verification Pending';

  useEffect(() => {
    if (!user || user.role !== 'branding_partner') {
      router.push('/branding/signin');
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => { logout(); router.push('/branding/signin'); };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 14 }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, padding: '20px 12px' }}>
        
        {/* Logo */}
        <div style={{ padding: '4px 4px 20px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="BookMyTicket" style={{ height: 36, width: 'auto' }} />
          </Link>
        </div>

        {/* Dashboard label */}
        <div style={{ padding: '0 4px 8px', fontSize: 11, fontWeight: 700, color: C.subtext, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Dashboard
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarItem icon={LayoutDashboard} label="Dashboard"   active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Ticket}          label="Coupons"     active={activeTab === 'coupons'}   disabled={!isVerified} onClick={() => setActiveTab('coupons')} />
          <SidebarItem icon={Store}           label="Stores"      active={activeTab === 'stores'}    disabled={!isVerified} onClick={() => setActiveTab('stores')} />
          <SidebarItem icon={BarChart3}       label="Reports"     active={activeTab === 'reports'}   disabled={!isVerified} onClick={() => setActiveTab('reports')} />
          <SidebarItem icon={FileCheck}       label="KYC"         active={activeTab === 'kyc'}       onClick={() => router.push('/branding/kyc')} />
          <SidebarItem icon={Settings}        label="Settings"    active={activeTab === 'settings'}  onClick={() => setActiveTab('settings')} />
          <SidebarItem icon={HelpCircle}      label="Help"        active={activeTab === 'help'}      onClick={() => setActiveTab('help')} />
          <SidebarItem icon={QrCode}          label="QR Scanner"  active={activeTab === 'scanner'}   disabled={!isVerified} onClick={() => setActiveTab('scanner')} />
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
          height: 64, background: C.sidebar, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.subtext }} />
            <input
              type="text" placeholder="Search..."
              style={{
                width: '100%', background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '7px 12px 7px 36px', fontSize: 13,
                color: C.text, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, position: 'relative', padding: 6 }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, background: C.accent, borderRadius: '50%' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>{kycStatus}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} style={{ color: C.muted }} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>

          {/* KYC Alert */}
          {!isVerified && (
            <div
              onClick={() => router.push('/branding/kyc')}
              style={{
                marginBottom: 24, padding: '16px 24px', borderRadius: 16, cursor: 'pointer',
                background: isPending ? '#fffbeb' : '#eef2ff',
                border: `1px solid ${isPending ? '#fde68a' : '#c7d2fe'}`,
                color: isPending ? '#92400e' : '#3730a3',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isPending ? '#fef3c7' : '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPending ? <Clock size={22} color="#d97706" /> : <AlertCircle size={22} color="#4f46e5" />}
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 2px' }}>
                    {isPending ? 'Complete Your KYC' : 'Verification Under Review'}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>
                    {isPending
                      ? 'Submit KYC documents to unlock Coupon creation, Stores and Reports.'
                      : 'Our team is reviewing your documents. Usually takes 24–48 hours.'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', color: isPending ? '#d97706' : '#4f46e5' }}>
                {isPending ? 'Begin KYC' : 'View Details'} <ChevronRight size={15} />
              </div>
            </div>
          )}

          {/* Page title */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: C.text }}>Dashboard</h1>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Welcome back, {user.name}!</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard label="Total Impressions" value="0" icon={BarChart3}    color="blue" />
            <StatCard label="Active Coupons"    value="0" icon={Ticket}       color="pink" />
            <StatCard label="Conversions"       value="0" icon={CheckCircle2} color="emerald" />
            <StatCard label="Store Partners"    value="0" icon={Store}        color="purple" />
          </div>

          {/* Welcome / empty state */}
          <div style={{ background: C.card, borderRadius: 20, padding: 48, textAlign: 'center', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `1px solid ${C.border}` }}>
              <Rocket size={36} style={{ color: C.subtext }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>
              Welcome to your Brand Command Center
            </h3>
            <p style={{ color: C.muted, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6, fontSize: 13 }}>
              Once your account is verified, you'll be able to create powerful digital campaigns that reach thousands of ticket buyers.
            </p>
            {!isVerified && (
              <button
                onClick={() => router.push('/branding/kyc')}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: C.accentGrad, color: '#fff', fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 16px rgba(248,68,100,0.25)',
                }}
              >
                Complete KYC Verification
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
