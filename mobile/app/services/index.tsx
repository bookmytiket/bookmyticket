import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, MapPin, Search, Sparkles, ShieldCheck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

// Mock Services fallback
const MOCK_SERVICES = [
  { id: '1', title: 'Premium Photography Studio', provider: 'LensCraft Experts', rating: 4.8, reviews: 124, price: 5000, category: 'Photography', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=400&fit=crop' },
  { id: '2', title: 'Elite Catering Services', provider: 'TasteMakers', rating: 4.9, reviews: 312, price: 15000, category: 'Catering', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&h=400&fit=crop' },
  { id: '3', title: 'Live Band & DJ', provider: 'Rhythm Masters', rating: 4.7, reviews: 89, price: 8000, category: 'Entertainment', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&h=400&fit=crop' }
];

export default function ServicesScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);

  const safeParse = (val: any) => {
    if (!val) return {};
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (err) { return {}; }
    }
    return val;
  };

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let allData: any[] = [];
        
        // 1. Fetch from service_providers
        const isTurfCat = category === "Turf Booking";
        let query = supabase.from('service_providers').select('*').ilike('status', 'active');
        
        if (category && category !== "All Services") {
          // Map UI categories to potential DB names
          const search = category.endsWith('s') ? category.slice(0, -1) : category;
          let filter = `category.ilike.%${category}%,category.ilike.%${search}%`;
          
          if (isTurfCat) filter += `,category.ilike.%Turf%`;
          if (category === "Photographers") filter += `,category.ilike.%Photo%`;
          if (category === "Makeup Artist") filter += `,category.ilike.%Makeup%,category.ilike.%Artist%`;
          
          query = query.or(filter);
        }
        
        const { data: providers } = await query;
        if (providers) {
          allData = providers.map(item => {
            const settings = safeParse(item.advanced_settings);
            return {
              ...item,
              title: item.business_name,
              image: item.image_url,
              provider: item.category,
              price: item.starting_price || item.pricing,
              rating: settings.rating || '5.0',
              reviews: settings.reviews || '20+',
              isTurf: false
            };
          });
        }

        // 2. Fetch from dedicated turfs table if applicable
        if (!category || isTurfCat || category === "All Services") {
          const { data: turfs } = await supabase.from('turfs').select('*').ilike('status', 'active');
          if (turfs) {
            const normalizedTurfs = turfs.map(t => ({
              ...t,
              id: t.id,
              title: t.name,
              image: Array.isArray(t.images) ? t.images[0] : (t.images || t.image_url),
              provider: "Turf Booking",
              price: t.price_per_hour || 0,
              rating: '5.0',
              reviews: '10+',
              isTurf: true
            }));
            allData = [...allData, ...normalizedTurfs];
          }
        }

        if (allData.length > 0) {
          setServices(allData);
        } else {
          // Fallback to mock only if nothing found
          const filteredMock = MOCK_SERVICES.filter(s => 
            !category || s.category.toLowerCase().includes(category.toLowerCase())
          );
          setServices(filteredMock);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setServices(MOCK_SERVICES);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [category]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={12} style={{ padding: 8 }}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{category || 'Experts'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={services}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={[styles.categoryHero, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <LinearGradient
                colors={['#f844a410', '#a855f710']}
                style={styles.heroGradient}
              />
              <View style={styles.heroInfo}>
                <Text style={[styles.heroSubtitle, { color: colors.tint }]}>Verified Professionals</Text>
                <Text style={[styles.heroTitle, { color: colors.text }]}>{category || 'Service Marketplace'}</Text>
                <Text style={[styles.heroDesc, { color: colors.muted }]}>
                  Explore top-rated {category?.toLowerCase() || 'experts'} vetted for quality and professional excellence.
                </Text>
              </View>
              <View style={[styles.heroIconContainer, { backgroundColor: colors.tint + '15' }]}>
                 <Sparkles size={24} color={colors.tint} />
              </View>
            </MotiView>
            
            <View style={styles.resultsRow}>
              <Text style={[styles.resultsText, { color: colors.muted }]}>{services.length} {category || 'Experts'} Found</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#22c55e" />
                <Text style={styles.verifiedText}>SECURE BOOKING</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 50 }} />
          ) : (
            <View style={{ marginTop: 50, alignItems: 'center' }}>
              <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 16, fontWeight: '600' }}>No experts found in this category.</Text>
              <Pressable 
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                style={{ marginTop: 20, padding: 12, backgroundColor: colors.tint, borderRadius: 12 }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Explore Other Categories</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: index * 100 }}
          >
            <Pressable 
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/services/[id]', params: { id: item.id } })}
            >
              <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=600' }} style={styles.image} contentFit="cover" />
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#fff" fill="#fff" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <MapPin size={12} color={colors.muted} />
                  <Text style={[styles.provider, { color: colors.muted, marginBottom: 0 }]} numberOfLines={1}>
                    {item.city || 'Online'} • {item.reviews} reviews
                  </Text>
                </View>
                
                <View style={styles.footer}>
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' }}>Starts from</Text>
                    <Text style={[styles.price, { color: colors.tint }]}>₹{Number(item.price || 1999).toLocaleString()}</Text>
                  </View>
                  <LinearGradient
                    colors={['#f844a4', '#a855f7']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bookBtn}
                  >
                    <Text style={styles.bookBtnText}>View Profile</Text>
                  </LinearGradient>
                </View>
              </View>
            </Pressable>
          </MotiView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  categoryHero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  heroDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
  },
  heroIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22c55e10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#22c55e',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  image: { width: '100%', height: 180 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  provider: { fontSize: 14, fontWeight: '600', marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: '900' },
  bookBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
