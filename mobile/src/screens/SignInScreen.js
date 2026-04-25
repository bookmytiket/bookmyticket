import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Theme';
import { HERO_BANNER_SLIDES } from '../data/homeEvents';

const { width } = Dimensions.get('window');


export default function SignInScreen() {
  console.log('!!!!!!! [CRITICAL] SIGN IN SCREEN LOADED - VERSION 8 !!!!!!!');
  const { user, login, verifyLoginOTP, selectedCity } = useAuth();
  const navigation = useNavigation();
  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  useEffect(() => {
    console.log('[SignInScreen] useEffect checking user:', !!user);
    if (user) {
      console.log('[SignInScreen] User exists! Attempting navigation...');
      if (!selectedCity) {
        console.log('[SignInScreen] Navigating to Location');
        navigation.reset({ index: 0, routes: [{ name: 'Location' }] });
      } else {
        if (navigation.canGoBack()) {
          console.log('[SignInScreen] Navigating goBack');
          navigation.goBack();
        } else {
          console.log('[SignInScreen] Navigating to MainTabs');
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
      }
    }
  }, [user, navigation, selectedCity]);

  const [mode, setMode] = useState('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Banner Logic
  const { data: convexBanners } = useSupabaseQuery('branding_banners');
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
  const [signupPhone, setSignupPhone] = useState('');
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
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email })
      });
      if (!res.ok) throw new Error('Reset failed');
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
    const id = identifier.trim();
    
    // Check for common typos (as seen in user feedback with .vom)
    if (id.toLowerCase().endsWith('.vom')) {
      setError('Typo detected: Did you mean ".com"?');
      setLoading(false);
      return;
    }

    try {
      // Unified Login for all other roles
      const res = await login(id, password, id === 'bookmyticket-admin' ? 'admin' : undefined);
      
      if (res.success) {
        if (res.needsOtp) {
          setLoginEmail(res.email);
          setLoginStep(2);
        } else {
          // Note: navigation happens via useEffect when user state changes!
        }
      } else {
        setError(res.error);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    console.log('[handleGoogleSSO] Started');
    try {
      setLoading(true);
      setError('');
      const redirectUrl = 'bookmyticket://auth/callback'; // App deep link
      console.log('[handleGoogleSSO] Opening browser');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // we handle the browser ourselves
        }
      });
      if (error) {
        console.log('[handleGoogleSSO] OAuth error:', error);
        throw error;
      }
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        console.log('[handleGoogleSSO] Browser result:', result.type);
        if (result.type === 'success' && result.url) {
          console.log("OAuth Success URL:", result.url);
          
          const extractParam = (url, param) => {
            const match = url.match(new RegExp(`[#&]${param}=([^&]+)`));
            return match ? match[1] : null;
          };
          
          const access_token = extractParam(result.url, 'access_token');
          const refresh_token = extractParam(result.url, 'refresh_token');
          console.log('[handleGoogleSSO] Parsed tokens:', !!access_token, !!refresh_token);
          
          if (access_token && refresh_token) {
            console.log('[handleGoogleSSO] Bridge resuming, waiting 500ms...');
            
            setTimeout(async () => {
              try {
                console.log('[handleGoogleSSO] Setting session now...');
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ 
                  access_token, 
                  refresh_token 
                });
                
                if (sessionError) {
                  console.log('[handleGoogleSSO] Session error:', sessionError);
                  setError('Failed to save session. Please try again.');
                  setLoading(false);
                  return;
                }
                
                console.log('[handleGoogleSSO] Session set successfully!', !!sessionData);
                
                // Navigate the user to the correct screen based on city selection
                if (!selectedCity) {
                  navigation.reset({ index: 0, routes: [{ name: 'Location' }] });
                } else {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                  }
                }
              } catch (asyncErr) {
                console.error('[handleGoogleSSO] Async error:', asyncErr);
                setLoading(false);
              }
            }, 500);
            
            // Return early so finally block doesn't set loading to false before timeout finishes
            return;
          } else {
            console.log('[handleGoogleSSO] Tokens were null');
          }
        }
      }
    } catch (err) {
      console.error('[handleGoogleSSO] Catch block error:', err);
      setError('Google Login failed. Please try again.');
    } finally {
      // Only run this if we didn't return early for the setTimeout
      if (loading) {
        console.log('[handleGoogleSSO] Finally block. Setting loading false.');
        setLoading(false);
      }
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
        if (res.role === 'staff') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Dashboard' } }],
          });
          return;
        }

        if (res.role === 'vendor' || res.role === 'admin' || res.role === 'organiser') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Management' }],
          });
          return;
        }
        
        if (!selectedCity) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Location' }],
          });
        } else {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }
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
      const res = await fetch(`${API_URL}/auth/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email, purpose: 'signup' })
      });
      if (!res.ok) throw new Error('Failed to send OTP');
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
      const res = await fetch(`${API_URL}/auth/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: signupEmail.trim().toLowerCase(), code: otpCode, purpose: 'signup' })
      });
      if (!res.ok) throw new Error('Invalid code');
      setSignupStep(3);
    } catch (err) {
      setError('Invalid or expired code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSignUp = async () => {
    setError('');
    if (!signupName.trim() || !signupUsername.trim() || !signupPass.trim() || !signupPhone.trim()) {
      setError('Please fill all fields.');
      return;
    }
    if (signupPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: signupEmail.trim().toLowerCase(),
          code: otpCode,
          fullName: signupName.trim(),
          username: signupUsername.trim().toLowerCase(),
          password: signupPass.trim(),
          phone: signupPhone.trim(),
        })
      });
      if (!res.ok) throw new Error('Signup failed on server');
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
            source={{ uri: 'https://bookmyticket.net/logo.png' }}
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

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
                  <Text style={{ marginHorizontal: 10, color: '#9ca3af', fontWeight: '600' }}>OR</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
                </View>

                <TouchableOpacity 
                  style={styles.googleBtn} 
                  onPress={handleGoogleSSO} 
                  disabled={loading}
                >
                  <Image source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }} style={{ width: 24, height: 24, marginRight: 12 }} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
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
                      placeholder="Phone Number"
                      placeholderTextColor="#9ca3af"
                      value={signupPhone}
                      onChangeText={setSignupPhone}
                      keyboardType="phone-pad"
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
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
  googleBtnText: { color: '#374151', fontSize: 16, fontWeight: '700' },
  link: { color: Colors.secondary, fontSize: 15, textAlign: 'center', fontWeight: '600' },
  stepTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  infoText: { fontSize: 14, color: '#64748b', marginBottom: 20, textAlign: 'center' },
});
