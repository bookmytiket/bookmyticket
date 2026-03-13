import { Stack } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from '../context/AuthContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient("https://tangible-possum-27.convex.cloud");

export default function RootLayout() {
  const loaded = true;
  const error = null;

  if (!loaded && !error) {
    return null;
  }

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </ConvexProvider>
  );
}
