'use client';

import { useState, useEffect } from 'react';
import styles from '../KYCOnboarding.module.css';

export default function StepSettlement({ session, kycData, onNext, onBack }) {
  // Lazy initializer — safe even when kycData is null at mount time
  const [form, setForm] = useState(() => ({
    account_holder_name: kycData?.identity?.verified_name ?? '',
    bank_name: '',
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    upi_id: '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [ifscDetails, setIfscDetails] = useState(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState(null);

  // Prefill name once kycData arrives
  useEffect(() => {
    const name = kycData?.identity?.verified_name || kycData?.profile?.full_name || '';
    if (name && !form.account_holder_name) {
      setForm(prev => ({ ...prev, account_holder_name: name }));
    }
  }, [kycData]);

  // Handle IFSC search
  useEffect(() => {
    const fetchIfsc = async () => {
      const code = form.ifsc_code.trim().toUpperCase();
      if (code.length === 11) {
        setIfscLoading(true);
        setIfscError(null);
        try {
          const res = await fetch(`/api/v1/ifsc/${code}`);
          const result = await res.json();
          if (result.success) {
            setIfscDetails(result.data);
            setForm(prev => ({ ...prev, bank_name: result.data.bank }));
          } else {
            setIfscError('Invalid IFSC code');
            setIfscDetails(null);
          }
        } catch (err) {
          setIfscError('Failed to verify IFSC');
          setIfscDetails(null);
        } finally {
          setIfscLoading(false);
        }
      } else {
        setIfscDetails(null);
        setIfscError(null);
      }
    };
    
    // Add debounce to avoid rapid calls
    const timeoutId = setTimeout(fetchIfsc, 300);
    return () => clearTimeout(timeoutId);
  }, [form.ifsc_code]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!(form?.account_holder_name ?? '').trim()) return setError('Account holder name is required');
    if (!(form?.bank_name ?? '').trim()) return setError('Bank name is required');
    if (!(form?.account_number ?? '').trim()) return setError('Account number is required');
    if (form?.account_number !== form?.confirm_account_number) return setError('Account numbers do not match');
    if (!(form?.ifsc_code ?? '').trim()) return setError('IFSC code is required');

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
          phone: kycData?.profile?.phone || '',
          business_name: kycData?.profile?.business_name || '',
          business_type: kycData?.profile?.business_type || '',
          pan_number: kycData?.profile?.pan_number || '',
          business_address: kycData?.profile?.business_address || '',
          city: kycData?.profile?.city || '',
          state: kycData?.profile?.state || '',
          pincode: kycData?.profile?.pincode || '',
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
      {/* Security notice */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '22px' }}>🔒</span>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#065f46' }}>
            Your data is encrypted &amp; secure
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#059669', lineHeight: 1.5 }}>
            Bank details are AES-256 encrypted. Account numbers are never displayed in full after submission.
            This account will be used for event revenue settlements.
          </p>
        </div>
      </div>

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
            style={{ textTransform: 'uppercase', borderColor: ifscError ? '#ef4444' : '' }}
            maxLength={11}
          />
          {ifscLoading && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Verifying IFSC...</p>}
          {ifscError && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>⚠ {ifscError}</p>}
          
          {ifscDetails && (
            <div style={{
              marginTop: '10px',
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#334155',
              lineHeight: '1.5'
            }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f172a' }}>✅ {ifscDetails.bank}</p>
              <p style={{ margin: '0 0 2px' }}><strong>Branch:</strong> {ifscDetails.branch}</p>
              <p style={{ margin: '0 0 2px' }}><strong>Location:</strong> {ifscDetails.city}, {ifscDetails.state}</p>
              <p style={{ margin: '0 0 2px' }}><strong>Address:</strong> {ifscDetails.address}</p>
            </div>
          )}
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
          <label className={styles.formLabel}>UPI ID <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></label>
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
        <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : 'Submit KYC →'}
        </button>
      </div>
    </div>
  );
}
