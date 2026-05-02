import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, FlatList, Pressable, Dimensions, TextInput, Platform, View, Text, Image, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseQuery, useAuth } from '@/hooks/useSupabase';
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

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % PROMOS.length);
    }, 4000);
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
  const { data: events, loading: eventsLoading } = useSupabaseQuery(
    'events',
    (q) => q.order('created_at', { ascending: false }),
    [],
    { realtime: true }
  );

  const activeEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return events.filter(ev => {
      const s = String(ev.status || '').toLowerCase();
      // Exclude draft/inactive
      if (s === "draft" || s === "inactive") return false;
      
      // Parse event date (dd/mm/yyyy or yyyy-mm-dd)
      let dt = ev.date || ev.start_date || ev.startDate;
      if (!dt) return true; // Fallback if no date
      
      let eventDate: Date | null = null;
      try {
        if (dt.includes('/')) {
          const [d, m, y] = dt.split('/');
          eventDate = new Date(`${y}-${m}-${d}T23:59:59`);
        } else {
          eventDate = new Date(dt);
        }
      } catch (e) { return true; }

      // Web portal logic: If future, show it. If past and expired, hide it.
      if (eventDate && eventDate > now) return true;
      if (s === "expired") return false;
      
      return true;
    });
  }, [events]);

  const featuredEvents = useMemo(() => {
    const featured = activeEvents.filter(e => e.featured);
    return featured.length > 0 ? featured : activeEvents.slice(0, 5);
  }, [activeEvents]);

  const comingSoonEvents = useMemo(() => {
    return activeEvents.slice(featuredEvents.length, featuredEvents.length + 5);
  }, [activeEvents, featuredEvents]);

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffda00' }}>
              <MapPin size={16} color="#000" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#000', backgroundColor: '#ffda00' }}>Coimbatore</Text>
            </View>
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
          <View style={[styles.section, { marginTop: 20 }]}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Coming</Text>
                <Text style={[styles.sectionTitle, { color: '#f844a4' }]}>Soon</Text>
                <Text style={{ fontSize: 20 }}>🎯</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              {comingSoonEvents.map((item) => (
                <Pressable 
                  key={item.id} 
                  style={styles.comingSoonCard}
                  onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                >
                  <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' }} style={styles.comingSoonImage} />
                  <View style={styles.comingSoonInfo}>
                    <Text style={[styles.comingSoonTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonBadgeText}>{item.category || 'Event'}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
