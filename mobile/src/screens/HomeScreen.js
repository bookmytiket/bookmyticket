import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import VideoHeroBanner from '../components/VideoHeroBanner';


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
    name: "Mehendi Artist",
    slug: "mehendi-artist",
    icon: "brush-outline",
    description: "Creative painters & designers.",
    color: "#f84464",
  },
  {
    name: "Photographer",
    slug: "photographer",
    icon: "camera-outline",
    description: "Expert event photography.",
    color: "#a855f7",
  },
  {
    name: "Makeup Artist",
    slug: "makeup-artist",
    icon: "sparkles-outline",
    description: "Bridal & party makeovers.",
    color: "#c026d3",
  },
];

function FeaturedSection({ title, subtitle, events, onEventPress, gradientColors = [Colors.secondary, Colors.accent] }) {
  if (!events?.length) return null;
  const words = title.split(' ');
  const lastWord = words.pop();
  const firstPart = words.join(' ');

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>
            {firstPart} <Text style={{ color: gradientColors[0] }}>{lastWord}</Text>
          </Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
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
        {/* 0) Video Hero Banner (Mirrors Web) */}
        <VideoHeroBanner />

        {/* Subnav Marquee (Categories) */}

        {/* Subnav Marquee (Categories) */}
        <View style={styles.marqueeContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.marqueeList}
          >
            {displayCategories.map((item, idx) => (
              <TouchableOpacity 
                key={item._id || idx} 
                style={styles.marqueeItem}
                onPress={() => navigation.navigate('Events', { category: item.name })}
              >
                <Text style={styles.marqueeText}>{item.name}</Text>
                <View style={styles.marqueeDot} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Top Trending Offers (Coupons) */}
        {allCoupons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Top Trending <Text style={{ color: Colors.secondary }}>Offers</Text>
                </Text>
                <Text style={styles.sectionSubtitle}>Grab these limited time deals!</Text>
              </View>
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

        {/* Recently Viewed */}
        <FeaturedSection 
          title="Recently Viewed" 
          events={(recentlyViewed || []).filter(ev => {
            if (!ev) return false;
            const eventDate = parseEventDate(ev.date, ev.time);
            if (!eventDate) return true;
            return eventDate >= new Date();
          })} 
          onEventPress={handleEventPress} 
        />

        {/* Featured Events */}
        <FeaturedSection title="Featured Events" events={featured} onEventPress={handleEventPress} />

        {/* Coming Soon */}
        <ComingSoonSection events={filteredEvents} onEventPress={handleEventPress} />

        {/* Popular Events */}
        <FeaturedSection 
          title="Explore Popular" 
          subtitle="Top trending events in your area"
          events={popular} 
          onEventPress={handleEventPress} 
        />

        {/* Exclusive Events */}
        <FeaturedSection 
          title="Exclusive Experiences" 
          subtitle="One-of-a-kind events for members"
          events={exclusive} 
          onEventPress={handleEventPress} 
          gradientColors={['#c026d3', '#a855f7']}
        />

        {/* Virtual Highlights */}
        {virtual.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Virtual <Text style={{ color: '#3b82f6' }}>Highlights</Text></Text>
                <Text style={styles.sectionSubtitle}>Immersive online experiences</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Events', { category: 'Virtual' })}>
                <Text style={styles.viewAllText}>View Online →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={virtual}
              keyExtractor={(item) => String(item._id || item.id)}
              renderItem={({ item }) => <EventCard event={item} onPress={handleEventPress} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Professional Services */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Professional <Text style={{ color: '#F43F5E' }}>Services</Text></Text>
              <Text style={styles.sectionSubtitle}>Exquisite talent for your big day</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ServiceVendors', { category: 'All' })}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.servicesGrid}>
            {SERVICE_CATEGORIES.map((cat, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.serviceCategoryCard, { width: (width - 48 - 12) / 2 }]} 
                onPress={() => navigation.navigate('ServiceVendors', { category: cat.name })}
              >
                <View style={styles.serviceImageContainer}>
                   <Image 
                     source={{ uri: cat.name === 'Mehendi Artist' ? 'https://images.unsplash.com/photo-1766100465798-c323de2860c7?q=80&w=400&auto=format&fit=crop' : 
                                  cat.name === 'Photographer' ? 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' :
                                  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400' }} 
                     style={styles.serviceCategoryImage}
                   />
                   <View style={[styles.serviceIconBadge, { backgroundColor: cat.color }]}>
                      <Ionicons name={cat.icon} size={18} color="#fff" />
                   </View>
                </View>
                <View style={styles.serviceCategoryInfo}>
                  <Text style={styles.serviceCategoryName}>{cat.name}</Text>
                  <Text style={styles.serviceCategoryCount}>Explore Experts</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Organisers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Featured <Text style={{ color: Colors.secondary }}>Organisers</Text></Text>
              <Text style={styles.sectionSubtitle}>Follow your favourite event creators</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {[1,2,3,4].map(idx => (
              <View key={idx} style={styles.organiserCircle}>
                <View style={styles.organiserAvatar}>
                  <Ionicons name="business" size={24} color="#64748b" />
                </View>
                <Text style={styles.organiserName}>Partner {idx}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Sponsors */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Our <Text style={{ color: '#64748b' }}>Sponsors</Text></Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {[1,2,3].map(idx => (
              <View key={idx} style={styles.sponsorLogo}>
                 <Text style={styles.sponsorText}>SPONSOR</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Subscription Banner */}
        <View style={styles.subscriptionCard}>
          <LinearGradient
            colors={['#f84464', '#c026d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscriptionGradient}
          >
            <Text style={styles.subTitle}>Ready for your next adventure?</Text>
            <Text style={styles.subText}>Subscribe to get the latest event updates and exclusive offers directly in your inbox.</Text>
            <TouchableOpacity style={styles.subBtn}>
              <Text style={styles.subBtnText}>Subscribe Now</Text>
            </TouchableOpacity>
          </LinearGradient>
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
  marqueeContainer: {
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  marqueeList: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  marqueeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  marqueeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  marqueeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginLeft: 20,
  },
  section: { marginTop: 40, paddingHorizontal: 0 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 24, 
    marginBottom: 24 
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
    lineHeight: 32,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
  },
  viewAllText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13,
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
  organiserCircle: {
    alignItems: 'center',
    width: 100,
  },
  organiserAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  organiserName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  sponsorLogo: {
    width: 140,
    height: 70,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sponsorText: {
    color: '#cbd5e1',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  subscriptionCard: {
    margin: 24,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#f84464',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  subscriptionGradient: {
    padding: 32,
    alignItems: 'center',
  },
  subTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
  subBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  subBtnText: {
    color: '#f84464',
    fontWeight: '900',
    fontSize: 15,
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
  servicesSection: { marginTop: 40, paddingHorizontal: 0 },
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
  quickActionContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  joinCodeBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  joinCodeGradient: {
    padding: 20,
  },
  joinCodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  joinCodeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCodeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  joinCodeSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  servicesSection: { marginTop: 40, paddingHorizontal: 0 },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  serviceCategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 4,
  },
  serviceImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  serviceCategoryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8fafc',
  },
  serviceIconBadge: {
    position: 'absolute',
    bottom: -16,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCategoryInfo: {
    padding: 16,
    paddingTop: 20,
  },
  serviceCategoryName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 2,
  },
  serviceCategoryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});
