import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { User, Ticket, Hammer, ChevronRight, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const ROLES = [
  {
    id: 'user',
    title: 'Public User',
    description: 'I want to discover and book events & services.',
    icon: <User size={24} color="#fff" />,
    colors: ['#06b6d4', '#3b82f6'],
  },
  {
    id: 'organiser',
    title: 'Event Organiser',
    description: 'I want to create and manage my own events.',
    icon: <Ticket size={24} color="#fff" />,
    colors: ['#f844a4', '#a855f7'],
  },
  {
    id: 'provider',
    title: 'Service Provider',
    description: 'I want to offer professional services to others.',
    icon: <Hammer size={24} color="#fff" />,
    colors: ['#a855f7', '#6366f1'],
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!selectedRole) {
      Alert.alert('Selection Required', 'Please select a role to continue.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: selectedRole,
          email: user.email,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.text }]}>Choose Your Role</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Personalize your experience by telling us how you'll use BookMyTicket.
          </Text>
        </MotiView>

        <View style={styles.rolesGrid}>
          {ROLES.map((role, idx) => (
            <MotiView
              key={role.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 200 + idx * 100 }}
            >
              <Pressable
                onPress={() => setSelectedRole(role.id)}
                style={[
                  styles.roleCard,
                  { backgroundColor: colors.card, borderColor: selectedRole === role.id ? colors.tint : colors.border },
                  selectedRole === role.id && styles.roleCardActive
                ]}
              >
                <LinearGradient
                  colors={role.colors as [string, string]}
                  style={styles.iconContainer}
                >
                  {role.icon}
                </LinearGradient>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleTitle, { color: colors.text }]}>{role.title}</Text>
                  <Text style={[styles.roleDesc, { color: colors.muted }]}>{role.description}</Text>
                </View>
                <View style={[styles.checkCircle, { borderColor: selectedRole === role.id ? colors.tint : colors.border, backgroundColor: selectedRole === role.id ? colors.tint : 'transparent' }]}>
                  {selectedRole === role.id && <Check size={14} color="#fff" />}
                </View>
              </Pressable>
            </MotiView>
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
            onPress={handleComplete}
            disabled={loading}
          >
            <LinearGradient
              colors={['#f844a4', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnText}>Complete Setup</Text>
                  <ChevronRight size={20} color="#fff" />
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
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  rolesGrid: { gap: 16 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    gap: 16,
  },
  roleCardActive: {
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  roleDesc: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { marginTop: 40 },
  btn: { borderRadius: 16, overflow: 'hidden' },
  btnGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 18, 
    gap: 8 
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});
