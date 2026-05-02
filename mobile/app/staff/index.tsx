import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MotiView } from 'moti';
import { ArrowLeft, QrCode, TrendingUp, Users, CalendarDays, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function StaffDashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const STATS = [
    { label: 'Total Tickets Sold', value: '1,204', icon: <TrendingUp size={20} color="#fff" />, colors: ['#3b82f6', '#2563eb'] },
    { label: 'Upcoming Events', value: '12', icon: <CalendarDays size={20} color="#fff" />, colors: ['#f59e0b', '#d97706'] },
    { label: 'Total Attendees', value: '45K+', icon: <Users size={20} color="#fff" />, colors: ['#10b981', '#059669'] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={15}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Staff Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          {/* Welcome Card */}
          <LinearGradient
            colors={['#a855f7', '#f844a4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <Text style={styles.welcomeTitle}>Welcome back, Admin!</Text>
            <Text style={styles.welcomeSub}>Manage your events and attendees directly from the mobile app.</Text>
            
            <Pressable 
              style={styles.scanBtn}
              onPress={() => router.push({ pathname: '/web', params: { url: encodeURIComponent('https://bookmyticket.vercel.app/organiser') } })}
            >
              <Settings size={18} color="#a855f7" />
              <Text style={styles.scanBtnText}>Open Advanced Portal</Text>
            </Pressable>
          </LinearGradient>

          {/* Quick Actions */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#eef2ff' }]}>
                <QrCode size={24} color="#6366f1" />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Scan Tickets</Text>
            </Pressable>

            <Pressable style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#fef2f2' }]}>
                <Users size={24} color="#ef4444" />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Guest List</Text>
            </Pressable>
          </View>

          {/* High Level Stats */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Overview</Text>
          <View style={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <LinearGradient
                key={i}
                colors={stat.colors as any}
                style={styles.statCard}
              >
                <View style={styles.statIconWrapper}>{stat.icon}</View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </LinearGradient>
            ))}
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 20,
  },
  scanBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanBtnText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    padding: 20,
    borderRadius: 20,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
});
