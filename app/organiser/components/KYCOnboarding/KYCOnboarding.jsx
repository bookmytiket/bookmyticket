'use client';

/**
 * DigiLocker KYC Onboarding Wizard
 * BookMyTicket Light App Theme
 *
 * Steps:
 *   1 – Basic Profile
 *   2 – DigiLocker Verification (MeriPehchaan)
 *   3 – Business Information
 *   4 – Settlement Setup
 *   5 – Admin Approval Pending
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './KYCOnboarding.module.css';

import StepBasicProfile    from './steps/StepBasicProfile';
import StepDigiLocker      from './steps/StepDigiLocker';
import StepBusinessInfo    from './steps/StepBusinessInfo';
import StepSettlement      from './steps/StepSettlement';
import StepApprovalPending from './steps/StepApprovalPending';

const STEPS = [
  { id: 1, label: 'Basic Profile',           icon: '👤', description: 'Personal details' },
  { id: 2, label: 'DigiLocker Verification', icon: '🔐', description: 'Government ID' },
  { id: 3, label: 'Business Information',    icon: '🏢', description: 'Business details' },
  { id: 4, label: 'Settlement Setup',        icon: '💰', description: 'Bank account' },
  { id: 5, label: 'Admin Approval',          icon: '✅', description: 'Under review' },
];

export default function KYCOnboarding({ session }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [kycStatus,   setKycStatus]   = useState(null);
  const [kycData,     setKycData]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Handle DigiLocker callback params ─────────────────────────────
  useEffect(() => {
    const kycStep          = searchParams.get('kyc_step');
    const digilockerVerified = searchParams.get('digilocker_verified');
    const kycError         = searchParams.get('kyc_error');

    if (kycError) {
      setError(decodeURIComponent(kycError));
      setCurrentStep(2);
    } else if (digilockerVerified === '1') {
      setCurrentStep(parseInt(kycStep) || 3);
    } else if (kycStep) {
      setCurrentStep(parseInt(kycStep));
    }
  }, [searchParams]);

  // ── Fetch KYC status ───────────────────────────────────────────────
  const fetchKYCStatus = useCallback(async () => {
    if (!session?.access_token) { setLoading(false); return; }
    try {
      setLoading(true);
      const res  = await fetch('/api/organizer/kyc/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (data.success) {
        setKycData(data);
        setKycStatus(data.kyc?.status);

        if (data.kyc?.dashboard_access) {
          router.replace('/organiser');
          return;
        }

        const serverStep = data.kyc?.current_step || 1;
        if (!searchParams.get('kyc_step') && !searchParams.get('digilocker_verified')) {
          setCurrentStep(serverStep);
        }

        if (['submitted', 'under_review', 'approved', 'rejected'].includes(data.kyc?.status)) {
          setCurrentStep(5);
        }

        // Reupload requested → send back to DigiLocker step
        if (data.kyc?.status === 'reupload_requested') {
          setCurrentStep(2);
        }
      }
    } catch (err) {
      console.error('KYC status fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, router, searchParams]);

  useEffect(() => { fetchKYCStatus(); }, [fetchKYCStatus]);

  // ── Realtime subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id || !supabase) return;

    const channel = supabase
      .channel(`kyc-status-${session.user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'digilocker_kyc_records',
        filter: `organizer_id=eq.${session.user.id}`,
      }, (payload) => {
        const newStatus = payload.new?.kyc_status;
        if (newStatus) {
          setKycStatus(newStatus);
          if (['submitted', 'under_review'].includes(newStatus)) setCurrentStep(5);
          if (newStatus === 'approved') router.replace('/organiser?kyc_approved=1');
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user?.id, router]);

  const handleNext = (nextStep) => { setCurrentStep(nextStep || currentStep + 1); setError(null); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      router.replace('/organiser/login');
    } catch (err) {
      console.error('Sign out failed:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your verification status...</p>
      </div>
    );
  }

  const completedSteps = Math.max(0, currentStep - 1);

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <img 
              src="/logo.png" 
              alt="BookMyTicket" 
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
          <div className={styles.headerActions}>
            <div className={styles.headerBadge}>
              <span className={styles.badgeDot} />
              Organizer KYC Verification
            </div>
            <button onClick={handleSignOut} className={styles.signOutBtn}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className={styles.wrapper}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <h3 className={styles.sidebarTitle}>Verification Steps</h3>
            <p className={styles.sidebarSubtitle}>
              Complete all steps to activate your organizer account
            </p>

            <div className={styles.stepsList}>
              {STEPS.map((step) => {
                const isCompleted = step.id < currentStep;
                const isActive    = step.id === currentStep;
                const isLocked    = step.id > currentStep;
                return (
                  <div
                    key={step.id}
                    className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''} ${isLocked ? styles.stepLocked : ''}`}
                  >
                    <div className={styles.stepDot}>
                      {isCompleted ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className={styles.stepNumber}>{step.id}</span>
                      )}
                    </div>
                    <div className={styles.stepInfo}>
                      <div className={styles.stepIcon}>{step.icon}</div>
                      <div>
                        <p className={styles.stepLabel}>{step.label}</p>
                        <p className={styles.stepDesc}>{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                <span>Progress</span>
                <span>{Math.round((completedSteps / STEPS.length) * 100)}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${(completedSteps / STEPS.length) * 100}%` }} />
              </div>
            </div>

            {/* DigiLocker badge */}
            <div className={styles.digilockerBadge}>
              <div className={styles.digilockerIcon}>🇮🇳</div>
              <div>
                <p className={styles.digilockerTitle}>Powered by DigiLocker</p>
                <p className={styles.digilockerDesc}>MeriPehchaan · Government of India</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className={styles.main}>
          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError(null)} className={styles.errorClose}>✕</button>
            </div>
          )}

          <div className={styles.stepHeader}>
            <div className={styles.stepBreadcrumb}>Step {currentStep} of {STEPS.length}</div>
            <h1 className={styles.stepTitle}>{STEPS[currentStep - 1]?.label}</h1>
            <p className={styles.stepDescription}>{STEPS[currentStep - 1]?.description}</p>
          </div>

          <div className={styles.stepContent}>
            {currentStep === 1 && <StepBasicProfile    session={session} kycData={kycData} onNext={() => handleNext(2)} onRefresh={fetchKYCStatus} />}
            {currentStep === 2 && <StepDigiLocker      session={session} kycData={kycData} onNext={() => handleNext(3)} onBack={handleBack} error={error} setError={setError} />}
            {currentStep === 3 && <StepBusinessInfo    session={session} kycData={kycData} onNext={() => handleNext(4)} onBack={handleBack} onRefresh={fetchKYCStatus} />}
            {currentStep === 4 && <StepSettlement      session={session} kycData={kycData} onNext={() => handleNext(5)} onBack={handleBack} onRefresh={fetchKYCStatus} />}
            {currentStep === 5 && <StepApprovalPending session={session} kycData={kycData} kycStatus={kycStatus} onRefresh={fetchKYCStatus} />}
          </div>
        </main>
      </div>
    </div>
  );
}
