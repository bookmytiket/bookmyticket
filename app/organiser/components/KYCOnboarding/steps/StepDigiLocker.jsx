'use client';

/**
 * Step 2 – DigiLocker Verification
 * Initiates MeriPehchaan OAuth flow
 */

import { useState } from 'react';
import styles from '../KYCOnboarding.module.css';
import digiStyles from './StepDigiLocker.module.css';
import { supabase } from '@/lib/supabase';

export default function StepDigiLocker({ session, kycData, onNext, onBack, error, setError }) {
  const [initiating, setInitiating] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  
  const [useManualUpload, setUseManualUpload] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isReuploadRequested = kycData?.kyc?.status === 'reupload_requested';
  // When reupload is requested, force re-verification even if previously verified
  const isAlreadyVerified = kycData?.kyc?.digilocker_verified && !isReuploadRequested;

  const handleInitiateDigiLocker = async () => {
    if (!session?.access_token) return;

    try {
      setInitiating(true);
      setError(null);

      const res = await fetch('/api/auth/digilocker/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate DigiLocker verification');
      }

      setVerificationId(data.verification_request_id);

      // Redirect to DigiLocker OAuth
      window.location.href = data.authorization_url;

    } catch (err) {
      console.error('[StepDigiLocker] Initiation error:', err);
      setError(err.message);
    } finally {
      setInitiating(false);
    }
  };

  const handleManualUpload = async () => {
    if (!aadhaarFile || !panFile) {
      setError('Please select both Aadhaar and PAN documents');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // 1. Upload Aadhaar
      const aadhaarPath = `${session.user.id}/aadhaar-${Date.now()}-${aadhaarFile.name}`;
      const { error: aadhaarUploadError } = await supabase.storage
        .from('organizer-kyc-documents')
        .upload(aadhaarPath, aadhaarFile);
      if (aadhaarUploadError) throw new Error('Failed to upload Aadhaar: ' + aadhaarUploadError.message);

      // 2. Upload PAN
      const panPath = `${session.user.id}/pan-${Date.now()}-${panFile.name}`;
      const { error: panUploadError } = await supabase.storage
        .from('organizer-kyc-documents')
        .upload(panPath, panFile);
      if (panUploadError) throw new Error('Failed to upload PAN: ' + panUploadError.message);

      // 3. Get Public URLs
      const aadhaarUrl = supabase.storage.from('organizer-kyc-documents').getPublicUrl(aadhaarPath).data.publicUrl;
      const panUrl = supabase.storage.from('organizer-kyc-documents').getPublicUrl(panPath).data.publicUrl;

      // 4. Submit to Onboarding API
      const res = await fetch('/api/organiser/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kyc_step: 2,
          documents: {
            identity: aadhaarUrl,
            business: panUrl, // Or a dedicated pan field if backend supports it
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save documents');

      onNext();
    } catch (err) {
      console.error('[ManualUpload] Error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (isAlreadyVerified) {
    return (
      <div className={digiStyles.container}>
        <div className={digiStyles.successState}>
          <div className={digiStyles.successIcon}>✅</div>
          <h3>DigiLocker Verification Complete</h3>
          <p>Your identity has been verified via DigiLocker (MeriPehchaan)</p>

          {kycData?.identity && (
            <div className={digiStyles.identityCard}>
              <div className={digiStyles.identityRow}>
                <span className={digiStyles.identityLabel}>Verified Name</span>
                <span className={digiStyles.identityValue}>{kycData.identity.verified_name || '—'}</span>
              </div>
              <div className={digiStyles.identityRow}>
                <span className={digiStyles.identityLabel}>Verified Email</span>
                <span className={digiStyles.identityValue}>{kycData.identity.verified_email || '—'}</span>
              </div>
              <div className={digiStyles.identityRow}>
                <span className={digiStyles.identityLabel}>Age Verified (18+)</span>
                <span className={`${digiStyles.identityValue} ${kycData.identity.age_verified ? digiStyles.verified : digiStyles.notVerified}`}>
                  {kycData.identity.age_verified ? `✓ Yes (${kycData.identity.age_at_verification} years)` : '✗ Not verified'}
                </span>
              </div>
              <div className={digiStyles.identityRow}>
                <span className={digiStyles.identityLabel}>Aadhaar</span>
                <span className={`${digiStyles.identityValue} ${kycData.identity.aadhaar_verified ? digiStyles.verified : digiStyles.notVerified}`}>
                  {kycData.identity.aadhaar_verified ? '✓ Verified' : '⏳ Not found'}
                </span>
              </div>
              <div className={digiStyles.identityRow}>
                <span className={digiStyles.identityLabel}>PAN</span>
                <span className={`${digiStyles.identityValue} ${kycData.identity.pan_verified ? digiStyles.verified : digiStyles.notVerified}`}>
                  {kycData.identity.pan_verified ? '✓ Verified' : '⏳ Not found'}
                </span>
              </div>
            </div>
          )}

          {/* Documents */}
          {kycData?.documents?.length > 0 && (
            <div className={digiStyles.documentsSection}>
              <h4 className={digiStyles.documentsTitle}>DigiLocker Documents</h4>
              <div className={digiStyles.documentsList}>
                {kycData.documents.map((doc) => (
                  <div key={doc.id} className={digiStyles.documentItem}>
                    <div className={digiStyles.documentType}>{doc.document_type}</div>
                    <div className={digiStyles.documentName}>{doc.document_name}</div>
                    <div className={`${digiStyles.documentStatus} ${digiStyles[doc.verification_status]}`}>
                      {doc.verification_status === 'verified' ? '✓' : '⏳'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button className={styles.btnSecondary} onClick={onBack}>← Back</button>
          <button className={styles.btnPrimary} onClick={onNext}>
            Continue to Business Info →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={digiStyles.container}>

      {/* Reupload Warning Banner */}
      {isReuploadRequested && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '22px' }}>⚠️</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e', fontSize: '15px' }}>
              Re-verification Required
            </p>
            <p style={{ margin: 0, color: '#78350f', fontSize: '13px', lineHeight: '1.5' }}>
              The admin has reviewed your KYC submission and requested a re-verification.
              Please complete DigiLocker again to link your Aadhaar and PAN documents.
            </p>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className={digiStyles.infoGrid}>
        <div className={digiStyles.infoCard}>
          <div className={digiStyles.infoIcon}>🔐</div>
          <h4>Government-Grade Security</h4>
          <p>Your identity is verified through DigiLocker, India's official digital document platform.</p>
        </div>
        <div className={digiStyles.infoCard}>
          <div className={digiStyles.infoIcon}>⚡</div>
          <h4>Instant Verification</h4>
          <p>No manual document uploads. Your Aadhaar, PAN, and other documents are auto-fetched.</p>
        </div>
        <div className={digiStyles.infoCard}>
          <div className={digiStyles.infoIcon}>🛡️</div>
          <h4>Privacy Protected</h4>
          <p>Only verification status is stored. Raw document data never leaves DigiLocker servers.</p>
        </div>
      </div>

      {/* What we fetch */}
      <div className={digiStyles.scopeSection}>
        <h3 className={digiStyles.scopeTitle}>Information we'll request from DigiLocker:</h3>
        <div className={digiStyles.scopeGrid}>
          {[
            { scope: 'Profile Information', detail: 'Full name, date of birth, gender', icon: '👤' },
            { scope: 'Verified Email', detail: 'Government-verified email address', icon: '📧' },
            { scope: 'Verified Address', detail: 'Aadhaar-linked address', icon: '📍' },
            { scope: 'Age Verification', detail: 'Confirm 18+ eligibility', icon: '🎂' },
            { scope: 'Issued Documents', detail: 'Aadhaar, PAN, Driving License', icon: '📄' },
            { scope: 'Profile Photo', detail: 'DigiLocker profile picture', icon: '📷' },
          ].map((item) => (
            <div key={item.scope} className={digiStyles.scopeItem}>
              <span className={digiStyles.scopeIcon}>{item.icon}</span>
              <div>
                <p className={digiStyles.scopeName}>{item.scope}</p>
                <p className={digiStyles.scopeDetail}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MeriPehchaan info */}
      <div className={digiStyles.meripehchaanBanner}>
        <div className={digiStyles.bannerFlag}>🇮🇳</div>
        <div>
          <p className={digiStyles.bannerTitle}>Redirecting to MeriPehchaan</p>
          <p className={digiStyles.bannerDesc}>
            You will be redirected to{' '}
            <strong>digilocker.meripehchaan.gov.in</strong> to login using your
            mobile OTP or Aadhaar-linked identity.
          </p>
        </div>
      </div>

      {/* Note */}
      <div className={digiStyles.securityNote}>
        <span className={digiStyles.securityNoteIcon}>🔒</span>
        <p>
          <strong>Security Note:</strong> We use PKCE (Proof Key for Code Exchange) OAuth 2.0 for
          maximum security. Your DigiLocker access tokens are encrypted and stored server-side only.
          They are <strong>never</strong> shared with the browser.
        </p>
      </div>

      {isReuploadRequested && !useManualUpload && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button 
            type="button" 
            onClick={() => setUseManualUpload(true)}
            style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
          >
            Or upload documents manually instead
          </button>
        </div>
      )}

      {useManualUpload && (
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Manual Document Upload</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Since re-verification was requested, you can manually upload your documents if DigiLocker is failing.</p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Aadhaar Card *</label>
            <input type="file" onChange={(e) => setAadhaarFile(e.target.files[0])} style={{ width: '100%', padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#fff' }} />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>PAN Card *</label>
            <input type="file" onChange={(e) => setPanFile(e.target.files[0])} style={{ width: '100%', padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#fff' }} />
          </div>

          <button 
            className={styles.btnPrimary} 
            style={{ width: '100%' }}
            onClick={handleManualUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Submit Documents'}
          </button>

          <button 
            type="button" 
            onClick={() => setUseManualUpload(false)}
            style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
          >
            Cancel Manual Upload
          </button>
        </div>
      )}

      {!useManualUpload && (
        <div className={styles.formActions}>
          <button className={styles.btnSecondary} onClick={onBack}>← Back</button>
          <button
            className={`${styles.btnPrimary} ${digiStyles.digilockerBtn}`}
            onClick={handleInitiateDigiLocker}
            disabled={initiating}
          >
            {initiating ? (
              <>
                <span className={digiStyles.btnSpinner} />
                Initiating...
              </>
            ) : (
              <>
                🔐 Verify with DigiLocker
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
