import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Bell, ChevronLeft, Calendar, Info } from 'lucide-react-native';
import { useSupabaseQuery, useAuth } from '@/hooks/useSupabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MotiView } from 'moti';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: notifications, loading, refresh } = useSupabaseQuery(
    'notifications',
    (q) => q.eq('user_id', user?.id).order('created_at', { ascending: false }),
    [user?.id],
    { enabled: !!user }
  );

  const sampleNotifications = [
    {
      id: 'sample-1',
      title: 'New Event Published! 🎊',
      message: 'Coimbatore Marathon 2026 is now live. Book your slots now!',
      created_at: new Date().toISOString(),
      type: 'event',
      is_read: false
    }
  ];

  const displayNotifications = notifications && notifications.length > 0 ? notifications : sampleNotifications;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Notifications",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontWeight: '900', fontSize: 18, color: colors.text },
          headerShadowVisible: false,
        }} 
      />

      {loading ? (
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>Loading notifications...</Text>
        </View>
      ) : displayNotifications.length > 0 ? (
        <FlatList
          data={displayNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          onRefresh={refresh}
          refreshing={loading}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 100 }}
              style={[styles.notificationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.is_read ? colors.background : '#ffda00' }]}>
                {item.type === 'event' ? <Calendar size={20} color="#1e293b" /> : <Bell size={20} color="#1e293b" />}
              </View>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.message, { color: colors.muted }]}>{item.message}</Text>
                <Text style={[styles.time, { color: colors.muted }]}>
                  {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </MotiView>
          )}
        />
      ) : (
        <View style={styles.center}>
          <Bell size={48} color={colors.muted} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
          <Text style={[styles.emptySub, { color: colors.muted }]}>We'll notify you when something important happens.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f84464' },
  message: { fontSize: 13, lineHeight: 18 },
  time: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
