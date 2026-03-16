import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useMutation, useConvex, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Theme';
import { HERO_BANNER_SLIDES } from '../data/homeEvents';

const { width } = Dimensions.get('window');

/**
 * SHA-256 implementation in pure JavaScript for React Native compatibility.
 */
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii.length * 8;

  // Initial hash values: first 32 bits of the fractional parts of the square roots of the first 8 primes
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  // Constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
  const k = sha256.k = sha256.k || [];
  if (!k.length) {
    let primeCounter = 0;
    const isCompound = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isCompound[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isCompound[i] = candidate;
        }
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
  }

  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const t1 =
        (hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ch +
        k[i] +
        (w[i] = i < 16 ? (w[i] || 0) : (w[i - 16] + s0 + w[i - 7] + s1) | 0)) | 0;
      const t2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + t1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (t1 + t2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function hashPassword(password) {
  return sha256(password);
}

export default function SignInScreen() {
  const { login, selectedCity } = useAuth();
  const convex = useConvex();
  const navigation = useNavigation();
  const createUser = useMutation(api.users.create);

  const [mode, setMode] = useState('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Banner Logic
  const convexBanners = useQuery(api.homeSettings.getBannerSlides);
  const [bannerIndex, setBannerIndex] = useState(0);
  const displayBanners = (convexBanners && convexBanners.length > 0) ? convexBanners : HERO_BANNER_SLIDES;

  useEffect(() => {
    if (displayBanners.length > 1) {
      const timer = setInterval(() => {
        setBannerIndex(prev => (prev + 1) % displayBanners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [displayBanners]);

  const currentBanner = displayBanners[bannerIndex % displayBanners.length];

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const rawId = identifier.trim();
    const id = rawId.toLowerCase();

    try {
      const hashed = await hashPassword(password);

      // Handle Admin separately as it's not in the unified backend yet
      if (rawId === 'bookmyticket-admin') {
        const res = await login(rawId, password, 'admin');
        if (res.success) {
          navigation.goBack();
          return;
        }
        setError(res.error);
        return;
      }

      // Unified Login for all other roles
      const res = await login(id, hashed);
      
      if (res.success) {
        if (res.role === 'staff') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Dashboard' } }],
          });
        } else if (!selectedCity) {
          navigation.navigate('Location');
        } else {
          navigation.goBack();
        }
        return;
      }
      setError(res.error);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!signupName.trim() || !signupEmail.trim() || !signupPass.trim()) {
      setError('Please fill all fields.');
      return;
    }
    if (signupPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const hashed = await hashPassword(signupPass);
      await createUser({
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: hashed,
        role: 'user',
        createdAt: new Date().toISOString(),
      });
      setSignupSuccess(true);
    } catch (err) {
      setError(err?.message || 'Sign up failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Hero Banner at Top */}
        <View style={styles.hero}>
          {currentBanner ? (
            <>
              <Image
                source={{ uri: currentBanner.img }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={1}>{currentBanner.title || "Welcome"}</Text>
                <Text style={styles.heroSub} numberOfLines={1}>{currentBanner.sub || "Explore amazing events"}</Text>
              </View>
            </>
          ) : (
            <View style={styles.bannerPlaceholder}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.header}>
          <Image
            style={styles.logoImage}
            source={require('../../assets/logo.png')}
          />
          <Text style={styles.tagline}>Welcome to bookmyticket</Text>
        </View>

        {mode === 'signin' ? (
          <View style={styles.form}>
            <Text style={styles.title}>Sign In</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, styles.passInput]}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={Colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Log in'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMode('signup'); setError(''); setSignupSuccess(false); }}>
              <Text style={styles.link}>Don't have an account? Create one now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.title}>Sign Up</Text>
            {signupSuccess ? (
              <>
                <Text style={styles.success}>Account created! You can now sign in.</Text>
                <TouchableOpacity style={styles.btn} onPress={() => { setMode('signin'); setSignupSuccess(false); }}>
                  <Text style={styles.btnText}>Go to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#9ca3af"
                  value={signupName}
                  onChangeText={setSignupName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  value={signupEmail}
                  onChangeText={setSignupEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor="#9ca3af"
                  value={signupPass}
                  onChangeText={setSignupPass}
                  secureTextEntry
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
                  <Text style={styles.btnText}>{loading ? 'Creating…' : 'Create Account'}</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => { setMode('signin'); setError(''); }}>
              <Text style={styles.link}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  hero: {
    height: 200,
    width,
    position: 'relative',
    backgroundColor: '#f3f4f6',
    marginBottom: 32,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  bannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 32, alignItems: 'center', paddingHorizontal: 24 },
  logoImage: { width: 180, height: 50, resizeMode: 'contain' },
  tagline: { fontSize: 15, color: '#64748b', marginTop: 8, textAlign: 'center', fontWeight: '600' },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  passWrap: { position: 'relative', marginBottom: 16 },
  passInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 16, top: 16 },
  error: { color: Colors.error, fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: '600' },
  success: { color: Colors.success, fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: '600' },
  btn: { padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  link: { color: Colors.secondary, fontSize: 15, textAlign: 'center', fontWeight: '600' },
});
