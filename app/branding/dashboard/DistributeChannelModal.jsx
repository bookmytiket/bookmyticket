import React from 'react';
import { X, Monitor, Gift, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const C = {
  accent: '#ff5862',
  text: '#1e1b4b',
  muted: '#6b7280',
};

export const DistributeChannelModal = ({ onClose }) => {
  const router = useRouter();

  const handleShowOnWebsite = () => {
    onClose();
    router.push('/branding/dashboard/coupon-creation?type=website');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <div 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: 940, borderRadius: 24, padding: '40px 48px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: '1px solid #1e1b4b', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} />
        </button>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24 }}>Distribute Channel</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Option 1: Show on Website */}
          <div 
            onClick={handleShowOnWebsite}
            style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, display: 'flex', gap: 16, cursor: 'pointer', transition: 'all 0.2s' }} 
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Monitor size={22} style={{ color: C.text }} />
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: C.text }}>Show on Website</h4>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                Create coupon codes and discounts for your recipients and distribute coupons them via ticket9 website.
              </p>
            </div>
          </div>

          {/* Option 2: Bulk Offline Coupon Generation */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, display: 'flex', gap: 16, position: 'relative' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Gift size={22} style={{ color: C.text }} />
              <div style={{ position: 'absolute', top: 18, left: 42, background: '#fff', borderRadius: '50%', padding: 2 }}>
                <Lock size={10} style={{ color: C.text }} />
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: C.text }}>
                Bulk Offline Coupon Generation <span style={{ color: '#4f46e5', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, marginLeft: 4 }}>Contact Us</span>
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                Generate a large number of unique coupon codes to distribute manually or via messaging platforms like SMS or WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
