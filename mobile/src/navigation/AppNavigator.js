import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import SignInScreen from '../screens/SignInScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OrganiserScannerScreen from '../screens/OrganiserScannerScreen';
import ManagementScreen from '../screens/ManagementScreen';
import LocationScreen from '../screens/LocationScreen';
import BecomeOrganiserScreen from '../screens/BecomeOrganiserScreen';

import { Colors } from '../theme/Theme';
import WebHeader from './WebHeader';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a splash/loading screen
  }

  const isOrganiserOrStaff = user?.role === 'organiser' || user?.role === 'staff';

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          header: () => <WebHeader />,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: 'Event Details' }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ title: 'Checkout' }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ title: 'Payment' }}
        />
        {isOrganiserOrStaff && (
          <Stack.Screen
            name="Scanner"
            component={OrganiserScannerScreen}
            options={{ title: 'Scan Ticket' }}
          />
        )}
        {(user?.role === 'admin' || user?.role === 'organiser' || user?.role === 'staff') && (
          <Stack.Screen
            name="Management"
            component={ManagementScreen}
            options={{ title: 'Dashboard' }}
          />
        )}
        <Stack.Screen
          name="Location"
          component={LocationScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="BecomeOrganiser"
          component={BecomeOrganiserScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
