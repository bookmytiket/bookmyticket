import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  Dimensions,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth, useSupabaseQuery } from '@/hooks/useSupabase';
import {
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  Ticket,
  TrendingUp,
  Plus,
  ChevronRight,
  Filter,
  BarChart3,
  Users,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export default function OrganiserDashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();

  // Fetch Organiser's Events
  const { data: events, loading: eventsLoading } = useSupabaseQuery(
    'events',
    (q) => q.eq('organiser_id', user?.id).order('created_at', { ascending: false }),
    [user?.id],
    { realtime: true, enabled: !!user }
  );

  // Fetch Recent Bookings for these events
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });

  useEffect(() => {
    if (!events) return;
    
    const eventIds = events.map(e => e.id);
    if (eventIds.length === 0) return;

    const fetchStats = async () => {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (bookingsData) {
        setRecentBookings(bookingsData.slice(0, 5));
        const totalRev = bookingsData.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);
        setStats({
          totalBookings: bookingsData.length,
          totalRevenue: totalRev,
          activeEvents: events.filter(e => new Date(e.date) >= new Date()).length,
        });
      }
    };

    fetchStats();
  }, [events]);

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <RNView style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Organiser Dashboard</Text>
        <Pressable style={styles.filterBtn}>
          <Filter size={20} color={colors.text} />
        </Pressable>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Quick Stats */}
        <RNView style={styles.statsGrid}>
          <StatCard
            label="REVENUE"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp size={16} color="#22c55e" />}
            colors={colors}
          />
          <StatCard
            label="BOOKINGS"
            value={stats.totalBookings.toString()}
            icon={<Ticket size={16} color="#f84464" />}
            colors={colors}
          />
          <StatCard
            label="ACTIVE EVENTS"
            value={stats.activeEvents.toString()}
            icon={<Calendar size={16} color="#8b5cf6" />}
            colors={colors}
          />
        </RNView>

        {/* Action Bar */}
        <RNView style={styles.actionBar}>
          <Pressable 
            style={[styles.actionBtn, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/organiser/create-event')}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Create Event</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => router.push('/wallet')}
          >
            <BarChart3 size={20} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Payouts</Text>
          </Pressable>
        </RNView>

        {/* My Events Section */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Events</Text>
            <Pressable onPress={() => {}}>
              <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700' }}>See All</Text>
            </Pressable>
          </RNView>
          
          {eventsLoading ? (
            <Text style={{ color: colors.muted }}>Loading events...</Text>
          ) : events?.length === 0 ? (
            <RNView style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Calendar size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12, fontWeight: '600' }}>No events created yet</Text>
            </RNView>
          ) : (
            events?.slice(0, 3).map((event, i) => (
              <EventMiniCard key={event.id} event={event} colors={colors} />
            ))
          )}
        </RNView>

        {/* Recent Bookings */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Bookings</Text>
          </RNView>
          
          <RNView style={[styles.bookingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recentBookings.length === 0 ? (
              <Text style={{ color: colors.muted, padding: 20, textAlign: 'center' }}>No bookings yet</Text>
            ) : (
              recentBookings.map((booking, i) => (
                <BookingRow 
                  key={booking.id} 
                  booking={booking} 
                  colors={colors} 
                  isLast={i === recentBookings.length - 1} 
                />
              ))
            )}
          </RNView>
        </RNView>

        <RNView style={{ height: 40 }} />
      </ScrollView>
    </RNView>
  );
}

function StatCard({ label, value, icon, colors }: any) {
  return (
    <RNView style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <RNView style={styles.statHeader}>
        <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
        {icon}
      </RNView>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </RNView>
  );
}

function EventMiniCard({ event, colors }: any) {
  const router = useRouter();
  return (
    <Pressable 
      onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
      style={[styles.eventMiniCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <RNView style={styles.eventMiniInfo}>
        <Text style={[styles.eventMiniTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        <Text style={[styles.eventMiniDate, { color: colors.muted }]}>{event.date}</Text>
      </RNView>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

function BookingRow({ booking, colors, isLast }: any) {
  return (
    <RNView style={[styles.bookingRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <RNView style={{ flex: 1 }}>
        <Text style={[styles.bookingName, { color: colors.text }]}>{booking.customer_details?.name || 'Guest'}</Text>
        <Text style={[styles.bookingMeta, { color: colors.muted }]}>{booking.ticket_count} Tickets • {new Date(booking.created_at).toLocaleDateString()}</Text>
      </RNView>
      <Text style={[styles.bookingAmount, { color: colors.tint }]}>₹{booking.total_price}</Text>
    </RNView>
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
  filterBtn: { padding: 4 },
  scrollContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, gap: 8 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: '900' },
  actionBar: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  emptyCard: { padding: 40, alignItems: 'center', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2 },
  eventMiniCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  eventMiniInfo: { flex: 1 },
  eventMiniTitle: { fontSize: 15, fontWeight: '800' },
  eventMiniDate: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  bookingsCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  bookingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  bookingName: { fontSize: 14, fontWeight: '800' },
  bookingMeta: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  bookingAmount: { fontSize: 14, fontWeight: '900' },
});
