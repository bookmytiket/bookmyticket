import React, { useState } from 'react';
import {
  StyleSheet, View, Image, TextInput, TouchableOpacity,
  Text, Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function MobileHeader({ initialSearch = '', onSearch }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  return (
    <LinearGradient
      colors={['#1a0a2e', '#2d1b69']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      {/* Top Row: Logo + Actions */}
      <View style={styles.topRow}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="location" size={14} color="#f84464" />
            <Text style={styles.locationText}>Coimbatore</Text>
            <Ionicons name="chevron-down" size={12} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/(auth)/signin')}
          >
            <Text style={styles.signInText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, artists, venues..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => onSearch && onSearch(search)}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => onSearch && onSearch(search)}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Promo Bar */}
      <View style={styles.promoBar}>
        <Ionicons name="pricetag-outline" size={13} color="#f59e0b" />
        <Text style={styles.promoText}>
          GET 10% OFF! Code: <Text style={styles.promoCode}>SAVE10</Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  logo: {
    height: 36,
    width: 130,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  signInBtn: {
    backgroundColor: '#c026d3',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  signInText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingLeft: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    height: '100%',
  },
  searchBtn: {
    backgroundColor: '#f84464',
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  promoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 2,
  },
  promoText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  promoCode: {
    color: '#60a5fa',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
