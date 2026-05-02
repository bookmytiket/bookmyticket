import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, MapPin, Search } from 'lucide-react-native';
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

  useEffect(() => {
    // Attempt to fetch from a generic 'services' table, fallback to mock data
    const fetchServices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('services').select('*').eq('category', category || 'Photography');
        if (data && data.length > 0) {
          setServices(data);
        } else {
          setServices(MOCK_SERVICES.filter(s => !category || s.category.toLowerCase().includes(category.toLowerCase())));
        }
      } catch (err) {
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
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 8 }}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{category || 'Services'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={services}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 50 }} />
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 50, color: colors.muted }}>No services found.</Text>
          )
        }
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: index * 100 }}
          >
            <Pressable 
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/services/book', params: { id: item.id } })}
            >
              <Image source={{ uri: item.image || item.img_url }} style={styles.image} contentFit="cover" />
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#fff" fill="#fff" />
                    <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                  </View>
                </View>
                <Text style={[styles.provider, { color: colors.muted }]} numberOfLines={1}>by {item.provider || item.organiser || 'Verified Professional'}</Text>
                
                <View style={styles.footer}>
                  <Text style={[styles.price, { color: colors.tint }]}>₹{item.price || 'Contact for Price'}</Text>
                  <LinearGradient
                    colors={colors.gradient as any}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bookBtn}
                  >
                    <Text style={styles.bookBtnText}>Book</Text>
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
