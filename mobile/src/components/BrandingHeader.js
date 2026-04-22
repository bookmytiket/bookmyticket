import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useSupabaseQuery } from '../hooks/useSupabase';

export default function BrandingHeader({ style }) {
  const queryResult = useSupabaseQuery('site_branding', (q) => q, [], { realtime: false });
  const brandingArr = queryResult?.data || [];
  
  // Ensure we have a valid branding object even if data is null or empty
  const brandingData = brandingArr && brandingArr[0];
  const branding = brandingData || {
    powered_by_logo_url: "https://www.bookmyticket.net/logo.png",
    powered_by_link: "https://www.bookmyticket.net"
  };

  if (!branding || !branding.powered_by_logo_url) return null;

  const handlePress = () => {
    if (branding.powered_by_link) {
      Linking.openURL(branding.powered_by_link);
    }
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress} activeOpacity={0.7}>
      <Text style={styles.label}>Powered By</Text>
      <Image 
        source={{ uri: branding.powered_by_logo_url }} 
        style={styles.logo}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logo: {
    height: 48,
    width: 200, 
  },
});
