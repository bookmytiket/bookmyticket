import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Calendar, 
  ChevronLeft,
  Share2,
  CheckCircle2,
  Info
} from 'lucide-react-native';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { data: pro, loading } = useSupabaseQuery(
    'service_providers',
    (q) => q.eq('id', id).single(),
    [id]
  );

  const settings = useMemo(() => {
    if (!pro?.advanced_settings) return {};
    try {
      return typeof pro.advanced_settings === 'string' 
        ? JSON.parse(pro.advanced_settings) 
        : pro.advanced_settings;
    } catch (e) {
      return {};
    }
  }, [pro]);

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><Text>Loading profile...</Text></View>;
  if (!pro) return <View style={[styles.loading, { backgroundColor: colors.background }]}><Text>Provider not found.</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerImageContainer}>
          <Image 
            source={{ uri: pro.image_url || 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800' }} 
            style={styles.headerImage}
          />
          <LinearGradient 
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          
          <SafeAreaView style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={styles.iconBtn}>
                <Share2 size={20} color="#fff" />
              </Pressable>
            </View>
          </SafeAreaView>

          <View style={styles.headerInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{pro.category}</Text>
            </View>
            <Text style={styles.businessName}>{pro.business_name}</Text>
            <View style={styles.ratingRow}>
              <View style={styles.starBadge}>
                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                <Text style={styles.starText}>{settings.rating || '5.0'}</Text>
              </View>
              <Text style={styles.reviewCount}>({settings.reviews || '20+'} Reviews)</Text>
              <View style={styles.dot} />
              <MapPin size={14} color="#fff" opacity={0.8} />
              <Text style={styles.locationText}>{pro.city || 'Online'}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Verified Badge */}
          <View style={styles.verifiedBar}>
            <ShieldCheck size={18} color="#22c55e" />
            <Text style={styles.verifiedText}>BookMyTicket Verified Professional</Text>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              {pro.bio || `${pro.business_name} is a leading ${pro.category} known for high-quality service and customer satisfaction. With years of experience in the industry, we ensure your special moments are handled with care.`}
            </Text>
          </View>

          {/* Services Offered */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Services & Pricing</Text>
            <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.pricingHeader}>
                <Text style={[styles.pricingLabel, { color: colors.text }]}>Starting Price</Text>
                <Text style={styles.priceValue}>₹{Number(pro.starting_price || pro.pricing || 1999).toLocaleString()}</Text>
              </View>
              <View style={styles.pricingDivider} />
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <Text style={[styles.featureText, { color: colors.muted }]}>Professional Equipment</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <Text style={[styles.featureText, { color: colors.muted }]}>On-time Service</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <Text style={[styles.featureText, { color: colors.muted }]}>Post-service Support</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Gallery Section */}
          <View style={[styles.section, { marginBottom: 120 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Portfolio</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {[1, 2, 3].map((_, i) => (
                <Image 
                  key={i}
                  source={{ uri: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400` }}
                  style={styles.galleryImage}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.actionGroup}>
          <Pressable style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <MessageSquare size={20} color={colors.text} />
          </Pressable>
          <Pressable style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <Phone size={20} color={colors.text} />
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/events')}>
            <LinearGradient colors={['#f844a4', '#a855f7']} style={styles.gradient}>
              <Calendar size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Book Now</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImageContainer: {
    height: 350,
    width: '100%',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  categoryBadge: {
    backgroundColor: '#f844a4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  businessName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  starText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
  reviewCount: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    opacity: 0.6,
  },
  locationText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '700',
  },
  content: {
    marginTop: -25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  verifiedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 16,
    marginBottom: 24,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  pricingCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10b981',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  }
});
