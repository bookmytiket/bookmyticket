import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, View as RNView, Platform, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Star, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';

const PARTNER_TYPES = [
  { label: 'Event Organiser', value: 'event_organiser' },
  { label: 'Professional Service', value: 'professional_service' },
  { label: 'Venue Partner', value: 'venue_partner' },
];

const PARTNER_MAPPING = {
  'Event Organiser': ['Music Concerts', 'Sports Events', 'Theatre & Arts', 'Workshops', 'Conferences', 'Others'],
  'Professional Service': ['Photographer', 'Makeup Artist', 'Decorator', 'Catering', 'Sound & Light', 'Security', 'Others'],
  'Venue Partner': ['Stadium', 'Cinema Hall', 'Hotel / Banquet', 'Sports Turf', 'Swimming Pool', 'Auditorium', 'Others'],
};

export default function PartnerRequestScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'type' | 'category' | null>(null);

  const [form, setForm] = useState({
    firstName: user?.user_metadata?.full_name?.split(' ')[0] || '',
    lastName: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    type: '',
    category: '',
    details: '',
  });

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.phone || !form.type || !form.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('partner_requests')
        .insert({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          business_name: `${form.firstName}'s Business`,
          category: form.category,
          type: form.type === 'Professional Service' ? 'professional_service' : (form.type === 'Venue Partner' ? 'venue_partner' : 'event_organiser'),
          details: form.details,
          status: 'Pending',
          user_id: user?.id,
        });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
        <MotiView from={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.successIcon}>
          <CheckCircle size={80} color="#22c55e" />
        </MotiView>
        <Text style={[styles.successTitle, { color: colors.text }]}>Application Received!</Text>
        <Text style={[styles.successSub, { color: colors.muted }]}>
          Thank you for your interest. Our team will review your application and get back to you within 24-48 business hours.
        </Text>
        <Pressable style={[styles.backHomeBtn, { backgroundColor: colors.text }]} onPress={() => router.replace('/(tabs)')}>
          <Text style={[styles.backHomeText, { color: colors.background }]}>Return Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Partner Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }}>
          <View style={styles.heroBanner}>
            <LinearGradient colors={['#f844a4', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerGradient}>
              <Star size={24} color="#fff" />
              <Text style={styles.bannerTitle}>Scale Your Business To New Heights</Text>
              <Text style={styles.bannerSub}>Join India's fastest growing network.</Text>
            </LinearGradient>
          </View>

          <View style={styles.formSection}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>FIRST NAME *</Text>
                <TextInput
                  value={form.firstName}
                  onChangeText={(val) => setForm({ ...form, firstName: val })}
                  placeholder="John"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>LAST NAME</Text>
                <TextInput
                  value={form.lastName}
                  onChangeText={(val) => setForm({ ...form, lastName: val })}
                  placeholder="Doe"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>EMAIL ADDRESS *</Text>
            <TextInput
              value={form.email}
              onChangeText={(val) => setForm({ ...form, email: val })}
              placeholder="john@example.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[styles.inputLabel, { color: colors.muted }]}>PHONE NUMBER *</Text>
            <TextInput
              value={form.phone}
              onChangeText={(val) => setForm({ ...form, phone: val })}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            {/* In-UI Dropdown: Type */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>REQUEST TYPE *</Text>
            <View style={{ zIndex: 100 }}>
              <Pressable 
                style={[styles.input, styles.selectTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              >
                <Text style={{ color: form.type ? colors.text : colors.muted, fontWeight: '600' }}>{form.type || 'Select Type'}</Text>
                <ChevronDown size={18} color={colors.muted} />
              </Pressable>
              
              <AnimatePresence>
                {openDropdown === 'type' && (
                  <MotiView from={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 160 }} exit={{ opacity: 0, height: 0 }} style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView nestedScrollEnabled>
                      {PARTNER_TYPES.map((t) => (
                        <Pressable 
                          key={t.value} 
                          style={styles.dropdownItem}
                          onPress={() => { setForm({ ...form, type: t.label, category: '' }); setOpenDropdown(null); }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{t.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </MotiView>
                )}
              </AnimatePresence>
            </View>

            {/* In-UI Dropdown: Category */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>CATEGORY *</Text>
            <View style={{ zIndex: 50 }}>
              <Pressable 
                style={[styles.input, styles.selectTrigger, !form.type && { opacity: 0.5 }, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { if (!form.type) return; setOpenDropdown(openDropdown === 'category' ? null : 'category'); }}
              >
                <Text style={{ color: form.category ? colors.text : colors.muted, fontWeight: '600' }}>{form.category || (form.type ? 'Select Category' : 'Select type first')}</Text>
                <ChevronDown size={18} color={colors.muted} />
              </Pressable>
              
              <AnimatePresence>
                {openDropdown === 'category' && (
                  <MotiView from={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 200 }} exit={{ opacity: 0, height: 0 }} style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView nestedScrollEnabled>
                      {((PARTNER_MAPPING as any)[form.type] || []).map((c: string) => (
                        <Pressable 
                          key={c} 
                          style={styles.dropdownItem}
                          onPress={() => { setForm({ ...form, category: c }); setOpenDropdown(null); }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{c}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </MotiView>
                )}
              </AnimatePresence>
            </View>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>ADDITIONAL DETAILS</Text>
            <TextInput
              value={form.details}
              onChangeText={(val) => setForm({ ...form, details: val })}
              placeholder="Briefly describe your events or services..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Pressable onPress={handleSubmit} disabled={loading} style={{ marginTop: 20 }}>
              <LinearGradient colors={['#f844a4', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                    <ArrowRight size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  content: { paddingBottom: 100 },
  heroBanner: { margin: 20, borderRadius: 24, overflow: 'hidden' },
  bannerGradient: { padding: 24, gap: 8 },
  bannerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  formSection: { paddingHorizontal: 20, gap: 16 },
  row: { flexDirection: 'row' },
  inputLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  input: { height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '600' },
  textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
  selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownMenu: { position: 'absolute', top: 56, left: 0, right: 0, borderRadius: 16, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  dropdownItemText: { fontSize: 14, fontWeight: '600' },
  submitBtn: { height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#f844a4', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  successIcon: { marginBottom: 30 },
  successTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 16 },
  successSub: { fontSize: 16, fontWeight: '600', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  backHomeBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  backHomeText: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }
});
