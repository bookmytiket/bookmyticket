import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 700;

export default function SignInScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const success = await login(identifier.toLowerCase(), password, 'user');
    if (!success) {
      setError('Invalid email or password');
    }
  };

  if (isTablet) {
    // === TABLET / WEB: Side-by-side layout (image | form) ===
    return (
      <View style={tablet.container}>
        {/* Left: Banner Image */}
        <View style={tablet.imagePane}>
          <Image
            source={require('../../assets/login_banner.png')}
            style={tablet.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Right: Form */}
        <ScrollView style={tablet.formPane} contentContainerStyle={tablet.formContent}>
          {/* Welcome Header */}
          <View style={tablet.welcomeRow}>
            <Text style={tablet.welcomeText}>Welcome to</Text>
            <Image
              source={require('../../assets/logo.png')}
              style={tablet.logo}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={tablet.subtitle}>
              Don't have an account?{' '}
              <Text style={tablet.createLink}>Create one now</Text>
            </Text>
          </TouchableOpacity>

          {/* Username/Email */}
          <Text style={tablet.label}>Username / Email</Text>
          <View style={tablet.inputBox}>
            <TextInput
              style={tablet.input}
              placeholder="yourname or name@example.com"
              placeholderTextColor="#94a3b8"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={tablet.labelRow}>
            <Text style={tablet.label}>Password</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={tablet.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={tablet.inputBox}>
            <TextInput
              style={tablet.input}
              placeholder="password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Log In Button */}
          <TouchableOpacity style={tablet.loginBtn} onPress={handleLogin}>
            <LinearGradient
              colors={['#f84464', '#c026d3']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={tablet.gradient}
            >
              <Text style={tablet.loginBtnText}>Log in</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={tablet.legal}>
            By continuing you agree to our{' '}
            <Text style={tablet.legalLink}>Terms</Text> &{' '}
            <Text style={tablet.legalLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </View>
    );
  }

  // === MOBILE: Stacked layout (banner top, form below) ===
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Banner Image */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/login_banner.png')}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.85)']}
            style={styles.gradient}
          />
          {/* Logo overlay */}
          <View style={styles.logoOverlay}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Welcome */}
          <View style={styles.welcomeRow}>
            <Text style={styles.title}>Welcome to</Text>
            <Image source={require('../../assets/logo.png')} style={styles.inlineLogo} resizeMode="contain" />
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.subtitle}>
              Don't have an account?{' '}
              <Text style={styles.createLink}>Create one now</Text>
            </Text>
          </TouchableOpacity>

          {/* Username */}
          <Text style={styles.label}>Username / Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="yourname or name@example.com"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Password */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Log In */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <LinearGradient
              colors={['#f84464', '#c026d3']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.loginButtonText}>Log in</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text> &{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── Mobile Styles ─────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1 },
  header: { height: 240, width: '100%', position: 'relative' },
  headerImage: { width: '100%', height: '100%', borderBottomRightRadius: 32, borderBottomLeftRadius: 32 },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  logoOverlay: { position: 'absolute', bottom: 20, left: 20 },
  logo: { height: 50, width: 160 },

  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 28, backgroundColor: '#fff' },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginRight: 6 },
  inlineLogo: { height: 30, width: 120 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 24 },
  createLink: { color: '#c026d3', fontWeight: '700', textDecorationLine: 'underline' },

  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotText: { fontSize: 13, color: '#64748b', textDecorationLine: 'underline' },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, height: 52, backgroundColor: '#fff', marginBottom: 20,
  },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },

  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 12 },

  loginButton: { height: 54, borderRadius: 27, overflow: 'hidden', marginTop: 4, marginBottom: 20 },
  gradientButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  legalText: { textAlign: 'center', fontSize: 12, color: '#94a3b8', lineHeight: 18 },
  legalLink: { color: '#475569', textDecorationLine: 'underline' },
});

/* ─── Tablet / Web Styles ───────────────────────── */
const tablet = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  imagePane: { width: '45%', height: '100%' },
  bannerImage: { width: '100%', height: '100%', borderRadius: 0 },
  formPane: { flex: 1, backgroundColor: '#fff' },
  formContent: { paddingHorizontal: 40, paddingVertical: 60 },

  welcomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  welcomeText: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginRight: 8 },
  logo: { height: 38, width: 150 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 36 },
  createLink: { color: '#c026d3', fontWeight: '700', textDecorationLine: 'underline' },

  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { fontSize: 13, color: '#64748b', textDecorationLine: 'underline' },

  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, height: 52, marginBottom: 20, backgroundColor: '#fff',
  },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },

  loginBtn: { height: 54, borderRadius: 27, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  legal: { textAlign: 'center', fontSize: 12, color: '#94a3b8', lineHeight: 18 },
  legalLink: { color: '#475569', textDecorationLine: 'underline' },
});
