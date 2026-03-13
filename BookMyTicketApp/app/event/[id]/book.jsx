import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookTicketScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const events = useQuery(api.events.getActiveEvents) || [];
  const event = events.find(e => e._id === id);
  
  const createBooking = useMutation(api.bookings.create);

  const [ticketCount, setTicketCount] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.identifier || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!event) return null;

  const pricePerTicket = event.price || event.normalTicketPrice || 0;
  const convenienceFee = 50; // Fixed for now
  const totalPrice = (pricePerTicket * ticketCount) + convenienceFee;

  const handleBooking = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await createBooking({
        eventId: id,
        userId: user.identifier,
        eventName: event.title,
        ticketCount,
        totalPrice,
        customerDetails: { name, email, phone },
        status: 'Confirmed', // Automatically confirming for demo purposes
      });
      
      Alert.alert(
        'Success!',
        'Your tickets have been booked successfully.',
        [{ text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventDetail}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.eventDetailText}>{event.date} • {event.time || 'TBA'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Tickets</Text>
          <View style={styles.counterContainer}>
            <View>
              <Text style={styles.ticketType}>General Admission</Text>
              <Text style={styles.ticketPrice}>₹{pricePerTicket} per ticket</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity 
                style={[styles.counterBtn, ticketCount <= 1 && styles.counterBtnDisabled]} 
                onPress={() => setTicketCount(Math.max(1, ticketCount - 1))}
              >
                <Ionicons name="remove" size={20} color={ticketCount <= 1 ? '#cbd5e1' : '#f84464'} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{ticketCount}</Text>
              <TouchableOpacity 
                style={styles.counterBtn} 
                onPress={() => setTicketCount(ticketCount + 1)}
              >
                <Ionicons name="add" size={20} color="#f84464" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendee Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tickets ({ticketCount} x ₹{pricePerTicket})</Text>
            <Text style={styles.summaryValue}>₹{pricePerTicket * ticketCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Convenience Fee</Text>
            <Text style={styles.summaryValue}>₹{convenienceFee}</Text>
          </View>
          <View style={[styles.summaryItem, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalPrice}</Text>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.disabledButton]} 
          onPress={handleBooking}
          disabled={loading}
        >
          <LinearGradient
            colors={['#f84464', '#c026d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payGradient}
          >
            <Text style={styles.payButtonText}>
              {loading ? 'Processing...' : `Pay ₹${totalPrice}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f8fafc',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 15,
    color: '#64748b',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  ticketType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  ticketPrice: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 4,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  counterBtnDisabled: {
    opacity: 0.5,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginHorizontal: 15,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f84464',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  payButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#f84464',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  payGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
