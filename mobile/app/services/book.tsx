import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useSupabase';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle, Ticket } from 'lucide-react-native';

export default function ServiceBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  
  const [success, setSuccess] = useState(false);

  const handleConfirm = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to book this service.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/sign-in') }
      ]);
      return;
    }
    
    // Simulate booking process
    setTimeout(() => {
      setSuccess(true);
    }, 1000);
  };

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
          <Text style={[styles.successTitle, { color: colors.text }]}>Service Request Confirmed!</Text>
          <Text style={[styles.successSub, { color: colors.muted }]}>
            The professional will contact you shortly to confirm the details.
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
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 8 }}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Book Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Confirm Your Request</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            We will send your contact details to the service provider. They will get back to you with a final quote.
          </Text>
          
          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.muted }]}>Service ID</Text>
            <Text style={[styles.value, { color: colors.text }]}>{id}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable onPress={handleConfirm} style={{ overflow: 'hidden', borderRadius: 14 }}>
          <LinearGradient colors={colors.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
            <Ticket size={20} color="#fff" />
            <Text style={styles.confirmText}>Request Service Quote</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  content: { padding: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1 },
  label: { fontSize: 15, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '800' },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  successBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  successBtnGradient: { alignItems: 'center', paddingVertical: 16 },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
