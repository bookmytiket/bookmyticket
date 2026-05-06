import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { View, ActivityIndicator, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as SecureStore from 'expo-secure-store';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useSupabase';
import { LocationProvider } from '@/context/LocationContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();


export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function CustomSplash() {
  return (
    <View style={styles.splashContainer}>
      <LinearGradient
        colors={['#f844a4', '#a855f7']}
        style={StyleSheet.absoluteFill}
      />
      <MotiView
        from={{ opacity: 0, scale: 0.8, translateY: 20 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.splashContent}
      >
        <Image 
          source={require('../assets/images/logo_brand.png')} 
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashBrandName}>BookMyTicket</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      </MotiView>
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      const hasOpened = await SecureStore.getItemAsync('hasOpenedApp');
      setIsFirstTime(hasOpened !== 'true');
    };
    checkFirstTime();
  }, []);

  if (loading || isFirstTime === null) {
    return <CustomSplash />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocationProvider>
        <Stack initialRouteName={isFirstTime ? 'onboarding' : '(tabs)'}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/sign-in" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="auth/sign-up" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="auth/otp-verify" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="auth/role-selection" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="events/book" options={{ headerShown: false }} />
          <Stack.Screen name="tickets/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </LocationProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashLogo: {
    width: 200,
    height: 80,
  },
});
