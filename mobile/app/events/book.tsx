import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
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
  ChevronDown,
} from 'lucide-react-native';
import { getFeeBreakdown, resolveFeeSettings } from '@/lib/feeBreakdown';

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
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState('');
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<any>({});
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    fetchEvent();

    // Real-time subscription
    fetchCoupons();
    const channel = supabase
      .channel(`event-updates-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setEvent(payload.new);
          processEventData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const processEventData = (data: any) => {
    const parsedConfig = safeParse(data.dynamic_config) || {};
    const ticketsData = safeParse(data.tickets);
    const parsedTickets = (Array.isArray(ticketsData) && ticketsData.length > 0) 
      ? ticketsData 
      : (parsedConfig.tickets || parsedConfig.categories || []);
    const tiers = Array.isArray(parsedTickets) ? parsedTickets : [];
    if (tiers.length > 0) {
      setSelectedTier(tiers[0]);
      const rawRates = tiers[0].ageRates || tiers[0].agePricing || tiers[0].age_rates || tiers[0].age_pricing || [];
      if (Array.isArray(rawRates) && rawRates.length > 0) {
        setSelectedAgeGroup(rawRates[0]);
      }
    }
    
    // Pre-fill form with defaults
    const form = parsedConfig.registrationForm || [];
    const initialResponses: any = {};
    form.forEach((f: any) => {
      if (f.isDefault) {
        if (f.label === 'Full Name') initialResponses[f.id] = user?.user_metadata?.full_name || '';
        if (f.label === 'Email Address') initialResponses[f.id] = user?.email || '';
      }
    });
    setFormResponses(initialResponses);
  };

  const safeParse = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return null; }
    }
    return val;
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAvailableCoupons(data || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organiser:profiles!events_organiser_id_fkey (*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setEvent(data);
      processEventData(data);
    } catch (err) {
      console.error('Error fetching event for booking:', err);
    } finally {
      setLoading(false);
    }
  };
  const dynamicConfig = safeParse(event?.dynamic_config) || {};
  const ticketsData = safeParse(event?.tickets);
  const parsedTickets = (Array.isArray(ticketsData) && ticketsData.length > 0) 
    ? ticketsData 
    : (dynamicConfig.tickets || dynamicConfig.categories || []);
  const ticketTiers = Array.isArray(parsedTickets) ? parsedTickets : [];
  
  const getBasePrice = () => {
    if (selectedAgeGroup) return Number(selectedAgeGroup.price || 0);
    if (selectedTier) {
      const rawRates = selectedTier.ageRates || selectedTier.agePricing || selectedTier.age_rates || selectedTier.age_pricing || [];
      if (Array.isArray(rawRates) && rawRates.length > 0) {
        return Number(rawRates[0].price || 0);
      }
      return Number(selectedTier.price || 0);
    }
    return Number(event?.price || 0);
  };

  const basePrice = getBasePrice();
  const { subtotal, convenienceFee, gst, total, discountAmount } = (() => {
    const base = basePrice * quantity;
    if (event?.is_free) return { subtotal: 0, convenienceFee: 0, gst: 0, total: 0, discountAmount: 0 };
    
    // Calculate discount
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        discount = (base * Number(appliedCoupon.value)) / 100;
      } else {
        discount = Math.min(base, Number(appliedCoupon.value));
      }
    }

    // Resolve fee settings based on organiser overrides
    const resolvedSettings = resolveFeeSettings({}, event?.organiser || {}, event?.fee_config || {});
    const breakdown = getFeeBreakdown(base, resolvedSettings, discount);
    return {
      subtotal: base,
      convenienceFee: breakdown.convenienceFee,
      gst: breakdown.gst,
      total: breakdown.total,
      discountAmount: discount
    };
  })();

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    
    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        Alert.alert('Invalid Coupon', 'This coupon code does not exist or is expired.');
        return;
      }

      // Check constraints
      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        Alert.alert('Expired', 'This coupon has expired.');
        return;
      }
      if (quantity < (data.min_tickets || 1)) {
        Alert.alert('Limit Not Met', `Minimum ${data.min_tickets || 1} tickets required.`);
        return;
      }

      setAppliedCoupon(data);
      Alert.alert('Success', `Coupon ${code} applied successfully!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to validate coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

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
        form_responses: formResponses,
        age_group: selectedAgeGroup?.label || null,
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
        // Paid Event - Initialize Razorpay via WebView
        setCurrentBookingId(data.id);
        
        // Generate Razorpay Checkout HTML
        const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { background-color: #f8f9fa; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
              .loader { border: 4px solid #f3f3f3; border-top: 4px solid #f84464; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            <script>
              var options = {
                key: "${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_SkQ5MQO9dB5LuI'}",
                amount: "${Math.round(total * 100)}",
                currency: "INR",
                name: "BookMyTicket",
                description: "Ticket for ${event.name || event.title}",
                prefill: {
                  name: "${name.trim()}",
                  email: "${email.trim()}",
                  contact: "${phone.trim()}"
                },
                theme: { color: "#f84464" },
                handler: function(response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', paymentId: response.razorpay_payment_id }));
                }
              };
              options.modal = {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'dismissed' }));
                }
              };
              setTimeout(() => {
                var rzp = new Razorpay(options);
                rzp.open();
              }, 500);
            </script>
          </body>
        </html>
        `;
        
        setRazorpayHtml(html);
        setShowRazorpay(true);
      }
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRazorpayMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'success') {
        setShowRazorpay(false);
        // Update booking status in Supabase
        if (currentBookingId) {
          await supabase.from('bookings').update({ payment_status: 'paid', payment_id: data.paymentId }).eq('id', currentBookingId);
        }
        setSuccess(true);
      } else if (data.event === 'dismissed') {
        setShowRazorpay(false);
        Alert.alert('Payment Cancelled', 'You can retry the payment from your tickets page.');
      }
    } catch (e) {
      console.log('Error parsing Razorpay message', e);
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
      {/* Razorpay Webview Modal */}
      <Modal visible={showRazorpay} animationType="slide" transparent={false}>
        <RNView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 40 }}>
          <Pressable onPress={() => setShowRazorpay(false)} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>Cancel Payment</Text>
          </Pressable>
          {razorpayHtml ? (
            <WebView
              source={{ html: razorpayHtml }}
              onMessage={handleRazorpayMessage}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
            />
          ) : null}
        </RNView>
      </Modal>

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
              {event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event Booking'}
            </Text>
            <RNView style={styles.metaRow}>
              <Calendar size={12} color={colors.tint} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{event.start_date || event.date || dynamicConfig?.date || dynamicConfig?.basicInfo?.date || dynamicConfig?.basicInfo?.expiryDate || 'TBA'}</Text>
            </RNView>
            <RNView style={styles.metaRow}>
              <MapPin size={12} color={colors.error} />
              <Text style={[styles.metaText, { color: colors.muted }]} numberOfLines={1}>
                {event.venue || event.location || event.city || dynamicConfig?.venue?.name || dynamicConfig?.basicInfo?.venue || 'TBA'}
              </Text>
            </RNView>
          </RNView>
        </RNView>

        {/* Ticket tiers */}
        {ticketTiers.length > 0 && (
          <RNView style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Category</Text>
            {ticketTiers.map((tier: any, i: number) => {
              const isSelected = selectedTier?.name === tier.name || selectedTier?.id === tier.id;
              
              // Robust price calculation for the list item
              const tierPrice = (() => {
                const rawRates = tier.ageRates || tier.agePricing || tier.age_rates || tier.age_pricing || [];
                if (Array.isArray(rawRates) && rawRates.length > 0) {
                  return Math.min(...rawRates.map((r: any) => Number(r.price || 0)));
                }
                return Number(tier.price || 0);
              })();

              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    setSelectedTier(tier);
                    const rawRates = tier.ageRates || tier.agePricing || tier.age_rates || tier.age_pricing || [];
                    if (Array.isArray(rawRates) && rawRates.length > 0) {
                      setSelectedAgeGroup(rawRates[0]);
                    } else {
                      setSelectedAgeGroup(null);
                    }
                  }}
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
                      {(tier.description || tier.gender) && (
                        <Text style={[styles.tierDesc, { color: colors.muted }]}>
                          {[tier.gender, tier.description].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                    </RNView>
                  </RNView>
                  <Text style={[styles.tierPrice, { color: colors.tint }]}>
                    {tierPrice === 0 ? 'FREE' : `₹${tierPrice.toLocaleString('en-IN')}`}
                  </Text>
                </Pressable>
              );
            })}
          </RNView>
        )}

        {/* Age Group selection */}
        {(() => {
          const rawRates = selectedTier?.ageRates || selectedTier?.agePricing || selectedTier?.age_rates || selectedTier?.age_pricing || [];
          if (Array.isArray(rawRates) && rawRates.length > 0) {
            return (
              <RNView style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Age Group</Text>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Select Age Group',
                      '',
                      [
                        ...rawRates.map((ap: any) => ({
                          text: `${ap.label || `${ap.minAge || ap.min}-${ap.maxAge || ap.max} Yrs`} - ₹${Number(ap.price || 0).toLocaleString('en-IN')}`,
                          onPress: () => setSelectedAgeGroup(ap)
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                >
                  <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: selectedAgeGroup ? colors.text : colors.muted, fontSize: 15, fontWeight: '600' }}>
                      {selectedAgeGroup 
                        ? `${selectedAgeGroup.label || `${selectedAgeGroup.minAge || selectedAgeGroup.min}-${selectedAgeGroup.maxAge || selectedAgeGroup.max} Yrs`} (₹${Number(selectedAgeGroup.price || 0).toLocaleString('en-IN')})`
                        : 'Select age group'}
                    </Text>
                    <ChevronDown size={18} color={colors.muted} />
                  </RNView>
                </Pressable>
              </RNView>
            );
          }
          return null;
        })()}

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

        {/* Dynamic Registration Form */}
        <RNView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Participant Details</Text>
          <RNView style={styles.formFields}>
            {(dynamicConfig.registrationForm || []).map((field: any) => (
              <RNView key={field.id} style={styles.fieldWrapper}>
                <Text style={[styles.label, { color: colors.muted }]}>
                  {field.label} {field.required ? '*' : ''}
                </Text>
                {field.type === 'select' ? (
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        `Select ${field.label}`,
                        '',
                        [
                          ...(field.options || []).map((opt: string) => ({
                            text: opt,
                            onPress: () => setFormResponses({ ...formResponses, [field.id]: opt })
                          })),
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                  >
                    <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: formResponses[field.id] ? colors.text : colors.muted, fontSize: 15, fontWeight: '600' }}>
                        {formResponses[field.id] || `Select ${field.label.toLowerCase()}`}
                      </Text>
                      <ChevronDown size={18} color={colors.muted} />
                    </RNView>
                  </Pressable>
                ) : (
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={colors.muted}
                    value={formResponses[field.id]}
                    onChangeText={(val) => {
                      setFormResponses({ ...formResponses, [field.id]: val });
                      // Map standard fields back to top-level state for legacy compat if needed
                      if (field.isDefault) {
                        if (field.label === 'Full Name') setName(val);
                        if (field.label === 'Email Address') setEmail(val);
                        if (field.label === 'Phone Number') setPhone(val);
                      }
                    }}
                    keyboardType={field.type === 'tel' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field.type === 'email' ? 'none' : 'words'}
                  />
                )}
              </RNView>
            ))}
            
            {/* Fallback if no dynamic form */}
            {(!dynamicConfig.registrationForm || dynamicConfig.registrationForm.length === 0) && (
              <>
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
              </>
            )}
          </RNView>
        </RNView>

        {/* Coupon code input */}
        <RNView style={styles.section}>
          <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.text }]}>Apply Coupon</Text>
            {availableCoupons.length > 0 && (
              <Pressable onPress={() => setShowCouponsModal(true)}>
                <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>View All</Text>
              </Pressable>
            )}
          </RNView>
          
          {!appliedCoupon ? (
            <RNView style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.fieldInput, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="ENTER CODE"
                placeholderTextColor={colors.muted}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <Pressable 
                onPress={handleApplyCoupon}
                disabled={validatingCoupon || !couponCode}
                style={[styles.applyBtn, { backgroundColor: colors.tint, opacity: (validatingCoupon || !couponCode) ? 0.5 : 1 }]}
              >
                <Text style={styles.applyBtnText}>{validatingCoupon ? '...' : 'Apply'}</Text>
              </Pressable>
            </RNView>
          ) : (
            <RNView style={[styles.couponBadge, { backgroundColor: '#22c55e15', borderColor: '#22c55e' }]}>
              <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontWeight: '800' }}>{appliedCoupon.code} Applied</Text>
              </RNView>
              <Pressable onPress={() => setAppliedCoupon(null)}>
                <Text style={{ color: colors.muted, fontWeight: '700' }}>Remove</Text>
              </Pressable>
            </RNView>
          )}
        </RNView>

        {/* Coupons Modal */}
        <Modal visible={showCouponsModal} animationType="slide" transparent={true}>
          <RNView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <RNView style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' }}>
              <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text }}>Available Offers</Text>
                <Pressable onPress={() => setShowCouponsModal(false)}>
                  <Text style={{ color: colors.muted, fontWeight: '800' }}>Close</Text>
                </Pressable>
              </RNView>
              <ScrollView showsVerticalScrollIndicator={false}>
                {availableCoupons.map((c) => (
                  <Pressable 
                    key={c.id}
                    onPress={() => {
                      setCouponCode(c.code);
                      setShowCouponsModal(false);
                      setTimeout(handleApplyCoupon, 100);
                    }}
                    style={{ 
                      padding: 20, 
                      backgroundColor: colors.card, 
                      borderRadius: 20, 
                      borderWidth: 1, 
                      borderColor: colors.border,
                      marginBottom: 12
                    }}
                  >
                    <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <RNView>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{c.code}</Text>
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                          {c.type === 'percent' ? `${c.value}% Off` : `₹${c.value} Off`}
                        </Text>
                      </RNView>
                      <ArrowLeft size={20} color={colors.tint} style={{ transform: [{ rotate: '180deg' }] }} />
                    </RNView>
                  </Pressable>
                ))}
              </ScrollView>
            </RNView>
          </RNView>
        </Modal>

        {/* Price breakdown */}
        <RNView style={[styles.priceBreakdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>Order Details</Text>
          <RNView style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
              {selectedTier?.name || 'General'} {selectedAgeGroup ? `(${selectedAgeGroup.label || `${selectedAgeGroup.minAge || selectedAgeGroup.min}-${selectedAgeGroup.maxAge || selectedAgeGroup.max} Yrs`})` : ''} × {quantity}
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {subtotal === 0 ? 'FREE' : `₹${subtotal.toLocaleString('en-IN')}`}
            </Text>
          </RNView>
          
          {discountAmount > 0 && (
            <RNView style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#22c55e' }]}>
                Coupon Discount
              </Text>
              <Text style={[styles.breakdownValue, { color: '#22c55e' }]}>
                - ₹{discountAmount.toLocaleString('en-IN')}
              </Text>
            </RNView>
          )}

          {convenienceFee > 0 && (
            <RNView style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
                Convenience fee
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ₹{convenienceFee.toLocaleString('en-IN')}
              </Text>
            </RNView>
          )}
          {gst > 0 && (
            <RNView style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
                GST
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ₹{gst.toLocaleString('en-IN')}
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
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, letterSpacing: -0.3 },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  tierName: { fontSize: 15, fontWeight: '800' },
  tierDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  tierPrice: { fontSize: 16, fontWeight: '900' },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
    marginTop: 8,
  },
  quantityBtn: { width: 64, height: '100%', alignItems: 'center', justifyContent: 'center' },
  quantityValue: { fontSize: 22, fontWeight: '900', textAlign: 'center', flex: 1 },
  formFields: { gap: 16 },
  fieldWrapper: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontWeight: '600',
  },
  priceBreakdown: {
    margin: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    marginBottom: 100,
  },
  breakdownTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 14, fontWeight: '600' },
  breakdownValue: { fontSize: 15, fontWeight: '800' },
  breakdownDivider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 18, fontWeight: '900' },
  totalValue: { fontSize: 22, fontWeight: '900' },
  footer: {
    padding: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  bookBtn: { borderRadius: 18, overflow: 'hidden' },
  bookBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  successBtn: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  successBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  successBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  ageGroupGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, justifyContent: 'space-between' },
  ageOption: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ageLabel: { fontSize: 13, fontWeight: '800' },
  agePrice: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  selectWrapper: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  applyBtn: { paddingHorizontal: 20, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  couponBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
});
