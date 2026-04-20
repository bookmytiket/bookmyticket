import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
// Demo imports removed
import { Colors } from '../theme/Theme';
import ComingSoonSection from '../components/ComingSoonSection';
import CouponCard from '../components/CouponCard';
import CouponOverlay from '../components/CouponOverlay';
import SequentialVideoBanner from '../components/SequentialVideoBanner';
import { parseEventDate } from '../utils/eventUtils';
import { Ionicons } from '@expo/vector-icons';
import CustomerAdPopup from '../components/CustomerAdPopup';
import { SERVICE_CATEGORIES } from '../data/serviceCategories';
import { HERO_BANNER_SLIDES, BRAND_COUPONS } from '../data/homeEvents';



const { width } = Dimensions.get('window');

// Default constants removed

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
  const { data: convexEvents } = useSupabaseQuery('events', (q) => q.select('*').eq('status', 'Active'), []);
  const { data: convexMeetings } = useSupabaseQuery('events', (q) => q.select('*').eq('type', 'Meeting').eq('status', 'Active'), []);
  const { data: convexVendors } = useSupabaseQuery('profiles', (q) => q.select('*').eq('role', 'organiser'), []);
  const { data: convexCategories } = useSupabaseQuery('categories', (q) => q.select('*'), []);
  const { data: convexBannersRaw } = useSupabaseQuery('system_config', (q) => q.select('value').eq('key', 'banner_slides').single(), []);
  const convexBanners = convexBannersRaw?.value || [];
  const { data: convexCouponsRaw } = useSupabaseQuery('system_config', (q) => q.select('value').eq('key', 'home_coupons').single(), []);
  const convexCoupons = convexCouponsRaw?.value || [];

  const allCoupons = useMemo(() => {
    return (convexCoupons && convexCoupons.length > 0) ? convexCoupons : BRAND_COUPONS;
  }, [convexCoupons]);
  
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!subscribeEmail) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscribeEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: subscribeEmail }]);
        
      if (error) throw error;
      
      Alert.alert("Success", "Thank you for subscribing today!");
      setSubscribeEmail('');
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setIsSubscribing(false);
    }
  };


  const { user, selectedCity, loading, recentlyViewed } = useAuth();
  
  const isServiceProvider = (category) => {
    if (!category) return false;
    const c = String(category).trim().toLowerCase();
    return c.includes("mehandi") || 
           c.includes("mehendi") || 
           c.includes("photograph") || 
           c.includes("makeup") || 
           c.includes("artist") || 
           c.includes("personal service");
  };

  const isVendor = isServiceProvider(user?.category);

  useEffect(() => {
    if (!loading && !selectedCity) {
      navigation.navigate('Location');
    }
  }, [loading, selectedCity, navigation]);

  // Display data logic: Convex with local fallbacks
  const displayBanners = useMemo(() => {
    return (convexBanners && convexBanners.length > 0) ? convexBanners : HERO_BANNER_SLIDES;
  }, [convexBanners]);

  const displayCategories = convexCategories || [];
  
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
    const now = new Date();

    const fromConvex = (displayEvents || []).filter(Boolean).map((ev, idx) => {
      const loc = ev?.location || ev?.venue || ev?.address || "Venue";
      const isMeeting = ev?.type === "Meeting";

      // 1. IMPROVED: Handle dates for Standalone Meetings (fixes "TBA")
      let dateStr = ev?.date;
      let timeStr = ev?.time;

      if (isMeeting && !dateStr && ev?.created_at) {
        const d = new Date(ev.created_at);
        dateStr = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
        timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }

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
        rawDate: dateStr,
        rawTime: timeStr,
        date: [dateStr, timeStr].filter(Boolean).join(" ") || "TBA",
        location: loc,
        featured: ev?.featured !== false,
        trending: ev?.trending !== false,
        spotlight: ev?.spotlight === true,
        exclusive: ev?.exclusive === true,
        virtual: isVirtual,
        isMeeting,
      };
    });

    // 2. IMPROVED FILTERING (Sync & Expiration)
    const eventIds = new Set(fromConvex.filter(e => !e.isMeeting).map(e => String(e._id || e.id)));

    return fromConvex.filter(ev => {
      if (!ev) return false;

      // Duplicate Check: If meeting has an eventId already in eventIds, skip standalone meeting
      if (ev.isMeeting && ev.eventId && eventIds.has(String(ev.eventId))) return false;

      // Precise expiration check using Convex endDateTime (if available)
      if (ev.endDateTime && now.getTime() > ev.endDateTime) return false;

      // 24-hour expiration for standalone meetings without endDateTime
      if (ev.isMeeting && !ev.endDateTime && ev.created_at) {
          const expirationTime = new Date(ev.created_at).getTime() + (24 * 60 * 60 * 1000); 
          if (now.getTime() > expirationTime) return false;
      }

      const eventDate = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time);
      if (!eventDate) return true; 

      // Matches Web Portal: Today onwards (ignore time for today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const evDateOnly = new Date(eventDate);
      evDateOnly.setHours(0, 0, 0, 0);

      return evDateOnly >= today;
    });
  }, [displayEvents]);

  const filteredEvents = useMemo(() => {
    if (!selectedCity || selectedCity === "All Cities") return activeEvents;

    const cityLower = selectedCity.toLowerCase();
    // Consistent with Web Portal variations
    const cityVariations = {
      'bengaluru': ['bangalore', 'bengaluru'],
      'bangalore': ['bangalore', 'bengaluru'],
      'new delhi': ['delhi', 'new delhi', 'ncr'],
      'delhi': ['delhi', 'new delhi', 'ncr'],
      'mumbai': ['bombay', 'mumbai'],
      'chennai': ['madras', 'chennai'],
      'kochi': ['cochin', 'kochi'],
      'coimbatore': ['coimbatore', 'pollachi', 'tiruppur'], // Extra mappings for Coimbatore district
    };
    
    const targetCities = cityVariations[cityLower] || [cityLower];

    return activeEvents.filter(e => {
      if (e.virtual === true) return true;
      const evCity = (e.city || '').toLowerCase();
      const evLoc = (e.location || '').toLowerCase();
      const evVenue = (e.venue || '').toLowerCase();
      const evDistrict = (e.district || '').toLowerCase();

      return targetCities.some(tc => 
        evCity.includes(tc) || 
        evDistrict.includes(tc) || 
        evLoc.includes(tc) || 
        evVenue.includes(tc)
      ) || !e.city;
    });
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
        {/* 1) Video Hero Banner (Top) */}
        <SequentialVideoBanner />

        {/* Vendor Quick Access - Visible only for professionals */}
        {isVendor && (
          <View style={styles.vendorQuickAccess}>
            <LinearGradient
              colors={['#0f172a', '#1e293b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vendorGradient}
            >
              <View style={styles.vendorHeader}>
                <View style={styles.vendorIconBadge}>
                  <Ionicons name="briefcase" size={20} color="#fbbf24" />
                </View>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorSub}>Artist Portal</Text>
                  <Text style={styles.vendorTitle}>Welcome back, {user?.name || 'Professional'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.vendorBtn}
                onPress={() => navigation.navigate('Management')}
                activeOpacity={0.8}
              >
                <Text style={styles.vendorBtnText}>GO TO DASHBOARD</Text>
                <Ionicons name="chevron-forward" size={16} color="#fbbf24" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* 2) Hero Banner (Image Slideshow - Below Video) */}
        {displayBanners.length > 0 && (
          <View style={styles.heroBannerContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => currentBanner?.redirectUrl && navigation.navigate(currentBanner.redirectUrl)}
              style={styles.heroBannerContent}
            >
              <Image
                source={{ uri: currentBanner?.imageUrl || currentBanner?.image || currentBanner?.img }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroTextContent}>
                 <Text style={styles.heroTitle}>{currentBanner?.title || "Special Event"}</Text>
                 {currentBanner?.subtitle && <Text style={styles.heroSubtitle}>{currentBanner.subtitle}</Text>}
              </View>
            </TouchableOpacity>
            
            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
              {displayBanners.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    i === bannerIndex % displayBanners.length && styles.activeDot
                  ]} 
                />
              ))}
            </View>
          </View>
        )}

        {/* 3) Subnav Marquee (Categories) */}
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

        {/* Professional Services Categories */}
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
                key={cat.id || idx} 
                style={[styles.serviceCategoryCard, { width: (width - 48 - 12) / 2 }]} 
                onPress={() => navigation.navigate('ServiceVendors', { category: cat.name })}
              >
                <View style={styles.serviceImageContainer}>
                   <Image 
                     source={{ uri: cat.image }} 
                     style={styles.serviceCategoryImage}
                   />
                   <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={StyleSheet.absoluteFill}
                   />
                   <View style={[styles.serviceIconBadge, { backgroundColor: cat.gradient[0] }]}>
                      <Ionicons name={cat.icon} size={18} color="#fff" />
                   </View>
                </View>
                <View style={styles.serviceCategoryInfo}>
                  <Text style={styles.serviceCategoryName} numberOfLines={1}>{cat.name}</Text>
                  <Text style={styles.serviceCategoryCount} numberOfLines={2}>{cat.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Organisers - Placeholder or Convex logic if available */}

        {/* Sponsors - Removed or driven by Convex */}

        {/* Subscription Banner */}
        <View style={styles.subscriptionCard}>
          <LinearGradient
            colors={['#f84464', '#c026d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscriptionGradient}
          >
            <View style={styles.subContent}>
              <Text style={styles.subTitle}>Get Subscribed Today!</Text>
              <Text style={styles.subText}>Don't miss our future updates!</Text>
            </View>
            
            <View style={styles.subInputContainer}>
              <TextInput
                style={styles.subInput}
                placeholder="your e-mail address"
                placeholderTextColor="#94a3b8"
                value={subscribeEmail}
                onChangeText={setSubscribeEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.subExecuteBtn} 
                onPress={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.subExecuteText}>SUBSCRIBE</Text>
                )}
              </TouchableOpacity>
            </View>
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
  vendorQuickAccess: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  vendorGradient: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorSub: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  vendorTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  vendorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
  },
  vendorBtnText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroBannerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    height: 200,
    position: 'relative',
  },
  heroBannerContent: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTextContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginTop: 2,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
  },
  activeDot: {
    width: 20,
    backgroundColor: Colors.secondary,
  },
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
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#f84464',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  subscriptionGradient: {
    padding: 24,
  },
  subContent: {
    marginBottom: 20,
  },
  subTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  subInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  subInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  subExecuteBtn: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subExecuteText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
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
