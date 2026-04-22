import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { generateTicketPDF } from '../utils/ticketGenerator';
import BrandingHeader from '../components/BrandingHeader';

import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, total, success, event } = route.params || {};
  const ticketViewRef = React.useRef();
  const [downloading, setDownloading] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(success || false);

  const { data: brandingArr = [] } = useSupabaseQuery('site_branding', (q) => q, [], { realtime: false });
  const branding = (brandingArr && brandingArr[0]) || {
    powered_by_logo_url: "https://www.bookmyticket.net/logo.png",
    powered_by_link: "https://www.bookmyticket.net"
  };

  const { data: supabaseBooking } = useSupabaseQuery('bookings', (q) => 
    q.select('*, events(*)').eq('id', bookingId).maybeSingle(), 
    [bookingId]
  );
  
  const booking = supabaseBooking;
  const eventDetails = event || booking?.events || { title: 'Event', date: 'TBA', location: 'Venue' };

  // Mutation using Edge Function
  const { mutate: callConfirmBooking } = useSupabaseMutation(async (supabase, bId) => {
    const { data: result, error } = await supabase.functions.invoke('booking-handler', {
      body: { action: 'confirm-booking', data: { bookingId: bId } }
    });
    if (error) throw error;
    return result;
  });

  const isConfirmed = booking?.status === 'Confirmed' || paymentSuccess;
  const displayTotal = total || booking?.total_price || 0;

  const handlePayNow = async () => {
    if (!bookingId) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1800));
    try {
      await callConfirmBooking(bookingId);
      
      // Trigger Notification
      if (booking?.customer_details?.phone) {
        fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/comm/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: booking.customer_details.phone,
            type: 'BOOKING',
            data: {
              eventName: eventDetails?.title || 'Event',
              date: eventDetails?.date || 'TBA',
              bookingId: bookingId
            }
          })
        }).catch(e => console.error("Notification trigger failed", e));
      }

      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!ticketViewRef.current) return;
    try {
      setDownloading(true);
      const uri = await captureRef(ticketViewRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save your Ticket',
          UTI: 'public.jpeg',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (err) {
      console.error('Capture error:', err);
      Alert.alert('Error', 'Failed to save ticket image');
    } finally {
      setDownloading(false);
    }
  };

  if (isConfirmed) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContainer}>
        <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.successHeader}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={64} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>Your ticket has been secured 🎉</Text>
        </LinearGradient>

        <BrandingHeader style={{ marginTop: 16 }} />

        {/* Capturable Ticket Card */}
        <View style={styles.ticketWrapper}>
          <View 
            ref={ticketViewRef}
            collapsable={false}
            style={styles.ticketInner}
          >
            <View style={styles.ticketTop}>
               <Image 
                 source={{ uri: eventDetails?.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87" }} 
                 style={styles.ticketImg}
                 resizeMode="cover"
               />
               <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imgOverlay} />
               <View style={styles.badgeContainer}>
                  <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>ACTIVE</Text></View>
               </View>
               <Text style={styles.eventNameOverlay} numberOfLines={2}>{eventDetails?.title}</Text>
            </View>

            <View style={styles.ticketBody}>
               <View style={styles.infoGrid}>
                  <View style={styles.infoCell}>
                     <Text style={styles.infoLabel}>DATE</Text>
                     <Text style={styles.infoValue}>{eventDetails?.date || 'TBA'}</Text>
                  </View>
                  <View style={styles.infoCell}>
                     <Text style={styles.infoLabel}>TIME</Text>
                     <Text style={styles.infoValue}>{eventDetails?.time || 'TBA'}</Text>
                  </View>
               </View>
               
               <View style={[styles.infoGrid, { marginTop: 15 }]}>
                  <View style={styles.infoCell}>
                     <Text style={styles.infoLabel}>VENUE</Text>
                     <Text style={styles.infoValue} numberOfLines={1}>{eventDetails?.location || 'Venue'}</Text>
                  </View>
               </View>

               <View style={styles.cardDivider}>
                  <View style={styles.dotL} /><View style={styles.dLine} /><View style={styles.dotR} />
               </View>

               <View style={styles.cardFooter}>
                  <View style={styles.qrBox}>
                    <Image
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingId}` }}
                      style={styles.qrSmall}
                    />
                  </View>
                  <View style={styles.idBox}>
                    <Text style={styles.infoLabel}>BOOKING ID</Text>
                    <Text style={styles.bookingId}>#{bookingId?.slice(-8).toUpperCase()}</Text>
                    
                    <View style={{ marginTop: 10 }}>
                      <Image source={{ uri: branding.powered_by_logo_url }} style={{ height: 30, width: 90 }} resizeMode="contain" />
                    </View>
                  </View>
               </View>
            </View>
            
            <View style={styles.cardWatermark}>
               <Text style={styles.watermarkText}>POWERED BY BOOKMYTICKET</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.downloadBtn} 
          onPress={handleDownloadTicket}
          disabled={downloading}
        >
          <LinearGradient colors={Colors.gradient} style={styles.btnGradient}>
            <Ionicons name={downloading ? "refresh" : "download-outline"} size={22} color="#fff" />
            <Text style={styles.btnTextLg}>{downloading ? "PREPARING..." : "Download E-Ticket"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtnAlt} onPress={handleBackToHome}>
          <Ionicons name="home-outline" size={20} color={Colors.secondary} />
          <Text style={styles.homeBtnTextAlt}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}>
          <Ionicons name="ticket-outline" size={20} color="#64748b" />
          <Text style={styles.profileBtnText}>View All My Tickets</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          {isProcessing
            ? <ActivityIndicator size="large" color={Colors.secondary} />
            : <Ionicons name="card-outline" size={80} color={Colors.secondary} />
          }
        </View>
        <Text style={styles.title}>{isProcessing ? 'Processing...' : 'Secure Payment'}</Text>
        <Text style={styles.sub}>
          {isProcessing
            ? 'Please do not close the app while we process your payment.'
            : `Complete payment to confirm your booking for ${eventDetails?.title || 'the event'}.`}
        </Text>

        {!isProcessing && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.amount}>₹{Number(displayTotal).toFixed(0)}</Text>
            {eventDetails?.date && <Text style={styles.summaryMeta}>📅 {eventDetails.date}</Text>}
            {eventDetails?.location && <Text style={styles.summaryMeta}>📍 {eventDetails.location}</Text>}
          </View>
        )}

        {!isProcessing && (
          <TouchableOpacity style={styles.btn} onPress={handlePayNow}>
            <Ionicons name="lock-closed" size={18} color="#fff" />
            <Text style={styles.btnText}>Pay Securely</Text>
          </TouchableOpacity>
        )}

        {!isProcessing && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  successContainer: { paddingBottom: 24 },
  successHeader: { padding: 40, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  successIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 6 },
  successSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  ticketWrapper: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInner: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  ticketTop: {
    height: 180,
    position: 'relative',
    backgroundColor: '#000',
  },
  ticketImg: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  imgOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  activeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  eventNameOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  ticketBody: {
    padding: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCell: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  cardDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: -24,
  },
  dotL: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginLeft: -32,
  },
  dLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 10,
  },
  dotR: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginRight: -32,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  qrBox: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSmall: {
    width: 90,
    height: 90,
  },
  idBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bookingId: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
  },
  cardWatermark: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  watermarkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    opacity: 0.5,
  },
  downloadBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  btnTextLg: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  homeBtnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
  },
  homeBtnTextAlt: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: '800',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
  },
  profileBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  card: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', margin: 20, borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  iconWrap: { marginBottom: 20, height: 80, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  summaryBox: { alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 20, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  amount: { fontSize: 36, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  summaryMeta: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.secondary, padding: 18, borderRadius: 16, width: '100%', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  secondaryBtn: { marginTop: 16, padding: 12 },
  secondaryBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
});
