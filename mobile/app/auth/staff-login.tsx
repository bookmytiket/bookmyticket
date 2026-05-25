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
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react-native';

export default function StaffLoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStaffLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your staff credentials.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Fetch role to verify staff status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) throw new Error('Could not verify staff status.');

        const role = profile.role?.toLowerCase();
        if (['staff', 'admin', 'organiser', 'superadmin'].includes(role)) {
          // IMPLEMENT DEVICE RESTRICTION LOGIC FOR STAFF
          if (role === 'staff') {
             const deviceId = 'mob_' + Math.random().toString(36).substring(2, 15);
             const sessionToken = 'sess_' + Math.random().toString(36).substring(2, 15);

             const { data: settings } = await supabase.from('admin_security_settings').select('*').maybeSingle();
             const policy = settings?.login_policy || 'replace_existing';
             const isEnabled = settings?.single_device_login_enabled !== false;

             if (isEnabled) {
                 if (policy === 'strict_block') {
                     const { data: activeSession } = await supabase
                         .from('staff_active_sessions')
                         .select('*')
                         .eq('staff_user_id', data.user.id)
                         .eq('session_status', 'active')
                         .maybeSingle();

                     if (activeSession) {
                         await supabase.auth.signOut();
                         throw new Error('Access Denied: You are already logged in on another device.');
                     }
                 } else if (policy === 'replace_existing') {
                     await supabase
                         .from('staff_active_sessions')
                         .update({ session_status: 'terminated' })
                         .eq('staff_user_id', data.user.id)
                         .eq('session_status', 'active');
                 }
             }

             // Insert new session
             await supabase.from('staff_active_sessions').insert({
                 staff_user_id: data.user.id,
                 session_token: sessionToken,
                 device_id: deviceId,
                 device_name: 'Mobile App Scanner',
                 device_type: 'Mobile',
                 session_status: 'active'
             });
             // We can't use localStorage easily in all environments, but we can pass it or just let it exist.
             // Usually mobile uses AsyncStorage. We will skip storing it unless needed for heartbeat.
          }

          router.replace('/staff');
        } else {
          // Not authorized, sign out immediately
          await supabase.auth.signOut();
          throw new Error('Access Denied: Your account does not have staff permissions.');
        }
      }
    } catch (err: any) {
      Alert.alert('Login Restricted', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: '#0f172a' }]} // Dark theme for staff portal
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
          <ArrowLeft size={24} color="#fff" />
        </Pressable>

        {/* Header Section */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.brand}
        >
          <View style={styles.iconWrapper}>
            <ShieldCheck size={40} color="#a855f7" />
          </View>
          <Text style={[styles.title, { color: '#fff' }]}>Staff Portal</Text>
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.6)' }]}>
            Authorized Personnel Access Only
          </Text>
        </MotiView>

        {/* Form Area */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={styles.form}
        >
          <RNView style={styles.fieldWrapper}>
            <Text style={styles.label}>Official Email</Text>
            <RNView style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <Mail size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={[styles.input, { color: '#fff' }]}
                placeholder="staff@bookmyticket.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </RNView>
          </RNView>

          <RNView style={styles.fieldWrapper}>
            <Text style={styles.label}>Staff Key</Text>
            <RNView style={[styles.inputRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <Lock size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={[styles.input, { color: '#fff' }]}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Eye size={18} color={showPassword ? "#a855f7" : "rgba(255,255,255,0.4)"} />
              </Pressable>
            </RNView>
          </RNView>

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleStaffLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#7c3aed', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>
                {loading ? 'Authenticating...' : 'Secure Login'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.notice}>
            Access to this portal is monitored. Unauthorized attempts will be logged and reported.
          </Text>
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
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  form: { gap: 20 },
  fieldWrapper: { gap: 8 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  btn: { borderRadius: 16, overflow: 'hidden', marginTop: 10, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  notice: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
