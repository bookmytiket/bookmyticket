import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Platform, 
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MotiView, AnimatePresence } from 'moti';
import { 
  ArrowLeft, 
  QrCode, 
  Wallet, 
  CalendarDays, 
  LayoutDashboard, 
  Users, 
  TrendingUp,
  Settings,
  Briefcase,
  Star,
  CheckCircle,
  XCircle,
  ChevronRight,
  Bell,
  LogOut,
  Plus,
  Activity
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth, useSupabaseQuery } from '@/hooks/useSupabase';

export default function UnifiedManagerDashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, role, signOut } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // 1. Fetch Role-Specific Data
  const lowerRole = (role || '').trim().toLowerCase();
  const isOrganiser = lowerRole === 'organiser' || lowerRole === 'admin' || lowerRole === 'superadmin' || lowerRole === 'super_admin';
  const isProvider = lowerRole === 'provider' || lowerRole === 'service_provider' || lowerRole === 'vendor';
  const isStaff = !isOrganiser && !isProvider; // Safe default for staff/unauthorized users

  // Stats Data (Real-time)
  const { data: organiserWallet } = useSupabaseQuery('organiser_wallet', (q) => q.eq('organiser_id', user?.id), [user?.id], { enabled: !!user && isOrganiser });
  const { data: providerWallet } = useSupabaseQuery('provider_wallet', (q) => q.eq('service_provider_id', user?.id), [user?.id], { enabled: !!user && isProvider });
  
  // 2. Fetch Events First
  const { data: events } = useSupabaseQuery('events', (q) => {
    if (role === 'admin' || role === 'superadmin') {
      return q.order('created_at', { ascending: false });
    }
    return q.eq('organiser_id', user?.id).order('created_at', { ascending: false });
  }, [user?.id, role], { enabled: !!user && isOrganiser });

  const { data: services } = useSupabaseQuery('service_providers', (q) => q.eq('user_id', user?.id), [user?.id], { enabled: !!user && isProvider });

  // 3. Fetch Bookings based on Events/Provider
  const eventIds = useMemo(() => (events || []).map(e => e.id), [events]);
  const { data: bookings, error: bookingsError } = useSupabaseQuery(
    isProvider ? 'vendor_bookings' : 'bookings', 
    (q) => {
      if (role === 'admin' || role === 'superadmin') {
        return q.order('created_at', { ascending: false });
      }
      if (isOrganiser && eventIds.length > 0) {
        return q.in('event_id', eventIds).order('created_at', { ascending: false });
      }
      if (isProvider) {
        return q.eq('vendor_id', user?.id).order('created_at', { ascending: false });
      }
      return q.eq('id', '00000000-0000-0000-0000-000000000000'); // No-op
    }, 
    [user?.id, role, eventIds, isProvider], 
    { enabled: !!user && (isProvider || (isOrganiser && (eventIds.length > 0 || role?.includes('admin')))) }
  );

  const walletBalance = isOrganiser ? (apiStats?.walletBalance || 0) : providerWallet?.[0]?.balance;

  const fetchApiStats = async () => {
    if (!user || !isOrganiser) return;
    try {
      setApiLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('https://bookmyticket.net/api/organiser/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch API stats:', err);
    } finally {
      setApiLoading(false);
    }
  };

  React.useEffect(() => {
    fetchApiStats();
  }, [user, isOrganiser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApiStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const STATS = useMemo(() => {
    if (isOrganiser) {
      const stats = apiStats || { totalEvents: 0, activeEvents: 0, totalBookings: 0, revenue: 0, expiredEvents: 0 };
      return [
        { label: 'Total Revenue', value: `₹${Number(stats.revenue).toLocaleString()}`, icon: <TrendingUp size={20} color="#fff" />, colors: ['#f59e0b', '#d97706'] },
        { label: 'Total Events', value: stats.totalEvents, icon: <LayoutDashboard size={20} color="#fff" />, colors: ['#3b82f6', '#2563eb'] },
        { label: 'Total Bookings', value: stats.totalBookings, icon: <Users size={20} color="#fff" />, colors: ['#a855f7', '#7c3aed'] },
        { label: 'Active Events', value: stats.activeEvents, icon: <Activity size={20} color="#fff" />, colors: ['#10b981', '#059669'] },
        { label: 'Expired Events', value: stats.expiredEvents, icon: <CalendarDays size={20} color="#fff" />, colors: ['#64748b', '#475569'] },
      ];
    } else if (isProvider) {
      return [
        { label: 'Total Earnings', value: `₹${walletBalance || 0}`, icon: <TrendingUp size={20} color="#fff" />, colors: ['#3b82f6', '#2563eb'] },
        { label: 'Active Services', value: services?.length || 0, icon: <Briefcase size={20} color="#fff" />, colors: ['#a855f7', '#7c3aed'] },
        { label: 'Avg Rating', value: '4.8', icon: <Star size={20} color="#fff" />, colors: ['#f59e0b', '#d97706'] },
      ];
    } else {
      // Staff Stats
      const confirmedBookings = (bookings || []).filter(b => b.status === 'Confirmed' || b.status === 'Paid');
      return [
        { label: 'Tickets Verified', value: confirmedBookings.length, icon: <CheckCircle size={20} color="#fff" />, colors: ['#10b981', '#059669'] },
        { label: 'Shift Status', value: 'Active', icon: <Activity size={20} color="#fff" />, colors: ['#3b82f6', '#2563eb'] },
      ];
    }
  }, [isOrganiser, isProvider, isStaff, bookings, events, services, walletBalance]);

  if (!user || !role) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#f844a4" />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Loading Portal...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#f844a4', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: 'https://bookmyticket.net/logo.png' }} 
            style={{ width: 180, height: 50, tintColor: '#fff' }}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={onRefresh} style={[styles.iconBtn, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <ActivityIndicator animating={refreshing} size="small" color="#fff" />
            {!refreshing && <TrendingUp size={18} color="#fff" />}
          </Pressable>
          <Pressable 
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: async () => {
                  await signOut();
                  router.replace('/auth/sign-in');
                }}
              ]);
            }} 
            style={styles.logoutBtn}
          >
            <LogOut size={20} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
      >
        {/* Profile/Wallet Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <LinearGradient
            colors={isOrganiser ? ['#a855f7', '#f844a4'] : isStaff ? ['#10b981', '#3b82f6'] : ['#3b82f6', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainCard}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardGreeting}>Hello, {user?.user_metadata?.full_name || (isStaff ? 'Event Staff' : 'Partner')}</Text>
                <Text style={styles.cardSubText}>{isStaff ? 'Ticket Verification Active' : isOrganiser ? 'Managing Events & Sales' : 'Managing Services & Portfolios'}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{role.toUpperCase()}</Text>
              </View>
            </View>

            {isStaff ? (
              <View style={styles.staffActionSection}>
                <Pressable 
                  style={styles.staffScannerBtn}
                  onPress={() => router.push('/staff/scan')}
                >
                  <QrCode size={24} color="#10b981" />
                  <Text style={styles.staffScannerBtnText}>Open Scanner</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.walletSection}>
                <View>
                  <Text style={styles.walletLabel}>Wallet Balance</Text>
                  <Text style={styles.walletValue}>₹{walletBalance || '0.00'}</Text>
                </View>
                <Pressable style={styles.withdrawBtn}>
                  <Text style={styles.withdrawBtnText}>Withdraw</Text>
                </Pressable>
              </View>
            )}
          </LinearGradient>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <View key={i} style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <LinearGradient colors={stat.colors as any} style={styles.statIcon}>{stat.icon}</LinearGradient>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {!isStaff && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Management Tools</Text>
              <View style={styles.actionsGrid}>
                <Pressable 
                  style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push('/staff/scan')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#eef2ff' }]}>
                    <QrCode size={24} color="#6366f1" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>{isOrganiser ? 'Scan Tickets' : 'Scanner'}</Text>
                </Pressable>

                <Pressable 
                  style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    const targetUrl = isOrganiser 
                      ? 'https://bookmyticket.net/organiser?tab=post_event' 
                      : 'https://bookmyticket.net/vendor/services?action=new';
                    router.push({ pathname: '/web', params: { url: targetUrl } });
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fdf2f8' }]}>
                    <Plus size={24} color="#f844a4" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>{isOrganiser ? 'Post Event' : 'Add Service'}</Text>
                </Pressable>

                <Pressable style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}>
                    <CalendarDays size={24} color="#ef4444" />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text }]}>{isOrganiser ? 'My Events' : 'My Schedule'}</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Recent Bookings List */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{isStaff ? 'Recently Scanned' : 'Recent Bookings'}</Text>
            {!isStaff && (
              <Pressable>
                <Text style={{ color: '#f844a4', fontWeight: '700' }}>View All</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.bookingsList}>
            {(bookings || []).slice(0, 5).map((booking, i) => (
              <Pressable key={i} style={[styles.bookingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statusIndicator, { backgroundColor: booking.status === 'Confirmed' ? '#10b981' : '#f59e0b' }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.bookingName, { color: colors.text }]}>{booking.customer_details?.name || 'Guest'}</Text>
                  <Text style={[styles.bookingMeta, { color: colors.muted }]}>{booking.event_name || 'Special Event'} • {booking.ticket_count} Seats</Text>
                </View>
                <ChevronRight size={20} color={colors.border} />
              </Pressable>
            ))}
            {(!bookings || bookings.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={{ color: colors.muted, fontWeight: '600' }}>No recent bookings found.</Text>
              </View>
            )}
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.05)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  mainCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  cardGreeting: { color: '#fff', fontSize: 22, fontWeight: '900' },
  cardSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  walletSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  walletValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  withdrawBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  withdrawBtnText: { color: '#a855f7', fontWeight: '800', fontSize: 13 },
  staffActionSection: { marginTop: 10 },
  staffScannerBtn: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  staffScannerBtnText: { color: '#10b981', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statItem: { width: '31%', minWidth: 100, padding: 12, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  actionCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 10 },
  actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 11, fontWeight: '800' },
  bookingsList: { gap: 10 },
  bookingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1 },
  statusIndicator: { width: 4, height: 30, borderRadius: 2 },
  bookingName: { fontSize: 15, fontWeight: '800' },
  bookingMeta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 20 },
});
