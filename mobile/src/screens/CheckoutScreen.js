import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS } from '../utils/feeBreakdown';
import CheckoutFooterBar from '../components/CheckoutFooterBar';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop';

function getEventById(id, supabaseEvents) {
  const sid = String(id);
  const fromSupabase = (supabaseEvents || []).find((e) => String(e.id) === sid);
  if (!fromSupabase) return null;
  return {
    ...fromSupabase,
    id: fromSupabase.id,
    title: fromSupabase.title || 'Event',
    date: fromSupabase.date || 'TBA',
    location: fromSupabase.location || fromSupabase.venue || fromSupabase.address || 'Venue',
    price: fromSupabase.price ?? fromSupabase.normalTicketPrice ?? 499,
  };
}

export default function CheckoutScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, event: routeEvent, selectedSeats = [] } = route.params || {};

  // Migrated to Supabase
  const { data: supabaseEvents } = useSupabaseQuery('events', (q) => q.select('*').or('status.eq.Active,status.eq.published'));
  const { data: supabaseConfig } = useSupabaseQuery('fee_settings', (q) => q.limit(1).maybeSingle());

  const isSeating = selectedSeats.length > 0;
  const [qty, setQty] = useState(isSeating ? selectedSeats.length : 1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);

  useEffect(() => {
    if (supabaseConfig) {
      setFeeSettings((p) => ({ ...p, ...supabaseConfig }));
    }
  }, [supabaseConfig]);

  const event = useMemo(() => {
    if (routeEvent) return { ...routeEvent, id: routeEvent.id };
    return getEventById(eventId, supabaseEvents);
  }, [eventId, routeEvent, supabaseEvents]);

  const totalSeatPrice = selectedSeats.reduce((s, seat) => s + (seat.isFree ? 0 : seat.price), 0);
  const ticketPrice = event?.price ?? 499;
  const baseAmount = isSeating ? totalSeatPrice : ticketPrice * Math.max(1, qty);
  const { convenienceFee, gst, total } = useMemo(() => getFeeBreakdown(baseAmount, feeSettings), [baseAmount, feeSettings]);

  // Mutation using Edge Function
  const { mutate: callCreateBooking } = useSupabaseMutation(async (supabase, data) => {
    const { data: result, error } = await supabase.functions.invoke('booking-handler', {
      body: { action: 'create-booking', data }
    });
    if (error) throw error;
    return result;
  });

  const handleConfirm = useCallback(async () => {
    if (!event) return;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing details', 'Please fill name, email and phone.');
      return;
    }
    try {
      const bookingData = {
        eventId: String(event.id),
        userId: email.trim().toLowerCase(),
        ticketCount: isSeating ? selectedSeats.length : qty,
        totalPrice: total,
        status: 'Pending',
        scanned: false,
        customerDetails: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }
      };

      if (isSeating) {
        bookingData.selectedSeats = selectedSeats;
      }

      const bookingResult = await callCreateBooking(bookingData);
      const bookingId = bookingResult.id;
      
      if (total === 0) {
        // Free booking confirmed immediately
        navigation.navigate('Payment', { bookingId: String(bookingId), eventId: String(event.id), total, event, success: true });
      } else {
        navigation.navigate('Payment', { bookingId: String(bookingId), eventId: String(event.id), total, event });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not create booking. Please try again.');
    }
  }, [event, qty, total, name, email, phone, callCreateBooking, navigation, isSeating, selectedSeats]);

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Event not found</Text>
      </View>
    );
  }

  const isFree = total === 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.location}>{event.location}</Text>
      </View>

      {!isSeating && (
        <View style={styles.card}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((x) => Math.max(1, x - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((x) => x + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isSeating && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selected Seats</Text>
          {selectedSeats.map(seat => (
            <View key={seat.id} style={styles.seatSummaryRow}>
              <Text style={styles.seatInfo}>Seat {seat.id} ({seat.catName})</Text>
              <Text style={styles.seatPrice}>{seat.isFree ? 'Free' : `₹${seat.price}`}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#9ca3af" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" placeholderTextColor="#9ca3af" autoCapitalize="none" />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" placeholderTextColor="#9ca3af" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Base amount</Text>
          <Text style={styles.rowVal}>₹{baseAmount.toFixed(0)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Fees + GST</Text>
          <Text style={styles.rowVal}>₹{(convenienceFee + gst).toFixed(0)}</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>{isFree ? 'FREE' : `₹${total.toFixed(0)}`}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.confirmBtn, isFree && { backgroundColor: '#10b981', shadowColor: '#10b981' }]} 
        onPress={handleConfirm}
      >
        <Text style={styles.confirmBtnText}>{isFree ? 'Confirm Free Booking' : 'Proceed to Payment'}</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, color: '#6b7280' },
  sectionHeader: { marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  location: { fontSize: 14, color: '#64748b', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#1e293b',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  qtyBtnText: { fontSize: 24, fontWeight: '400', color: '#1e293b' },
  qtyVal: { fontSize: 20, fontWeight: '800', minWidth: 32, textAlign: 'center', color: '#1e293b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  rowVal: { fontSize: 14, color: '#1e293b', fontWeight: '700' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 8, paddingTop: 16 },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#111827' },
  totalVal: { fontSize: 20, fontWeight: '900', color: '#f43f5e' },
  confirmBtn: { backgroundColor: '#f43f5e', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  seatSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 4 },
  seatInfo: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  seatPrice: { fontSize: 14, color: '#111827', fontWeight: '700' },
});
