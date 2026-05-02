import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View, Text } from 'react-native';
import { Home, Calendar, Ticket, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

import { useAuth } from '@/hooks/useSupabase';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'HOME',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarLabel: 'EVENTS',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book Now',
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.bookNowContainer}>
              <LinearGradient
                colors={['#f844a4', '#a855f7']}
                style={styles.bookNowGradient}
              >
                <Text style={styles.bookNowText}>BOOK</Text>
                <Text style={styles.bookNowTextSub}>NOW</Text>
              </LinearGradient>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            if (!user) {
              router.push('/auth/sign-in');
            } else {
              router.push('/events');
            }
          },
        }}
      />

      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarLabel: 'TICKETS',
          tabBarIcon: ({ color }) => <Ticket size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bookNowContainer: {
    top: -25,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    padding: 5,
    elevation: 10,
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
  },
  bookNowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookNowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  bookNowTextSub: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
    textTransform: 'uppercase',
    marginTop: 2,
  }
});
