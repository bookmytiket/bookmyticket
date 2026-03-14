import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  // No global redirect here to allow public browsing of Home/Explore
  // Protected tabs (Bookings/Profile) should handle their own redirect or we can use a wrapper


  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#f84464',
      tabBarInactiveTintColor: '#64748b',
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        height: 60,
        paddingBottom: 10,
      },
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTitleStyle: {
        fontWeight: '900',
        fontSize: 20,
        color: '#0f172a',
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          headerTitle: 'BookMyTicket',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
