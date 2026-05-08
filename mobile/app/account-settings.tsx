import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuth, useSupabaseQuery } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Shield, ChevronLeft, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AccountSettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: profiles, refresh } = useSupabaseQuery(
    'profiles',
    (q) => q.eq('id', user?.id),
    [user?.id],
    { enabled: !!user }
  );

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profiles?.[0]) {
      setFullName(profiles[0].full_name || '');
      setPhoneNumber(profiles[0].phone || '');
    }
  }, [profiles]);

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phoneNumber.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully');
      refresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>PERSONAL INFORMATION</Text>
        
        <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.inputWrapper}>
            <User size={20} color={colors.secondary} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text }]}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.inputWrapper}>
            <Mail size={20} color={colors.muted} />
            <Text style={[styles.input, { color: colors.muted, paddingTop: 12 }]}>{user?.email}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.inputWrapper}>
            <Phone size={20} color={colors.secondary} />
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone Number"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.text }]}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 30 }]}>SECURITY</Text>
        <Pressable 
          style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
          onPress={() => Alert.alert('Privacy', 'Your data is encrypted and secure with BookMyTicket.')}
        >
          <Shield size={20} color={colors.tint} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Privacy & Security</Text>
        </Pressable>

        <View style={{ marginTop: 40 }}>
          <Pressable onPress={handleUpdate} disabled={updating}>
            <LinearGradient
              colors={['#f844a4', '#a855f7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 16, 
    borderBottomWidth: 1 
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  content: { padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  inputGroup: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, height: 56, fontSize: 16, fontWeight: '600' },
  divider: { height: 1, marginLeft: 48 },
  saveBtn: { 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
