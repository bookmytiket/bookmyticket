import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  Pressable,
  View as RNView,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useSupabase';
import { Calendar, MapPin, Ticket, ChevronRight, QrCode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MotiView } from 'moti';

export default function TicketsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Real-time Bookings with Event Data
  const { data: bookingsRaw, loading, refresh } = useSupabaseQuery(
    'bookings',
    (q) => q.select('*, events(*)').eq('user_id', user?.id).order('created_at', { ascending: false }),
    [user?.id],
    { realtime: true, enabled: !!user }
  );

  const bookings = React.useMemo(() => {
    if (!bookingsRaw) return [];
    return (bookingsRaw as any[]).filter(b => {
      if (b.payment_status === 'pending' || b.status === 'Pending') {
        const diff = Date.now() - new Date(b.created_at).getTime();
        return diff < (24 * 60 * 60 * 1000);
      }
      return true;
    });
  }, [bookingsRaw]);

  // Automatic redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/sign-in');
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.muted }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={loading ? Array(3).fill({}) : bookings}
        keyExtractor={(item, index) => item.id ?? `sk-${index}`}
        contentContainerStyle={styles.list}
        onRefresh={fetchBookings}
        refreshing={loading}
        renderItem={({ item, index }) =>
          loading ? (
            <RNView
              style={[
                styles.skeleton,
                { backgroundColor: colors.border },
              ]}
            />
          ) : (
            <TicketCard
              booking={item}
              colors={colors}
              index={index}
              onPress={() =>
                router.push({
                  pathname: '/tickets/[id]',
                  params: { id: item.id },
                })
              }
            />
          )
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🎭</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No tickets yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                Book an event and it'll appear here
              </Text>
              <Pressable
                style={[styles.signInBtn, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/(tabs)/events')}
              >
                <Text style={styles.signInText}>Browse Events</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function TicketCard({ booking, colors, index, onPress }: any) {
  const event = booking.events || {};
  const statusColor =
    booking.payment_status === 'paid'
      ? '#22c55e'
      : booking.payment_status === 'pending'
      ? '#f59e0b'
      : '#ef4444';

  const safeParse = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return null; }
    }
    return val;
  };
  const dynamicConfig = safeParse(event.dynamic_config) || {};
  const eventVenue = event.venue || event.location || dynamicConfig.location?.venueName || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || event.city;
  const eventDate = event.start_date || event.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 80 }}
    >
      <Pressable
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={onPress}
      >
        {/* Top: Event image + info */}
        <RNView style={styles.cardTop}>
          <Image
            source={{
              uri:
                event.image_url ||
                event.img ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200',
            }}
            style={styles.eventThumb}
            contentFit="cover"
          />
          <RNView style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event'}
            </Text>
            {eventDate && (
              <RNView style={styles.metaRow}>
                <Calendar size={12} color={colors.tint} />
                <Text style={[styles.metaText, { color: colors.muted }]}>
                  {eventDate}
                </Text>
              </RNView>
            )}
            {eventVenue && (
              <RNView style={styles.metaRow}>
                <MapPin size={12} color={colors.error} />
                <Text style={[styles.metaText, { color: colors.muted }]} numberOfLines={1}>
                  {eventVenue}
                </Text>
              </RNView>
            )}
          </RNView>
          <ChevronRight size={18} color={colors.muted} />
        </RNView>

        {/* Divider dashed */}
        <RNView style={[styles.divider, { borderColor: colors.border }]} />

        {/* Bottom: ticket info */}
        <RNView style={styles.cardBottom}>
          <RNView style={styles.ticketMeta}>
            <Ticket size={14} color={colors.tint} />
            <Text style={[styles.ticketCount, { color: colors.text }]}>
              {booking.quantity || 1}x {booking.ticket_type || 'General'}
            </Text>
          </RNView>
          <RNView style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(booking.payment_status || 'confirmed').toUpperCase()}
            </Text>
          </RNView>
          <RNView style={styles.qrHint}>
            <QrCode size={16} color={colors.muted} />
            <Text style={[styles.qrText, { color: colors.muted }]}>View QR</Text>
          </RNView>
        </RNView>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  skeleton: { height: 130, borderRadius: 20, marginBottom: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  eventThumb: { width: 64, height: 64, borderRadius: 12 },
  eventInfo: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '600' },
  divider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 14,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  ticketCount: { fontSize: 13, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 10, fontWeight: '900' },
  qrHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qrText: { fontSize: 12, fontWeight: '600' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  signInBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  signInText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
