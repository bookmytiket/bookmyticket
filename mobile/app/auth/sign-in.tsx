import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, View as RNView, Image, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Mail, Phone, ArrowLeft, ShieldCheck, Apple } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [authType, setAuthType] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!inputValue.trim()) {
      Alert.alert('Required', `Please enter your ${authType === 'email' ? 'email' : 'phone number'}.`);
      return;
    }

    if (authType === 'email' && !password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (authType === 'email') {
        // Email + Password Login (Standard Supabase)
        const { error } = await supabase.auth.signInWithPassword({
          email: inputValue.trim().toLowerCase(),
          password: password,
        });
        if (error) throw error;
        router.replace('/(tabs)');
      } else {
        // Phone + OTP Login (Custom API)
        const { sendOtp } = require('@/lib/authApi');
        const result = await sendOtp({ phone: inputValue.trim() });

        if (!result.success) throw new Error(result.error);

        router.push({
          pathname: '/auth/otp-verify',
          params: {
            phone: inputValue.trim(),
            type: 'signin'
          }
        });
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUri = Linking.createURL('/auth/callback');
      
      console.log('SSO Redirect URI:', redirectUri);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: redirectUri, 
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          }
        },
      });

      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        if (result.type === 'success' && result.url) {
          const { params, errorCode } = WebBrowser.parseNextServerResponse(result.url);
          if (errorCode) throw new Error(errorCode);
          
          const { access_token, refresh_token } = params;
          if (access_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token || '',
            });
            router.replace('/(tabs)');
          }
        }
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      Alert.alert('Google Error', err.message);
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
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Sign in to your BookMyTicket account</Text>
        </MotiView>

        <View style={styles.authTypeTabs}>
          <Pressable 
            style={[styles.tab, authType === 'email' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
            onPress={() => { setAuthType('email'); setInputValue(''); setPassword(''); }}
          >
            <Text style={[styles.tabText, { color: authType === 'email' ? colors.tint : colors.muted }]}>Email</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, authType === 'phone' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
            onPress={() => { setAuthType('phone'); setInputValue(''); setPassword(''); }}
          >
            <Text style={[styles.tabText, { color: authType === 'phone' ? colors.tint : colors.muted }]}>Phone</Text>
          </Pressable>
        </View>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.form}>
          {/* Identifier Field (Email or Phone) */}
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

          {/* Password Field (Only for Email) */}
          {authType === 'email' && (
            <RNView style={styles.fieldWrapper}>
              <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
                <Pressable onPress={() => {}}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.tint }}>Forgot?</Text>
                </Pressable>
              </RNView>
              <RNView style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ShieldCheck size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={18} color={colors.muted} />
                </Pressable>
              </RNView>
            </RNView>
          )}

          <Pressable style={styles.btn} onPress={handleSignIn} disabled={loading}>
            <LinearGradient colors={['#f844a4', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{authType === 'email' ? 'Sign In' : 'Send OTP'}</Text>
              )}
            </LinearGradient>
          </Pressable>

          <RNView style={styles.dividerRow}>
            <RNView style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.muted }]}>OR CONTINUE WITH</Text>
            <RNView style={[styles.divider, { backgroundColor: colors.border }]} />
          </RNView>

          <RNView style={styles.socialRow}>
            <Pressable 
              style={{ width: '100%' }}
              onPress={handleGoogleSignIn}
            >
              <RNView
                style={[styles.socialBtn, { 
                  backgroundColor: '#fff',
                  borderColor: colors.border, 
                  width: '100%', 
                  borderRadius: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: 60,
                  borderWidth: 1.5,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2
                }]}
              >
                <LottieView
                  source={require('../../assets/google_animation.json')}
                  autoPlay
                  loop
                  style={{ width: 55, height: 55, marginTop: -5, marginBottom: -5 }}
                />
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Sign in with Google</Text>
              </RNView>
            </Pressable>
          </RNView>

          <Pressable style={styles.linkRow} onPress={() => router.replace('/auth/sign-up')}>
            <Text style={[styles.linkText, { color: colors.muted }]}>New here? </Text>
            <Text style={[styles.linkText, { color: colors.tint, fontWeight: '800' }]}>Create Account</Text>
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
  authTypeTabs: { flexDirection: 'row', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  form: { gap: 20 },
  fieldWrapper: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  btn: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginVertical: 15 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  socialRow: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
  socialBtn: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { fontSize: 15, fontWeight: '600' },
});
