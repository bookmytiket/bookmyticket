import React from 'react';
import { StyleSheet, View, SafeAreaView, ActivityIndicator, Pressable, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function WebViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // For BookMyTicket local testing or prod URL
  const targetUrl = url ? decodeURIComponent(url) : 'https://bookmyticket.vercel.app';
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/auth/sign-in')} style={styles.backBtn} hitSlop={15}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title ? decodeURIComponent(title) : 'BookMyTicket'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <WebView 
        source={{ uri: targetUrl }} 
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.loading]}>
            <ActivityIndicator size="large" color="#f84464" />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 10,
  }
});
