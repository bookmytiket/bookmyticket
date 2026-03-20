"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, QrCode, Monitor, Gift, ArrowRight, X, ExternalLink } from 'lucide-react';

const C = {
  bg: '#f4f5f7',
  text: '#1e1b4b',
  muted: '#6b7280',
  accent: '#ff5862',
  border: '#e5e7eb',
  card: '#ffffff',
  primary: '#4f46e5',
};

const LOGO_IMG = "/branding/nykaa_logo.png";
const BANNER_IMG = "/branding/beauty_banner.png";

export default function CouponCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'website';

  const [form, setForm] = useState({
    redemptionMethod: 'In-Store Only',
    discountType: 'percentage',
    discountValue: '250',
    brandName: 'Nykaa',
    couponTitle: 'Get ₹250 Off on Nykaa Beauty Products!',
    shortDescription: 'Glow up with Nykaa! Enjoy ₹250 off on your next beauty haul — exclusively on Ticket9.',
    couponCode: 'SAVE250',
    redirectUrl: 'https://nykaa.com/offer',
    couponImage: BANNER_IMG,
    brandLogo: LOGO_IMG,
    startDate: '',
    endDate: '2026-05-31',
    usageLimit: '1000',
    productName: '',
    productPrice: '',
    productId: '',
    targetAudience: '',
    description: 'From bold lipsticks to skin-loving serums, discover your new favorites with Nykaa. Ticket9 users get an exclusive ₹250 off on a wide range of cosmetics and skincare essentials!',
    terms: '• Minimum order value: ₹999.\n• Valid on select beauty & skincare products only.\n• Offer valid once per Ticket9 user.\n• Coupon expires on May 31, 2025.',
    howToRedeem: [
      'Tap "Get Code" and copy your code',
      'Visit www.nykaa.com or open the app',
      'Shop for ₹999 or more and apply code at checkout',
      '₹250 off will be automatically applied'
    ]
  });

  const addStep = () => {
    setForm({...form, howToRedeem: [...form.howToRedeem, '']});
  };

  const updateStep = (index, val) => {
    const newSteps = [...form.howToRedeem];
    newSteps[index] = val;
    setForm({...form, howToRedeem: newSteps});
  };

  const removeStep = (index) => {
    setForm({...form, howToRedeem: form.howToRedeem.filter((_, i) => i !== index)});
  };

  return (
    <div style={{ padding: '28px 40px' }}>
      {/* Header / Nav */}
      <button 
        onClick={() => router.push('/branding/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontWeight: 700, fontSize: 13, marginBottom: 12, padding: 0 }}
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 32 }}>Create Coupon</h1>

      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
        
        {/* Left: Configuration Form */}
        <div style={{ flex: 1, background: C.card, borderRadius: 24, padding: '32px 40px', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 28 }}>Coupon Configuration</h2>

          {/* Redemption Method & Coupon Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Redemption Method <span style={{ color: C.accent }}>*</span>
              </label>
              <select 
                value={form.redemptionMethod}
                onChange={e => setForm({...form, redemptionMethod: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: '#fff', cursor: 'pointer' }}
              >
                <option>In-Store Only</option>
                <option>Online Only</option>
                <option>Both</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Coupon Code <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>(max 12 characters)</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. SAVE20"
                value={form.couponCode}
                onChange={e => setForm({...form, couponCode: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }}
              />
            </div>
          </div>

          {/* QR Preview Section */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 40, padding: 20, background: '#f9fafb', borderRadius: 16 }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>Generate QR our backend side based on your Usage limit</h4>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
                This is a preview - real QR will be generated upon submission
              </p>
            </div>
            <div style={{ width: 80, height: 80, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <QrCode size={48} style={{ color: '#000' }} />
            </div>
          </div>

          {/* Discount Type */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
              Discount Type <span style={{ color: C.accent }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <input 
                  type="radio" 
                  checked={form.discountType === 'percentage'} 
                  onChange={() => setForm({...form, discountType: 'percentage'})}
                  style={{ width: 18, height: 18, accentColor: C.primary }}
                />
                Percentage
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <input 
                  type="radio" 
                  checked={form.discountType === 'flat'} 
                  onChange={() => setForm({...form, discountType: 'flat'})}
                  style={{ width: 18, height: 18, accentColor: C.primary }}
                />
                Flat Amount
              </label>
            </div>
          </div>

          {/* Discount Value */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Discount {form.discountType === 'percentage' ? 'Percentage' : 'Amount'} (Max 100%) <span style={{ color: C.accent }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
               <input 
                 type="text"
                 placeholder="e.g. 20"
                 value={form.discountValue}
                 onChange={e => setForm({...form, discountValue: e.target.value})}
                 style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.text }}
               />
               <span style={{ position: 'absolute', right: 16, color: C.muted, fontSize: 13, fontWeight: 600 }}>
                 {form.discountType === 'percentage' ? '%' : '₹'}
               </span>
            </div>
          </div>

          {/* Brand & Coupon Details */}
          <div style={{ marginBottom: 40, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 24 }}>Brand & Coupon Details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: (form.redemptionMethod === 'Online Only' || form.redemptionMethod === 'Both') ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Brand Name <span style={{ color: C.accent }}>*</span></label>
                <input type="text" value={form.brandName} onChange={e => setForm({...form, brandName: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
              {(form.redemptionMethod === 'Online Only' || form.redemptionMethod === 'Both') && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Redirect URL <span style={{ color: C.accent }}>*</span></label>
                  <input type="text" value={form.redirectUrl} placeholder="https://example.com/offer" onChange={e => setForm({...form, redirectUrl: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Coupon Title <span style={{ color: C.accent }}>*</span></label>
                <input type="text" value={form.couponTitle} onChange={e => setForm({...form, couponTitle: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Short Description <span style={{ color: C.accent }}>*</span></label>
                <input type="text" value={form.shortDescription} onChange={e => setForm({...form, shortDescription: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Coupon Image (1200x600) <span style={{ color: C.accent }}>*</span></label>
                <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  <img src={BANNER_IMG} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#fff', borderRadius: 8, padding: 6, cursor: 'pointer', border: `1px solid ${C.border}`, color: C.accent }}>
                    <X size={14} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Brand Logo (300x300) <span style={{ color: C.accent }}>*</span></label>
                <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={LOGO_IMG} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#fff', borderRadius: 8, padding: 6, cursor: 'pointer', border: `1px solid ${C.border}`, color: C.accent }}>
                    <X size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validity & Limits */}
          <div style={{ marginBottom: 40, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 24 }}>Validity & Limits</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Start Date & Time <span style={{ color: C.accent }}>*</span></label>
                <input type="datetime-local" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>End Date & Time <span style={{ color: C.accent }}>*</span></label>
                <input type="datetime-local" value="2026-05-31T11:17" readOnly style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Total No of Coupons (Usage Limit) <span style={{ color: C.accent }}>*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input type="text" placeholder="e.g. 1000" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
                  <span style={{ position: 'absolute', right: 16, fontSize: 12, color: C.muted }}>redemptions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div style={{ marginBottom: 40, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 24 }}>Product Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Product Name</label>
                <input type="text" placeholder="e.g Ticket9" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Product Price</label>
                <input type="text" placeholder="e.g 100" value={form.productPrice} onChange={e => setForm({...form, productPrice: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Product Id</label>
                <input type="text" placeholder="e.g 456GHJKL" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* Audience & Redemption */}
          <div style={{ marginBottom: 40, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 24 }}>Audience & Redemption</h2>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Target Audience <span style={{ color: C.accent }}>*</span></label>
              <select 
                value={form.targetAudience} 
                onChange={e => setForm({...form, targetAudience: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: '#fff' }}
              >
                <option value="">Select target audience</option>
                <option value="all">All Users</option>
                <option value="new">New Users Only</option>
                <option value="premium">Premium Users Only</option>
              </select>
            </div>
          </div>

          {/* Descriptions */}
          <div style={{ marginBottom: 40, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 24 }}>Descriptions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Description <span style={{ color: C.accent }}>*</span></label>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, background: '#f9fafb', display: 'flex', gap: 16 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>B</span>
                    <span style={{ fontStyle: 'italic', fontSize: 14, cursor: 'pointer' }}>I</span>
                    <span style={{ textDecoration: 'underline', fontSize: 14, cursor: 'pointer' }}>U</span>
                    <span style={{ textDecoration: 'line-through', fontSize: 14, cursor: 'pointer' }}>S</span>
                  </div>
                  <textarea 
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    style={{ width: '100%', height: 120, padding: '12px 16px', border: 'none', fontSize: 13, lineHeight: 1.6, outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Terms & Conditions <span style={{ color: C.accent }}>*</span></label>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, background: '#f9fafb', display: 'flex', gap: 16 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>B</span>
                    <span style={{ fontStyle: 'italic', fontSize: 14, cursor: 'pointer' }}>I</span>
                    <span style={{ textDecoration: 'underline', fontSize: 14, cursor: 'pointer' }}>U</span>
                    <span style={{ textDecoration: 'line-through', fontSize: 14, cursor: 'pointer' }}>S</span>
                  </div>
                  <textarea 
                    value={form.terms}
                    onChange={e => setForm({...form, terms: e.target.value})}
                    style={{ width: '100%', height: 120, padding: '12px 16px', border: 'none', fontSize: 13, lineHeight: 1.6, outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>How to Redeem</label>
              {form.howToRedeem.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <input 
                    type="text" 
                    value={step} 
                    onChange={e => updateStep(idx, e.target.value)}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} 
                  />
                  <button onClick={() => removeStep(idx)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.accent, cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button onClick={addStep} style={{ display: 'block', width: 'fit-content', padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
                + Add Step
              </button>
            </div>
          </div>

          <button style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
            Save Coupon
          </button>
        </div>

        {/* Right: Phone Preview */}
        <div style={{ flexShrink: 0, width: 340, position: 'sticky', top: 28 }}>
           {/* Phone Frame */}
           <div style={{ 
             width: '100%', height: 680, background: '#1e1b4b', borderRadius: 48, padding: 12, 
             position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', border: '8px solid #2d2d2d' 
           }}>
             {/* Notch */}
             <div style={{ 
               position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', 
               width: 120, height: 28, background: '#2d2d2d', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, zIndex: 10 
             }} />

             {/* Screen Content */}
             <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 32, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Status Bar App Mockup */}
                <div style={{ height: 40, background: '#ff5862', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                   EXCLUSIVE TICKET9 OFFER
                </div>

                {/* Banner Part */}
                <div style={{ position: 'relative', height: 180 }}>
                   <img src={BANNER_IMG} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <div style={{ position: 'absolute', top: 12, left: 12, width: 50, height: 50, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <img src={LOGO_IMG} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                   </div>
                </div>

                {/* Content Part */}
                <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ color: C.accent }}>
                         <Monitor size={14} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{form.brandName}</span>
                   </div>

                   <h3 style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.2, color: C.text, margin: '0 0 10px' }}>
                      {form.couponTitle}
                   </h3>

                   <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
                      {form.shortDescription}
                   </p>

                   <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.subtext, marginBottom: 10 }}>
                         Expires on: {form.endDate}, 11:17 AM
                      </div>
                      
                      <div style={{ border: '1px dashed #e5e7eb', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb' }}>
                         <span style={{ fontWeight: 800, color: C.subtext, letterSpacing: '2px', fontSize: 14 }}>********</span>
                         <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                            Get Code <ArrowRight size={13} />
                         </button>
                      </div>
                   </div>

                   {/* Accordions */}
                   <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 'auto' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.text }}>
                        <span>Description</span> <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.text }}>
                        <span>How To Redeem</span> <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
                     </div>
                   </div>

                   <button style={{ 
                     background: '#ff5862', color: '#fff', border: 'none', padding: '12px 24px', 
                     borderRadius: 999, width: '100%', fontWeight: 800, fontSize: 15, marginTop: 16,
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                     boxShadow: '0 4px 12px rgba(255, 88, 98, 0.2)'
                   }}>
                      <ExternalLink size={18} strokeWidth={2.5} /> Redeem Now
                   </button>
                </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
