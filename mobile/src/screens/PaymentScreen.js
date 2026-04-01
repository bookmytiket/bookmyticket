import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, total, success } = route.params || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(success || false);

  const booking = useQuery(api.bookings.getBookingById, bookingId ? { id: bookingId } : 'skip');
  const confirmBooking = useMutation(api.bookings.confirmBooking);

  const isConfirmed = booking?.status === 'Confirmed' || paymentSuccess;

  const handlePayNow = async () => {
    if (!bookingId) return;
    setIsProcessing(true);

    // Simulate network delay for payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      await confirmBooking({ id: bookingId });
      setPaymentSuccess(true);
      Alert.alert('Success', 'Payment completed successfully!');
    } catch (err) {
      console.error("Payment confirmation failed:", err);
      Alert.alert('Payment Failed', 'Something went wrong during payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isConfirmed ? (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success || "#22c55e"} />
            </View>
            <Text style={styles.title}>Booking Confirmed!</Text>
            <Text style={styles.sub}>Your tickets have been booked successfully.</Text>
            <Text style={styles.amount}>₹{Number(total || booking?.totalPrice || 0).toFixed(0)}</Text>
            
            <TouchableOpacity style={styles.btn} onPress={handleBackToHome}>
              <Text style={styles.btnText}>Back to Home</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.iconWrap}>
              {isProcessing ? (
                <ActivityIndicator size="large" color={Colors.secondary} />
              ) : (
                <Ionicons name="card-outline" size={80} color={Colors.secondary} />
              )}
            </View>
            <Text style={styles.title}>{isProcessing ? 'Processing...' : 'Secure Payment'}</Text>
            <Text style={styles.sub}>
              {isProcessing 
                ? 'Please do not close the app while we process your payment.' 
                : `Complete payment to confirm your booking for ${booking?.eventName || 'the event'}.`}
            </Text>
            <Text style={styles.amount}>₹{Number(total || booking?.totalPrice || 0).toFixed(0)}</Text>
            
            {!isProcessing && (
              <TouchableOpacity style={styles.btn} onPress={handlePayNow}>
                <Text style={styles.btnText}>Pay Now</Text>
              </TouchableOpacity>
            )}
            
            {!isProcessing && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconWrap: { marginBottom: 20, height: 80, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  amount: { fontSize: 36, fontWeight: '900', color: Colors.text, marginBottom: 32 },
  btn: { backgroundColor: Colors.secondary, padding: 18, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  secondaryBtn: { marginTop: 16, padding: 12 },
  secondaryBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
});
