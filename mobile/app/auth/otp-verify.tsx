import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; phone?: string; name?: string; type: 'signup' | 'signin' }>();
  const { email, phone, type } = params;
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const target = email || phone;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const { verifyOtp } = require('@/lib/authApi');
      const result = await verifyOtp({
        email: email,
        phone: phone,
        code: otpString
      });

      if (!result.success) throw new Error(result.error);

      // result.session contains the JWT from Supabase generated on the server
      const { error: sessionError } = await supabase.auth.setSession(result.session);
      if (sessionError) throw sessionError;

      if (type === 'signup') {
        const { name } = params; 
        if (name) {
          await supabase.from('profiles').upsert({
            id: result.user.id,
            full_name: name,
            email: result.user.email,
            phone: result.user.phone,
            updated_at: new Date().toISOString(),
          });
        }
        router.replace('/auth/role-selection');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    try {
      const { sendOtp } = require('@/lib/authApi');
      const result = await sendOtp({
        email: email,
        phone: phone,
      });
      if (!result.success) throw new Error(result.error);
      setTimer(60);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your ' + (email ? 'email' : 'phone') + '.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={['#f844a4', '#a855f7']}
            style={styles.iconGradient}
          >
            <CheckCircle2 size={40} color="#fff" />
          </LinearGradient>
        </MotiView>

        <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          We've sent a 6-digit code to{'\n'}
          <Text style={{ color: colors.text, fontWeight: '800' }}>{target}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputRefs.current[i] = ref)}
              style={[
                styles.otpInput,
                { 
                  backgroundColor: colors.card, 
                  borderColor: digit ? colors.tint : colors.border,
                  color: colors.text 
                }
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(val) => handleOtpChange(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.8 }]}
          onPress={handleVerify}
          disabled={loading}
        >
          <LinearGradient
            colors={['#f844a4', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifyBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.muted }]}>
            Didn't receive the code?
          </Text>
          <Pressable onPress={handleResend} disabled={timer > 0}>
            <Text style={[
              styles.resendAction, 
              { color: timer > 0 ? colors.muted : colors.tint }
            ]}>
              {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 30, alignItems: 'center', paddingTop: 20 },
  iconContainer: { marginBottom: 30 },
  iconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  otpContainer: { flexDirection: 'row', gap: 10, marginBottom: 40 },
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
  },
  verifyBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  verifyBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  resendContainer: { marginTop: 30, alignItems: 'center', gap: 8 },
  resendText: { fontSize: 14, fontWeight: '600' },
  resendAction: { fontSize: 14, fontWeight: '800' },
});
