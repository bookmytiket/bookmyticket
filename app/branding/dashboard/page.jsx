"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Ticket, Store, BarChart3, CheckCircle2, Rocket, ChevronRight, Clock, AlertCircle, Image as ImageIcon, CreditCard, Upload
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StatCard } from './StatCard';
import { DistributeChannelModal } from './DistributeChannelModal';

export default function BrandingDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const activeTab = searchParams?.get('tab') || 'dashboard';
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Premium Banners State
  const convexPrices = useQuery(api.branding.getConfigPrices);
  const subscription = useQuery(api.branding.getSubscription, { brandId: user?.id || '' });
  const banner = useQuery(api.branding.getBanner, { brandId: user?.id || '' });
  const simulatePayment = useMutation(api.branding.processPayment);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(banner?.redirectUrl || '');
  
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const generateUploadUrl = useMutation(api.branding.generateUploadUrl);
  const uploadBannerMutation = useMutation(api.branding.uploadBanner);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleSaveBanner = async () => {
    if (!redirectUrl && !banner?.redirectUrl) {
      alert("Please provide a redirect URL.");
      return;
    }
    
    setIsUploading(true);
    try {
      let storageId = null;
      if (selectedFile) {
         const postUrl = await generateUploadUrl();
         const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": selectedFile.type },
            body: selectedFile,
         });
         const { storageId: returnedId } = await result.json();
         storageId = returnedId;
      }
      
      // If we don't have a new file but have a new URL, we might need a distinct mutation or just fail for now
      if (!storageId) {
         alert("Please select a new banner image to upload.");
         setIsUploading(false);
         return;
      }

      await uploadBannerMutation({
         brandId: user.id,
         storageId,
         redirectUrl
      });
      alert("Banner updated successfully!");
      setSelectedFile(null);
    } catch(e) {
      alert("Error uploading banner: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const kycData = useQuery(api.branding.getKYC, { brandId: user?.id || '' });
  const kycStatus = kycData?.status || 'Verification Pending';
  const isVerified = kycStatus === 'Verified';
  const isPending = kycStatus === 'Verification Pending';

  const myCoupons = useQuery(api.branding.getBrandCoupons, user ? { brandId: user.id } : "skip") || [];

  if (!isMounted || !user) return null;

  const handlePayment = async (planType) => {
    setIsProcessing(true);
    try {
      // Simulate real payment delay
      await new Promise(r => setTimeout(r, 1500));
      const amount = planType === 'Monthly' ? convexPrices?.monthlyPrice : convexPrices?.yearlyPrice;
      await simulatePayment({ brandId: user.id, planType, amountPaid: amount });
      alert(`Successfully subscribed to ${planType} Premium Banners!`);
    } catch (e) {
      alert("Payment failed or cancelled.");
    } finally {
      setIsProcessing(false);
    }
  };

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
          {myCoupons && myCoupons.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {myCoupons.map(coupon => (
                <div key={coupon._id} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 120, background: coupon.bannerUrl ? `url(${coupon.bannerUrl}) center/cover` : '#f3f4f6', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 12, right: 12, background: coupon.status === 'Active' ? '#10b981' : '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>
                      {coupon.status}
                    </div>
                  </div>
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {coupon.logoUrl && <img src={coupon.logoUrl} style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{coupon.brandName}</span>
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>{coupon.title}</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: C.muted, flex: 1 }}>{coupon.description?.substring(0, 80)}...</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Code: <strong style={{ color: C.text }}>{coupon.couponCode}</strong></div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>{coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} OFF</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 16, padding: 40, textAlign: 'center', border: `1px solid ${C.border}` }}>
              <Ticket size={48} style={{ color: C.subtext, marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>No coupons created yet</h3>
              <p style={{ color: C.muted, fontSize: 14 }}>Once you create a coupon, it will appear here for management and tracking.</p>
            </div>
          )}
        </>
      )}

      {/* Premium Banners Tab */}
      {activeTab === 'banners' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: C.text }}>Premium Banners</h1>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Promote your brand directly on the Home Page Hero Carousel.</p>
          </div>
          
          <div style={{ background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}` }}>
            {!subscription ? (
              // Payment State
              <div style={{ textAlign: 'center' }}>
                <ImageIcon size={48} style={{ color: C.subtext, marginBottom: 16 }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 12px' }}>Unlock Home Page Visibility</h3>
                <p style={{ color: C.muted, fontSize: 14, maxWidth: 500, margin: '0 auto 32px' }}>
                  A premium subscription allows you to upload a branded Hero Banner that appears on the main booking page.
                </p>
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <div style={{ border: `2px solid ${C.border}`, borderRadius: 16, padding: 24, width: 260 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Monthly</h4>
                    <div style={{ fontSize: 32, fontWeight: 900, color: C.text, marginBottom: 16 }}>₹{convexPrices?.monthlyPrice || '999'}</div>
                    <button 
                      onClick={() => handlePayment('Monthly')}
                      disabled={isProcessing}
                      style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: isProcessing ? 'wait' : 'pointer' }}
                    >
                      {isProcessing ? 'Processing...' : 'Subscribe Monthly'}
                    </button>
                  </div>
                  <div style={{ border: `2px solid ${C.accent}`, borderRadius: 16, padding: 24, width: 260, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.accent, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 12 }}>MOST POPULAR</div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Yearly</h4>
                    <div style={{ fontSize: 32, fontWeight: 900, color: C.text, marginBottom: 16 }}>₹{convexPrices?.yearlyPrice || '9999'}</div>
                    <button 
                      onClick={() => handlePayment('Yearly')}
                      disabled={isProcessing}
                      style={{ width: '100%', padding: '12px', background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: isProcessing ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(255,88,98,0.3)' }}
                    >
                      {isProcessing ? 'Processing...' : 'Subscribe Yearly'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Upload State
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, marginBottom: 4 }}>
                      <CheckCircle2 size={18} /> Active {subscription.planType} Subscription
                    </div>
                     <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Valid until {new Date(subscription.endDate).toLocaleDateString()}</p>
                  </div>
                  <div style={{ background: '#f0fdf4', color: '#059669', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
                    Ads Live
                  </div>
                </div>
                
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Manage Your Hero Banner</h3>
                
                {banner?.imageUrl && (
                  <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    <img src={banner.imageUrl} alt="Current Banner" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div>
                     <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Banner Image URL (Target Dimensions: 1200x500)</label>
                     <div style={{ display: 'flex', gap: 12 }}>
                       <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, background: '#f9fafb' }} 
                       />
                     </div>
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Redirect Click URL</label>
                     <input 
                        type="url" 
                        value={redirectUrl} 
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="https://..." 
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${C.border}` }} 
                     />
                   </div>
                   <button 
                      onClick={handleSaveBanner}
                      disabled={isUploading}
                      style={{ background: '#1e1b4b', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: isUploading ? 'wait' : 'pointer', alignSelf: 'flex-start' }}
                   >
                     {isUploading ? 'Uploading...' : 'Save Changes'}
                   </button>
                </div>
              </div>
            )}
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
