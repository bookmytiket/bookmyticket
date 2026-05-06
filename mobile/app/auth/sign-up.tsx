import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, View as RNView, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Mail, Phone, ArrowLeft, User, ChevronRight } from 'lucide-react-native';

export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [authType, setAuthType] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!inputValue.trim()) {
      Alert.alert('Required', `Please enter your ${authType === 'email' ? 'email' : 'phone number'}.`);
      return;
    }

    setLoading(true);
    try {
      // Phone or Email + OTP Signup (Custom API)
      const { sendOtp } = require('@/lib/authApi');
      const result = await sendOtp(
        authType === 'email' 
          ? { email: inputValue.trim().toLowerCase() }
          : { phone: inputValue.trim() }
      );

      if (!result.success) throw new Error(result.error);

      router.push({
        pathname: '/auth/otp-verify',
        params: {
          [authType]: inputValue.trim(),
          name: name.trim(),
          type: 'signup'
        }
      });
    } catch (err: any) {
      Alert.alert('Failed to start signup', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        <MotiView 
          from={{ opacity: 0, translateY: -20 }} 
          animate={{ opacity: 1, translateY: 0 }} 
          style={styles.brand}
        >
          <Image source={require('../../assets/images/logo_brand.png')} style={styles.brandLogo} resizeMode="contain" />
          <Text style={[styles.title, { color: colors.text }]}>Join Us</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Create your account and start booking</Text>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.form}>
          {/* Name Field */}
          <RNView style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.muted }]}>Full Name</Text>
            <RNView style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <User size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="John Doe"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </RNView>
          </RNView>

          <View style={styles.authTypeTabs}>
            <Pressable 
              style={[styles.tab, authType === 'email' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
              onPress={() => { setAuthType('email'); setInputValue(''); }}
            >
              <Text style={[styles.tabText, { color: authType === 'email' ? colors.tint : colors.muted }]}>Email</Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, authType === 'phone' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
              onPress={() => { setAuthType('phone'); setInputValue(''); }}
            >
              <Text style={[styles.tabText, { color: authType === 'phone' ? colors.tint : colors.muted }]}>Phone</Text>
            </Pressable>
          </View>

          <RNView style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.muted }]}>{authType === 'email' ? 'Email Address' : 'Phone Number'}</Text>
            <RNView style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {authType === 'email' ? <Mail size={18} color={colors.muted} /> : <Phone size={18} color={colors.muted} />}
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={authType === 'email' ? 'you@example.com' : '+91 98765 43210'}
                placeholderTextColor={colors.muted}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType={authType === 'email' ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
              />
            </RNView>
          </RNView>

          <Pressable style={styles.btn} onPress={handleSignUp} disabled={loading}>
            <LinearGradient colors={['#f844a4', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnText}>Continue</Text>
                  <ChevronRight size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.terms}>
            <Text style={[styles.termsText, { color: colors.muted }]}>
              By signing up, you agree to our{' '}
              <Text style={{ color: colors.tint, fontWeight: '700' }}>Terms of Service</Text> and{' '}
              <Text style={{ color: colors.tint, fontWeight: '700' }}>Privacy Policy</Text>.
            </Text>
          </View>

          <Pressable style={styles.linkRow} onPress={() => router.replace('/auth/sign-in')}>
            <Text style={[styles.linkText, { color: colors.muted }]}>Already have an account? </Text>
            <Text style={[styles.linkText, { color: colors.tint, fontWeight: '800' }]}>Sign In</Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 32 },
  brand: { alignItems: 'center', marginBottom: 30 },
  brandLogo: { width: 180, height: 60, marginBottom: 15 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  authTypeTabs: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  form: { gap: 15 },
  fieldWrapper: { gap: 8 },
  label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  btn: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  terms: { marginTop: 10 },
  termsText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  linkText: { fontSize: 15, fontWeight: '600' },
});
