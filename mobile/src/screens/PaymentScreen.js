import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, total, success, event } = route.params || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(success || false);

  const booking = useQuery(api.bookings.getBookingById, bookingId ? { id: bookingId } : 'skip');
  const confirmBooking = useMutation(api.bookings.confirmBooking);

  const isConfirmed = booking?.status === 'Confirmed' || paymentSuccess;
  const displayTotal = total || booking?.totalPrice || 0;
  const displayEvent = event || { title: booking?.eventName || 'Event' };

  const handlePayNow = async () => {
    if (!bookingId) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1800));
    try {
      await confirmBooking({ id: bookingId });
      setPaymentSuccess(true);
    } catch (err) {
      Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
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

        <View style={styles.ticketCard}>
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>SCAN TO VERIFY</Text>
            {bookingId ? (
              <Image
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${bookingId}&bgcolor=ffffff&color=111827&margin=10` }}
                style={styles.qrImage}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={80} color="#e2e8f0" />
              </View>
            )}
            <Text style={styles.bookingIdText} numberOfLines={1}>#{bookingId || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.ticketDetails}>
            <Text style={styles.ticketEventName} numberOfLines={2}>{displayEvent?.title || 'Event'}</Text>
            <View style={styles.ticketRow}>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketMetaLabel}>DATE</Text>
                <Text style={styles.ticketMetaValue}>{displayEvent?.date || 'TBA'}</Text>
              </View>
              <View style={styles.ticketColRight}>
                <Text style={styles.ticketMetaLabel}>TICKETS</Text>
                <Text style={styles.ticketMetaValue}>{booking?.ticketCount || 1}</Text>
              </View>
            </View>
            <View style={styles.ticketRow}>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketMetaLabel}>VENUE</Text>
                <Text style={styles.ticketMetaValue} numberOfLines={1}>{displayEvent?.location || 'TBA'}</Text>
              </View>
              <View style={styles.ticketColRight}>
                <Text style={styles.ticketMetaLabel}>PAID</Text>
                <Text style={[styles.ticketMetaValue, { color: '#10b981', fontWeight: '900' }]}>₹{Number(displayTotal).toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={handleBackToHome}>
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}>
          <Ionicons name="ticket-outline" size={20} color={Colors.secondary} />
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
            : `Complete payment to confirm your booking for ${displayEvent?.title || 'the event'}.`}
        </Text>

        {!isProcessing && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.amount}>₹{Number(displayTotal).toFixed(0)}</Text>
            {displayEvent?.date && <Text style={styles.summaryMeta}>📅 {displayEvent.date}</Text>}
            {displayEvent?.location && <Text style={styles.summaryMeta}>📍 {displayEvent.location}</Text>}
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
  ticketCard: { marginHorizontal: 20, marginTop: 24, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  qrSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff' },
  qrLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 2, marginBottom: 16 },
  qrImage: { width: 180, height: 180, borderRadius: 8 },
  qrPlaceholder: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: 8 },
  bookingIdText: { marginTop: 12, fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 20 },
  ticketDetails: { padding: 20 },
  ticketEventName: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 20 },
  ticketRow: { flexDirection: 'row', marginBottom: 16 },
  ticketCol: { flex: 1 },
  ticketColRight: { flex: 1, alignItems: 'flex-end' },
  ticketMetaLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  ticketMetaValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  homeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.secondary, marginHorizontal: 20, marginTop: 20, padding: 18, borderRadius: 16, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  profileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 12, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.secondary },
  profileBtnText: { color: Colors.secondary, fontSize: 15, fontWeight: '700' },
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
