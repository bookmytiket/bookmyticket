import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View as RNView,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUri = makeRedirectUri({
        scheme: 'bookmyticket', // Ensure this matches your app.json scheme
        path: '/auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        
        if (result.type === 'success' && result.url) {
          const params = new URL(result.url).searchParams;
          const refresh_token = params.get('refresh_token');
          const access_token = params.get('access_token');

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
            router.replace('/(tabs)');
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Google Sign In Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable
          style={styles.back}
          onPress={handleBack}
          hitSlop={12}
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        {/* Logo / Brand */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.brand}
        >
          <Image 
            source={require('../../assets/images/logo_brand.png')} 
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Sign in to your BookMyTicket account
          </Text>
        </MotiView>

        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={styles.form}
        >
          {/* Email */}
          <RNView style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.muted }]}>Email Address</Text>
            <RNView
              style={[
                styles.inputRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Mail size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </RNView>
          </RNView>

          {/* Password */}
          <RNView style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
            <RNView
              style={[
                styles.inputRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Lock size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.muted} />
                ) : (
                  <Eye size={18} color={colors.muted} />
                )}
              </Pressable>
            </RNView>
          </RNView>

          {/* Sign In Button */}
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <LinearGradient
              colors={colors.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* OR Divider */}
          <RNView style={styles.dividerRow}>
            <RNView style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.muted }]}>OR</Text>
            <RNView style={[styles.divider, { backgroundColor: colors.border }]} />
          </RNView>

          {/* Google Sign In */}
          <Pressable
            style={({ pressed }) => [
              styles.googleBtn,
              { borderColor: colors.border, backgroundColor: colors.card },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <RNView style={styles.googleBtnInner}>
              <FontAwesome name="google" size={20} color="#4285F4" />
              <Text style={[styles.googleBtnText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </RNView>
          </Pressable>

          {/* Sign Up link */}
          <Pressable
            style={styles.linkRow}
            onPress={() => router.replace('/auth/sign-up')}
          >
            <Text style={[styles.linkText, { color: colors.muted }]}>
              Don't have an account?{' '}
            </Text>
            <Text style={[styles.linkText, { color: colors.tint, fontWeight: '800' }]}>
              Sign Up
            </Text>
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
  brand: { alignItems: 'center', marginBottom: 40 },
  brandLogo: {
    width: 200,
    height: 60,
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  form: { gap: 16 },
  fieldWrapper: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnGradient: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: { fontSize: 14, fontWeight: '600' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginVertical: 10,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  googleBtn: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
