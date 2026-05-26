import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  Dimensions,
  ImageBackground,
  RefreshControl
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth, useSupabaseQuery } from '@/hooks/useSupabase';
import UnifiedApi from '@/lib/unifiedApi';
import {
  ArrowLeft, Calendar, Ticket, TrendingUp, Plus, ChevronRight, 
  BarChart3, Users, QrCode, FileCheck, Trophy, Bell, ShieldCheck, 
  Clock, Activity
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export default function OrganiserDashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Organiser's Events
  const { data: events, loading: eventsLoading, refetch: refetchEvents } = useSupabaseQuery(
    'events',
    (q) => q.eq('organiser_id', user?.id).order('created_at', { ascending: false }),
    [user?.id],
    { realtime: true, enabled: !!user }
  );

  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeEvents: 0,
    pendingKYC: 0
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);

  const loadDashboardData = async () => {
    if (!events || events.length === 0) return;
    const eventIds = events.map(e => e.id);

    // Fetch regular bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    // Fetch Sports Events linked to these events
    const { data: sportsEvents } = await supabase
      .from('sports_events')
      .select('id, sport_type')
      .in('event_id', eventIds);

    const sportEventIds = sportsEvents?.map(se => se.id) || [];

    // Fetch Pending KYC Documents for Sports
    if (sportEventIds.length > 0) {
      const { data: registrations } = await supabase
        .from('sports_registrations')
        .select('participant_id')
        .in('sports_event_id', sportEventIds);
        
      const participantIds = registrations?.map(r => r.participant_id) || [];
      if (participantIds.length > 0) {
        const { data: docs } = await supabase
          .from('participant_documents')
          .select('id, document_type, verification_status')
          .in('participant_id', participantIds)
          .eq('verification_status', 'Pending');
          
        setPendingDocs(docs || []);
      }
    }

    if (bookingsData) {
      setRecentBookings(bookingsData.slice(0, 5));
      const totalRev = bookingsData.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);
      
      const now = new Date();
      const activeCount = events.filter(e => {
        const pStatus = e.publish_status || (e.status === 'draft' ? 'draft' : 'published');
        const lStatus = e.listing_status || (e.status === 'archived' ? 'archived' : 'active');
        const endAt = e.event_end_at ? new Date(e.event_end_at) : new Date(e.date);
        return lStatus !== 'archived' && pStatus === 'published' && endAt >= now;
      }).length;

      setStats({
        totalBookings: bookingsData.length,
        totalRevenue: totalRev,
        activeEvents: activeCount,
        pendingKYC: pendingDocs.length
      });
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [events]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchEvents();
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dynamic Header */}
      <RNView style={styles.header}>
        <LinearGradient 
            colors={[colors.tint, colors.background]} 
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            opacity={0.15}
        />
        <RNView style={styles.headerTop}>
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.iconBtn}>
            <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <RNView style={styles.iconGroup}>
                <Pressable style={styles.iconBtn}>
                    <Bell size={24} color={colors.text} />
                    {stats.pendingKYC > 0 && <RNView style={styles.badge} />}
                </Pressable>
            </RNView>
        </RNView>
        
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
            <Text style={[styles.greeting, { color: colors.text }]}>Welcome back,</Text>
            <Text style={[styles.title, { color: colors.text }]}>Organiser HQ</Text>
        </MotiView>
      </RNView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      >
        {/* Core Actions */}
        <RNView style={styles.coreActionsGrid}>
            <Pressable 
                style={styles.coreActionCard}
                onPress={() => {
                  const tokenHash = session ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=magiclink` : '';
                  const webUrl = `${UnifiedApi.baseUrl}/organiser?tab=post_event${tokenHash}`;
                  router.push({ pathname: '/web', params: { url: webUrl } });
                }}
            >
                <LinearGradient colors={['#f97316', '#ea580c']} style={StyleSheet.absoluteFill} borderRadius={24} />
                <Plus size={32} color="#fff" />
                <Text style={styles.coreActionText}>Create Event</Text>
            </Pressable>
            <Pressable 
                style={styles.coreActionCard}
                onPress={() => router.push('/staff/scan')}
            >
                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={StyleSheet.absoluteFill} borderRadius={24} />
                <QrCode size={32} color="#fff" />
                <Text style={styles.coreActionText}>Scan Tickets</Text>
            </Pressable>
        </RNView>

        {/* Business Metrics */}
        <RNView style={styles.metricsContainer}>
            <RNView style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <RNView style={[styles.metricIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                    <TrendingUp size={20} color="#22c55e" />
                </RNView>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>Total Revenue</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>₹{stats.totalRevenue.toLocaleString()}</Text>
            </RNView>
            <RNView style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <RNView style={[styles.metricIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                    <Ticket size={20} color="#ec4899" />
                </RNView>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>Total Bookings</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{stats.totalBookings}</Text>
            </RNView>
        </RNView>

        {/* Action Required: Sports KYC */}
        {stats.pendingKYC > 0 && (
            <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.section}>
                <RNView style={[styles.alertCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <RNView style={styles.alertIcon}>
                        <ShieldCheck size={24} color="#ef4444" />
                    </RNView>
                    <RNView style={styles.alertContent}>
                        <Text style={styles.alertTitle}>KYC Approvals Pending</Text>
                        <Text style={styles.alertDesc}>{stats.pendingKYC} participant documents require verification for sports events.</Text>
                    </RNView>
                    <ChevronRight size={20} color="#ef4444" />
                </RNView>
            </MotiView>
        )}

        {/* My Events Scroll */}
        <RNView style={styles.section}>
            <RNView style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Live & Upcoming</Text>
                <Pressable><Text style={{ color: colors.tint, fontSize: 13, fontWeight: '800' }}>See All</Text></Pressable>
            </RNView>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {eventsLoading ? (
                    <Text style={{ color: colors.muted, padding: 20 }}>Loading events...</Text>
                ) : events?.length === 0 ? (
                    <RNView style={[styles.emptyHorizontal, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Calendar size={32} color={colors.muted} />
                        <Text style={{ color: colors.muted, fontWeight: '700', marginTop: 8 }}>No active events</Text>
                    </RNView>
                ) : (
                    events?.slice(0, 5).map(event => (
                        <EventCard key={event.id} event={event} colors={colors} router={router} />
                    ))
                )}
            </ScrollView>
        </RNView>

        {/* Recent Activity */}
        <RNView style={styles.section}>
            <RNView style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Bookings</Text>
            </RNView>
            
            <RNView style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {recentBookings.length === 0 ? (
                    <Text style={{ color: colors.muted, padding: 30, textAlign: 'center', fontWeight: '600' }}>No activity yet</Text>
                ) : (
                    recentBookings.map((booking, i) => (
                        <ActivityRow key={booking.id} booking={booking} colors={colors} isLast={i === recentBookings.length - 1} />
                    ))
                )}
            </RNView>
        </RNView>

        <RNView style={{ height: 60 }} />
      </ScrollView>
    </RNView>
  );
}

function EventCard({ event, colors, router }: any) {
  const isSports = event.type === 'Sports Event';
  return (
    <Pressable 
        onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
        style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
        <ImageBackground 
            source={{ uri: event.image_url || 'https://images.unsplash.com/photo-1540324155970-148aa144db6b' }} 
            style={styles.eventCardImage}
        >
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
            <RNView style={styles.eventCardTag}>
                {isSports ? <Trophy size={12} color="#fff" /> : <Calendar size={12} color="#fff" />}
                <Text style={styles.eventCardTagText}>{isSports ? 'Sports' : 'Event'}</Text>
            </RNView>
        </ImageBackground>
        <RNView style={styles.eventCardInfo}>
            <Text style={[styles.eventCardTitle, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
            <Text style={[styles.eventCardDate, { color: colors.muted }]}>{event.date}</Text>
        </RNView>
    </Pressable>
  );
}

function ActivityRow({ booking, colors, isLast }: any) {
  return (
    <RNView style={[styles.activityRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <RNView style={[styles.activityAvatar, { backgroundColor: colors.background }]}>
            <Users size={18} color={colors.text} />
        </RNView>
        <RNView style={{ flex: 1 }}>
            <Text style={[styles.activityName, { color: colors.text }]}>{booking.customer_details?.name || 'Guest User'}</Text>
            <Text style={[styles.activityMeta, { color: colors.muted }]}>Bought {booking.ticket_count} tickets • {new Date(booking.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </RNView>
        <Text style={[styles.activityAmount, { color: colors.tint }]}>+₹{booking.total_price}</Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  iconBtn: { padding: 8, borderRadius: 16, backgroundColor: 'rgba(150, 150, 150, 0.1)' },
  iconGroup: { flexDirection: 'row', gap: 12 },
  badge: { position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  greeting: { fontSize: 14, fontWeight: '700', opacity: 0.6, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  coreActionsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  coreActionCard: { flex: 1, height: 110, borderRadius: 24, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  coreActionText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  
  metricsContainer: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  metricCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1 },
  metricIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: '900' },
  
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, gap: 16 },
  alertIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#ef4444', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '900', color: '#b91c1c', marginBottom: 2 },
  alertDesc: { fontSize: 12, fontWeight: '600', color: '#ef4444', opacity: 0.8 },
  
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  
  horizontalScroll: { gap: 16 },
  emptyHorizontal: { width: 200, height: 180, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  eventCard: { width: 240, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  eventCardImage: { height: 140, padding: 12, justifyContent: 'flex-end' },
  eventCardTag: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  eventCardTagText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  eventCardInfo: { padding: 16 },
  eventCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  eventCardDate: { fontSize: 12, fontWeight: '600' },
  
  listContainer: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  activityAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activityName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  activityMeta: { fontSize: 12, fontWeight: '600' },
  activityAmount: { fontSize: 16, fontWeight: '900' },
});
