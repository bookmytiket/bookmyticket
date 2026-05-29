'use client';

/**
 * Admin KYC Review Panel Component
 * Integrates into the existing Admin Panel page
 * Shows all pending/submitted KYC applications with risk scores
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './AdminDigiLockerKYC.module.css';

const STATUS_FILTERS = ['submitted', 'under_review', 'approved', 'rejected', 'reupload_requested', 'suspended'];

export default function AdminKYCReview({ adminSession }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('submitted');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm] = useState({ remarks: '', risk_score_override: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async (status = activeFilter, page = 1) => {
    if (!adminSession?.access_token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/admin/kyc?status=${status}&page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${adminSession.access_token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to load KYC submissions');
        setRecords([]);
      }
    } catch (err) {
      console.error('Admin KYC fetch error:', err);
      setError('Network error. Please try again.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [adminSession?.access_token, activeFilter]);

  useEffect(() => {
    fetchRecords(activeFilter, 1);
  }, [activeFilter]);

  const handleAction = async (action) => {
    if (!selectedRecord) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSession?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          organizer_id: selectedRecord.organizer_id,
          remarks: actionForm.remarks || null,
          risk_score_override: actionForm.risk_score_override
            ? parseInt(actionForm.risk_score_override)
            : undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`KYC ${action} action applied successfully`, 'success');
        setActionModal(null);
        setSelectedRecord(null);
        setActionForm({ remarks: '', risk_score_override: '' });
        fetchRecords();
      } else {
        showToast(data.error || `Failed to ${action} KYC`, 'error');
      }
    } catch (err) {
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getRiskBadge = (score) => {
    if (score >= 70) return { label: 'High Risk', cls: styles.riskHigh };
    if (score >= 30) return { label: 'Medium Risk', cls: styles.riskMedium };
    return { label: 'Low Risk', cls: styles.riskLow };
  };

  return (
    <div className={styles.container}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>DigiLocker KYC Review</h2>
          <p className={styles.subtitle}>Review and approve organizer identity verifications</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => fetchRecords()}>
          ⟳ Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            className={`${styles.filterTab} ${activeFilter === status ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter(status)}
          >
            {status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Records Table */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading KYC submissions...</span>
        </div>
      ) : error ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>⚠️</span>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
          <button className={styles.refreshBtn} onClick={() => fetchRecords()} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          <p>No {activeFilter} KYC submissions</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organizer</th>
                <th>DigiLocker Status</th>
                <th>Documents</th>
                <th>Risk Score</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const risk = getRiskBadge(record.risk_score || 0);
                return (
                  <tr
                    key={record.organizer_id}
                    className={selectedRecord?.organizer_id === record.organizer_id ? styles.rowSelected : ''}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <td>
                      <div className={styles.organizerCell}>
                        {record.profile_photo_url ? (
                          <img
                            src={record.profile_photo_url}
                            alt="Profile"
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {(record.verified_name || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className={styles.organizerName}>{record.verified_name || 'Unknown'}</p>
                          <p className={styles.organizerEmail}>{record.verified_email || '—'}</p>
                          <p className={styles.organizerPhone}>{record.verified_mobile || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.verificationCell}>
                        <span className={`${styles.verBadge} ${record.aadhaar_verified ? styles.verGreen : styles.verAmber}`}>
                          Aadhaar {record.aadhaar_verified ? '✓' : '—'}
                        </span>
                        <span className={`${styles.verBadge} ${record.pan_verified ? styles.verGreen : styles.verAmber}`}>
                          PAN {record.pan_verified ? '✓' : '—'}
                        </span>
                        <span className={`${styles.verBadge} ${record.age_verified ? styles.verGreen : styles.verRed}`}>
                          Age {record.age_verified ? '✓' : '✗'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.docsCell}>
                        {record.digilocker_issued_documents?.slice(0, 3).map((doc, i) => (
                          <span key={`dl-${i}`} className={styles.docChip}>{doc.document_type}</span>
                        ))}
                        {record.organizer_kyc_documents?.slice(0, 3).map((doc, i) => (
                          <span key={`man-${i}`} className={`${styles.docChip} ${styles.manualChip}`} style={{ background: '#fef08a', color: '#854d0e', borderColor: '#fde047' }}>Manual {doc.document_type}</span>
                        ))}
                        {((record.digilocker_issued_documents?.length || 0) + (record.organizer_kyc_documents?.length || 0)) > 4 && (
                          <span className={styles.docChip}>+{((record.digilocker_issued_documents?.length || 0) + (record.organizer_kyc_documents?.length || 0)) - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.riskCell}>
                        <div className={styles.riskScore}>{record.risk_score || 0}</div>
                        <span className={`${styles.riskBadge} ${risk.cls}`}>{risk.label}</span>
                        {record.is_duplicate && (
                          <span className={styles.dupFlag}>DUPLICATE</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <p className={styles.dateCell}>
                        {record.submitted_at
                          ? new Date(record.submitted_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </td>
                    <td>
                      <div className={styles.actionBtns} onClick={(e) => e.stopPropagation()}>
                        {activeFilter !== 'approved' && (
                          <button
                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                            onClick={() => { setSelectedRecord(record); setActionModal('approve'); }}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.rejectBtn}`}
                          onClick={() => { setSelectedRecord(record); setActionModal('reject'); }}
                        >
                          Reject
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.reuploadBtn}`}
                          onClick={() => { setSelectedRecord(record); setActionModal('reupload'); }}
                        >
                          Reupload
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.suspendBtn}`}
                          onClick={() => { setSelectedRecord(record); setActionModal('suspend'); }}
                        >
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      {selectedRecord && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <h3>KYC Detail</h3>
            <button className={styles.closeBtn} onClick={() => setSelectedRecord(null)}>✕</button>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailSection}>
              <h4>Verified Identity</h4>
              <div className={styles.detailRow}>
                <span>Name</span><span>{selectedRecord.verified_name || '—'}</span>
              </div>
              <div className={styles.detailRow}>
                <span>DOB</span>
                <span>{selectedRecord.verified_dob
                  ? new Date(selectedRecord.verified_dob).toLocaleDateString('en-IN')
                  : '—'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span>Email</span><span>{selectedRecord.verified_email || '—'}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Mobile</span><span>{selectedRecord.verified_mobile || '—'}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Gender</span><span>{selectedRecord.verified_gender || '—'}</span>
              </div>
              {selectedRecord.pan_number && (
                <div className={styles.detailRow}>
                  <span>PAN Number</span><span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{selectedRecord.pan_number}</span>
                </div>
              )}
            </div>

            {selectedRecord.verified_address && (
              <div className={styles.detailSection}>
                <h4>Verified Address</h4>
                <div className={styles.detailRow}>
                  <span>Street</span>
                  <span>{selectedRecord.verified_address.house} {selectedRecord.verified_address.street}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>City</span><span>{selectedRecord.verified_address.city}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>State</span><span>{selectedRecord.verified_address.state}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Pincode</span><span>{selectedRecord.verified_address.pincode}</span>
                </div>
              </div>
            )}

            {selectedRecord.fraud_flags?.length > 0 && (
              <div className={styles.detailSection}>
                <h4>⚠️ Risk Flags</h4>
                {selectedRecord.fraud_flags.map((flag) => (
                  <div key={flag} className={styles.flagItem}>{flag}</div>
                ))}
              </div>
            )}

            {selectedRecord.organizer_kyc_documents?.length > 0 && (
              <div className={styles.detailSection} style={{ gridColumn: '1 / -1' }}>
                <h4>Manually Uploaded Documents</h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {selectedRecord.organizer_kyc_documents.map((doc, i) => (
                    <a 
                      key={i} 
                      href={doc.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#0f172a',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                    >
                      <span style={{ fontSize: '20px' }}>📄</span>
                      {doc.document_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && selectedRecord && (
        <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {actionModal.charAt(0).toUpperCase() + actionModal.slice(1)} KYC
            </h3>
            <p className={styles.modalDesc}>
              Organizer: <strong>{selectedRecord.verified_name}</strong>
            </p>

            {actionModal === 'approve' && (
              <div className={styles.formGroup}>
                <label>Risk Score Override (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={styles.modalInput}
                  placeholder="Leave blank to keep auto-calculated"
                  value={actionForm.risk_score_override}
                  onChange={(e) => setActionForm((f) => ({ ...f, risk_score_override: e.target.value }))}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Remarks {actionModal !== 'approve' ? '*' : '(Optional)'}</label>
              <textarea
                className={styles.modalInput}
                rows={3}
                placeholder={
                  actionModal === 'reject' ? 'Reason for rejection...' :
                  actionModal === 'reupload' ? 'Specify which documents to reupload...' :
                  actionModal === 'suspend' ? 'Reason for suspension...' :
                  'Optional notes...'
                }
                value={actionForm.remarks}
                onChange={(e) => setActionForm((f) => ({ ...f, remarks: e.target.value }))}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => { setActionModal(null); setActionForm({ remarks: '', risk_score_override: '' }); }}
              >
                Cancel
              </button>
              <button
                className={`${styles.modalConfirm} ${styles[`confirm${actionModal.charAt(0).toUpperCase() + actionModal.slice(1)}`]}`}
                onClick={() => handleAction(actionModal)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Confirm ${actionModal.charAt(0).toUpperCase() + actionModal.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
