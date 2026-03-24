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
import { hashPassword } from '../utils/hashPassword';

const { width } = Dimensions.get('window');


export default function SignInScreen() {
  console.log('!!!!!!! [CRITICAL] SIGN IN SCREEN LOADED - VERSION 8 !!!!!!!');
  const { login, verifyLoginOTP, selectedCity } = useAuth();
  const convex = useConvex();
  const navigation = useNavigation();

  // Mutations
  const sendOTPMutation = useMutation(api.auth.sendOTP);
  const verifyOTPOnlyMutation = useMutation(api.auth.verifyOTPOnly);
  const verifyOTPAndCreateAccountMutation = useMutation(api.auth.verifyOTPAndCreateAccount);
  const forgotPasswordMutation = useMutation(api.auth.forgotPassword);

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
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupStep, setSignupStep] = useState(1); // 1: Email, 2: OTP, 3: Details
  const [otpCode, setOtpCode] = useState('');
  const [loginStep, setLoginStep] = useState(1); // 1: Password, 2: OTP
  const [loginEmail, setLoginEmail] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleForgotPassword = async () => {
    setError('');
    const email = forgotEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordMutation({ email });
      setForgotSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        if (res.needsOtp) {
          setLoginEmail(res.email);
          setLoginStep(2);
          return;
        }

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

  const handleLoginOTP = async () => {
    setError('');
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyLoginOTP(loginEmail, otpCode);
      if (res.success) {
        if (!selectedCity) {
          navigation.navigate('Location');
        } else {
          navigation.goBack();
        }
        return;
      }
      setError(res.error || 'Invalid code.');
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');
    const email = signupEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await sendOTPMutation({ email, purpose: 'signup' });
      setSignupStep(2);
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      await verifyOTPOnlyMutation({ 
        email: signupEmail.trim().toLowerCase(), 
        code: otpCode, 
        purpose: 'signup' 
      });
      setSignupStep(3);
    } catch (err) {
      setError('Invalid or expired code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSignUp = async () => {
    setError('');
    if (!signupName.trim() || !signupUsername.trim() || !signupPass.trim()) {
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
      await verifyOTPAndCreateAccountMutation({
        email: signupEmail.trim().toLowerCase(),
        code: otpCode,
        fullName: signupName.trim(),
        username: signupUsername.trim().toLowerCase(),
        password: hashed,
      });
      setSignupSuccess(true);
    } catch (err) {
      setError(err?.message || 'Sign up failed. Please try again.');
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
            source={{ uri: 'https://bookmysticket-nu.vercel.app/logo.png' }}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Premium Event Experience</Text>
        </View>

        {mode === 'signin' ? (
          <View style={styles.form}>
            <Text style={styles.title}>Sign In</Text>
            
            {loginStep === 1 ? (
              <>
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
                
                <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); setForgotSuccess(false); }} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
                  <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 13 }}>Forgot Password?</Text>
                </TouchableOpacity>

                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity onPress={handleLogin} disabled={loading}>
                  <LinearGradient colors={Colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                    <Text style={styles.btnText}>{loading ? 'Checking…' : 'Log in'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Security Verification</Text>
                <Text style={styles.infoText}>Enter the 6-digit code sent to {loginEmail}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor="#9ca3af"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity onPress={handleLoginOTP} disabled={loading}>
                  <LinearGradient colors={Colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                    <Text style={styles.btnText}>{loading ? 'Verifying…' : 'Verify & Sign In'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setLoginStep(1); setError(''); }}>
                  <Text style={styles.link}>Back to password</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => { setMode('signup'); setError(''); setSignupSuccess(false); setSignupStep(1); setLoginStep(1); }}>
              <Text style={styles.link}>Don't have an account? Create one now</Text>
            </TouchableOpacity>
          </View>
        ) : mode === 'forgot' ? (
          <View style={styles.form}>
            <Text style={styles.title}>Reset Password</Text>
            {forgotSuccess ? (
              <>
                <Text style={styles.success}>Reset link sent! Please check your email inbox to reset your password.</Text>
                <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={() => { setMode('signin'); setForgotSuccess(false); setForgotEmail(''); }}>
                  <Text style={styles.btnText}>Return to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Enter your registered email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#9ca3af"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                  <LinearGradient colors={Colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                    <Text style={styles.btnText}>{loading ? 'Sending Link…' : 'Send Reset Link'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setMode('signin'); setError(''); }}>
                  <Text style={styles.link}>I remember my password. Go back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.title}>Sign Up</Text>
            {signupSuccess ? (
              <>
                <Text style={styles.success}>Account created! You can now sign in.</Text>
                <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={() => { setMode('signin'); setSignupSuccess(false); setSignupStep(1); }}>
                  <Text style={styles.btnText}>Go to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {signupStep === 1 && (
                  <>
                    <Text style={styles.stepTitle}>Step 1: Enter your email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#9ca3af"
                      value={signupEmail}
                      onChangeText={setSignupEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                      <LinearGradient colors={Colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                        <Text style={styles.btnText}>{loading ? 'Sending Code…' : 'Send Verification Code'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {signupStep === 2 && (
                  <>
                    <Text style={styles.stepTitle}>Step 2: Verify your email</Text>
                    <Text style={styles.infoText}>Enter the 6-digit code sent to {signupEmail}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit code"
                      placeholderTextColor="#9ca3af"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <TouchableOpacity onPress={handleVerifyOTP} disabled={loading}>
                      <LinearGradient colors={Colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                        <Text style={styles.btnText}>{loading ? 'Verifying…' : 'Verify Code'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSignupStep(1)}>
                      <Text style={styles.link}>Change Email</Text>
                    </TouchableOpacity>
                  </>
                )}

                {signupStep === 3 && (
                  <>
                    <Text style={styles.stepTitle}>Step 3: Complete your profile</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#9ca3af"
                      value={signupName}
                      onChangeText={setSignupName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#9ca3af"
                      value={signupUsername}
                      onChangeText={setSignupUsername}
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
                    <TouchableOpacity onPress={handleFinalSignUp} disabled={loading}>
                      <LinearGradient colors={Colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                        <Text style={styles.btnText}>{loading ? 'Creating Account…' : 'Finish Sign Up'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
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
  logoImage: { width: 220, height: 60 },
  tagline: { fontSize: 16, color: '#64748b', marginTop: 10, textAlign: 'center', fontWeight: '600' },
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
  stepTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  infoText: { fontSize: 14, color: '#64748b', marginBottom: 20, textAlign: 'center' },
});
