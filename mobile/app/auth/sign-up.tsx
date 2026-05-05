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
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react-native';

export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });

      if (error) throw error;

      Alert.alert(
        'Account Created! 🎉',
        'Please check your email to verify your account, then sign in.',
        [{ text: 'Go to Sign In', onPress: () => router.replace('/auth/sign-in') }]
      );
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
        <Pressable style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/auth/sign-in')} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.brand}
        >
          <LinearGradient
            colors={colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoText}>🎟️</Text>
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Join BookMyTicket and discover amazing events
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={styles.form}
        >
          {/* Full Name */}
          <RNView style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.muted }]}>Full Name</Text>
            <RNView
              style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <User size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Your full name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </RNView>
          </RNView>

          {/* Email */}
          <RNView style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.muted }]}>Email Address</Text>
            <RNView
              style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}
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
              style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Lock size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
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

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <LinearGradient
              colors={colors.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.linkRow}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={[styles.linkText, { color: colors.muted }]}>
              Already have an account?{' '}
            </Text>
            <Text style={[styles.linkText, { color: colors.tint, fontWeight: '800' }]}>
              Sign In
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
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: { fontSize: 36 },
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
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  linkText: { fontSize: 14, fontWeight: '600' },
});
