import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Alert
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function TurfDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { turfId } = route.params || {};

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  
  const { user } = useAuth();

  const turf = useQuery(api.turfs.getById, { turfId });
  const slots = useQuery(api.turfs.getSlots, { turfId }) || [];
  const reserveSlot = useMutation(api.turfBookings.reserveSlot);

  if (turf === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  if (turf === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: Colors.textMuted }}>Turf not found.</Text>
      </View>
    );
  }

  const currentDayOfWeek = new Date(selectedDate).getDay();
  const daySlots = slots.filter(s => s.dayOfWeek === currentDayOfWeek).sort((a,b) => a.startTime.localeCompare(b.startTime));

  const calculateTotal = () => {
    if (!selectedSlot || !turf) return 0;
    let basePrice = selectedSlot.priceOverride || turf.pricePerHour;
    
    if (turf.pricingType === "per_person") {
        return (turf.pricePerPerson || basePrice) * participantCount;
    } else if (turf.pricingType === "tiered" && turf.pricingTiers && turf.pricingTiers.length > 0) {
        const tier = turf.pricingTiers.find(t => participantCount >= t.min && participantCount <= t.max);
        if (tier) return tier.price;
        const sortedTiers = [...turf.pricingTiers].sort((a, b) => b.max - a.max);
        if (participantCount > sortedTiers[0].max) return sortedTiers[0].price;
    }
    return basePrice;
  };

  const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }
    return dates;
  };

  const handleBooking = async () => {
    if (!user) {
      Alert.alert("Sign In", "Please sign in to book this turf.");
      return;
    }
    if (!selectedSlot) {
      Alert.alert("Missing", "Please select a time slot first.");
      return;
    }

    setIsBooking(true);
    try {
      // Direct booking simulation for mobile avoiding Razorpay complexity out-of-box.
      await reserveSlot({
          turfId: turf._id,
          userId: user.identifier || user.email,
          date: selectedDate,
          slotId: selectedSlot._id,
          participantCount,
          paymentType: "full",
          customerDetails: {
              name: user.name || "Customer",
              email: user.identifier || user.email || "",
              phone: user.phone || ""
          }
      });
      
      Alert.alert(
        "Booking Successful!", 
        "Your turf has been booked successfully.",
        [{ text: "OK", onPress: () => navigation.navigate("MainTabs") }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to book turf.");
    } finally {
      setIsBooking(false);
    }
  };

  const totalAmount = calculateTotal();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Turf Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: turf.images?.[0] || 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=800' }} 
          style={styles.coverImage} 
        />
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{turf.name}</Text>
          </View>
          <Text style={styles.category}>Turf Booking</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.statText}>{turf.location || turf.address || "Local Venue"}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.statText}>Max {turf.maxCapacity || "20"} Players</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this Turf</Text>
          <Text style={styles.description}>{turf.description || "No description provided."}</Text>

          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
            {getUpcomingDates().map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              return (
                <TouchableOpacity 
                  key={dateStr}
                  style={[styles.datePill, isSelected && styles.datePillActive]}
                  onPress={() => {
                    setSelectedDate(dateStr);
                    setSelectedSlot(null);
                  }}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          {daySlots.length === 0 ? (
            <Text style={styles.noSlots}>No slots available on this day.</Text>
          ) : (
            <View style={styles.slotsGrid}>
              {daySlots.map((slot) => {
                const isSelected = selectedSlot?._id === slot._id;
                return (
                  <TouchableOpacity 
                    key={slot._id}
                    style={[styles.slotCard, isSelected && styles.slotCardActive]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotTime, isSelected && styles.slotTextActive]}>
                      {slot.startTime} - {slot.endTime}
                    </Text>
                    <Text style={[styles.slotPrice, isSelected && styles.slotTextActive]}>
                      ₹{slot.priceOverride || turf.pricePerHour}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>Number of Players (Optional)</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setParticipantCount(Math.max(1, participantCount - 1))}>
               <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{participantCount}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setParticipantCount(participantCount + 1)}>
               <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Price</Text>
          <Text style={styles.footerPrice}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, (!selectedSlot || isBooking) && { opacity: 0.7 }]}
          onPress={handleBooking}
          disabled={!selectedSlot || isBooking}
        >
          {isBooking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>Book Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', zIndex: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.black },
  coverImage: { width: '100%', height: 250 },
  content: { padding: 20, paddingBottom: 100 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  name: { fontSize: 28, fontWeight: '900', color: Colors.black, flex: 1 },
  category: { fontSize: 14, fontWeight: '800', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.black, marginBottom: 16, marginTop: 8 },
  description: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 24 },
  
  datesScroll: { marginBottom: 24 },
  datePill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: '#f8fafc', marginRight: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  datePillActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  dateDay: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' },
  dateNum: { fontSize: 20, fontWeight: '900', color: Colors.black },
  dateTextActive: { color: '#fff' },

  noSlots: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 24 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  slotCard: { width: (width - 56) / 2, padding: 16, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  slotCardActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  slotTime: { fontSize: 13, fontWeight: '800', color: Colors.black, marginBottom: 4 },
  slotPrice: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  slotTextActive: { color: '#fff' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  qtyBtnText: { fontSize: 24, fontWeight: '400', color: Colors.black },
  qtyVal: { fontSize: 20, fontWeight: '800', color: Colors.black },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  footerLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  footerPrice: { fontSize: 24, fontWeight: '900', color: Colors.black },
  bookBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, shadowColor: Colors.secondary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
