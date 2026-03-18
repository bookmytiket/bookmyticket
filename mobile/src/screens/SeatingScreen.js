import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Dimensions } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const { width } = Dimensions.get('window');
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getCategoryForRow(categories, rIdx) {
  let sum = 0;
  for (const cat of categories) {
    const rows = Math.max(0, Math.floor(Number(cat.rows) || 0));
    if (rIdx < sum + rows) return cat;
    sum += rows;
  }
  return categories[categories.length - 1] || null;
}

function getCatColor(name) {
  const n = (name || '').toLowerCase();
  if (n === 'vip') return '#f59e0b';
  if (n === 'gold') return '#a855f7';
  if (n === 'premium') return '#6366f1';
  if (n === 'silver') return '#22c55e';
  if (n === 'general') return '#0ea5e9';
  return '#3b82f6';
}

export default function SeatingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, event } = route.params || {};
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  const bookedSeats = useQuery(api.bookings.getBookedSeatsByEvent, { eventId: String(eventId || event?.id || event?._id) }) || [];

  const isSeatBooked = useCallback((seatId) => {
    return bookedSeats.includes(seatId);
  }, [bookedSeats]);

  const isSeating = useMemo(() => {
    return event &&
      event.seatingEnabled !== false &&
      Array.isArray(event.seatCategories) &&
      event.seatCategories.length > 0 &&
      Number(event.cols) > 0;
  }, [event]);

  const totalRows = useMemo(() => {
    if (!isSeating) return 0;
    return event.seatCategories.reduce((s, c) => s + Math.max(0, Math.floor(Number(c.rows) || 0)), 0);
  }, [isSeating, event]);

  const cols = useMemo(() => Math.min(30, Math.max(0, Math.floor(Number(event?.cols) || 0))), [event]);

  const toggleSeat = (seatId, cat) => {
    if (isSeatBooked(seatId)) return; // Prevent toggling booked seats
    setSelectedSeats(prev => {
      const idx = prev.findIndex(s => s.id === seatId);
      if (idx >= 0) return prev.filter(s => s.id !== seatId);
      return [...prev, { id: seatId, catName: cat.name, price: Number(cat.price) || 0, isFree: !!cat.isFree }];
    });
  };

  useFocusEffect(
    useCallback(() => {
      // Clear selected seats when returning to this screen
      setSelectedSeats([]);
    }, [])
  );

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;
    navigation.navigate('Checkout', { eventId, event, selectedSeats });
  };

  if (!isSeating) {
      return (
          <View style={styles.center}>
              <Text>Seating not available for this event.</Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>Select Seats</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{event.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.legend}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legendList}>
          {event.seatCategories.map(cat => (
            <View key={cat.name} style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: getCatColor(cat.name) }]} />
              <Text style={styles.legendLabel}>{cat.name} {cat.isFree ? '(Free)' : `₹${cat.price}`}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#f84464' }]} />
            <Text style={styles.legendLabel}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#d1d5db' }]} />
            <Text style={[styles.legendLabel, { textDecorationLine: 'line-through' }]}>Booked</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.seatingArea} contentContainerStyle={styles.seatingContent}>
        <View style={styles.stage}>
          <View style={styles.stageBar} />
          <Text style={styles.stageText}>STAGE / PERFORMANCE AREA</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalSeating}>
          <View style={styles.rowsContainer}>
            {[...Array(totalRows)].map((_, rIdx) => {
              const rowLabel = ROW_LABELS[rIdx] || `${rIdx + 1}`;
              const cat = getCategoryForRow(event.seatCategories, rIdx);
              const color = cat ? getCatColor(cat.name) : '#3b82f6';
              return (
                <View key={rIdx} style={styles.row}>
                  <Text style={[styles.rowLabel, { color }]}>{rowLabel}</Text>
                  <View style={styles.seatsRow}>
                    {[...Array(cols)].map((_, cIdx) => {
                      const seatId = `${rowLabel}${cIdx + 1}`;
                      const isSelected = selectedSeats.some(s => s.id === seatId);
                      const isBooked = isSeatBooked(seatId);

                      let bgColor = `${color}10`;
                      let borderColor = color;
                      let textColor = color;

                      if (isBooked) {
                        bgColor = '#e5e7eb';
                        borderColor = '#d1d5db';
                        textColor = '#9ca3af';
                      } else if (isSelected) {
                        bgColor = '#f84464';
                        borderColor = '#f84464';
                        textColor = '#fff';
                      }

                      return (
                        <TouchableOpacity
                          key={cIdx}
                          onPress={() => !isBooked && cat && toggleSeat(seatId, cat)}
                          activeOpacity={0.7}
                          disabled={isBooked}
                          style={[
                            styles.seat,
                            { 
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                              opacity: isBooked ? 0.6 : 1
                            }
                          ]}
                        >
                          <Text style={[styles.seatText, { color: textColor }]}>{cIdx + 1}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerDetails}>
          <Text style={styles.footerCount}>{selectedSeats.length} Seats Selected</Text>
          <Text style={styles.footerPrice}>
            Total: ₹{selectedSeats.reduce((s, seat) => s + (seat.isFree ? 0 : seat.price), 0)}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.continueBtn, selectedSeats.length === 0 && styles.disabledBtn]} 
          onPress={handleContinue}
          disabled={selectedSeats.length === 0}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginTop: Platform.OS === 'android' ? 30 : 0
  },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textLight },
  legend: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  legendList: { paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
  legendLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  seatingArea: { flex: 1 },
  seatingContent: { paddingVertical: 40, alignItems: 'center' },
  stage: { width: '80%', alignItems: 'center', marginBottom: 40 },
  stageBar: { width: '100%', height: 6, backgroundColor: '#3b82f6', borderRadius: 3, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  stageText: { fontSize: 10, fontWeight: '900', color: '#64748b', letterSpacing: 3, marginTop: 8 },
  horizontalSeating: { paddingHorizontal: 20 },
  rowsContainer: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { width: 30, textAlign: 'right', fontSize: 12, fontWeight: '900' },
  seatsRow: { flexDirection: 'row', gap: 6 },
  seat: { 
    width: 32, 
    height: 32, 
    borderRadius: 6, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  seatText: { fontSize: 10, fontWeight: '800' },
  footer: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  footerDetails: { flex: 1 },
  footerCount: { fontSize: 14, fontWeight: '600', color: Colors.textLight },
  footerPrice: { fontSize: 18, fontWeight: '800', color: Colors.text },
  continueBtn: { 
    backgroundColor: '#f84464', 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 12,
    shadowColor: '#f84464',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  disabledBtn: { backgroundColor: '#e2e8f0', shadowOpacity: 0, elevation: 0 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
