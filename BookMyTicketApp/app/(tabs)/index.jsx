import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, FlatList,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import EventCard from '../../components/EventCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MobileHeader from '../../components/MobileHeader';
import HeroBannerMobile from '../../components/HeroBannerMobile';

const CATEGORIES = [
  { name: 'All',       icon: 'apps-outline' },
  { name: 'Music',     icon: 'musical-notes-outline' },
  { name: 'Sports',    icon: 'trophy-outline' },
  { name: 'Comedy',    icon: 'happy-outline' },
  { name: 'Workshop',  icon: 'color-palette-outline' },
  { name: 'Virtual',   icon: 'globe-outline' },
];

const SectionHeader = ({ title, highlight, subtitle, onSeeAll }) => (
  <View style={styles.secHeader}>
    <View style={styles.secHeaderRow}>
      <View>
        <Text style={styles.secTitle}>
          {title} <Text style={styles.secHighlight}>{highlight}</Text>
        </Text>
        {subtitle ? <Text style={styles.secSub}>{subtitle}</Text> : null}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={13} color="#f84464" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Convex queries (same as web) ─────────────────
  const convexEvents = useQuery(api.events.getActiveEvents) || [];

  const normalizedEvents = useMemo(() =>
    convexEvents.map((ev, idx) => ({
      ...ev,
      id: ev._id || `${idx}`,
      title:    ev.title    || 'Event',
      img:      ev.img      || ev.bannerPreview || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop',
      date:     [ev.date, ev.time].filter(Boolean).join(' ') || 'TBA',
      location: ev.location || ev.venue || ev.address || 'Venue',
      price:    ev.price    || ev.normalTicketPrice || null,
      category: ev.category || ev.eventType || '',
    })),
    [convexEvents]
  );

  // Filter by active category
  const filteredEvents = useMemo(() => {
    if (activeCategory === 'All') return normalizedEvents;
    return normalizedEvents.filter(e =>
      (e.category || '').toLowerCase().includes(activeCategory.toLowerCase())
    );
  }, [normalizedEvents, activeCategory]);

  const featuredEvents  = useMemo(() => normalizedEvents.filter(e => e.featured),  [normalizedEvents]);
  const trendingEvents  = useMemo(() => normalizedEvents.filter(e => e.trending),  [normalizedEvents]);
  const spotlightEvents = useMemo(() => normalizedEvents.filter(e => e.spotlight), [normalizedEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const onSearch = (q) => router.push(`/(tabs)/explore?q=${encodeURIComponent(q)}`);

  return (
    <View style={styles.container}>
      <MobileHeader initialSearch={searchQuery} onSearch={onSearch} />

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Hero Banner (image slider + PROMO slide) ── */}
        <HeroBannerMobile />

        {/* ── Category Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
          style={styles.catRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={[styles.catPill, activeCategory === cat.name && styles.catPillActive]}
              onPress={() => setActiveCategory(cat.name)}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={activeCategory === cat.name ? '#fff' : '#64748b'}
              />
              <Text style={[styles.catText, activeCategory === cat.name && styles.catTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Featured Events ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Featured" highlight="Events"
            subtitle="Explore top events near you"
            onSeeAll={() => router.push('/(tabs)/explore')}
          />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={featuredEvents.length > 0 ? featuredEvents : normalizedEvents.slice(0, 8)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
            )}
            contentContainerStyle={styles.listPad}
          />
        </View>

        {/* ── Trending Events ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Trending" highlight="Now"
            subtitle="Most popular this week"
            onSeeAll={() => router.push('/(tabs)/explore')}
          />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={trendingEvents.length > 0 ? trendingEvents : normalizedEvents.slice(1, 9)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
            )}
            contentContainerStyle={styles.listPad}
          />
        </View>

        {/* ── Explore Popular Events ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Explore Popular" highlight="Events"
            subtitle="Discover what everyone is talking about"
            onSeeAll={() => router.push('/(tabs)/explore')}
          />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={filteredEvents}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
            )}
            contentContainerStyle={styles.listPad}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No events found in this category</Text>
            }
          />
        </View>

        {/* ── Spotlight Events ── */}
        {spotlightEvents.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Spotlight" highlight="Events"
              subtitle="Exclusive highlights of the week"
            />
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={spotlightEvents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
              )}
              contentContainerStyle={styles.listPad}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll:    { flex: 1 },

  // Categories
  catRow:    { backgroundColor: '#fff', paddingVertical: 2 },
  catScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0',
  },
  catPillActive: { backgroundColor: '#f84464', borderColor: '#f84464' },
  catText:       { fontSize: 13, fontWeight: '600', color: '#64748b' },
  catTextActive: { color: '#fff' },

  // Sections
  section: { marginBottom: 28, backgroundColor: '#fff', paddingVertical: 4 },
  listPad: { paddingLeft: 16, paddingRight: 8 },
  emptyText: { color: '#94a3b8', fontSize: 14, paddingHorizontal: 16, paddingVertical: 20 },

  // Section headers
  secHeader:    { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  secHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  secTitle:     { fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  secHighlight: { color: '#f84464' },
  secSub:       { fontSize: 12, color: '#9ca3af', fontWeight: '500', marginTop: 2 },
  viewAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#f84464', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  viewAllText:  { fontSize: 12, color: '#f84464', fontWeight: '700' },
});
