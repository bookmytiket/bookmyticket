import React, { useEffect, useState, useMemo } from 'react';
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
import { useAuth } from '@/hooks/useSupabase';
import { useUnifiedResource } from '@/hooks/useUnifiedSync';
import UnifiedApi from '@/lib/unifiedApi';
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
  const { data: bookingsRaw, loading, refresh, error } = useUnifiedResource(
    'bookings',
    () => UnifiedApi.getBookings(),
    [user?.id],
    { enabled: !!user, realtimeTables: ['bookings', 'tickets', 'payments'] }
  );

  const bookings = useMemo(() => {
    const rawData = Array.isArray(bookingsRaw) ? bookingsRaw : [];
    if (!rawData || typeof rawData.filter !== 'function') return [];
    
    return rawData.filter((b: any) => {
      if (b?.payment_status === 'pending' || b?.status === 'Pending') {
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
        onRefresh={refresh}
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
  const isPaid = booking.payment_status === 'paid' || booking.payment_status === 'confirmed';
  
  const statusColor = isPaid
      ? '#10b981' // emerald-500
      : booking.payment_status === 'pending'
      ? '#f59e0b' // amber-500
      : '#ef4444'; // red-500

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
  const eventTitle = event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event';
  const eventImage = event.image_url || event.img || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: index * 100 }}
    >
      <Pressable
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.tint },
        ]}
        onPress={onPress}
      >
        {/* Top: Banner Image */}
        <RNView style={styles.bannerContainer}>
          <Image
            source={{ uri: eventImage }}
            style={styles.bannerImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.bannerGradient}
          >
            <RNView style={styles.bannerStatus}>
              <RNView style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusTextWhite}>
                  {(booking.payment_status || 'confirmed').toUpperCase()}
                </Text>
              </RNView>
            </RNView>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {eventTitle}
            </Text>
          </LinearGradient>
        </RNView>

        {/* Middle: Info */}
        <RNView style={styles.infoContainer}>
          {eventDate && (
            <RNView style={styles.infoRow}>
              <RNView style={[styles.iconBox, { backgroundColor: colors.tint + '15' }]}>
                <Calendar size={16} color={colors.tint} />
              </RNView>
              <RNView style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>Date & Time</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{eventDate}</Text>
              </RNView>
            </RNView>
          )}
          {eventVenue && (
            <RNView style={styles.infoRow}>
              <RNView style={[styles.iconBox, { backgroundColor: colors.tint + '15' }]}>
                <MapPin size={16} color={colors.tint} />
              </RNView>
              <RNView style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>Venue</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{eventVenue}</Text>
              </RNView>
            </RNView>
          )}
        </RNView>

        {/* Cutout Divider */}
        <RNView style={styles.dividerContainer}>
          <RNView style={[styles.cutout, styles.cutoutLeft, { backgroundColor: colors.background }]} />
          <RNView style={[styles.dashedLine, { borderColor: colors.border }]} />
          <RNView style={[styles.cutout, styles.cutoutRight, { backgroundColor: colors.background }]} />
        </RNView>

        {/* Bottom: Ticket details */}
        <RNView style={styles.bottomContainer}>
          <RNView style={styles.ticketDetails}>
            <Text style={[styles.ticketLabel, { color: colors.muted }]}>Ticket Type</Text>
            <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ticket size={16} color={colors.tint} />
              <Text style={[styles.ticketValue, { color: colors.text }]}>
                {booking.quantity || 1}x {booking.ticket_type || 'General'}
              </Text>
            </RNView>
          </RNView>
          
          <RNView style={[styles.qrButton, { backgroundColor: colors.tint }]}>
            <QrCode size={18} color="#fff" />
            <Text style={styles.qrButtonText}>View QR</Text>
          </RNView>
        </RNView>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 20, paddingBottom: 40 },
  skeleton: { height: 280, borderRadius: 24, marginBottom: 14 },
  card: {
    borderRadius: 24,
    borderWidth: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 6,
  },
  bannerContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  bannerStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextWhite: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 28,
  },
  infoContainer: {
    padding: 18,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  dividerContainer: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  dashedLine: {
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    marginHorizontal: 28,
  },
  cutout: {
    width: 30,
    height: 30,
    borderRadius: 15,
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  cutoutLeft: {
    left: -15,
  },
  cutoutRight: {
    right: -15,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    paddingTop: 8,
    paddingBottom: 22,
  },
  ticketDetails: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ticketValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
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
