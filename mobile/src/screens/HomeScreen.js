import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { HOME_EVENTS, HERO_BANNER_SLIDES } from '../data/homeEvents';
import { Colors } from '../theme/Theme';
import PromotionBanner from '../components/PromotionBanner';
import ComingSoonSection from '../components/ComingSoonSection';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
  { name: "Concert", icon: "musical-notes" },
  { name: "Sports", icon: "trophy" },
  { name: "Comedy", icon: "happy" },
  { name: "Theatre", icon: "mask" },
  { name: "Music", icon: "mic" },
  { name: "Workshop", icon: "build" },
];

function FeaturedSection({ title, events, onEventPress }) {
  if (!events?.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title.split(' ')[0]} </Text>
        <Text style={[styles.sectionTitle, { color: Colors.secondary }]}>{title.split(' ').slice(1).join(' ')}</Text>
      </View>
      <FlatList
        horizontal
        data={events}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => <EventCard event={item} onPress={onEventPress} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const convexEvents = useQuery(api.events.getActiveEvents);
  const convexCategories = useQuery(api.homeSettings.getCategories);
  const convexBanners = useQuery(api.homeSettings.getBannerSlides);
  
  const [bannerIndex, setBannerIndex] = useState(0);

  const { selectedCity, loading, recentlyViewed } = useAuth();

  useEffect(() => {
    if (!loading && !selectedCity) {
      navigation.navigate('Location');
    }
  }, [loading, selectedCity, navigation]);

  // Display data logic: Favor Convex, fallback to static/defaults
  const displayBanners = (convexBanners && convexBanners.length > 0) ? convexBanners : HERO_BANNER_SLIDES;
  const displayCategories = (convexCategories && convexCategories.length > 0) ? convexCategories : DEFAULT_CATEGORIES;
  const displayEvents = convexEvents || [];

  // Auto-rotate banners
  useEffect(() => {
    if (displayBanners.length > 1) {
      const timer = setInterval(() => {
        setBannerIndex(prev => (prev + 1) % displayBanners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [displayBanners]);

  const filteredEvents = useMemo(() => {
    const fromConvex = (displayEvents || []).map((ev, idx) => ({
      ...ev,
      id: ev._id || ev.id || `convex-${idx}`,
      title: ev.title || "Event",
      img: ev.img || ev.bannerPreview || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop',
      date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
      location: ev.location || ev.venue || ev.address || "Venue",
      featured: ev.featured !== false,
      trending: ev.trending !== false,
      spotlight: ev.spotlight === true,
      exclusive: ev.exclusive === true,
      virtual: ev.virtual === true || ev.type === "Online",
    }));

    const fromHome = (HOME_EVENTS || []).map(h => ({ ...h, id: String(h.id) }));
    
    const eventMap = new Map();
    fromConvex.forEach(e => eventMap.set(String(e.id), e));
    fromHome.forEach(h => {
      if (!eventMap.has(String(h.id))) eventMap.set(String(h.id), h);
    });

    const merged = Array.from(eventMap.values());
    if (!selectedCity) return merged;

    return merged.filter(e =>
      e.virtual === true ||
      (e.city && e.city.toLowerCase() === selectedCity.toLowerCase()) ||
      (e.district && e.district.toLowerCase() === selectedCity.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(selectedCity.toLowerCase()))
    );
  }, [displayEvents, selectedCity]);

  const featured = useMemo(() => filteredEvents.filter((e) => e.featured).slice(0, 10), [filteredEvents]);
  const popular = useMemo(() => filteredEvents.filter((e) => e.trending).slice(0, 10), [filteredEvents]);
  const exclusive = useMemo(() => filteredEvents.filter((e) => e.exclusive).slice(0, 10), [filteredEvents]);
  const virtual = useMemo(() => filteredEvents.filter((e) => e.virtual).slice(0, 10), [filteredEvents]);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: String(event._id || event.id), event });
  };

  const currentBanner = displayBanners[bannerIndex % displayBanners.length];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <PromotionBanner />
      <View style={styles.hero}>
        {currentBanner ? (
          <>
            <Image
              source={{ uri: currentBanner.img }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>{currentBanner.title || "Live Events & Experiences"}</Text>
              <Text style={styles.heroSub} numberOfLines={1}>{currentBanner.sub || "Book tickets for concerts, sports & more"}</Text>
            </View>
          </>
        ) : (
          <View style={styles.bannerPlaceholder}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>

      {/* Categories Row */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          data={displayCategories}
          keyExtractor={(item, idx) => String(item._id || idx)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {filteredEvents.length > 0 ? (
        <>
          <FeaturedSection title="Recently Viewed" events={recentlyViewed} onEventPress={handleEventPress} />
          <FeaturedSection title="Featured Events" events={featured} onEventPress={handleEventPress} />
          <ComingSoonSection events={filteredEvents} onEventPress={handleEventPress} />
          <FeaturedSection title="Explore Popular Events" events={popular} onEventPress={handleEventPress} />
          <FeaturedSection title="Exclusive Events" events={exclusive} onEventPress={handleEventPress} />
          <FeaturedSection title="Virtual Events" events={virtual} onEventPress={handleEventPress} />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Events Found in {selectedCity}</Text>
          <Text style={styles.emptySub}>We couldn't find any events matching your current location. Try switching cities or check back later!</Text>
          <TouchableOpacity 
            style={styles.changeLocationBtn}
            onPress={() => navigation.navigate('Location')}
          >
            <Text style={styles.changeLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  hero: {
    height: 240,
    width,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 40,
    letterSpacing: -1,
  },
  heroSub: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  section: { marginTop: 40, paddingHorizontal: 0 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 16 
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.8,
  },
  horizontalList: { gap: 16, paddingLeft: 24, paddingRight: 24 },
  categoriesSection: { marginTop: 20 },
  categoriesList: { paddingHorizontal: 24, gap: 12 },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySub: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  changeLocationBtn: {
    backgroundColor: '#F43F5E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  changeLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
