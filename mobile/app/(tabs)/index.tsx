import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, FlatList, Pressable, Dimensions, TextInput, Platform, View, Text, Image, Alert, Modal } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseQuery, useAuth } from '@/hooks/useSupabase';
import * as SecureStore from 'expo-secure-store';
import HeroSlider from '@/components/HeroSlider';
import EventCard from '@/components/EventCard';
import { useRouter } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { MapPin, Search, Menu, Bell, Sparkles, Ticket, Zap, Camera, Hammer, Utensils, Laptop, Rocket, ChevronRight, X as CloseIcon, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const PROMOS = [
  { code: 'NYKAA', text: 'Get ₹250 Off on Nykaa Beauty Products!' },
  { code: 'AMAZON', text: 'Flat 10% Cashback on Movie Tickets!' },
  { code: 'ZEPTO', text: 'Free Delivery on your first order!' },
];

const BRAND_COUPONS = [
  {
      _id: "nykaa",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Nykaa_logo.svg/1200px-Nykaa_logo.svg.png",
      brandName: "Nykaa",
      title: "Get ₹250 Off on Nykaa Beauty Products!",
      description: "From bold lipsticks to skin-loving serums, discover your new favorites...",
      endDate: Date.now() + (69 * 24 * 60 * 60 * 1000),
      bannerUrl: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800&h=400&fit=crop",
      discountType: "Percentage",
      discountValue: 250,
      redemptionMethod: "Online"
  },
  {
      _id: "amazon",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png",
      brandName: "Amazon",
      title: "Up to 50% Off on Premium Electronics",
      description: "Upgrade your tech with the latest headphones, tablets and more.",
      endDate: Date.now() + (15 * 24 * 60 * 60 * 1000),
      bannerUrl: "https://images.unsplash.com/photo-1550009158-9fdf6c8bea0f?w=800&h=400&fit=crop",
      discountType: "Percentage",
      discountValue: 50,
      redemptionMethod: "Online"
  },
  {
      _id: "myntra",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.png",
      brandName: "Myntra",
      title: "Flat 40% Off on Summer Collections",
      description: "Trendy fashion and accessories to get you ready for the heat!",
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      bannerUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=400&fit=crop",
      discountType: "Percentage",
      discountValue: 40,
      redemptionMethod: "Online"
  }
];

const SERVICES_CATEGORIES = [
  {
    name: "Mehendi Artist",
    icon: '🎨',
    description: "Traditional & modern henna designs for every occasion.",
    color: "#f84464",
    gradient: ['#f84464', '#ff7eb3'],
    image: "https://images.unsplash.com/photo-1766100465798-c323de2860c7?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Photographer/Studio",
    icon: '📸',
    description: "Capture timeless moments with expert professional photography.",
    color: "#a855f7",
    gradient: ['#a855f7', '#da77f2'],
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
  },
  {
    name: "Makeup Artist",
    icon: '✨',
    description: "Flawless bridal and party makeovers for every occasion.",
    color: "#c026d3",
    gradient: ['#c026d3', '#f783ac'],
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80"
  },
  {
    name: "Turf Booking",
    icon: '⚽',
    description: "Book premium football, cricket, and multisport turfs near you.",
    color: "#22c55e",
    gradient: ['#22c55e', '#10b981'],
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"
  },
  {
    name: "Swimming Pool",
    icon: '🏊',
    description: "Find and book premium swimming pools with real-time slot updates.",
    color: "#0ea5e9",
    gradient: ['#0ea5e9', '#0c4a6e'],
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800&auto=format&fit=crop"
  }
];

const SERVICE_REVIEWS = [
  { id: 1, user: "Ananya Sharma", service: "Mehendi Artist", review: "Absolutely loved the intricate designs! Highly professional and made my special day even better.", rating: 5, avatar: "https://i.pravatar.cc/150?u=ananya" },
  { id: 2, user: "Rahul Desai", service: "Photographer/Studio", review: "The wedding photos came out breathtaking. They captured every moment perfectly. Worth every penny!", rating: 5, avatar: "https://i.pravatar.cc/150?u=rahul" },
  { id: 3, user: "Priya Menon", service: "Makeup Artist", review: "Flawless makeup that lasted all night. She understood exactly what I wanted. Highly recommended!", rating: 4, avatar: "https://i.pravatar.cc/150?u=priya" },
  { id: 4, user: "Karan Singh", service: "Turf Booking", review: "Best turf in the city! Turf quality is amazing, and booking was seamless.", rating: 5, avatar: "https://i.pravatar.cc/150?u=karan" }
];

const RECENT_MEMORIES = [
  { id: 1, img: "https://images.unsplash.com/photo-1542038590-b997973ba047?w=400&h=600&fit=crop", caption: "Reception" },
  { id: 2, img: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=400&h=600&fit=crop", caption: "Marriage" },
  { id: 3, img: "https://images.unsplash.com/photo-1605414175510-53bcdd800bb8?w=400&h=600&fit=crop", caption: "Marriage" },
  { id: 4, img: "https://images.unsplash.com/photo-1589253457193-4a30e84b72aa?w=400&h=600&fit=crop", caption: "Babyshower" },
  { id: 5, img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&h=600&fit=crop", caption: "Reception" },
  { id: 6, img: "https://images.unsplash.com/photo-1620023412351-86a014a093ed?w=400&h=600&fit=crop", caption: "Marriage" },
];

const COUNTRIES = [
  { flag: '🇮🇳', label: 'India' },
  { flag: '🇦🇪', label: 'UAE' },
  { flag: '🇸🇬', label: 'Singapore' },
  { flag: '🇲🇾', label: 'Malaysia' },
  { flag: '🇹🇭', label: 'Thailand' },
  { flag: '🇩🇪', label: 'Germany' },
  { flag: '🇺🇸', label: 'United States' }
];
const CITIES = [
  { name: 'Bengaluru', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/city-buildings.png' },
  { name: 'Chennai', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/museum.png' },
  { name: 'Coimbatore', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/mountain.png' },
  { name: 'Hyderabad', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/fortress.png' },
  { name: 'Kochi', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/sailboat.png' },
  { name: 'Kolkata', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/bridge.png' },
  { name: 'New Delhi', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/india-gate.png' },
  { name: 'Mumbai', iconUrl: 'https://img.icons8.com/ios-filled/100/000000/gateway-of-india.png' },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const safeParse = (val: any) => {
    if (!val) return {};
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (err) { return {}; }
    }
    return val;
  };
  const [userLocation, setUserLocation] = useState('Coimbatore');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeCountry, setActiveCountry] = useState('India');

  useEffect(() => {
    SecureStore.getItemAsync('userLocation').then(loc => {
      if (loc) setUserLocation(loc);
    });
  }, []);

  const handleSetLocation = async (loc: string) => {
    setUserLocation(loc);
    await SecureStore.setItemAsync('userLocation', loc);
    setIsLocationModalOpen(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % PROMOS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % SERVICE_REVIEWS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = () => {
    setIsMenuOpen(false);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: async () => {
          await signOut();
          router.replace('/auth/sign-in');
        } 
      },
    ]);
  };

  // Fetch Data with Realtime Sync
  const { data: banners } = useSupabaseQuery('branding_banners', (q) => q.eq('status', 'Active'), [], { realtime: true });
  const { data: couponsRaw } = useSupabaseQuery('branding_coupons', (q) => q.eq('status', 'Active'), [], { realtime: true });
  const { data: memoriesData } = useSupabaseQuery('memories', (q) => q, [], { realtime: true });
  const { data: events, loading: eventsLoading } = useSupabaseQuery(
    'events',
    (q) => q.order('created_at', { ascending: false }),
    [],
    { realtime: true }
  );

  const { data: professionals } = useSupabaseQuery(
    'service_providers',
    (q) => q.eq('status', 'active'),
    [],
    { realtime: true }
  );

  const activeProfessionals = useMemo(() => {
    if (!professionals) return [];
    
    return professionals
      .map(p => ({ ...p, settings: safeParse(p.advanced_settings) }))
      .filter(p => Number(p.settings.rating || 0) >= 4)
      .sort((a, b) => Number(b.settings.rating) - Number(a.settings.rating))
      .slice(0, 10);
  }, [professionals]);

  const allLiveEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (Array.isArray(events) ? events : []).filter(ev => {
      const s = String(ev.status || '').toLowerCase();
      if (s === "inactive" || s === "draft" || s === "expired") return false;

      const dynamicConfig = safeParse(ev.dynamic_config);
      
      // Prioritize End Date/Expiry Date for visibility
      let dt = ev.expiry_date || ev.end_date || dynamicConfig?.basicInfo?.expiryDate || dynamicConfig?.basicInfo?.endDate || ev.date || ev.start_date || dynamicConfig?.date || dynamicConfig?.basicInfo?.date;
      if (!dt) return true; // Show if no date found (fallback)

      let eventDate: Date | null = null;
      try {
        if (typeof dt === 'string') {
          if (dt.includes('/')) {
            const [d, m, y] = dt.split('/');
            eventDate = new Date(`${y}-${m}-${d}T23:59:59`);
          } else if (dt.includes('-') && dt.split('-')[0].length === 2) {
            const [d, m, y] = dt.split('-');
            eventDate = new Date(`${y}-${m}-${d}T23:59:59`);
          } else {
            eventDate = new Date(dt);
          }
        } else {
          eventDate = new Date(dt);
        }
      } catch (e) { return true; }

      if (eventDate && !isNaN(eventDate.getTime())) {
        return eventDate >= today;
      }
      
      return true;
    });
  }, [events]);

  const activeEvents = useMemo(() => {
    const cityFilter = userLocation && userLocation !== "India" && userLocation !== "All Cities" ? userLocation.toLowerCase() : null;

    return allLiveEvents.filter(ev => {
      // Spotlight/Exclusive/Virtual events show everywhere
      const isVirtual = ev.virtual === true || ev.virtual === "Yes";
      const isSpotlight = ev.is_spotlight === true || ev.spotlight === true || ev.spotlight === "Yes";
      const isExclusive = ev.is_exclusive === true || ev.exclusive === true || ev.exclusive === "Yes";

      if (isVirtual || isSpotlight || isExclusive) return true;

      if (cityFilter) {
        const loc = String(ev.city || ev.location || ev.venue || '').toLowerCase();
        if (!loc.includes(cityFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [allLiveEvents, userLocation]);

  const heroSlides = useMemo(() => {
    if (!banners || banners.length === 0) return [];
    return banners.map((b: any) => ({
      id: b.id,
      img: b.imageUrl || b.img || b.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      title: b.title || 'Live Events',
      sub: b.redirect_type === 'event' ? 'BOOK NOW' : 'OFFER',
      url: b.redirectUrl || b.link || b.redirect_url,
      redirect_type: b.redirect_type,
      redirect_id: b.redirect_id
    }));
  }, [banners]);

  const allCoupons = useMemo(() => {
    const dynamicCoupons = couponsRaw || [];
    return [...dynamicCoupons, ...BRAND_COUPONS];
  }, [couponsRaw]);

  const featuredEvents = useMemo(() => {
    const featured = activeEvents.filter(e => e.is_exclusive || e.is_spotlight || e.featured);
    return featured.length > 0 ? featured : activeEvents.slice(0, 5);
  }, [activeEvents]);

  const spotlightEvents = useMemo(() => {
    return activeEvents.filter(e => e.is_spotlight).slice(0, 5);
  }, [activeEvents]);

  const justInEventsList = useMemo(() => {
    return [...allLiveEvents]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [allLiveEvents]);

  const comingSoonEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Coming soon should show ALL upcoming events (not city restricted) to give better visibility
    return [...allLiveEvents]
      .filter(ev => {

        const dynamicConfig = safeParse(ev.dynamic_config) || {};
        const dt = ev.start_date || ev.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate;
        if (!dt) return false;

        let eventDate: Date | null = null;
        if (typeof dt === 'string' && dt.includes('/')) {
          const [d, m, y] = dt.split('/');
          eventDate = new Date(`${y}-${m}-${d}T00:00:00`);
        } else {
          eventDate = new Date(dt);
        }
        
        // Show events starting tomorrow or later
        return eventDate > today;
      })
      .sort((a, b) => {
        // Prioritize featured/trending, then by date
        const aScore = (a.is_spotlight ? 10 : 0) + (a.featured ? 5 : 0) + (a.trending ? 3 : 0);
        const bScore = (b.is_spotlight ? 10 : 0) + (b.featured ? 5 : 0) + (b.trending ? 3 : 0);
        if (aScore !== bScore) return bScore - aScore;
        
        return new Date(a.date || a.start_date || 0).getTime() - new Date(b.date || b.start_date || 0).getTime();
      })
      .slice(0, 5);
  }, [allLiveEvents]);

  const popularEvents = useMemo(() => {
    return activeEvents.slice(0, 10);
  }, [activeEvents]);

  const comingSoonListRef = useRef(null);
  const servicesListRef = useRef(null);
  const memoriesListRef = useRef(null);

  useEffect(() => {
    if (comingSoonEvents.length <= 1) return;
    let currentIndex = 0;
    const timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % comingSoonEvents.length;
      try {
        comingSoonListRef.current?.scrollToIndex({ index: currentIndex, animated: true });
      } catch (error) {}
    }, 4000);
    return () => clearInterval(timer);
  }, [comingSoonEvents.length]);

  useEffect(() => {
    let currentIndex = 0;
    const timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % SERVICES_CATEGORIES.length;
      try {
        servicesListRef.current?.scrollToIndex({ index: currentIndex, animated: true });
      } catch (error) {}
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    const itemsCount = memoriesData && memoriesData.length > 0 ? memoriesData.length : RECENT_MEMORIES.length;
    if (itemsCount <= 1) return;
    const timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % itemsCount;
      try {
        memoriesListRef.current?.scrollToIndex({ index: currentIndex, animated: true });
      } catch (error) {}
    }, 3500);
    return () => clearInterval(timer);
  }, [memoriesData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Custom Header */}
      <View style={styles.header}>
        <View style={[styles.headerTopYellow, { backgroundColor: '#ffda00' }]}>
          <View style={{ backgroundColor: '#ffda00' }}>
            <Image 
              source={require('../../assets/images/logo_brand.png')} 
              style={{ width: 140, height: 45, backgroundColor: '#ffda00' }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffda00' }}>
            {user ? (
              <View style={[styles.avatar, { backgroundColor: '#f84464' }]}>
                <Text style={styles.avatarText}>{user.email?.slice(0, 1).toUpperCase() || 'U'}</Text>
              </View>
            ) : (
              <Pressable onPress={() => router.push('/auth/sign-in')}>
                <View style={[styles.avatar, { backgroundColor: '#e2e8f0' }]}>
                  <User size={18} color="#64748b" />
                </View>
              </Pressable>
            )}
            <Pressable style={styles.menuBtn} onPress={() => setIsMenuOpen(true)}>
              <Menu size={24} color="#000" />
            </Pressable>
          </View>
        </View>

        {/* 2. Promo Ticker - Flip Slide Style */}
        <View style={[styles.promoTicker, { backgroundColor: colors.background }]}>
          <Pressable 
            style={styles.promoTickerContent}
            onPress={() => {
              if (!user) {
                router.push('/auth/sign-in');
              } else {
                Alert.alert('Coupon Copied!', 'The promo code has been copied to your clipboard.');
              }
            }}
          >
            <Text style={styles.promoEmoji}>🏷️</Text>
            <MotiView
              key={currentPromoIndex}
              from={{ opacity: 0, translateY: 10, rotateX: '-90deg' }}
              animate={{ opacity: 1, translateY: 0, rotateX: '0deg' }}
              transition={{ type: 'spring', damping: 15 }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={styles.promoText} numberOfLines={1}>
                <Text style={{ color: '#f844a4', fontWeight: '900' }}>
                  {PROMOS[currentPromoIndex].code}: 
                </Text>
                {' '}{PROMOS[currentPromoIndex].text}
              </Text>
              <View style={styles.getDealBadge}>
                <Text style={styles.getDealText}>GET DEAL</Text>
              </View>
            </MotiView>
          </Pressable>
        </View>

        {/* 3. Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background, paddingTop: 15 }]}>
          <View style={[styles.searchBarInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.muted} />
            <TextInput
              placeholder="Find events..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => router.push({ pathname: '/events', params: { q: searchQuery } })}
            />
            <Pressable 
              style={styles.searchBtn}
              onPress={() => router.push({ pathname: '/events', params: { q: searchQuery } })}
            >
              <LinearGradient
                colors={['#f844a4', '#a855f7']}
                style={styles.searchBtnGradient}
              >
                <Text style={styles.searchBtnText}>Search</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {heroSlides.length > 0 && (
          <HeroSlider 
            slides={heroSlides} 
            onPress={(slide) => {
               if (slide.redirect_type === 'event' && slide.redirect_id) {
                 router.push({ pathname: "/events/[id]", params: { id: slide.redirect_id } });
               } else if (slide.redirect_type === 'url' && slide.url) {
                 // In a real app we might open WebBrowser here, but for now we'll do nothing
               }
            }} 
          />
        )}
        {/* Partner Deals Section */}
        <View style={[styles.section, { marginTop: 10, marginBottom: 10 }]}>
          <View style={[styles.sectionHeader, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12 }}>🏷️</Text>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#a855f7', letterSpacing: 1, textTransform: 'uppercase' }}>Partner Deals</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24 }]}>Top Trending <Text style={{ color: '#f844a4' }}>Offers</Text></Text>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Grab these limited time deals before they expire!</Text>
          </View>

          <FlatList
            data={allCoupons}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id || item._id || Math.random().toString()}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 16 }}
            renderItem={({ item }) => {
              const bannerImage = item.bannerUrl || item.img || item.image_url || 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800';
              const logoImage = item.logoUrl || item.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png';
              
              let daysLeft = '30 days left';
              if (item.endDate) {
                const end = new Date(item.endDate).getTime();
                const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
                if (diff > 0) daysLeft = `${diff} days left`;
              }

              return (
              <Pressable style={{ width: 280, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                <View style={{ height: 140, position: 'relative' }}>
                  <Image source={{ uri: bannerImage }} style={{ width: '100%', height: '100%' }} />
                  <View style={{ position: 'absolute', top: 12, left: 12, width: 28, height: 28, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}>
                    <Image source={{ uri: logoImage }} style={{ width: 16, height: 16 }} resizeMode="contain" />
                  </View>
                  <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#6366f1' }}>{item.discountValue ? `${item.discountValue}${item.discountType === 'Percentage' ? '%' : '₹'} OFF` : (item.discount || 'OFFER')}</Text>
                  </View>
                </View>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Image source={{ uri: logoImage }} style={{ width: 14, height: 14 }} resizeMode="contain" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>{item.brandName || item.brand_name || 'Brand'}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text, marginBottom: 6, lineHeight: 20 }} numberOfLines={2}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16, lineHeight: 18 }} numberOfLines={2}>{item.description}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: colors.muted }}>{daysLeft}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#3b82f6' }}>{item.redemptionMethod || 'Online'}</Text>
                  </View>
                </View>
              </Pressable>
              );
            }}
          />
        </View>

        {/* Spotlight Events (Premium/Admin Highlighted) */}
        {spotlightEvents.length > 0 && (
          <View style={[styles.section, { paddingBottom: 10 }]}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={20} color="#ffda00" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Spotlight ✨</Text>
              </View>
            </View>
            <FlatList
              data={spotlightEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `spotlight-${item.id}`}
              contentContainerStyle={{ paddingLeft: 20, gap: 12 }}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                  style={{ width: 280, height: 160, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                >
                  <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <MapPin size={12} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.city || 'Location TBA'}</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#ffda00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#000', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Exclusive</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Professional Services Section (Mehendi Artists, etc.) */}
        {activeProfessionals.length > 0 && (
          <View style={[styles.section, { marginBottom: 10 }]}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'column', gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#f844a4', letterSpacing: 1, textTransform: 'uppercase' }}>Professional Services</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Top <Text style={{ color: '#a855f7' }}>Artists</Text> & Pros</Text>
              </View>
              <Pressable onPress={() => router.push('/services')}>
                <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
              </Pressable>
            </View>
            <FlatList
              data={activeProfessionals}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `pro-${item.id}`}
              contentContainerStyle={{ paddingLeft: 20, gap: 16 }}
              renderItem={({ item }) => (
                <Pressable 
                  style={{ width: 180, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
                  onPress={() => router.push({ pathname: "/services/[id]", params: { id: item.id } })}
                >
                  <View style={{ height: 120, position: 'relative' }}>
                    <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=400' }} style={{ width: '100%', height: '100%' }} />
                    <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#22c55e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#fff' }}>AVAILABLE</Text>
                    </View>
                    <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Star size={10} fill="#fbbf24" color="#fbbf24" />
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>{item.settings.rating || '5.0'}</Text>
                    </View>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#f844a4', textTransform: 'uppercase', marginBottom: 2 }}>{item.category}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }} numberOfLines={1}>{item.business_name}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10} color={colors.muted} />
                        <Text style={{ fontSize: 10, color: colors.muted }}>{item.city || 'Online'}</Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#10b981' }}>₹{Number(item.starting_price || item.pricing || 1999).toLocaleString()}</Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Ad Banner Slot */}
        {banners && banners.some(b => {
          const m = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata;
          return m?.is_ad;
        }) && (
          <View style={{ paddingHorizontal: 20, marginVertical: 10 }}>
            {banners.filter(b => {
              const m = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata;
              return m?.is_ad;
            }).slice(0, 1).map((ad, i) => (
              <Pressable 
                key={i}
                style={{ height: 100, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f844a4' }}
                onPress={() => {
                  const m = typeof ad.metadata === 'string' ? JSON.parse(ad.metadata) : ad.metadata;
                  if (m?.url) router.push(m.url);
                }}
              >
                <Image source={{ uri: ad.image_url }} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={{ padding: 16 }}>
                  <Text style={{ color: '#fde047', fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>SPONSORED</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 4 }}>{ad.title}</Text>
                  <Text style={{ color: '#fff', fontSize: 10, opacity: 0.8 }}>{ad.sub_text}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Featured Events List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Events</Text>
            <Pressable onPress={() => router.push('/events')}>
              <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
            </Pressable>
          </View>
          <FlatList
            data={featuredEvents}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingLeft: 20 }}
            renderItem={({ item }) => (
              <EventCard 
                event={item} 
                onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })} 
              />
            )}
          />
        </View>

        {/* Coming Soon Section */}
        {comingSoonEvents.length > 0 && (
          <View style={[styles.section, { marginTop: 20, paddingBottom: 20 }]}>
            <View style={[styles.sectionHeader, { marginBottom: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Coming</Text>
                <Text style={[styles.sectionTitle, { color: '#f844a4' }]}>Soon</Text>
                <Text style={{ fontSize: 20 }}>🎯</Text>
              </View>
            </View>
            
            <FlatList
              ref={comingSoonListRef}
              data={comingSoonEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 16 }}
              renderItem={({ item }) => {
                // Calculate countdown
                let eventDate = new Date();
                const dConfig = safeParse(item.dynamic_config) || {};
                const rawDate = item.start_date || item.date || dConfig.date || dConfig.basicInfo?.date || dConfig.basicInfo?.expiryDate;
                const rawTime = item.time || dConfig.time || dConfig.basicInfo?.time || '18:00';
                
                if (rawDate) {
                    if (typeof rawDate === 'string' && rawDate.includes('/')) {
                        const [d, m, y] = rawDate.split('/');
                        eventDate = new Date(`${y}-${m}-${d}T${rawTime.includes(':') ? rawTime : '18:00'}:00`);
                    } else {
                        eventDate = new Date(rawDate);
                    }
                }
                const timeDiff = eventDate.getTime() - new Date().getTime();
                const days = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
                const hours = Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
                const mins = Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));


                const dynamicConfig = safeParse(item.dynamic_config) || {};
                const eventVenue = item.venue || item.location || dynamicConfig.location?.venueName || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || item.city || 'Venue TBA';
                const displayDate = item.start_date || item.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate || 'To be announced';
                const eventTime = item.time || dynamicConfig.time || dynamicConfig.basicInfo?.time || '18:00';

                return (
                  <Pressable 
                    style={{ width: width - 40, backgroundColor: colors.card, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 }}
                    onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                  >
                    {/* Top Image */}
                    <View style={{ height: 180, position: 'relative' }}>
                      <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' }} style={{ width: '100%', height: '100%' }} />
                      <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>Trending</Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View style={{ padding: 20 }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 16, letterSpacing: -0.5 }} numberOfLines={1}>{item.title || item.name || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event'}</Text>
                      
                      {/* Countdown */}
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
                        {[
                          { label: 'DAYS', val: days.toString().padStart(2, '0') },
                          { label: 'HOURS', val: hours.toString().padStart(2, '0') },
                          { label: 'MINS', val: mins.toString().padStart(2, '0') }
                        ].map((t, idx) => (
                          <View key={idx} style={{ alignItems: 'center', backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, minWidth: 60, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{t.val}</Text>
                            <Text style={{ fontSize: 8, fontWeight: '800', color: colors.muted, marginTop: 2 }}>{t.label}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Details */}
                      <View style={{ gap: 8, marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14 }}>📅</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted }}>{displayDate} • {eventTime}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14 }}>📍</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted }} numberOfLines={1}>{eventVenue}</Text>
                        </View>
                      </View>

                      {/* Button */}
                      <LinearGradient
                        colors={['#f844a4', '#a855f7']}
                        style={{ width: '100%', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Book Now</Text>
                      </LinearGradient>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* New Section: Just In (Unfiltered latest events) */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Just In ⚡</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>The latest events added to BookMyTicket</Text>
              </View>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
            >
              {justInEventsList && justInEventsList.length > 0 ? (
                justInEventsList.map((item, idx) => (
                  <EventCard 
                    key={item.id || idx} 
                    event={item} 
                    onPress={() => router.push({
                      pathname: "/events/[id]",
                      params: { id: item.id }
                    })}
                  />
                ))
              ) : (
                <View style={{ width: width - 40, padding: 40, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border }}>
                   <Text style={{ color: colors.muted, fontWeight: '600' }}>Loading fresh events...</Text>
                </View>
              )}
            </ScrollView>
          </View>

        {/* New Section: Events Near You (ALL events) */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Events Near You 📍</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Handpicked for you in {userLocation}</Text>
              </View>
              <Pressable onPress={() => router.push('/events')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.tint }}>See All</Text>
              </Pressable>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
            >
              {activeEvents.length > 0 ? (
                activeEvents.map((item, idx) => (
                  <EventCard 
                    key={item.id || idx} 
                    event={item} 
                    onPress={() => router.push({
                      pathname: "/events/[id]",
                      params: { id: item.id }
                    })}
                  />
                ))
              ) : (
                <View style={{ width: width - 40, padding: 40, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border }}>
                   <Ticket size={32} color={colors.muted} />
                   <Text style={{ marginTop: 12, color: colors.muted, fontWeight: '600' }}>No events in your city yet</Text>
                </View>
              )}
            </ScrollView>
          </View>

        {/* Explore Popular Events Section */}
        {popularEvents.length > 0 && (
          <View style={[styles.section, { marginTop: 10, paddingBottom: 20 }]}>
            <View style={[styles.sectionHeader, { flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, letterSpacing: -0.5 }]}>
                Explore Popular <Text style={{ color: '#f844a4' }}>Events</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Discover what everyone is talking about</Text>
            </View>

            <FlatList
              data={popularEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 16 }}
              renderItem={({ item }) => {

                const dynamicConfig = safeParse(item.dynamic_config) || {};
                const eventVenue = item.venue || item.location || dynamicConfig.location?.venueName || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || item.city || 'Venue TBA';
                const eventDate = item.start_date || item.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate || 'TBA';
                const eventTime = item.time || dynamicConfig.time || dynamicConfig.basicInfo?.time || '';

                return (
                <Pressable 
                  style={{ width: 180, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
                  onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                >
                  <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' }} style={{ width: '100%', height: 120 }} />
                  
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, flex: 1 }} numberOfLines={1}>{item.title || item.name || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event'}</Text>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginLeft: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>✓</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                      <Text style={{ fontSize: 10, color: '#f84464' }}>📍</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: colors.muted }} numberOfLines={1}>{eventVenue}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 10, color: '#10b981' }}>📅</Text>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.muted }}>{eventDate} {eventTime}</Text>
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: colors.text }}>{item.type === 'Free' ? 'Free' : 'Paid'}</Text>
                    </View>
                  </View>
                </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* Professional Services Section */}
        <View style={[styles.section, { marginTop: 10, paddingBottom: 20 }]}>
          <View style={[styles.sectionHeader, { flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, letterSpacing: -0.5 }]}>
              Professional <Text style={{ color: '#a855f7' }}>Services</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Top rated artists and studios for your special occasions</Text>
          </View>

          <FlatList
            ref={servicesListRef}
            data={SERVICES_CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 16 }}
            renderItem={({ item }) => (
              <Pressable 
                style={{ width: width - 40, height: 220, backgroundColor: colors.card, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5 }}
                onPress={() => router.push({ pathname: "/services", params: { category: item.name } })}
              >
                {/* Background Image */}
                <Image source={{ uri: item.image }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
                
                {/* Overlay */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={[StyleSheet.absoluteFill]}
                  locations={[0.3, 1]}
                />

                <View style={{ padding: 20, flex: 1, justifyContent: 'space-between' }}>
                  {/* Top Pill */}
                  <LinearGradient
                    colors={item.gradient as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{item.name}</Text>
                  </LinearGradient>

                  {/* Bottom Text */}
                  <View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 22, marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                      {item.description}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Browse Experts</Text>
                      <ChevronRight size={14} color="#fff" />
                    </View>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Newsletter Subscription Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 40 }}>
          <LinearGradient
            colors={['#ec4899', '#a855f7']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 24, padding: 24, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
              Don't Miss Our Future Updates!
            </Text>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 24 }}>
              Get Subscribed Today!
            </Text>
            
            <View style={{ backgroundColor: '#fff', borderRadius: 30, padding: 6, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <TextInput 
                placeholder="your e-mail address"
                placeholderTextColor="#9ca3af"
                style={{ flex: 1, paddingHorizontal: 16, fontSize: 14, color: '#111827', height: 44 }}
              />
              <Pressable style={{ backgroundColor: '#ffda00', borderRadius: 24, paddingHorizontal: 20, height: 44, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#111827', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Subscribe</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Service Reviews */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>Recent <Text style={{ color: '#f844a4' }}>Reviews</Text></Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>What people are saying about our experts</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
               {[1,2,3,4,5].map(i => <Text key={i} style={{ fontSize: 12, color: '#ffda00' }}>★</Text>)}
            </View>
          </View>

          <View style={{ height: 160 }}>
            {SERVICE_REVIEWS.map((review, index) => {
              if (index !== currentReviewIndex) return null;
              return (
                <MotiView
                  key={review.id}
                  from={{ opacity: 0, translateY: 30, rotateX: '45deg', scale: 0.9 }}
                  animate={{ opacity: 1, translateY: 0, rotateX: '0deg', scale: 1 }}
                  transition={{ type: 'timing', duration: 600 }}
                  style={[StyleSheet.absoluteFill, { backgroundColor: '#111827', borderRadius: 24, padding: 20, shadowColor: '#f844a4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: 'rgba(248, 68, 164, 0.3)' }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Image source={{ uri: review.avatar }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#f844a4' }} />
                      <View>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{review.user}</Text>
                        <Text style={{ color: '#a855f7', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>{review.service}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255, 218, 0, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: '#ffda00', fontSize: 12, fontWeight: '900' }}>{review.rating}.0</Text>
                      <Text style={{ fontSize: 10, color: '#ffda00' }}>★</Text>
                    </View>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontStyle: 'italic', lineHeight: 22 }}>
                    "{review.review}"
                  </Text>
                  
                  {/* Blinking indicator at bottom right */}
                  <MotiView
                    from={{ opacity: 0.2 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 800, loop: true }}
                    style={{ position: 'absolute', bottom: 20, right: 20, width: 8, height: 8, borderRadius: 4, backgroundColor: '#f844a4', shadowColor: '#f844a4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 }}
                  />
                </MotiView>
              );
            })}
          </View>
        </View>

        {/* Recent Memories Gallery */}
        <View style={{ marginBottom: 60, marginTop: 10 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 }}>
            <Text style={{ color: '#f97316', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              ✦ Our Gallery
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>
                Recent Memories{' '}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#f844a4' }}>
                2026
              </Text>
            </View>
          </View>

          {/* Gallery List */}
          <FlatList
            ref={memoriesListRef}
            data={memoriesData && memoriesData.length > 0 ? memoriesData.map(m => ({ id: m.id, img: m.image_url || m.img || m.imageUrl, caption: m.alt_text || m.alt || m.altText || 'Memory' })) : RECENT_MEMORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            renderItem={({ item, index }) => {
              const rotation = index % 2 === 0 ? '-3deg' : '3deg';
              const translateY = index % 2 === 0 ? 0 : 6;
              
              return (
                <View style={{ alignItems: 'center', transform: [{ rotate: rotation }, { translateY }], width: 110 }}>
                  <View style={{ width: 110, height: 150, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6, borderWidth: 2, borderColor: '#fff' }}>
                    <Image source={{ uri: item.img }} style={{ width: '100%', height: '100%' }} />
                  </View>
                  <Text style={{ marginTop: 12, fontSize: 11, fontWeight: '800', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                    {item.caption}
                  </Text>
                </View>
              );
            }}
          />

          {/* Button */}
          <Pressable style={{ alignSelf: 'center', marginTop: 40, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 30, borderWidth: 1.5, borderColor: '#f97316', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '800' }}>Explore Full Gallery →</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <Pressable 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
            onPress={() => setIsMenuOpen(false)} 
          />
          <MotiView
            from={{ translateX: 300 }}
            animate={{ translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[styles.sideMenu, { backgroundColor: colors.background }]}
          >
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>
              <Pressable onPress={() => setIsMenuOpen(false)}>
                <CloseIcon size={28} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.menuContent}>
              <Pressable style={styles.menuItem} onPress={() => setIsMenuOpen(false)}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Become a Partner</Text>
              </Pressable>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <Pressable style={styles.menuItem} onPress={() => setIsMenuOpen(false)}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Join Now</Text>
              </Pressable>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              
              {user && ['staff', 'admin', 'organiser', 'superadmin'].includes(user.user_metadata?.role?.toLowerCase()) && (
                <>
                  <Pressable style={styles.menuItem} onPress={() => { 
                    setIsMenuOpen(false); 
                    router.push('/staff');
                  }}>
                    <Text style={[styles.menuItemText, { color: '#a855f7' }]}>⚡ Organiser Dashboard</Text>
                  </Pressable>
                  <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                </>
              )}

              {user && (
                <View style={{ marginTop: 40 }}>
                  <Pressable onPress={handleSignOut}>
                    <LinearGradient
                      colors={['#f844a4', '#a855f7']}
                      style={styles.signOutBtn}
                    >
                      <Text style={styles.signOutText}>Sign Out</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </View>
          </MotiView>
        </View>
      )}

      {/* Location Modal Overlay */}
      {isLocationModalOpen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 2000, justifyContent: 'center', alignItems: 'center', padding: 16 }]}>
          <Pressable 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} 
            onPress={() => setIsLocationModalOpen(false)} 
          />
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={{ width: '100%', maxWidth: 900, backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.15, shadowRadius: 60, elevation: 10, maxHeight: '90%' }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 }}>Select Your Location to Continue</Text>
              <Pressable onPress={() => setIsLocationModalOpen(false)} style={{ position: 'absolute', right: 0 }}>
                <CloseIcon size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 24 }}>
              <Search size={22} color="#f844a4" />
              <TextInput 
                placeholder="Search For A Location..."
                placeholderTextColor="#94a3b8"
                style={{ flex: 1, paddingHorizontal: 12, fontSize: 16, fontWeight: '600', color: '#334155' }}
              />
              <View style={{ width: 1.5, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 10 }} />
              <Pressable onPress={() => {
                Alert.alert("Location Permission", "Allow BookMyTicket to access your live location?", [
                  { text: 'Deny', style: 'cancel' },
                  { text: 'Allow', onPress: () => { 
                      setTimeout(() => {
                        handleSetLocation('Coimbatore'); 
                      }, 400);
                  } }
                ]);
              }}>
                <MapPin size={24} color="#f844a4" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
              {/* Countries Tabs */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                {COUNTRIES.map(c => {
                  const isActive = activeCountry === c.label;
                  return (
                    <Pressable 
                      key={c.label} 
                      onPress={() => setActiveCountry(c.label)}
                      style={{ 
                        flexDirection: 'row', alignItems: 'center', gap: 6, 
                        paddingHorizontal: 14, paddingVertical: 8, 
                        borderRadius: 40, 
                        borderWidth: isActive ? 2.5 : 1.5, 
                        borderColor: isActive ? '#4f46e5' : '#e2e8f0', 
                        backgroundColor: '#fff',
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{c.flag}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#4f46e5' : '#64748b' }}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Popular Cities */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 16 }}>Popular Cities</Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
                {CITIES.map(city => {
                  const isSelected = city.name === userLocation;
                  return (
                    <Pressable 
                      key={city.name} 
                      style={{ width: '22%', minWidth: 75, alignItems: 'center', marginBottom: 16 }}
                      onPress={() => handleSetLocation(city.name)}
                    >
                      <View style={{ 
                        width: '100%', aspectRatio: 1, 
                        borderRadius: 16, 
                        backgroundColor: '#f8fafc', 
                        borderWidth: isSelected ? 2.5 : 1.5, 
                        borderColor: isSelected ? '#4f46e5' : '#f1f5f9', 
                        justifyContent: 'center', alignItems: 'center', 
                        marginBottom: 8, 
                        shadowColor: isSelected ? '#4f46e5' : '#000', 
                        shadowOffset: { width: 0, height: 4 }, 
                        shadowOpacity: isSelected ? 0.3 : 0, 
                        shadowRadius: 10, 
                        elevation: isSelected ? 4 : 0,
                        padding: 16
                      }}>
                        <Image source={{ uri: city.iconUrl }} style={{ width: '80%', height: '80%', opacity: 0.9, tintColor: isSelected ? '#4f46e5' : '#000' }} resizeMode="contain" />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#4f46e5' : '#475569', textAlign: 'center' }} numberOfLines={1}>{city.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            
            {/* Footer BookMyTicket Image / Branding Placeholder */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden', pointerEvents: 'none' }}>
               <View style={{ position: 'absolute', bottom: -10, width: '100%', height: 40, backgroundColor: '#f1f5f9', opacity: 0.3 }} />
               <Text style={{ fontSize: 14, fontWeight: '900', color: '#cbd5e1', letterSpacing: 2 }}>book<Text style={{ color: '#94a3b8' }}>my</Text>ticket</Text>
            </View>
          </MotiView>
        </View>
      )}
    </View>
  );
}

function CategoryPill({ icon, label, active }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  return (
    <Pressable 
      style={[
        styles.categoryPill, 
        { 
          backgroundColor: active ? (colorScheme === 'dark' ? '#fff' : '#f1f5f9') : colors.card, 
          borderColor: active ? colors.text : colors.border 
        }
      ]}
    >
      {icon}
      <Text style={[styles.categoryPillLabel, { color: active ? colors.text : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTopYellow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffda00',
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: 'transparent',
  },
  logoImage: { width: 140, height: 45, backgroundColor: 'transparent' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'transparent' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  locationText: { fontSize: 13, fontWeight: '700' },
  avatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  menuBtn: { padding: 4 },
  promoTicker: { 
    height: 35, 
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  promoTickerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    height: '100%',
  },
  promoEmoji: { fontSize: 14, marginRight: 10, zIndex: 10 },
  promoText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#1e293b' },
  getDealBadge: { backgroundColor: '#f844a4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  getDealText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  searchBtn: { borderRadius: 20, overflow: 'hidden' },
  searchBtnGradient: { paddingHorizontal: 18, paddingVertical: 8 },
  searchBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  scrollContent: { paddingTop: 10 },
  categoryScroll: { paddingHorizontal: 20, gap: 10, marginBottom: 25 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillLabel: { fontSize: 13, fontWeight: '700' },
  featuredBanner: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 30 },
  featuredBannerGradient: { padding: 20, gap: 15 },
  bannerBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 15,
    alignSelf: 'flex-start'
  },
  bannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  bannerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  bookNowBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#fff', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  bookNowBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  heroSection: { height: 450, position: 'relative', marginBottom: 30 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, justifyContent: 'flex-end', padding: 25 },
  heroContent: { gap: 8 },
  heroTitleMain: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  heroTitleAccent: { color: '#f84464', fontSize: 28, fontWeight: '900', letterSpacing: -1, marginTop: -10 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', lineHeight: 22 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  seeAll: { fontSize: 14, fontWeight: '700' },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  comingSoonImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  comingSoonInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  comingSoonBadge: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  sideMenu: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    bottom: 0, 
    width: 300, 
    padding: 25, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  menuHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 40 
  },
  menuTitle: { fontSize: 24, fontWeight: '900' },
  menuContent: { gap: 10 },
  menuItem: { paddingVertical: 15 },
  menuItemText: { fontSize: 18, fontWeight: '800' },
  menuDivider: { height: 1, width: '100%' },
  signOutBtn: { 
    width: '100%', 
    height: 55, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#f844a4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
