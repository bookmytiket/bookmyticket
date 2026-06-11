import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Pressable,
  View as RNView,
  Share,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import UnifiedApi from '@/lib/unifiedApi';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Ticket, 
  Share2, 
  Download, 
  CheckCircle2, 
  Info,
  Clock,
  ShieldCheck,
  CreditCard
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

// Category-based color themes (Pink & Purple Focus)
const THEMES: Record<string, { colors: [string, string], icon: string }> = {
  'Sports': { colors: ['#9333ea', '#4f46e5'], icon: '🏆' },
  'Concert': { colors: ['#f844a4', '#a21caf'], icon: '🎸' },
  'Workshop': { colors: ['#f844a4', '#8b5cf6'], icon: '💡' },
  'Festival': { colors: ['#a855f7', '#f844a4'], icon: '🎡' },
  'Tech': { colors: ['#7c3aed', '#db2777'], icon: '💻' },
  'Default': { colors: ['#f844a4', '#7c3aed'], icon: '🎟️' },
};

function QRDisplay({ value, size = 180 }: { value: string; size?: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&format=png&margin=10`;
  return (
    <View style={styles.qrContainer}>
      <Image
        source={{ uri: qrUrl }}
        style={{ width: size, height: size, borderRadius: 16 }}
        contentFit="contain"
      />
      <MotiView
        from={{ opacity: 0.5, scale: 0.8 }}
        animate={{ opacity: 0, scale: 1.5 }}
        transition={{ loop: true, duration: 2000, type: 'timing' }}
        style={[StyleSheet.absoluteFill, styles.qrScannerLine]}
      />
    </View>
  );
}

export default function TicketDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewRef = useRef<RNView>(null);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchBooking();
      
      const bookingChannel = supabase
        .channel(`ticket-${id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings', 
          filter: `id=eq.${id}` 
        }, (payload) => {
          if (payload.new) {
            setBooking(prev => ({ ...prev, ...payload.new }));
          }
        })
        .subscribe();

      const ticketChannel = supabase
        .channel(`ticket-record-${id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tickets',
        }, fetchBooking)
        .subscribe();

      return () => {
        supabase.removeChannel(bookingChannel);
        supabase.removeChannel(ticketChannel);
      };
    }
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const data = await UnifiedApi.getTicket(String(id));
      setBooking(data);

      if (data.event_id) {
        // Fetch global active sponsors and partners
        const [sponsorsRes, partnersRes] = await Promise.all([
          supabase.from('sponsors').select('*').eq('status', 'active').order('display_order', { ascending: true }),
          supabase.from('partners').select('*').eq('status', 'active').order('display_order', { ascending: true })
        ]);
        
        const logos = [];
        if (sponsorsRes.data) {
          sponsorsRes.data.slice(0, 3).forEach(s => logos.push({ url: s.logo_url, role: s.name || 'Sponsor' }));
        }
        if (partnersRes.data) {
          partnersRes.data.slice(0, 2).forEach(p => logos.push({ url: p.logo_url, role: p.name || 'Partner' }));
        }
        
        setSponsors(logos);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!viewRef.current) return;
      
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Ticket: ${booking.events?.title}`,
          UTI: 'public.png',
        });
      } else {
        const message = `🎟️ My premium ticket for "${booking.events?.title}"!\nBooking ID: ${booking.id}\n\nPowered by BookMyTicket`;
        await Share.share({ message });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      Alert.alert('Share Failed', 'Could not generate ticket image.');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      if (!viewRef.current) return;
      
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
      });

      const event = booking.events || {};
      const html = `
        <html>
          <head>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; }
              img { max-width: 100%; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <img src="${uri}" />
          </body>
        </html>
      `;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(pdfUri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `Ticket: ${event.title}` });
    } catch (err) {
      console.error('Error generating PDF:', err);
      Alert.alert('Download Failed', 'Could not generate PDF ticket.');
    }
  };

  if (loading || !booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <MotiView
          from={{ opacity: 0, rotate: '0deg' }}
          animate={{ opacity: 1, rotate: '360deg' }}
          transition={{ loop: true, duration: 1000, type: 'timing' }}
        >
          <Ticket size={40} color={colors.tint} />
        </MotiView>
      </View>
    );
  }

  const event = booking.events || {};
  const theme = THEMES[event.category] || THEMES.Default;
  const statusColor = booking.payment_status === 'paid' ? '#22c55e' : '#f59e0b';
  
  // Robust pricing calculation
  const baseAmount = Number(booking.amount) || 0;
  const platformFee = Number(booking.platform_fee) || 15; // Fallback fee
  const discount = Number(booking.discount_amount) || 0;
  const totalGst = Number(booking.gst_amount) || (baseAmount * 0.18);
  const finalTotal = baseAmount + platformFee + totalGst - discount;

  const qrData = JSON.stringify({
    bid: booking.id,
    eid: event.id,
    u: booking.user_id,
    v: 'T9-SECURE-V1'
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <Pressable 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
          style={styles.iconBtn}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Digital Ticket</Text>
        <Pressable onPress={handleShare} style={styles.iconBtn}>
          <Share2 size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Ticket Container with Glow */}
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.ticketGlowContainer}
        >
          <RNView ref={viewRef} collapsable={false} style={styles.ticketCardWrapper}>
            <View style={styles.ticketCard}>
            {/* Ticket Top - Gradient Header */}
            <LinearGradient
              colors={theme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ticketHeader}
            >
              <RNView style={styles.headerRow}>
                <View style={styles.brandRow}>
                  <Image 
                    source={require('../../assets/images/logo_brand.png')} 
                    style={[styles.ticketLogo, { tintColor: '#000' }]}
                    contentFit="contain"
                  />
                  <View style={[styles.statusBadge, { backgroundColor: '#22c55e' }]}>
                    <Text style={[styles.statusText, { color: '#fff' }]}>{(booking.payment_status || 'CONFIRMED').toUpperCase()}</Text>
                  </View>
                </View>
                <CheckCircle2 size={20} color="#fff" />
              </RNView>

              <RNView style={styles.eventMainInfo}>
                <View style={styles.categoryIconContainer}>
                  <Text style={styles.categoryIconText}>{theme.icon}</Text>
                </View>
                <View style={styles.eventTitleCol}>
                  <Text style={[styles.ticketEventTitle, { color: '#000' }]} numberOfLines={2}>{event.title}</Text>
                  <View style={styles.ticketCategoryBadgeContainer}>
                    <Text style={styles.ticketCategoryBadge}>{event.category || 'Event'}</Text>
                  </View>
                </View>
              </RNView>

              <RNView style={styles.shineEffect} />
            </LinearGradient>

            {/* Ticket Body - Glassmorphism details */}
            <View style={styles.ticketBody}>
              <RNView style={styles.primaryDetails}>
                <DetailItem icon={<Calendar size={14} color={colors.tint} />} label="DATE" value={event.event_start_date || event.startDate || event.event_date || event.date || 'TBA'} />
                <DetailItem icon={<Clock size={14} color={colors.tint} />} label="TIME" value={event.event_start_time || event.startTime || event.event_time || event.time || 'TBA'} />
                <DetailItem icon={<MapPin size={14} color={colors.tint} />} label="VENUE" value={event.location || event.city || 'TBA'} />
              </RNView>

              <RNView style={styles.secondaryDetails}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>ATTENDEE</Text>
                  <Text style={styles.infoValue}>{booking.customer_details?.name || booking.attendee_name || 'Guest'}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>{booking.bib_number || booking.customer_details?.bib_number ? 'BIB NUMBER' : 'QUANTITY'}</Text>
                  <Text style={styles.infoValue}>{booking.bib_number || booking.customer_details?.bib_number || `${booking.quantity || 1} Person(s)`}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>BOOKING ID</Text>
                  <Text style={styles.infoValue}>#{booking.id.slice(0, 8).toUpperCase()}</Text>
                </View>
              </RNView>

              {/* Dynamic Seat Allocation / Ticket Type */}
              {booking.booking_items && booking.booking_items.length > 0 ? (
                <RNView style={styles.seatsSection}>
                  <Text style={styles.seatsTitle}>SEAT ALLOCATION</Text>
                  <RNView style={styles.seatGrid}>
                    {booking.booking_items.map((item: any, idx: number) => (
                      <View key={idx} style={styles.seatBadge}>
                        <Text style={styles.seatLabel} numberOfLines={1}>
                          {item.block_name || item.ticket_category || item.section_name || 'Seat'}
                        </Text>
                        <Text style={styles.seatNumber}>
                          {item.row_label ? `${item.row_label}-` : ''}{item.seat_number}
                        </Text>
                      </View>
                    ))}
                  </RNView>
                </RNView>
              ) : (
                <RNView style={styles.seatsSection}>
                  <Text style={styles.seatsTitle}>TICKET TYPE</Text>
                  <RNView style={styles.seatGrid}>
                    <View style={[styles.seatBadge, { flex: 1, alignItems: 'center', backgroundColor: '#f1f5f9' }]}>
                      <Text style={styles.seatLabel}>General Admission</Text>
                      <Text style={styles.seatNumber}>{booking.ticket_type || 'Standard Entry'} (x{booking.quantity || 1})</Text>
                    </View>
                  </RNView>
                </RNView>
              )}

              {/* Perforation */}
              <RNView style={styles.perforationRow}>
                <View style={styles.perfCircleLeft} />
                <View style={styles.perfLine} />
                <View style={styles.perfCircleRight} />
              </RNView>

              {/* QR Section */}
              <View style={styles.qrSection}>
                <QRDisplay value={qrData} />
                <Text style={styles.qrHint}>#SECURE-VERIFICATION</Text>
                <View style={styles.securityBadge}>
                  <ShieldCheck size={12} color="#22c55e" />
                  <Text style={styles.securityText}>AUTHORIZED TICKET</Text>
                </View>
              </View>
            </View>
          </View>
          </RNView>
      </MotiView>

        {/* Payment Summary - Professional Breakdown */}
        <View style={styles.sectionHeader}>
          <CreditCard size={16} color={colors.text} />
          <Text style={styles.sectionTitle}>PAYMENT SUMMARY</Text>
        </View>

        <View style={styles.breakdownCard}>
          <BreakdownRow label="Ticket Amount" value={baseAmount} />
          {discount > 0 && <BreakdownRow label="Discounts" value={-discount} color="#ef4444" />}
          <BreakdownRow label="Platform Fee" value={platformFee} />
          
          <View style={styles.gstSplit}>
            <View style={styles.gstHeader}>
              <Text style={styles.gstLabel}>GST Split-up (18%)</Text>
            </View>
            <BreakdownRow label="CGST (9%)" value={totalGst / 2} isSmall />
            <BreakdownRow label="SGST (9%)" value={totalGst / 2} isSmall />
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PAID</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Sponsor Branding Section */}
        {sponsors.length > 0 && (
          <View style={styles.sponsorSection}>
            <Text style={styles.sponsorTitle}>OFFICIAL PARTNERS & SPONSORS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sponsorScroll}>
              {sponsors.map((sponsor, idx) => (
                <View key={idx} style={styles.sponsorCard}>
                  <Image source={{ uri: sponsor.url }} style={styles.sponsorLogo} contentFit="contain" />
                  <Text style={styles.sponsorName}>{sponsor.role}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Pressable 
            style={[styles.mainAction, { backgroundColor: colors.tint }]}
            onPress={handleDownloadInvoice}
          >
            <Download size={20} color="#fff" />
            <Text style={styles.actionText}>Download E-Ticket (PDF)</Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          This is a computer-generated digital ticket. Please show this at the entrance gate for verification.
        </Text>
      </ScrollView>
    </View>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconBox}>{icon}</View>
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function BreakdownRow({ label, value, color, isSmall }: any) {
  return (
    <View style={[styles.breakdownRow, isSmall && { paddingVertical: 4 }]}>
      <Text style={[styles.breakdownLabel, isSmall && { fontSize: 11, color: '#64748b' }]}>{label}</Text>
      <Text style={[styles.breakdownValue, { color: color || '#1e293b' }, isSmall && { fontSize: 11 }]}>
        {value >= 0 ? '+' : ''}₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  ticketGlowContainer: {
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    marginBottom: 30,
  },
  ticketCardWrapper: {
    borderRadius: 30,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  ticketCard: {
    borderRadius: 30,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(248, 68, 164, 0.1)',
  },
  ticketHeader: {
    padding: 24,
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'transparent' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent' },
  ticketLogo: { width: 100, height: 35 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  eventMainInfo: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  categoryIconContainer: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  categoryIconText: { fontSize: 28 },
  eventTitleCol: { flex: 1, gap: 8, backgroundColor: 'transparent' },
  ticketEventTitle: { color: '#000', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  ticketCategoryBadgeContainer: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  ticketCategoryBadge: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 },
  shineEffect: { position: 'absolute', top: 0, left: -100, width: 200, height: 400, backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ rotate: '45deg' }] },
  ticketBody: { padding: 24, gap: 24 },
  primaryDetails: { gap: 16 },
  detailItem: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  detailIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1 },
  detailValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  secondaryDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  infoCol: { gap: 4 },
  infoLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 1 },
  infoValue: { fontSize: 12, fontWeight: '800', color: '#1e293b' },
  seatsSection: { marginTop: -4 },
  seatsTitle: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  seatBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', minWidth: 80 },
  seatLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  seatNumber: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
  perforationRow: { flexDirection: 'row', alignItems: 'center', height: 2, marginHorizontal: -24 },
  perfCircleLeft: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f8fafc', marginLeft: -12 },
  perfCircleRight: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f8fafc', marginRight: -12 },
  perfLine: { flex: 1, height: 1, borderStyle: 'dashed', borderTopWidth: 1, borderColor: '#e2e8f0' },
  qrSection: { alignItems: 'center', gap: 12 },
  qrContainer: { padding: 12, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', position: 'relative' },
  qrScannerLine: { backgroundColor: '#f844a4', height: 2, top: '50%' },
  qrHint: { fontSize: 11, fontWeight: '900', color: '#cbd5e1', letterSpacing: 3 },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0fdf4' },
  securityText: { fontSize: 10, fontWeight: '800', color: '#10b981' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5 },
  breakdownCard: { padding: 20, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  breakdownLabel: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  breakdownValue: { fontSize: 14, fontWeight: '800' },
  gstSplit: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  gstHeader: { marginBottom: 4 },
  gstLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#f1f5f9' },
  totalLabel: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#f844a4' },
  sponsorSection: { marginTop: 30 },
  sponsorTitle: { fontSize: 11, fontWeight: '900', color: '#cbd5e1', letterSpacing: 2, textAlign: 'center', marginBottom: 16 },
  sponsorScroll: { gap: 20, paddingHorizontal: 10 },
  sponsorCard: { alignItems: 'center', gap: 6 },
  sponsorLogo: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#fff' },
  sponsorName: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  actionContainer: { marginTop: 30 },
  mainAction: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  footerNote: { fontSize: 11, color: '#cbd5e1', textAlign: 'center', marginTop: 30, lineHeight: 18, fontWeight: '600' },
});
