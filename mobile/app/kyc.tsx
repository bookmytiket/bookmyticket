/**
 * DigiLocker KYC Screen – Expo Mobile App
 * Handles organizer KYC flow via WebBrowser
 * 
 * Uses expo-web-browser for OAuth redirect
 * Tracks KYC status via Supabase Realtime
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://www.bookmyticket.net';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const KYC_STEPS = [
  { id: 1, label: 'Basic Profile', icon: 'person-outline' },
  { id: 2, label: 'DigiLocker', icon: 'shield-checkmark-outline' },
  { id: 3, label: 'Business Info', icon: 'business-outline' },
  { id: 4, label: 'Bank Setup', icon: 'card-outline' },
  { id: 5, label: 'Approval', icon: 'checkmark-circle-outline' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', icon: 'time-outline' },
  in_progress: { label: 'In Progress', color: '#3b82f6', icon: 'sync-outline' },
  submitted: { label: 'Submitted', color: '#3b82f6', icon: 'document-text-outline' },
  under_review: { label: 'Under Review', color: '#8b5cf6', icon: 'search-outline' },
  approved: { label: 'Approved ✓', color: '#10b981', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', color: '#ef4444', icon: 'close-circle-outline' },
  reupload_requested: { label: 'Reupload Required', color: '#f97316', icon: 'cloud-upload-outline' },
  suspended: { label: 'Suspended', color: '#6b7280', icon: 'ban-outline' },
};

export default function KYCScreen() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Get session ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch KYC Status ─────────────────────────────────────────────────────
  const fetchKYCStatus = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/organizer/kyc/status`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) setKycData(data);
    } catch (err) {
      console.error('KYC fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session) fetchKYCStatus();
  }, [session, fetchKYCStatus]);

  // ── Realtime KYC Updates ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`mobile-kyc-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'digilocker_kyc_records',
          filter: `organizer_id=eq.${session.user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.kyc_status;
          if (newStatus) {
            fetchKYCStatus();
            if (newStatus === 'approved') {
              Alert.alert(
                '🎉 KYC Approved!',
                'Your organizer account is now verified. You can start creating events!',
                [{ text: 'Go to Dashboard', onPress: () => router.replace('/organiser-dashboard') }]
              );
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user?.id, fetchKYCStatus, router]);

  // ── Initiate DigiLocker ──────────────────────────────────────────────────
  const handleInitiateDigiLocker = async () => {
    if (!session?.access_token) return;

    try {
      setInitiating(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/digilocker/initiate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate DigiLocker');
      }

      // Open DigiLocker in system browser
      const canOpen = await Linking.canOpenURL(data.authorization_url);
      if (canOpen) {
        await Linking.openURL(data.authorization_url);
        // Refresh status after user returns
        setTimeout(() => fetchKYCStatus(), 3000);
      } else {
        Alert.alert('Error', 'Cannot open DigiLocker. Please try on the web portal.');
      }

    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to start DigiLocker verification');
    } finally {
      setInitiating(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchKYCStatus();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7c3aed" size="large" />
        <Text style={styles.loadingText}>Loading KYC status...</Text>
      </View>
    );
  }

  const kycStatus = kycData?.kyc?.status || 'pending';
  const statusConfig = STATUS_CONFIG[kycStatus] || STATUS_CONFIG['pending'];
  const currentStep = kycData?.kyc?.current_step || 1;
  const digilockerVerified = kycData?.kyc?.digilocker_verified || false;
  const dashboardAccess = kycData?.kyc?.dashboard_access || false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1e1b4b', '#0f172a']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <Text style={styles.headerSubtitle}>DigiLocker × BookMyTicket</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { borderColor: statusConfig.color + '40', backgroundColor: statusConfig.color + '15' }]}>
          <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </LinearGradient>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        <Text style={styles.sectionTitle}>Verification Progress</Text>
        <View style={styles.stepsList}>
          {KYC_STEPS.map((step, idx) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  isCompleted && styles.stepDotCompleted,
                  isActive && styles.stepDotActive,
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>
                      {step.id}
                    </Text>
                  )}
                </View>
                {idx < KYC_STEPS.length - 1 && (
                  <View style={[styles.stepLine, isCompleted && styles.stepLineDone]} />
                )}
                <View style={styles.stepInfo}>
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={isActive ? '#a78bfa' : isCompleted ? '#34d399' : '#4b5563'}
                  />
                  <Text style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isCompleted && styles.stepLabelCompleted,
                  ]}>
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* DigiLocker Section */}
      {!digilockerVerified && !dashboardAccess && (
        <View style={styles.digilockerCard}>
          <LinearGradient
            colors={['#1e3a5f', '#1e1b4b']}
            style={styles.digilockerGradient}
          >
            <View style={styles.digilockerHeader}>
              <Text style={styles.digilockerFlag}>🇮🇳</Text>
              <View>
                <Text style={styles.digilockerTitle}>Verify with DigiLocker</Text>
                <Text style={styles.digilockerSubtitle}>MeriPehchaan • Govt. of India</Text>
              </View>
            </View>
            <Text style={styles.digilockerDesc}>
              Instantly verify your identity using your Aadhaar-linked DigiLocker account.
              No manual document uploads required.
            </Text>

            <View style={styles.scopeList}>
              {['Aadhaar & PAN Verification', 'Age & Address Verification', 'Profile Photo', 'Government-issued Documents'].map((scope) => (
                <View key={scope} style={styles.scopeItem}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#818cf8" />
                  <Text style={styles.scopeText}>{scope}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.digilockerBtn}
              onPress={handleInitiateDigiLocker}
              disabled={initiating}
            >
              {initiating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.digilockerBtnText}>Verify with DigiLocker</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.securityNote}>
              🔒 PKCE OAuth 2.0 secured. Tokens stored server-side only.
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* Verified Identity */}
      {digilockerVerified && kycData?.identity && (
        <View style={styles.identityCard}>
          <View style={styles.identityHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#34d399" />
            <Text style={styles.identityTitle}>DigiLocker Verified ✓</Text>
          </View>
          <View style={styles.identityGrid}>
            <View style={styles.identityField}>
              <Text style={styles.identityLabel}>Full Name</Text>
              <Text style={styles.identityValue}>{kycData.identity.verified_name || '—'}</Text>
            </View>
            <View style={styles.identityField}>
              <Text style={styles.identityLabel}>Age Verified</Text>
              <Text style={[styles.identityValue, { color: kycData.identity.age_verified ? '#34d399' : '#f87171' }]}>
                {kycData.identity.age_verified ? `✓ ${kycData.identity.age_at_verification} yrs` : '✗ Failed'}
              </Text>
            </View>
            <View style={styles.identityField}>
              <Text style={styles.identityLabel}>Aadhaar</Text>
              <Text style={[styles.identityValue, { color: kycData.identity.aadhaar_verified ? '#34d399' : '#fbbf24' }]}>
                {kycData.identity.aadhaar_verified ? '✓ Verified' : '⏳ Pending'}
              </Text>
            </View>
            <View style={styles.identityField}>
              <Text style={styles.identityLabel}>PAN</Text>
              <Text style={[styles.identityValue, { color: kycData.identity.pan_verified ? '#34d399' : '#fbbf24' }]}>
                {kycData.identity.pan_verified ? '✓ Verified' : '⏳ Pending'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Documents */}
      {kycData?.documents?.length > 0 && (
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>DigiLocker Documents</Text>
          {kycData.documents.map((doc) => (
            <View key={doc.id} style={styles.docItem}>
              <View style={styles.docTypeChip}>
                <Text style={styles.docTypeText}>{doc.document_type}</Text>
              </View>
              <Text style={styles.docName}>{doc.document_name}</Text>
              <Ionicons
                name={doc.verification_status === 'verified' ? 'checkmark-circle' : 'time'}
                size={16}
                color={doc.verification_status === 'verified' ? '#34d399' : '#fbbf24'}
              />
            </View>
          ))}
        </View>
      )}

      {/* Status Card for submitted/under_review */}
      {['submitted', 'under_review'].includes(kycStatus) && (
        <View style={styles.pendingCard}>
          <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
          <Text style={styles.pendingTitle}>Under Admin Review</Text>
          <Text style={styles.pendingDesc}>
            Your KYC submission is being reviewed by our team.
            You will receive a notification once it's processed.
            Average review time: 24–48 hours.
          </Text>
          <Text style={styles.realtimeNote}>
            🟢 Real-time updates enabled – you'll be notified instantly
          </Text>
        </View>
      )}

      {/* Rejection/Reupload reason */}
      {(['rejected', 'reupload_requested'].includes(kycStatus) && kycData?.rejection_reason) && (
        <View style={styles.rejectionCard}>
          <Text style={styles.rejectionTitle}>Admin Remarks</Text>
          <Text style={styles.rejectionText}>{kycData.rejection_reason}</Text>
          <TouchableOpacity style={styles.restartBtn} onPress={handleInitiateDigiLocker}>
            <Text style={styles.restartBtnText}>Restart Verification</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Web Portal CTA */}
      <TouchableOpacity
        style={styles.webPortalCta}
        onPress={() => Linking.openURL(`${API_BASE_URL}/organiser`)}
      >
        <Ionicons name="open-outline" size={16} color="#a78bfa" />
        <Text style={styles.webPortalCtaText}>Complete full KYC on Web Portal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  contentContainer: { paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: '#080810', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#64748b', fontSize: 14 },

  // Header
  headerGradient: { padding: 24, paddingTop: Platform.OS === 'ios' ? 56 : 32 },
  headerContent: { marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#6366f1' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusLabel: { fontSize: 13, fontWeight: '700' },

  // Steps
  stepsContainer: { margin: 16, backgroundColor: 'rgba(15,15,40,0.8)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.05 },
  stepsList: { gap: 0 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(30,27,75,0.8)', borderWidth: 2, borderColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepDotCompleted: { backgroundColor: 'rgba(5,150,105,0.3)', borderColor: '#059669' },
  stepDotActive: { backgroundColor: 'rgba(124,58,237,0.3)', borderColor: '#7c3aed' },
  stepLine: { position: 'absolute', left: 13, top: 28, width: 2, height: 12, backgroundColor: 'rgba(124,58,237,0.15)' },
  stepLineDone: { backgroundColor: 'rgba(124,58,237,0.5)' },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
  stepNumActive: { color: '#a78bfa' },
  stepInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  stepLabel: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
  stepLabelActive: { color: '#a78bfa', fontWeight: '700' },
  stepLabelCompleted: { color: '#34d399' },

  // DigiLocker Card
  digilockerCard: { margin: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  digilockerGradient: { padding: 24 },
  digilockerHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  digilockerFlag: { fontSize: 40 },
  digilockerTitle: { fontSize: 18, fontWeight: '800', color: '#f1f5f9', marginBottom: 2 },
  digilockerSubtitle: { fontSize: 12, color: '#6366f1' },
  digilockerDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 20, marginBottom: 16 },
  scopeList: { gap: 8, marginBottom: 20 },
  scopeItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scopeText: { fontSize: 13, color: '#a5b4fc' },
  digilockerBtn: { backgroundColor: '#1d4ed8', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  digilockerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  securityNote: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 12 },

  // Identity Card
  identityCard: { margin: 16, backgroundColor: 'rgba(5,150,105,0.08)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(5,150,105,0.25)' },
  identityHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  identityTitle: { fontSize: 16, fontWeight: '700', color: '#34d399' },
  identityGrid: { gap: 12 },
  identityField: { flexDirection: 'row', justifyContent: 'space-between' },
  identityLabel: { fontSize: 13, color: '#64748b' },
  identityValue: { fontSize: 13, fontWeight: '700', color: '#f1f5f9' },

  // Documents
  documentsSection: { margin: 16 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(30,27,75,0.4)', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(124,58,237,0.1)' },
  docTypeChip: { backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  docTypeText: { fontSize: 10, fontWeight: '700', color: '#a78bfa' },
  docName: { flex: 1, fontSize: 13, color: '#94a3b8' },

  // Pending Card
  pendingCard: { margin: 16, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', alignItems: 'center', gap: 10 },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: '#60a5fa' },
  pendingDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  realtimeNote: { fontSize: 12, color: '#34d399', textAlign: 'center' },

  // Rejection Card
  rejectionCard: { margin: 16, backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)', gap: 12 },
  rejectionTitle: { fontSize: 14, fontWeight: '700', color: '#fca5a5' },
  rejectionText: { fontSize: 13, color: '#fecaca', lineHeight: 20 },
  restartBtn: { backgroundColor: '#dc2626', borderRadius: 10, padding: 12, alignItems: 'center' },
  restartBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Web CTA
  webPortalCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 14, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  webPortalCtaText: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
});
