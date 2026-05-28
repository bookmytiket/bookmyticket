'use client';

/**
 * Step 5 – Admin Approval Pending
 * Realtime KYC status tracking
 */

import { useEffect, useState } from 'react';
import styles from '../KYCOnboarding.module.css';
import pendingStyles from './StepApprovalPending.module.css';

const STATUS_CONFIG = {
  pending: {
    icon: '⏳',
    title: 'Verification in Progress',
    description: 'Your documents are being prepared for review',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
  submitted: {
    icon: '📋',
    title: 'KYC Submitted',
    description: 'Your KYC has been submitted and is awaiting admin review',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.3)',
  },
  under_review: {
    icon: '🔍',
    title: 'Under Admin Review',
    description: 'Our team is carefully reviewing your submission. This typically takes 24–48 hours.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.3)',
  },
  approved: {
    icon: '✅',
    title: 'KYC Approved!',
    description: 'Congratulations! Your organizer account is now fully verified.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.3)',
  },
  rejected: {
    icon: '❌',
    title: 'KYC Rejected',
    description: 'Your KYC submission was not approved. Please check the reason below.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
  },
  reupload_requested: {
    icon: '📤',
    title: 'Document Reupload Required',
    description: 'Some documents need to be reuploaded. Please check the reason below.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.3)',
  },
  suspended: {
    icon: '🚫',
    title: 'Account Suspended',
    description: 'Your account has been suspended. Contact support for assistance.',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
  },
};

export default function StepApprovalPending({ session, kycData, kycStatus, onRefresh }) {
  const [timeAgo, setTimeAgo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const status = kycStatus || kycData?.kyc?.status || 'submitted';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['submitted'];

  // Compute time since submission
  useEffect(() => {
    const submittedAt = kycData?.submitted_at;
    if (!submittedAt) return;

    const update = () => {
      const diff = Date.now() - new Date(submittedAt).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) {
        setTimeAgo(`${hours}h ${minutes}m ago`);
      } else {
        setTimeAgo(`${minutes}m ago`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [kycData?.submitted_at]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className={pendingStyles.container}>
      {/* Status Badge */}
      <div
        className={pendingStyles.statusBadge}
        style={{ background: config.bg, borderColor: config.border }}
      >
        <div className={pendingStyles.statusIcon}>{config.icon}</div>
        <div>
          <h2 className={pendingStyles.statusTitle} style={{ color: config.color }}>
            {config.title}
          </h2>
          <p className={pendingStyles.statusDesc}>{config.description}</p>
          {timeAgo && (
            <p className={pendingStyles.submittedAt}>Submitted {timeAgo}</p>
          )}
        </div>
      </div>

      {/* Rejection Reason */}
      {(status === 'rejected' || status === 'reupload_requested') && kycData?.rejection_reason && (
        <div className={pendingStyles.rejectionBox}>
          <h4 className={pendingStyles.rejectionTitle}>📋 Admin Remarks:</h4>
          <p className={pendingStyles.rejectionText}>{kycData.rejection_reason}</p>
        </div>
      )}

      {/* Verification Summary */}
      {kycData?.identity && (
        <div className={pendingStyles.summaryCard}>
          <h3 className={pendingStyles.summaryTitle}>Verification Summary</h3>
          <div className={pendingStyles.summaryGrid}>
            <div className={pendingStyles.summaryItem}>
              <span className={pendingStyles.summaryLabel}>DigiLocker Identity</span>
              <span className={`${pendingStyles.summaryBadge} ${pendingStyles.badgeGreen}`}>✓ Verified</span>
            </div>
            <div className={pendingStyles.summaryItem}>
              <span className={pendingStyles.summaryLabel}>Age Verification (18+)</span>
              <span className={`${pendingStyles.summaryBadge} ${kycData.identity.age_verified ? pendingStyles.badgeGreen : pendingStyles.badgeRed}`}>
                {kycData.identity.age_verified ? '✓ Verified' : '✗ Failed'}
              </span>
            </div>
            <div className={pendingStyles.summaryItem}>
              <span className={pendingStyles.summaryLabel}>Aadhaar</span>
              <span className={`${pendingStyles.summaryBadge} ${kycData.identity.aadhaar_verified ? pendingStyles.badgeGreen : pendingStyles.badgeAmber}`}>
                {kycData.identity.aadhaar_verified ? '✓ Verified' : '⏳ Pending'}
              </span>
            </div>
            <div className={pendingStyles.summaryItem}>
              <span className={pendingStyles.summaryLabel}>PAN</span>
              <span className={`${pendingStyles.summaryBadge} ${kycData.identity.pan_verified ? pendingStyles.badgeGreen : pendingStyles.badgeAmber}`}>
                {kycData.identity.pan_verified ? '✓ Verified' : '⏳ Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Review Timeline */}
      {kycData?.review_logs?.length > 0 && (
        <div className={pendingStyles.timeline}>
          <h3 className={pendingStyles.timelineTitle}>Review Timeline</h3>
          {kycData.review_logs.map((log, idx) => (
            <div key={idx} className={pendingStyles.timelineItem}>
              <div className={pendingStyles.timelineDot} />
              <div>
                <p className={pendingStyles.timelineAction}>{log.action}</p>
                <p className={pendingStyles.timelineTime}>
                  {new Date(log.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                {log.remarks && <p className={pendingStyles.timelineRemarks}>{log.remarks}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline info */}
      {(status === 'submitted' || status === 'under_review') && (
        <div className={pendingStyles.timelineInfo}>
          <div className={pendingStyles.timelineSteps}>
            {['KYC Submitted', 'Admin Review', 'Risk Assessment', 'Final Approval'].map((step, i) => (
              <div key={step} className={`${pendingStyles.timelineStep} ${i < 2 ? pendingStyles.timelineStepDone : ''}`}>
                <div className={pendingStyles.timelineStepDot} />
                <span>{step}</span>
              </div>
            ))}
          </div>
          <p className={pendingStyles.timelineNote}>
            ⏱️ Average review time: 24–48 business hours. You will receive an email notification on your registered email.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className={pendingStyles.actions}>
        <button
          className={styles.btnSecondary}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? '⟳ Refreshing...' : '⟳ Refresh Status'}
        </button>

        {(status === 'rejected' || status === 'reupload_requested') && (
          <button
            className={styles.btnPrimary}
            onClick={() => window.location.href = '/organiser?kyc_restart=1'}
          >
            Restart Verification
          </button>
        )}

        <a
          href="mailto:support@bookmyticket.net"
          className={styles.btnSecondary}
          style={{ textDecoration: 'none' }}
        >
          Contact Support
        </a>
      </div>

      {/* Realtime badge */}
      <div className={pendingStyles.realtimeBadge}>
        <span className={pendingStyles.realtimeDot} />
        <span>Real-time status updates enabled</span>
      </div>
    </div>
  );
}
