import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrganiserScannerScreen from '../screens/OrganiserScannerScreen';
import ManagementScreen from '../screens/ManagementScreen';
import { useAuth } from '../context/AuthContext';

import { Colors } from '../theme/Theme';
import WebHeader from './WebHeader';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabNavigator() {
  const { user } = useAuth();
  const isOrganiserOrStaff = user?.role === 'organiser' || user?.role === 'staff';
  
  const isServiceProvider = (category) => {
    if (!category) return false;
    const c = String(category).trim().toLowerCase();
    return c.includes("mehandi") || 
           c.includes("mehendi") || 
           c.includes("photograph") || 
           c.includes("makeup") || 
           c.includes("artist") || 
           c.includes("personal service");
  };

  const isVendor = isServiceProvider(user?.category);

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <WebHeader />,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
      }}
    >
      {user?.role !== 'staff' && (
        <>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ focused, color }) => TabIcon({ name: focused ? 'home' : 'home-outline', focused, color }),
            }}
          />
          <Tab.Screen
            name="Events"
            component={EventsScreen}
            options={{
              tabBarIcon: ({ focused, color }) => TabIcon({ name: focused ? 'calendar' : 'calendar-outline', focused, color }),
            }}
          />
        </>
      )}
      {isOrganiserOrStaff && (
        <Tab.Screen
          name="Scan"
          component={OrganiserScannerScreen}
          options={{
            tabBarIcon: ({ focused, color }) => TabIcon({ name: focused ? 'qr-code' : 'qr-code-outline', focused, color }),
          }}
        />
      )}
      {(user?.role === 'admin' || user?.role === 'organiser' || user?.role === 'staff') && (
        <Tab.Screen
          name="Dashboard"
          component={ManagementScreen}
          options={{
            tabBarLabel: isVendor ? 'Artist Hub' : 'Dashboard',
            tabBarIcon: ({ focused, color }) => TabIcon({ 
                name: isVendor 
                    ? (focused ? 'briefcase' : 'briefcase-outline') 
                    : (focused ? 'grid' : 'grid-outline'), 
                focused, 
                color 
            }),
          }}
        />
      )}
      <Tab.Screen
        name="Tickets"
        component={ProfileScreen}
        initialParams={{ tab: 'my_booking' }}
        options={{
          tabBarIcon: ({ focused, color }) => TabIcon({ name: focused ? 'ticket' : 'ticket-outline', focused, color }),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => TabIcon({ name: focused ? 'person' : 'person-outline', focused, color }),
        }}
      />
    </Tab.Navigator>
  );
}
