import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending: {
    icon: 'time-outline',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    gradientColors: ['#f59e0b', '#d97706'],
    label: 'Under Review',
    message: 'Your application is being reviewed by our team. We\'ll notify you within 3-5 business days.',
  },
  'kyc pending': {
    icon: 'shield-checkmark-outline',
    color: '#a16207',
    bg: '#fffbeb',
    border: '#fde68a',
    gradientColors: ['#f59e0b', '#ca8a04'],
    label: 'KYC Pending',
    message: 'Please complete your KYC verification to continue your Event Organiser onboarding.',
  },
  'kyc completed': {
    icon: 'document-text-outline',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    gradientColors: ['#3b82f6', '#2563eb'],
    label: 'KYC Submitted',
    message: 'Your KYC documents are submitted. Admin review is in progress.',
  },
  'access granted': {
    icon: 'checkmark-done-circle',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#bbf7d0',
    gradientColors: ['#10b981', '#059669'],
    label: 'Access Granted',
    message: 'Your onboarding is complete. You can now access your panel.',
  },
  approved: {
    icon: 'checkmark-circle',
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    gradientColors: ['#10b981', '#059669'],
    label: 'Approved! 🎉',
    message: 'Congratulations! Your partner request has been approved. You can now access your dashboard.',
  },
  rejected: {
    icon: 'close-circle',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    gradientColors: ['#ef4444', '#dc2626'],
    label: 'Not Approved',
    message: 'Unfortunately your request was not approved at this time. You may reapply after 30 days.',
  },
};

export default function PartnerStatusScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Migrated to Supabase
  const { data: requests, loading: isLoading } = useSupabaseQuery('partner_requests', (q) => 
    q.select('*').eq('email', user?.identifier).order('created_at', { ascending: false }), 
    [user?.identifier]
  );

  const latest = requests?.[0];
  const status = latest?.status?.toLowerCase() || 'pending';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  if (!latest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Status</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>No Application Found</Text>
          <Text style={styles.emptySub}>Submit a partner request to get started.</Text>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => navigation.navigate('BecomePartner')}
          >
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <LinearGradient
          colors={config.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusIconWrap}>
            <Ionicons name={config.icon} size={56} color="#fff" />
          </View>
          <Text style={styles.statusLabel}>{config.label}</Text>
          <Text style={styles.statusMessage}>{config.message}</Text>
        </LinearGradient>

        {/* Application Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Application Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Name</Text>
            <Text style={styles.detailValue}>{latest.first_name || latest.firstName} {latest.last_name || latest.lastName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Category</Text>
            <Text style={styles.detailValue}>{latest.category || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Role</Text>
            <Text style={styles.detailValue}>{latest.role || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Submitted</Text>
            <Text style={styles.detailValue}>
              {latest.created_at
                ? new Date(latest.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A'}
            </Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailKey}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
              <Text style={[styles.statusBadgeText, { color: config.color }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {(status === 'approved' || status === 'access granted') && (
          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Ionicons name="grid-outline" size={20} color="#fff" />
            <Text style={styles.dashboardBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        )}

        {status === 'rejected' && (
          <TouchableOpacity
            style={styles.reapplyBtn}
            onPress={() => navigation.navigate('BecomePartner')}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.secondary} />
            <Text style={styles.reapplyBtnText}>Submit New Application</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.homeLink} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.homeLinkText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  scrollContent: { padding: 20 },

  // Status Card
  statusCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  statusIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusLabel: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  statusMessage: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 },

  // Details Card
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailsTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailKey: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },

  // Action buttons
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dashboardBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  reapplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    marginBottom: 12,
  },
  reapplyBtnText: { color: Colors.secondary, fontSize: 16, fontWeight: '700' },
  homeLink: { alignItems: 'center', padding: 12 },
  homeLinkText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  applyBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
