"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Ticket, Store, BarChart3, CheckCircle2, Rocket, ChevronRight, Clock, AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StatCard } from './StatCard';
import { DistributeChannelModal } from './DistributeChannelModal';

export default function BrandingDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('coupons');
  const [showCouponModal, setShowCouponModal] = useState(false);

  const kycData = useQuery(api.branding.getKYC, { brandId: user?.id || '' });
  const kycStatus = kycData?.status || 'Verification Pending';
  const isVerified = kycStatus === 'Verified';
  const isPending = kycStatus === 'Verification Pending';

  if (!user) return null;

  const C = {
    accent: '#ff5862',
    text: '#1e1b4b',
    muted: '#6b7280',
    subtext: '#9ca3af',
    card: '#ffffff',
    border: '#e5e7eb',
  };

  return (
    <div style={{ padding: 28 }}>
      
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

      {/* Conditional Content Rendering */}
      {activeTab === 'dashboard' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: C.text }}>Dashboard</h1>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Welcome back, {user.name}!</p>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard label="Total Impressions" value="0" icon={BarChart3}    color="blue" />
            <StatCard label="Active Coupons"    value="0" icon={Ticket}       color="pink" />
            <StatCard label="Conversions"       value="0" icon={CheckCircle2} color="emerald" />
            <StatCard label="Store Partners"    value="0" icon={Store}        color="purple" />
          </div>

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
                  background: C.accent, color: '#fff', fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 16px rgba(255,88,98,0.25)',
                }}
              >
                Complete KYC Verification
              </button>
            )}
          </div>
        </>
      )}

      {activeTab === 'coupons' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: C.text }}>Coupons</h1>
              <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Manage and track your brand's digital coupons.</p>
            </div>
            <button 
              onClick={() => setShowCouponModal(true)}
              style={{ background: '#1e1b4b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: isVerified ? 'pointer' : 'not-allowed', opacity: isVerified ? 1 : 0.6 }}
            >
              Create Coupon
            </button>
          </div>
          <div style={{ background: C.card, borderRadius: 16, padding: 40, textAlign: 'center', border: `1px solid ${C.border}` }}>
            <Ticket size={48} style={{ color: C.subtext, marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>No coupons created yet</h3>
            <p style={{ color: C.muted, fontSize: 14 }}>Once you create a coupon, it will appear here for management and tracking.</p>
          </div>
        </>
      )}

      {/* Placeholder for other tabs */}
      {['stores', 'reports', 'settings', 'help', 'scanner'].includes(activeTab) && (
        <div style={{ background: C.card, borderRadius: 16, padding: 40, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>{activeTab.toUpperCase()} Section</h3>
          <p style={{ color: C.muted, fontSize: 14 }}>This section is currently under development.</p>
        </div>
      )}

      {showCouponModal && <DistributeChannelModal onClose={() => setShowCouponModal(false)} />}
    </div>
  );
}
