import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import {
  User,
  Settings,
  Ticket,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Star,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  // Real-time Profile Data
  const { data: profiles } = useSupabaseQuery(
    'profiles',
    (q) => q.eq('id', user?.id),
    [user?.id],
    { realtime: true, enabled: !!user }
  );

  // Real-time Booking Count
  const { data: bookings } = useSupabaseQuery(
    'bookings',
    (q) => q.eq('user_id', user?.id),
    [user?.id],
    { realtime: true, enabled: !!user }
  );

  const profile = profiles?.[0];
  const bookingCount = bookings?.length || 0;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/sign-in');
        },
      },
    ]);
  };

  // Automatic redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/sign-in');
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.muted }}>Loading...</Text>
      </View>
    );
  }

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.tint + '15', colors.background]}
        style={styles.headerGradient}
      >
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.headerContent}
        >
          <LinearGradient colors={colors.gradient as any} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.userEmail, { color: colors.muted }]}>{email}</Text>

          {/* Stats row */}
          <RNView style={[styles.statsRow, { backgroundColor: colors.card }]}>
            <RNView style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.tint }]}>{bookingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Bookings</Text>
            </RNView>
            <RNView style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <RNView style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.tint }]}>⭐</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Member</Text>
            </RNView>
          </RNView>
        </MotiView>
      </LinearGradient>

      {/* Menu sections */}
      <RNView style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>ACCOUNT</Text>
        <RNView style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ProfileItem
            icon={<Ticket size={20} color={colors.tint} />}
            label="My Tickets"
            onPress={() => router.push('/(tabs)/tickets')}
            colors={colors}
          />
          <ProfileItem
            icon={<Bell size={20} color={colors.secondary} />}
            label="Notifications"
            onPress={() => {}}
            colors={colors}
          />
          <ProfileItem
            icon={<Settings size={20} color={colors.icon} />}
            label="Account Settings"
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </RNView>
      </RNView>

      <RNView style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>SUPPORT</Text>
        <RNView style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ProfileItem
            icon={<HelpCircle size={20} color={colors.muted} />}
            label="Help & Support"
            onPress={() => {}}
            colors={colors}
          />
          <ProfileItem
            icon={<Shield size={20} color={colors.muted} />}
            label="Privacy Policy"
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </RNView>
      </RNView>

      <RNView style={styles.menuSection}>
        <RNView style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ProfileItem
            icon={<LogOut size={20} color={colors.error} />}
            label="Sign Out"
            labelColor={colors.error}
            onPress={handleSignOut}
            colors={colors}
            isLast
            showChevron={false}
          />
        </RNView>
      </RNView>

      <Text style={[styles.version, { color: colors.muted }]}>BookMyTicket v1.0.0</Text>
      <RNView style={{ height: 40 }} />
    </ScrollView>
  );
}

function ProfileItem({ icon, label, labelColor, onPress, colors, isLast, showChevron = true }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <RNView style={styles.itemIcon}>{icon}</RNView>
      <Text style={[styles.itemLabel, { color: labelColor || colors.text }]}>{label}</Text>
      {showChevron && <ChevronRight size={16} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guestContent: { alignItems: 'center', padding: 32 },
  guestAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  guestSub: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  signInBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  signInGradient: { paddingVertical: 16, alignItems: 'center' },
  signInText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  signUpLink: { fontSize: 14, fontWeight: '700' },
  headerGradient: { paddingBottom: 24 },
  headerContent: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 20, gap: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  userName: { fontSize: 22, fontWeight: '900' },
  userEmail: { fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 2 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1 },
  menuSection: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 14,
  },
  itemIcon: { width: 32, alignItems: 'center' },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, fontWeight: '600', marginTop: 28 },
});
