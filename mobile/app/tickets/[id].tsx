import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View as RNView,
  Share,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { ArrowLeft, Calendar, MapPin, Ticket, Share2, Download, QrCode } from 'lucide-react-native';
import { Image } from 'expo-image';

// Simple QR code display using a public QR API
function QRDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&format=png&margin=10`;
  return (
    <Image
      source={{ uri: qrUrl }}
      style={{ width: size, height: size, borderRadius: 12 }}
      contentFit="contain"
    />
  );
}

export default function TicketDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, events(*)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      setBooking(data);
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!booking) return;
    try {
      await Share.share({
        message: `🎟️ My ticket for "${booking.events?.title}"!\nBooking ID: ${booking.id}\n\nPowered by BookMyTicket`,
        title: 'My Ticket',
      });
    } catch {}
  };

  if (loading || !booking) {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
      </RNView>
    );
  }

  const event = booking.events || {};
  const statusColor =
    booking.payment_status === 'paid'
      ? '#22c55e'
      : booking.payment_status === 'pending'
      ? '#f59e0b'
      : '#ef4444';

  // QR data: booking ID for verification
  const qrData = JSON.stringify({
    booking_id: booking.id,
    event: event.title,
    attendee: booking.attendee_name,
    qty: booking.quantity,
  });

  const bookingDate = new Date(booking.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Ticket</Text>
        <Pressable onPress={handleShare} hitSlop={12}>
          <Share2 size={20} color={colors.tint} />
        </Pressable>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Ticket card */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 18 }}
        >
          <RNView style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Top gradient strip */}
            <LinearGradient
              colors={colors.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ticketStrip}
            >
              <Text style={styles.stripText}>BOOKMYTICKET</Text>
              <RNView style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.stripText}>{(booking.payment_status || 'CONFIRMED').toUpperCase()}</Text>
            </LinearGradient>

            {/* Event info */}
            <RNView style={styles.ticketTop}>
              {event.img && (
                <Image
                  source={{ uri: event.img }}
                  style={styles.eventThumb}
                  contentFit="cover"
                />
              )}
              <RNView style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={3}>
                  {event.title}
                </Text>
                {event.category && (
                  <RNView style={[styles.categoryBadge, { backgroundColor: colors.tint + '20' }]}>
                    <Text style={[styles.categoryText, { color: colors.tint }]}>
                      {event.category}
                    </Text>
                  </RNView>
                )}
              </RNView>
            </RNView>

            {/* Details */}
            <RNView style={[styles.detailsGrid, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
              <DetailCell label="Date" value={event.date || 'TBA'} colors={colors} />
              <RNView style={[styles.cellDivider, { backgroundColor: colors.border }]} />
              <DetailCell label="Time" value={event.time || 'TBA'} colors={colors} />
              <RNView style={[styles.cellDivider, { backgroundColor: colors.border }]} />
              <DetailCell label="Venue" value={event.location || event.city || 'TBA'} colors={colors} />
            </RNView>

            {/* Ticket info */}
            <RNView style={styles.ticketInfo}>
              <RNView style={styles.ticketInfoRow}>
                <InfoItem label="Ticket Type" value={booking.ticket_type || 'General'} colors={colors} />
                <InfoItem label="Quantity" value={`${booking.quantity || 1}x`} colors={colors} />
                <InfoItem
                  label="Amount"
                  value={booking.amount === 0 ? 'FREE' : `₹${Number(booking.amount).toLocaleString('en-IN')}`}
                  colors={colors}
                />
              </RNView>

              <RNView style={styles.attendeeRow}>
                <InfoItem label="Attendee" value={booking.attendee_name || 'N/A'} colors={colors} />
                <InfoItem label="Booked On" value={bookingDate} colors={colors} />
              </RNView>
            </RNView>

            {/* Dashed separator */}
            <RNView style={styles.dashedRow}>
              <RNView style={[styles.semiCircleLeft, { backgroundColor: colors.background }]} />
              <RNView style={[styles.dashedLine, { borderColor: colors.border }]} />
              <RNView style={[styles.semiCircleRight, { backgroundColor: colors.background }]} />
            </RNView>

            {/* QR Code */}
            <RNView style={styles.qrSection}>
              <Text style={[styles.qrLabel, { color: colors.muted }]}>Scan to verify</Text>
              <QRDisplay value={qrData} size={180} />
              <Text style={[styles.bookingId, { color: colors.muted }]}>
                #{booking.id.slice(0, 8).toUpperCase()}
              </Text>
            </RNView>
          </RNView>
        </MotiView>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: colors.muted }]}>
          Present this QR code at the venue for entry. This ticket is non-transferable.
        </Text>
      </ScrollView>
    </RNView>
  );
}

function DetailCell({ label, value, colors }: any) {
  return (
    <RNView style={styles.detailCell}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </RNView>
  );
}

function InfoItem({ label, value, colors }: any) {
  return (
    <RNView style={styles.infoItem}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 16, paddingTop: 52 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    paddingTop: 52,
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  scroll: { padding: 16, paddingBottom: 40 },
  ticketCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  ticketStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stripText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  ticketTop: { flexDirection: 'row', padding: 16, gap: 12 },
  eventThumb: { width: 80, height: 80, borderRadius: 12 },
  eventInfo: { flex: 1, gap: 8 },
  eventTitle: { fontSize: 16, fontWeight: '900', lineHeight: 22 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  detailCell: { flex: 1, padding: 14, alignItems: 'center' },
  cellDivider: { width: 1 },
  detailLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  ticketInfo: { padding: 16, gap: 12 },
  ticketInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  attendeeRow: { flexDirection: 'row', gap: 20 },
  infoItem: { gap: 3 },
  infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontWeight: '800' },
  dashedRow: { flexDirection: 'row', alignItems: 'center', height: 1, marginHorizontal: -1 },
  semiCircleLeft: { width: 16, height: 16, borderRadius: 8, marginLeft: -8 },
  semiCircleRight: { width: 16, height: 16, borderRadius: 8, marginRight: -8 },
  dashedLine: { flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed' },
  qrSection: { alignItems: 'center', padding: 24, gap: 12 },
  qrLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bookingId: { fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  disclaimer: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
