import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { HOME_EVENTS, HERO_BANNER_SLIDES, BRAND_COUPONS } from '../data/homeEvents';
import { Colors } from '../theme/Theme';
import ComingSoonSection from '../components/ComingSoonSection';
import CouponCard from '../components/CouponCard';
import CouponOverlay from '../components/CouponOverlay';
import { Ionicons } from '@expo/vector-icons';
import CustomerAdPopup from '../components/CustomerAdPopup';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
  { name: "Concert", icon: "musical-notes" },
  { name: "Sports", icon: "trophy" },
  { name: "Comedy", icon: "happy" },
  { name: "Theatre", icon: "mask" },
  { name: "Music", icon: "mic" },
  { name: "Workshop", icon: "build" },
];

const SERVICE_CATEGORIES = [
  {
    name: "Mehendi Artists",
    slug: "mehendi-artists",
    icon: "flower-outline",
    description: "Traditional & modern henna designs.",
    color: "#f84464",
    gradient: ["#f84464", "#ff7eb3"],
  },
  {
    name: "Photographers",
    slug: "photographers",
    icon: "camera-outline",
    description: "Capture your precious moments.",
    color: "#a855f7",
    gradient: ["#a855f7", "#da77f2"],
  },
  {
    name: "Makeup Artists",
    slug: "makeup-artists",
    icon: "sparkles-outline",
    description: "Stunning bridal & party makeovers.",
    color: "#c026d3",
    gradient: ["#c026d3", "#f783ac"],
  },
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
  const parseEventDate = (dateStr, timeStr) => {
    if (!dateStr) return null;
    try {
      let dt = String(dateStr).trim();
      if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
        const parts = dt.split(/[-/]/);
        dt = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      if (dt.includes('T') || dt.includes(' ')) {
        const d = new Date(dt.replace(' ', 'T'));
        return isNaN(d.getTime()) ? null : d;
      }

      let normalizedTime = "23:59";
      if (timeStr) {
        let t = String(timeStr).trim().toUpperCase();
        const ampmMatch = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
        if (ampmMatch) {
          let [_, hours, mins = "00", ampm] = ampmMatch;
          hours = parseInt(hours);
          if (ampm === "PM" && hours < 12) hours += 12;
          if (ampm === "AM" && hours === 12) hours = 0;
          normalizedTime = `${String(hours).padStart(2, '0')}:${mins}`;
        } else {
          normalizedTime = t.includes(':') ? t : `${t}:00`;
        }
      }
      
      const eventDate = new Date(`${dt}T${normalizedTime}`);
      return isNaN(eventDate.getTime()) ? null : eventDate;
    } catch (_) { return null; }
  };
  const convexEvents = useQuery(api.events.getActiveEvents);
  const convexMeetings = useQuery(api.meetings.listAll) || [];
  const convexVendors = useQuery(api.vendors.getActiveVendors);
  const convexCategories = useQuery(api.homeSettings.getCategories);
  const convexBanners = useQuery(api.homeSettings.getBannerSlides);
  const convexCoupons = useQuery(api.branding.getHomeCoupons) || [];
  const allCoupons = useMemo(() => {
    return [...convexCoupons, ...(BRAND_COUPONS || []).map(c => ({
      ...c,
      _id: c.title || c._id, // Local ID fallback
    }))];
  }, [convexCoupons]);
  
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const { selectedCity, loading, recentlyViewed } = useAuth();

  useEffect(() => {
    if (!loading && !selectedCity) {
      navigation.navigate('Location');
    }
  }, [loading, selectedCity, navigation]);

  // Display data logic: Favor Convex, fallback to static/defaults
  const displayBanners = (convexBanners && convexBanners.length > 0) ? convexBanners : HERO_BANNER_SLIDES;
  const displayCategories = (convexCategories && convexCategories.length > 0) ? convexCategories : DEFAULT_CATEGORIES;
  
  // Merge regular events and standalone meetings
  const displayEvents = useMemo(() => {
    const events = convexEvents || [];
    const meetings = (convexMeetings || []).map(m => ({
      ...m,
      type: "Meeting",
      virtual: true, // Meetings are always virtual in this context
      location: "Online Meeting"
    }));
    return [...events, ...meetings];
  }, [convexEvents, convexMeetings]);

  // Auto-rotate banners
  useEffect(() => {
    if (displayBanners.length > 1) {
      const timer = setInterval(() => {
        setBannerIndex(prev => (prev + 1) % displayBanners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [displayBanners]);

  const activeEvents = useMemo(() => {
    const fromConvex = (displayEvents || []).filter(Boolean).map((ev, idx) => {
      const loc = ev?.location || ev?.venue || ev?.address || "Venue";
      const isVirtual = ev?.virtual === true || 
               ev?.virtual === "true" ||
               String(ev?.type || '').toLowerCase().includes("online") || 
               String(ev?.type || '').toLowerCase().includes("virtual") ||
               loc.toLowerCase().includes("online") ||
               loc.toLowerCase().includes("virtual") ||
               loc.toLowerCase().includes("zoom") ||
               loc.toLowerCase().includes("meet") ||
               String(ev?.title || '').toLowerCase().includes("online meeting") ||
               String(ev?.title || '').toLowerCase().includes("virtual event");
      return {
        ...ev,
        id: ev?._id || ev?.id || `convex-${idx}`,
        title: ev?.title || "Event",
        img: ev?.img || ev?.bannerPreview || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop',
        rawDate: ev?.date,
        rawTime: ev?.time,
        date: [ev?.date, ev?.time].filter(Boolean).join(" ") || "TBA",
        location: loc,
        featured: ev?.featured !== false,
        trending: ev?.trending !== false,
        spotlight: ev?.spotlight === true,
        exclusive: ev?.exclusive === true,
        virtual: isVirtual,
      };
    });

    const fromHome = (HOME_EVENTS || []).filter(Boolean).map(h => ({ 
      ...h, 
      id: String(h.id),
      rawDate: h.date,
      rawTime: h.time
    }));
    const eventMap = new Map();
    fromConvex.forEach(e => { if (e?.id) eventMap.set(String(e.id), e); });
    fromHome.forEach(h => { if (h?.id && !eventMap.has(String(h.id))) eventMap.set(String(h.id), h); });

    const merged = Array.from(eventMap.values());
    const now = new Date();
    return merged.filter(ev => {
      if (!ev) return false;
      const eventDate = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time);
      if (!eventDate) return true; // Keep if invalid parse to avoid hiding valid events

      // Ensure virtual events/meetings from the portal aren't hidden by strict date checks
      // allowing them to show even if the date is slightly in the past or missing
      if (ev.virtual === true || ev.virtual === "true") return true; 

      return eventDate >= now;
    });
  }, [displayEvents]);

  const filteredEvents = useMemo(() => {
    if (!selectedCity || selectedCity === "All Cities") return activeEvents;
    return activeEvents.filter(e =>
      e.virtual === true ||
      !e.city ||
      (e.city && e.city.toLowerCase() === selectedCity.toLowerCase()) ||
      (e.district && e.district.toLowerCase() === selectedCity.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(selectedCity.toLowerCase())) ||
      (e.venue && e.venue.toLowerCase().includes(selectedCity.toLowerCase()))
    );
  }, [activeEvents, selectedCity]);

  const featured = useMemo(() => filteredEvents.filter((e) => e.featured).slice(0, 10), [filteredEvents]);
  const popular = useMemo(() => filteredEvents.filter((e) => e.trending).slice(0, 10), [filteredEvents]);
  const exclusive = useMemo(() => filteredEvents.filter((e) => e.exclusive).slice(0, 10), [filteredEvents]);
  const virtual = useMemo(() => activeEvents.filter((e) => e.virtual).slice(0, 10), [activeEvents]);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: String(event._id || event.id), event });
  };

  const currentBanner = displayBanners[bannerIndex % displayBanners.length];

  if (!convexEvents && loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }
  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {currentBanner ? (
            <>
              <Image source={{ uri: currentBanner.img }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={2}>{currentBanner.title || "Live Events & Experiences"}</Text>
                <Text style={styles.heroSub} numberOfLines={1}>{currentBanner.sub || "Book tickets for concerts, sports & more"}</Text>
              </View>
            </>
          ) : (
            <View style={styles.bannerPlaceholder}><ActivityIndicator color="#fff" /></View>
          )}
        </View>

        {allCoupons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exclusive </Text>
              <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Brand Offers</Text>
            </View>
            <FlatList
              horizontal
              data={allCoupons}
              keyExtractor={(item, index) => item._id || String(index)}
              renderItem={({ item }) => <CouponCard coupon={item} onPress={() => setSelectedCoupon(item)} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        <View style={styles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoriesList}
          >
          {displayCategories.map((item, idx) => (
            <TouchableOpacity 
              key={item._id || idx} 
              style={styles.categoryBadge}
              onPress={() => navigation.navigate('Events', { category: item.name })}
            >
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FeaturedSection title="Recently Viewed" events={(recentlyViewed || []).filter(ev => {
        if (!ev) return false;
        const eventDate = parseEventDate(ev.date, ev.time);
        if (!eventDate) return true;
        return eventDate >= new Date();
      })} onEventPress={handleEventPress} />

      <FeaturedSection title="Featured Events" events={featured} onEventPress={handleEventPress} />
      <ComingSoonSection events={filteredEvents} onEventPress={handleEventPress} />
      <FeaturedSection title="Explore Popular Events" events={popular} onEventPress={handleEventPress} />
      <FeaturedSection title="Exclusive Events" events={exclusive} onEventPress={handleEventPress} />
      <FeaturedSection title="Virtual Events" events={virtual} onEventPress={handleEventPress} />
      
      {/* Professional Services Section */}
      <View style={[styles.section, { marginBottom: 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Professional Services</Text>
            <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Top rated artists for your occasions</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ServiceVendors', { category: 'All' })}>
            <Text style={{ color: '#F43F5E', fontWeight: '700', fontSize: 14 }}>View All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {convexVendors && convexVendors.length > 0 ? (
            convexVendors.map((vendor) => (
              <TouchableOpacity 
                key={vendor.id} 
                style={styles.vendorCard} 
                onPress={() => navigation.navigate('ServiceDetail', { vendorId: vendor.id })}
              >
                <Image 
                  source={{ uri: vendor.portfolio?.[0]?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop' }} 
                  style={styles.vendorImage}
                  resizeMode="cover"
                />
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorCategory}>{vendor.category}</Text>
                  <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
                  <View style={styles.ratingRow}>
                     <Ionicons name="star" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                     <Text style={styles.ratingText}>{vendor.rating > 0 ? vendor.rating.toFixed(1) : "New"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            SERVICE_CATEGORIES.map((cat, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.serviceCard, { borderColor: cat.color }]} 
                onPress={() => navigation.navigate('ServiceVendors', { category: cat.name })}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: cat.color }]}>
                  <Text style={{ fontSize: 28 }}>{cat.icon === 'flower-outline' ? '🌸' : cat.icon === 'camera-outline' ? '📸' : '✨'}</Text>
                </View>
                <Text style={styles.serviceTitle}>{cat.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>{cat.description}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
      {filteredEvents.length === 0 && virtual.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Events Found in {selectedCity}</Text>
          <Text style={styles.emptySub}>We couldn't find any events matching your current location. Try switching cities or check back later!</Text>
          <TouchableOpacity style={styles.changeLocationBtn} onPress={() => navigation.navigate('Location')}>
            <Text style={styles.changeLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>

      <CouponOverlay 
        visible={!!selectedCoupon} 
        coupon={selectedCoupon} 
        onClose={() => setSelectedCoupon(null)} 
      />
      <CustomerAdPopup />
    </>
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
  serviceCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  vendorCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginRight: 16,
  },
  vendorImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f1f5f9',
  },
  vendorInfo: {
    padding: 12,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F43F5E',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  serviceDesc: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
});
