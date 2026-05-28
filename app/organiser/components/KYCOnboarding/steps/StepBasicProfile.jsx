'use client';

import { useState, useEffect } from 'react';
import styles from '../KYCOnboarding.module.css';

export default function StepBasicProfile({ session, kycData, onNext, onRefresh }) {
  const [form, setForm] = useState({ full_name: '', phone: '', dob: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill once kycData is available
  useEffect(() => {
    const name = kycData?.identity?.verified_name || kycData?.profile?.full_name || '';
    const dob  = kycData?.identity?.verified_dob  || kycData?.profile?.dob || '';
    const phone = kycData?.profile?.phone || '';
    setForm(prev => ({
      full_name: name || prev.full_name,
      phone:     phone || prev.phone,
      dob:       dob  || prev.dob,
    }));
  }, [kycData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) return setError('Full name is required');
    if (!form.phone.trim()) return setError('Phone number is required');

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
          full_name: form.full_name,
          phone: form.phone,
          dob: form.dob || null,
          business_name: '',
          business_type: '',
          pan_number: '',
          business_address: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          kyc_step: 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      if (onRefresh) onRefresh();
      onNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const digilockerVerified = kycData?.kyc?.digilocker_verified;

  return (
    <div>
      {digilockerVerified && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#065f46',
        }}>
          <span>✅</span>
          <span>Fields pre-filled from your DigiLocker verified identity</span>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#b91c1c',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
          <label className={styles.formLabel}>Full Name *</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="As per government ID"
            disabled={digilockerVerified}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Phone Number *</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="+91 XXXXXXXXXX"
            type="tel"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Date of Birth</label>
          <input
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className={styles.formInput}
            type="date"
            disabled={digilockerVerified}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  );
}
