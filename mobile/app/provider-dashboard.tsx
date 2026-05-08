import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuth, useSupabaseQuery } from '@/hooks/useSupabase';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  Settings,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

export default function ProviderDashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();

  // Fetch Service Requests for this provider
  const { data: requests, loading } = useSupabaseQuery(
    'service_requests',
    (q) => q.eq('provider_id', user?.id).order('created_at', { ascending: false }),
    [user?.id],
    { realtime: true, enabled: !!user }
  );

  const stats = {
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    confirmed: requests?.filter(r => r.status === 'confirmed').length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0,
  };

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <RNView style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Provider Dashboard</Text>
        <Pressable style={styles.settingsBtn}>
          <Settings size={20} color={colors.text} />
        </Pressable>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Row */}
        <RNView style={styles.statsRow}>
          <RNView style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>PENDING</Text>
          </RNView>
          <RNView style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.tint }]}>{stats.confirmed}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>ACTIVE</Text>
          </RNView>
          <RNView style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>DONE</Text>
          </RNView>
        </RNView>

        {/* Action Button */}
        <Pressable 
          style={[styles.addServiceBtn, { backgroundColor: colors.tint }]}
          onPress={() => {
            const targetUrl = 'https://bookmyticket.net/vendor/services?action=new';
            router.push({ pathname: '/web', params: { url: targetUrl } });
          }}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addServiceBtnText}>Add New Service</Text>
        </Pressable>

        {/* Recent Requests */}
        <RNView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Requests</Text>
          {loading ? (
            <Text style={{ color: colors.muted }}>Loading requests...</Text>
          ) : requests?.length === 0 ? (
            <RNView style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Briefcase size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12, fontWeight: '600' }}>No requests yet</Text>
            </RNView>
          ) : (
            requests?.map((req, i) => (
              <RequestCard key={req.id} request={req} colors={colors} />
            ))
          )}
        </RNView>
      </ScrollView>
    </RNView>
  );
}

function RequestCard({ request, colors }: any) {
  const router = useRouter();
  const getStatusColor = () => {
    switch(request.status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return colors.tint;
      case 'completed': return '#22c55e';
      default: return colors.muted;
    }
  };

  return (
    <Pressable 
      onPress={() => {}}
      style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <RNView style={styles.requestHeader}>
        <Text style={[styles.requestTitle, { color: colors.text }]}>{request.service_name || 'Service Request'}</Text>
        <RNView style={[styles.statusBadge, { backgroundColor: getStatusColor() + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{request.status.toUpperCase()}</Text>
        </RNView>
      </RNView>
      <RNView style={styles.requestFooter}>
        <RNView style={styles.requestMeta}>
          <Clock size={12} color={colors.muted} />
          <Text style={[styles.requestDate, { color: colors.muted }]}>{new Date(request.created_at).toLocaleDateString()}</Text>
        </RNView>
        <ChevronRight size={18} color={colors.muted} />
      </RNView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  backBtn: { padding: 4 },
  settingsBtn: { padding: 4 },
  scrollContent: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statItem: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  addServiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, marginBottom: 32 },
  addServiceBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  emptyCard: { padding: 40, alignItems: 'center', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2 },
  requestCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  requestTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900' },
  requestFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requestDate: { fontSize: 12, fontWeight: '600' },
});
