import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, TouchableOpacity, RefreshControl, Dimensions, Image } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import EventCard from '../../components/EventCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'All', icon: 'apps-outline' },
  { name: 'Music', icon: 'musical-notes-outline' },
  { name: 'Comedy', icon: 'happy-outline' },
  { name: 'Sports', icon: 'football-outline' },
  { name: 'Workshops', icon: 'color-palette-outline' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const convexEvents = useQuery(api.events.getActiveEvents) || [];

  const normalizedEvents = useMemo(() => convexEvents.map((ev, idx) => ({
    ...ev,
    id: ev._id || `${idx}`,
    title: ev.title || "Event",
    img: ev.img || ev.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop",
    date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
    location: ev.location || ev.venue || "Venue",
    price: ev.price || ev.normalTicketPrice || null,
  })), [convexEvents]);

  const featuredEvents = useMemo(() => normalizedEvents.filter(e => e.featured), [normalizedEvents]);
  const trendingEvents = useMemo(() => normalizedEvents.filter(e => e.trending), [normalizedEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex queries auto-refresh, so we just simulate a delay
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.heroBanner}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&fit=crop' }} 
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroTagline}>Exclusive Experience</Text>
          <Text style={styles.heroTitle}>Premium Concert Tickets</Text>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.heroButtonText}>Explore Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.name} 
            style={[styles.categoryPill, activeCategory === cat.name && styles.categoryPillActive]}
            onPress={() => setActiveCategory(cat.name)}
          >
            <Ionicons 
              name={cat.icon} 
              size={18} 
              color={activeCategory === cat.name ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.categoryText, activeCategory === cat.name && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderHeader()}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Events</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={featuredEvents.length > 0 ? featuredEvents : normalizedEvents.slice(0, 5)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard 
              event={item} 
              onPress={() => router.push(`/event/${item.id}`)} 
            />
          )}
          contentContainerStyle={styles.listPadding}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={trendingEvents.length > 0 ? trendingEvents : normalizedEvents.slice(2, 7)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard 
              event={item} 
              onPress={() => router.push(`/event/${item.id}`)} 
            />
          )}
          contentContainerStyle={styles.listPadding}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingBottom: 20,
  },
  heroBanner: {
    width: width - 32,
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTagline: {
    color: '#f84464',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  heroButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  heroButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  seeAll: {
    color: '#f84464',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#f84464',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#fff',
  },
  listPadding: {
    paddingLeft: 16,
  },
});
