'use client';

/**
 * Step 4 – Settlement Setup
 */

import { useState } from 'react';
import styles from '../KYCOnboarding.module.css';

export default function StepSettlement({ session, kycData, onNext, onBack }) {
  const [form, setForm] = useState({
    account_holder_name: kycData?.identity?.verified_name || '',
    bank_name: '',
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    upi_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.account_holder_name.trim()) return setError('Account holder name is required');
    if (!form.bank_name.trim()) return setError('Bank name is required');
    if (!form.account_number.trim()) return setError('Account number is required');
    if (form.account_number !== form.confirm_account_number) {
      return setError('Account numbers do not match');
    }
    if (!form.ifsc_code.trim()) return setError('IFSC code is required');

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
          full_name: kycData?.identity?.verified_name || kycData?.profile?.full_name || '',
          phone: '',
          business_name: kycData?.profile?.business_name || '',
          business_type: '',
          pan_number: '',
          business_address: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          bank: {
            account_holder_name: form.account_holder_name,
            bank_name: form.bank_name,
            account_number: form.account_number,
            ifsc_code: form.ifsc_code.toUpperCase(),
            upi_id: form.upi_id || null,
          },
          documents: {},
          kyc_step: 4,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save bank details');
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
      <div style={{
        background: 'rgba(30,27,75,0.4)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        fontSize: '13px',
        color: '#94a3b8',
      }}>
        <span style={{ fontSize: '20px' }}>🔒</span>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Your bank account details are encrypted and stored securely.
          Account numbers are never displayed in full after submission.
          This account will be used for event revenue settlements.
        </p>
      </div>

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
        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
          <label className={styles.formLabel}>Account Holder Name *</label>
          <input
            name="account_holder_name"
            value={form.account_holder_name}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Exactly as per bank records"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Bank Name *</label>
          <input
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="e.g. State Bank of India"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>IFSC Code *</label>
          <input
            name="ifsc_code"
            value={form.ifsc_code}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="SBIN0001234"
            style={{ textTransform: 'uppercase' }}
            maxLength={11}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Account Number *</label>
          <input
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Bank account number"
            type="password"
            autoComplete="off"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Confirm Account Number *</label>
          <input
            name="confirm_account_number"
            value={form.confirm_account_number}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Re-enter account number"
            type="password"
            autoComplete="off"
          />
        </div>

        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
          <label className={styles.formLabel}>UPI ID (Optional)</label>
          <input
            name="upi_id"
            value={form.upi_id}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="yourname@upi"
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
          {submitting ? 'Saving...' : 'Submit KYC →'}
        </button>
      </div>
    </div>
  );
}
