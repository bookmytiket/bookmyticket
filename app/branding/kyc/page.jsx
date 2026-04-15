"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Building2, MapPin, FileText, CreditCard, Send, AlertCircle, Clock, CheckCircle2, Lock, LayoutDashboard, Ticket, Store, BarChart3, FileCheck, Settings, HelpCircle, QrCode, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';

const C = {
  bg: '#f4f5f7',
  sidebar: '#ffffff',
  sidebarBorder: '#e8eaed',
  accentGrad: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
  text: '#1a1a2e',
  muted: '#6b7280',
  subtext: '#9ca3af',
  card: '#ffffff',
  border: '#e5e7eb',
};

const SidebarItem = ({ icon: Icon, label, active, disabled, onClick }) => (
  <button
    onClick={!disabled ? onClick : undefined}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 10, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: active ? C.accentGrad : 'transparent',
      color: active ? '#fff' : disabled ? '#d1d5db' : C.muted,
      fontWeight: 600, fontSize: 14, transition: 'all 0.18s', marginBottom: 2, textAlign: 'left',
    }}
    onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = '#f3f4f6'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon size={17} />{label}</span>
    {disabled && <Lock size={12} style={{ color: '#d1d5db' }} />}
  </button>
);

const FieldInput = ({ label, icon: Icon, value, onChange, placeholder, disabled, type = 'text', required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        disabled={disabled} required={required}
        style={{
          width: '100%', background: disabled ? '#f8fafc' : '#fff', border: '1.5px solid #e2e8f0',
          borderRadius: 9, padding: '11px 12px 11px 36px', fontSize: 13, color: C.text,
          outline: 'none', fontFamily: 'inherit', opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text', boxSizing: 'border-box',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = '#6366f1'; }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
      />
    </div>
  </div>
);

const StepRow = ({ num, label, status }) => {
  const isActive = status === 'active';
  const isDone = status === 'done';
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
      background: isActive ? '#eef2ff' : isDone ? '#f0fdf4' : '#f8fafc',
      border: `1.5px solid ${isActive ? '#c7d2fe' : isDone ? '#bbf7d0' : '#e2e8f0'}`,
      color: isActive ? '#4338ca' : isDone ? '#15803d' : '#94a3b8', marginBottom: 10,
    }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isActive ? '#6366f1' : isDone ? '#16a34a' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isDone ? <CheckCircle2 size={16} color="#fff" /> : isActive ? <Clock size={16} color="#fff" /> : <Lock size={13} color="#9ca3af" />}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65 }}>Step {num}</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{label}</p>
      </div>
    </div>
  );
};

export default function BrandingKYC() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [kycData, setKycData] = useState(null);
  const [formData, setFormData] = useState({ orgName: '', address: '', city: '', state: '', zip: '', gstNumber: '', panNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!user) router.push('/branding/signin'); }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('brand_kyc').select('*').eq('brand_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setKycData(data);
          setFormData({ orgName: data.org_name || '', address: data.address || '', city: data.city || '', state: data.state || '', zip: data.zip || '', gstNumber: data.gst_number || '', panNumber: data.pan_number || '' });
        }
      });
  }, [user?.id]);

  const kycStatus = kycData?.status || 'Verification Pending';
  const isSubmitted = kycStatus === 'Pending Review' || kycStatus === 'Verified';
  const isVerified = kycStatus === 'Verified';
  const isPendingReview = kycStatus === 'Pending Review';
  const step1 = isSubmitted || isVerified ? 'done' : 'active';
  const step2 = isPendingReview ? 'active' : isVerified ? 'done' : 'inactive';
  const step3 = isVerified ? 'done' : 'inactive';

  const set = (k) => (e) => setFormData(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error: upsertError } = await supabase.from('brand_kyc').upsert({
        brand_id: user?.id,
        org_name: formData.orgName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        gst_number: formData.gstNumber,
        pan_number: formData.panNumber,
        status: 'Pending Review',
      }, { onConflict: 'brand_id' });
      if (upsertError) throw upsertError;
      router.push('/branding/dashboard');
    } catch (err) {
      setError('Failed to submit KYC. Please check your details and try again.');
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif", overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0 }}>
        <div style={{ padding: '4px 4px 20px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="BookMyTicket" style={{ height: 36 }} />
          </Link>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.subtext, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 4px 8px' }}>Dashboard</div>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarItem icon={LayoutDashboard} label="Dashboard"  active={false} onClick={() => router.push('/branding/dashboard')} />
          <SidebarItem icon={Ticket}          label="Coupons"    disabled={true} onClick={() => {}} />
          <SidebarItem icon={Store}           label="Stores"     disabled={true} onClick={() => {}} />
          <SidebarItem icon={BarChart3}       label="Reports"    disabled={true} onClick={() => {}} />
          <SidebarItem icon={FileCheck}       label="KYC"        active={true}   onClick={() => {}} />
          <SidebarItem icon={Settings}        label="Settings"   active={false}  onClick={() => {}} />
          <SidebarItem icon={HelpCircle}      label="Help"       active={false}  onClick={() => {}} />
          <SidebarItem icon={QrCode}          label="QR Scanner" disabled={true} onClick={() => {}} />
        </nav>
        <button onClick={() => { logout(); router.push('/branding/signin'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: C.muted, fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}>
          <LogOut size={16} />Logout
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, background: C.bg, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => router.push('/branding/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontWeight: 600, fontSize: 14, padding: 0 }}>
            <ArrowLeft size={17} /> Back to Dashboard
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {/* Page title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: C.text }}>KYC Verification</h1>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Complete your business profile to unlock all branding features.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>

            {/* Left: steps */}
            <div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <ShieldCheck size={24} color="#fff" />
              </div>
              <StepRow num={1} label="Provide Credentials" status={step1} />
              <StepRow num={2} label="Admin Approval"      status={step2} />
              <StepRow num={3} label="Start Campaigning"   status={step3} />
            </div>

            {/* Right: form */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 28, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldInput label="Official Brand / Org Name" icon={Building2} value={formData.orgName} onChange={set('orgName')} placeholder="e.g. Acme Corp" disabled={isSubmitted} required />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldInput label="Business Address" icon={MapPin} value={formData.address} onChange={set('address')} placeholder="123 Business Way, Suite 100" disabled={isSubmitted} required />
                  </div>
                  <FieldInput label="City"         icon={MapPin}    value={formData.city}      onChange={set('city')}      placeholder="Mumbai"         disabled={isSubmitted} />
                  <FieldInput label="State"        icon={MapPin}    value={formData.state}     onChange={set('state')}     placeholder="Maharashtra"    disabled={isSubmitted} />
                  <FieldInput label="PIN / ZIP"    icon={MapPin}    value={formData.zip}       onChange={set('zip')}       placeholder="400001"         disabled={isSubmitted} />
                  <FieldInput label="GST Number"   icon={FileText}  value={formData.gstNumber} onChange={set('gstNumber')} placeholder="22AAAAA0000A1Z5" disabled={isSubmitted} />
                  <FieldInput label="PAN Number"   icon={CreditCard} value={formData.panNumber} onChange={set('panNumber')} placeholder="ABCDE1234F"   disabled={isSubmitted} />
                </div>

                {error && (
                  <div style={{ padding: '11px 14px', borderRadius: 9, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                {!isSubmitted ? (
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                    {loading ? 'Submitting...' : <><Send size={18} /> Submit for Verification</>}
                  </button>
                ) : (
                  <div style={{ padding: 24, borderRadius: 12, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: isVerified ? '#f0fdf4' : '#eef2ff', border: `1.5px solid ${isVerified ? '#bbf7d0' : '#c7d2fe'}`, color: isVerified ? '#15803d' : '#4338ca' }}>
                    {isVerified ? <CheckCircle2 size={40} /> : <Clock size={40} />}
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{isVerified ? 'Brand Fully Verified ✓' : 'Review in Progress...'}</h3>
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>{isVerified ? 'Your brand is verified! You can now create campaigns.' : 'KYC submitted. Our team will verify your details within 24–48 hours.'}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
