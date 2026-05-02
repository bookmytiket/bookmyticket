import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { ArrowLeft, CheckCircle, Ticket, Calendar, Clock, MapPin, ChevronRight, Info } from 'lucide-react-native';

const SLOTS = ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"];

export default function ServiceBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Turf Specific State
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try service_providers
        const { data: provider } = await supabase.from('service_providers').select('*').eq('id', id).single();
        if (provider) {
          setItem({ ...provider, isTurf: false });
        } else {
          // Try turfs
          const { data: turf } = await supabase.from('turfs').select('*').eq('id', id).single();
          if (turf) {
            setItem({ 
              ...turf, 
              business_name: turf.name, 
              isTurf: true,
              image_url: Array.isArray(turf.images) ? turf.images[0] : (turf.images || turf.image_url),
              starting_price: turf.price_per_hour
            });
          }
        }
      } catch (err) {
        console.error('Error fetching booking item:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to complete your booking.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/sign-in') }
      ]);
      return;
    }

    if (item?.isTurf && !selectedSlot) {
      Alert.alert('Select a Slot', 'Please select a time slot to continue.');
      return;
    }
    
    setSubmitting(true);
    // Simulate booking process
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#f844a4" />
        <Text style={{ marginTop: 12, fontWeight: '600', color: colors.muted }}>Loading details...</Text>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <MotiView
          from={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }} style={styles.successContent}
        >
          <LinearGradient colors={['#22c55e20', '#22c55e10']} style={styles.successIcon}>
            <CheckCircle size={64} color="#22c55e" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            {item?.isTurf ? 'Turf Booked Successfully!' : 'Request Sent!'}
          </Text>
          <Text style={[styles.successSub, { color: colors.muted }]}>
            {item?.isTurf 
              ? `Your slot at ${item.business_name} for ${selectedDate} has been confirmed.`
              : 'The professional will contact you shortly to discuss the details.'}
          </Text>
          <Pressable style={styles.successBtn} onPress={() => router.replace('/(tabs)')}>
            <LinearGradient colors={colors.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successBtnGradient}>
              <Text style={styles.successBtnText}>Back to Home</Text>
            </LinearGradient>
          </Pressable>
        </MotiView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {item?.isTurf ? 'Turf Booking' : 'Book Service'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Item Summary Card */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={{ uri: item?.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400' }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemCat, { color: '#f844a4' }]}>{item?.category || (item?.isTurf ? 'Turf' : 'Service')}</Text>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{item?.business_name}</Text>
            <View style={styles.itemLocation}>
              <MapPin size={12} color={colors.muted} />
              <Text style={[styles.itemLocText, { color: colors.muted }]}>{item?.city || 'Location TBA'}</Text>
            </View>
          </View>
        </MotiView>

        {item?.isTurf ? (
          <>
            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateContainer}>
                {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const dateStr = d.toLocaleDateString('en-GB');
                  const active = selectedDate === dateStr;
                  return (
                    <Pressable key={offset} onPress={() => setSelectedDate(dateStr)} style={[styles.datePill, active && { backgroundColor: '#f844a4', borderColor: '#f844a4' }, { borderColor: colors.border }]}>
                      <Text style={[styles.dateDay, { color: active ? '#fff' : colors.muted }]}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                      <Text style={[styles.dateNum, { color: active ? '#fff' : colors.text }]}>{d.getDate()}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Slot Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Slots</Text>
              <View style={styles.slotsGrid}>
                {SLOTS.map(slot => {
                  const active = selectedSlot === slot;
                  return (
                    <Pressable key={slot} onPress={() => setSelectedSlot(slot)} style={[styles.slotItem, active && { backgroundColor: '#f844a4', borderColor: '#f844a4' }, { borderColor: colors.border }]}>
                      <Clock size={14} color={active ? '#fff' : colors.muted} />
                      <Text style={[styles.slotText, { color: active ? '#fff' : colors.text }]}>{slot}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Duration */}
            <View style={[styles.section, styles.durationRow]}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Duration (Hours)</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Min 1 hour required</Text>
              </View>
              <View style={styles.counter}>
                <Pressable onPress={() => setDuration(Math.max(1, duration - 1))} style={styles.counterBtn}>
                  <Text style={{ color: colors.text, fontSize: 20 }}>-</Text>
                </Pressable>
                <Text style={[styles.counterVal, { color: colors.text }]}>{duration}</Text>
                <Pressable onPress={() => setDuration(duration + 1)} style={styles.counterBtn}>
                  <Text style={{ color: colors.text, fontSize: 20 }}>+</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
             <View style={[styles.infoCard, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                <Info size={20} color="#3b82f6" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>Direct Booking Inquiry</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 4 }}>
                    By clicking confirm, we will share your profile details with {item?.business_name}. They will reach out with a customized quote based on your requirements.
                  </Text>
                </View>
             </View>
          </View>
        )}

        {/* Pricing Summary */}
        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.priceTitle, { color: colors.text }]}>Booking Summary</Text>
          <View style={styles.priceRow}>
            <Text style={{ color: colors.muted }}>{item?.isTurf ? 'Hourly Rate' : 'Consultation Fee'}</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>₹{Number(item?.starting_price || 0).toLocaleString()}</Text>
          </View>
          {item?.isTurf && (
            <View style={styles.priceRow}>
              <Text style={{ color: colors.muted }}>Duration</Text>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{duration} Hours</Text>
            </View>
          )}
          <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>Total Amount</Text>
            <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 22 }}>₹{(Number(item?.starting_price || 0) * (item?.isTurf ? duration : 1)).toLocaleString()}</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable onPress={handleConfirm} disabled={submitting} style={{ overflow: 'hidden', borderRadius: 18 }}>
          <LinearGradient colors={colors.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ticket size={20} color="#fff" />
                <Text style={styles.confirmText}>{item?.isTurf ? 'Confirm Booking' : 'Send Inquiry'}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, paddingTop: 50,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  scrollContent: { padding: 16 },
  summaryCard: { flexDirection: 'row', padding: 12, borderRadius: 20, borderWidth: 1, gap: 16, marginBottom: 24 },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemCat: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  itemTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  itemLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLocText: { fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 16 },
  dateContainer: { gap: 12 },
  datePill: { width: 60, height: 75, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dateDay: { fontSize: 11, fontWeight: '800' },
  dateNum: { fontSize: 18, fontWeight: '900' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotItem: { width: '31%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  slotText: { fontSize: 11, fontWeight: '800' },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(0,0,0,0.03)', padding: 4, borderRadius: 12 },
  counterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 8 },
  counterVal: { fontSize: 18, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  infoCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  priceCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
  priceTitle: { fontSize: 16, fontWeight: '900', marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceDivider: { height: 1, marginVertical: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { padding: 16, paddingBottom: 40, borderTopWidth: 1 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  successBtn: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  successBtnGradient: { alignItems: 'center', paddingVertical: 18 },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
