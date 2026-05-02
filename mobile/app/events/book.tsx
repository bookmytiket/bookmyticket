import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  Alert,
  TextInput,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useSupabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Minus,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

export default function BookEventScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setEvent(data);

      // Pre-select first tier
      const tiers = data.tickets || data.dynamic_config?.tickets || [];
      if (tiers.length > 0) setSelectedTier(tiers[0]);
    } catch (err) {
      console.error('Error fetching event for booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const ticketTiers = event?.tickets || event?.dynamic_config?.tickets || [];
  const tierPrice = selectedTier ? Number(selectedTier.price || 0) : Number(event?.price || 0);
  const subtotal = tierPrice * quantity;
  const convenienceFee = event?.is_free ? 0 : Math.round(subtotal * 0.02);
  const total = subtotal + convenienceFee;

  const handleBook = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Info', 'Please fill in your name and email.');
      return;
    }

    setSubmitting(true);
    try {
      const bookingPayload = {
        user_id: user?.id,
        event_id: event.id,
        ticket_type: selectedTier?.name || selectedTier?.type || 'General',
        quantity,
        amount: total,
        payment_status: event.is_free ? 'paid' : 'pending',
        booking_status: 'confirmed',
        attendee_name: name.trim(),
        attendee_email: email.trim(),
        attendee_phone: phone.trim() || null,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select()
        .single();

      if (error) throw error;

      if (event.is_free) {
        setSuccess(true);
      } else {
        // For paid events: navigate to payment (Cashfree/Razorpay)
        // For now show success (payment integration point)
        Alert.alert(
          'Booking Confirmed!',
          'Your booking has been confirmed. Payment integration coming soon.',
          [
            {
              text: 'View Ticket',
              onPress: () => {
                router.replace('/(tabs)/tickets');
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <RNView style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.successContent}
        >
          <LinearGradient
            colors={['#22c55e20', '#22c55e10']}
            style={styles.successIcon}
          >
            <CheckCircle size={64} color="#22c55e" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Booking Confirmed! 🎉
          </Text>
          <Text style={[styles.successSub, { color: colors.muted }]}>
            Your ticket for "{event?.title}" is ready
          </Text>
          <Pressable
            style={styles.successBtn}
            onPress={() => router.replace('/(tabs)/tickets')}
          >
            <LinearGradient
              colors={colors.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.successBtnGradient}
            >
              <Ticket size={18} color="#fff" />
              <Text style={styles.successBtnText}>View My Tickets</Text>
            </LinearGradient>
          </Pressable>
        </MotiView>
      </RNView>
    );
  }

  if (loading || !event) {
    return (
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>
        <RNView style={[styles.skeletonHero, { backgroundColor: colors.border }]} />
      </RNView>
    );
  }

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <RNView style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Book Tickets</Text>
        <RNView style={{ width: 22 }} />
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Event summary */}
        <RNView style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={{ uri: event.img || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200' }}
            style={styles.eventThumb}
            contentFit="cover"
          />
          <RNView style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {event.title}
            </Text>
            <RNView style={styles.metaRow}>
              <Calendar size={12} color={colors.tint} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{event.date || 'TBA'}</Text>
            </RNView>
            <RNView style={styles.metaRow}>
              <MapPin size={12} color={colors.error} />
              <Text style={[styles.metaText, { color: colors.muted }]} numberOfLines={1}>
                {event.location || event.city || 'TBA'}
              </Text>
            </RNView>
          </RNView>
        </RNView>

        {/* Ticket tiers */}
        {ticketTiers.length > 0 && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Ticket Type</Text>
            {ticketTiers.map((tier: any, i: number) => {
              const isSelected = selectedTier?.name === tier.name && selectedTier?.type === tier.type;
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedTier(tier)}
                  style={[
                    styles.tierOption,
                    {
                      backgroundColor: isSelected ? colors.tint + '15' : colors.card,
                      borderColor: isSelected ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <RNView style={styles.tierLeft}>
                    <RNView
                      style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? colors.tint : colors.border },
                      ]}
                    >
                      {isSelected && (
                        <RNView style={[styles.radioInner, { backgroundColor: colors.tint }]} />
                      )}
                    </RNView>
                    <RNView>
                      <Text style={[styles.tierName, { color: colors.text }]}>
                        {tier.name || tier.type || 'General'}
                      </Text>
                      {tier.description && (
                        <Text style={[styles.tierDesc, { color: colors.muted }]}>
                          {tier.description}
                        </Text>
                      )}
                    </RNView>
                  </RNView>
                  <Text style={[styles.tierPrice, { color: colors.tint }]}>
                    {Number(tier.price) === 0 ? 'FREE' : `₹${Number(tier.price).toLocaleString('en-IN')}`}
                  </Text>
                </Pressable>
              );
            })}
          </RNView>
        )}

        {/* Quantity */}
        <RNView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quantity</Text>
          <RNView style={[styles.quantityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={[styles.quantityBtn, { backgroundColor: colors.border }]}
            >
              <Minus size={18} color={colors.text} />
            </Pressable>
            <Text style={[styles.quantityValue, { color: colors.text }]}>{quantity}</Text>
            <Pressable
              onPress={() => setQuantity((q) => Math.min(10, q + 1))}
              style={[styles.quantityBtn, { backgroundColor: colors.tint }]}
            >
              <Plus size={18} color="#fff" />
            </Pressable>
          </RNView>
        </RNView>

        {/* Attendee info */}
        <RNView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Details</Text>
          <RNView style={styles.formFields}>
            <RNView style={styles.fieldWrapper}>
              <Text style={[styles.label, { color: colors.muted }]}>Full Name *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </RNView>
            <RNView style={styles.fieldWrapper}>
              <Text style={[styles.label, { color: colors.muted }]}>Email Address *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </RNView>
            <RNView style={styles.fieldWrapper}>
              <Text style={[styles.label, { color: colors.muted }]}>Phone Number</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="+91 9876543210"
                placeholderTextColor={colors.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </RNView>
          </RNView>
        </RNView>

        {/* Price breakdown */}
        <RNView style={[styles.priceBreakdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>Price Breakdown</Text>
          <RNView style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
              {selectedTier?.name || 'General'} × {quantity}
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {subtotal === 0 ? 'FREE' : `₹${subtotal.toLocaleString('en-IN')}`}
            </Text>
          </RNView>
          {convenienceFee > 0 && (
            <RNView style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
                Convenience fee (2%)
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ₹{convenienceFee.toLocaleString('en-IN')}
              </Text>
            </RNView>
          )}
          <RNView style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <RNView style={styles.breakdownRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.tint }]}>
              {total === 0 ? 'FREE' : `₹${total.toLocaleString('en-IN')}`}
            </Text>
          </RNView>
        </RNView>
      </ScrollView>

      {/* CTA */}
      <RNView style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleBook}
          disabled={submitting}
          style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            <Ticket size={18} color="#fff" />
            <Text style={styles.bookBtnText}>
              {submitting
                ? 'Processing...'
                : event.is_free
                ? 'Confirm Free Ticket'
                : `Pay ₹${total.toLocaleString('en-IN')}`}
            </Text>
          </LinearGradient>
        </Pressable>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeletonHero: { height: 200, margin: 16, borderRadius: 16 },
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
  eventCard: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  eventThumb: { width: 72, height: 72, borderRadius: 12 },
  eventInfo: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 15, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 12 },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  tierName: { fontSize: 14, fontWeight: '800' },
  tierDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  tierPrice: { fontSize: 15, fontWeight: '900' },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quantityBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  quantityValue: { fontSize: 20, fontWeight: '900' },
  formFields: { gap: 12 },
  fieldWrapper: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    fontWeight: '600',
  },
  priceBreakdown: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  breakdownTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 14, fontWeight: '600' },
  breakdownValue: { fontSize: 14, fontWeight: '700' },
  breakdownDivider: { height: 1, marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: '900' },
  totalValue: { fontSize: 18, fontWeight: '900' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 26, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  successBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  successBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
