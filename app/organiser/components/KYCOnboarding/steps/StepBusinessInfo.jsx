'use client';

/**
 * Step 3 – Business Information
 */

import { useState } from 'react';
import styles from '../KYCOnboarding.module.css';

const BUSINESS_TYPES = [
  'Individual / Freelancer',
  'Private Limited Company',
  'LLP (Limited Liability Partnership)',
  'Partnership Firm',
  'Sole Proprietorship',
  'NGO / Trust',
  'Government / PSU',
  'Other',
];

export default function StepBusinessInfo({ session, kycData, onNext, onBack }) {
  const [form, setForm] = useState({
    business_name: kycData?.profile?.business_name || '',
    business_type: '',
    pan_number: kycData?.identity?.pan_verified ? '(Verified via DigiLocker)' : '',
    gst_number: '',
    company_registration_number: '',
    website: '',
    business_address: kycData?.identity?.verified_address
      ? `${kycData.identity.verified_address.house} ${kycData.identity.verified_address.street}`.trim()
      : '',
    city: kycData?.identity?.verified_address?.city || '',
    state: kycData?.identity?.verified_address?.state || '',
    pincode: kycData?.identity?.verified_address?.pincode || '',
    country: 'India',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.business_name.trim()) return setError('Business name is required');
    if (!form.business_type) return setError('Business type is required');
    if (!form.business_address.trim()) return setError('Business address is required');

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/organiser/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          full_name: kycData?.identity?.verified_name || kycData?.profile?.full_name || '',
          phone: '',
          // Required by API
          bank: { account_holder_name: '', bank_name: '', account_number: '', ifsc_code: '' },
          documents: {},
          kyc_step: 3,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save business info');
      }

      onNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {kycData?.identity?.verified_address && (
        <div style={{
          background: 'rgba(5,150,105,0.1)',
          border: '1px solid rgba(5,150,105,0.3)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          color: '#34d399',
        }}>
          <span>✅</span>
          <span>Address fields pre-filled from your DigiLocker verified Aadhaar address</span>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#fca5a5',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Business / Organization Name *</label>
          <input
            name="business_name"
            value={form.business_name}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Legal entity name"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Business Type *</label>
          <select
            name="business_type"
            value={form.business_type}
            onChange={handleChange}
            className={styles.formInput}
          >
            <option value="">Select type...</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>PAN Number</label>
          <input
            name="pan_number"
            value={form.pan_number}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="ABCDE1234F"
            disabled={kycData?.identity?.pan_verified}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>GST Number (Optional)</label>
          <input
            name="gst_number"
            value={form.gst_number}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="29ABCDE1234F1Z5"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Company Registration No. (Optional)</label>
          <input
            name="company_registration_number"
            value={form.company_registration_number}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="CIN or registration number"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Website (Optional)</label>
          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="https://yourwebsite.com"
            type="url"
          />
        </div>

        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
          <label className={styles.formLabel}>Business Address *</label>
          <input
            name="business_address"
            value={form.business_address}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Street address"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>City *</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="City"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>State *</label>
          <input
            name="state"
            value={form.state}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="State"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Pincode *</label>
          <input
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="6-digit pincode"
            maxLength={6}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Country</label>
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Country"
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.btnSecondary} onClick={onBack}>← Back</button>
        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  );
}
