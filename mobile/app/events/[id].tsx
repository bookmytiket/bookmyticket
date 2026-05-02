import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  StatusBar,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useSupabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Share2,
  Heart,
  Ticket,
  ChevronRight,
  Users,
  Tag,
  Globe,
  Activity,
  HeartPulse,
  FileText,
  Award,
  Shirt,
  Coffee,
  Utensils,
  Home,
  Car,
  ShieldCheck,
  Smile,
  DollarSign,
  Trophy,
  Target,
  Camera,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react-native';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${event?.title}" on BookMyTicket!`,
        title: event?.title,
      });
    } catch {}
  };

  const handleBook = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to book this event.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/sign-in') },
        ]
      );
      return;
    }
    router.push({ pathname: '/events/book', params: { id: event.id } });
  };

  if (loading || !event) {
    return (
      <RNView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        {/* Skeleton */}
        <RNView style={[styles.skeletonHero, { backgroundColor: colors.border }]} />
        <RNView style={{ padding: 20, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <RNView
              key={i}
              style={[
                styles.skeletonLine,
                { backgroundColor: colors.border, width: `${100 - i * 15}%` as any },
              ]}
            />
          ))}
        </RNView>
      </RNView>
    );
  }

  // Safe JSON parse helper
  const safeParse = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return null; }
    }
    return val;
  };

  const dynamicConfig = safeParse(event.dynamic_config) || {};
  const parsedTickets = safeParse(event.tickets) || dynamicConfig.tickets || dynamicConfig.categories || [];
  
  const ticketTiers = Array.isArray(parsedTickets) ? parsedTickets : [];
  
  // Robust price calculation for dynamic events
  const getMinPrice = () => {
    if (ticketTiers.length === 0) return Number(event.price || 0);
    
    const prices = ticketTiers.map((t: any) => {
      const rawRates = t.ageRates || t.agePricing || t.age_rates || t.age_pricing || [];
      if (Array.isArray(rawRates) && rawRates.length > 0) {
        return Math.min(...rawRates.map((r: any) => Number(r.price || 0)));
      }
      return Number(t.price || 0);
    });
    
    return Math.min(...prices);
  };

  const minPrice = getMinPrice();
  
  const isFree = event.is_free || (minPrice === 0 && event.type !== 'Dynamic') || event.type === 'Free';
  const priceLabel = isFree ? 'FREE' : `₹${minPrice.toLocaleString('en-IN')}`;
  const location = event.venue || event.location || event.city || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || 'TBA';
  const date = event.start_date || event.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate || 'TBA';
  const time = event.start_time || event.time || dynamicConfig.time || dynamicConfig.basicInfo?.time || '';

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero Image */}
        <RNView style={styles.heroContainer}>
          <Image
            source={{
              uri:
                event.img ||
                event.image_url ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
            }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
            style={styles.heroGradient}
          />

          {/* Nav overlay */}
          <RNView style={styles.heroNav}>
            <Pressable
              onPress={() => router.back()}
              style={styles.navBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <RNView style={styles.navActions}>
              <Pressable onPress={handleShare} style={styles.navBtn} hitSlop={8}>
                <Share2 size={20} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => setLiked((v) => !v)}
                style={styles.navBtn}
                hitSlop={8}
              >
                <Heart
                  size={20}
                  color="#fff"
                  fill={liked ? '#f84464' : 'none'}
                />
              </Pressable>
            </RNView>
          </RNView>

          {/* Category badge */}
          {event.category && (
            <RNView style={styles.heroCategoryBadge}>
              <Tag size={12} color="#fff" />
              <Text style={styles.heroCategoryText}>{event.category}</Text>
            </RNView>
          )}
        </RNView>

        {/* Content */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={[styles.content, { backgroundColor: colors.background }]}
        >
          {/* Title + Price */}
          <RNView style={styles.titleRow}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>
              {event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event Details'}
            </Text>
            <RNView
              style={[
                styles.pricePill,
                { backgroundColor: isFree ? colors.success + '20' : colors.tint + '15' },
              ]}
            >
              <Text
                style={[
                  styles.priceText,
                  { color: isFree ? colors.success : colors.tint },
                ]}
              >
                {priceLabel}
              </Text>
            </RNView>
          </RNView>

          {/* Meta info */}
          <RNView style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MetaRow icon={<Calendar size={16} color={colors.tint} />} value={date} label="Date" colors={colors} />
            {time ? <MetaRow icon={<Clock size={16} color={colors.secondary} />} value={time} label="Time" colors={colors} /> : null}
            <MetaRow icon={<MapPin size={16} color={colors.error} />} value={location} label="Venue" colors={colors} isLast />
          </RNView>

          {/* Countdown Timer */}
          {dynamicConfig.countdown?.enabled && dynamicConfig.countdown?.deadline && (
            <RNView style={styles.countdownContainer}>
              <LinearGradient
                colors={['#f84464', '#c026d3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.countdownGradient}
              >
                <Text style={styles.countdownTitle}>REGISTRATION DEADLINE</Text>
                <Countdown deadline={dynamicConfig.countdown.deadline} />
              </LinearGradient>
            </RNView>
          )}

          {/* Ticket Categories & Prizes */}
          {dynamicConfig.categories?.length > 0 && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ticket Categories</Text>
              {dynamicConfig.categories.map((cat: any, i: number) => (
                <RNView
                  key={i}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <RNView style={styles.categoryHeader}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                    <Text style={[styles.categoryPrice, { color: colors.tint }]}>
                      {(() => {
                        const rawRates = cat.ageRates || cat.agePricing || cat.age_rates || cat.age_pricing || [];
                        if (Array.isArray(rawRates) && rawRates.length > 0) {
                          const prices = rawRates.map((r: any) => Number(r.price || 0));
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
                        }
                        return `₹${cat.price || 0}`;
                      })()}
                    </Text>
                  </RNView>
                  
                  {cat.prizes?.length > 0 && (
                    <RNView style={styles.prizeList}>
                      {cat.prizes.map((p: any, pi: number) => (
                        <RNView key={pi} style={styles.prizeRow}>
                          <Text style={[styles.prizeLabel, { color: colors.muted }]}>{p.label}</Text>
                          <Text style={[styles.prizeValue, { color: colors.text }]}>{p.value}</Text>
                        </RNView>
                      ))}
                    </RNView>
                  )}
                  
                  <RNView style={styles.categoryFooter}>
                    <Text style={[styles.categorySlots, { color: colors.muted }]}>
                      {cat.gender || 'All'} • {cat.totalSlots || 0} SLOTS
                    </Text>
                  </RNView>
                </RNView>
              ))}
            </RNView>
          )}

          {/* Amenities Grid */}
          {dynamicConfig.amenities?.length > 0 && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Amenities</Text>
              <RNView style={styles.amenitiesGrid}>
                {dynamicConfig.amenities.map((item: string, i: number) => (
                  <RNView key={i} style={styles.amenityItem}>
                    <RNView style={[styles.amenityIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <AmenityIcon name={item} color={colors.tint} />
                    </RNView>
                    <Text style={[styles.amenityLabel, { color: colors.muted }]} numberOfLines={1}>
                      {item}
                    </Text>
                  </RNView>
                ))}
              </RNView>
            </RNView>
          )}

          {/* Description */}
          {(event.description || event.about || dynamicConfig.description || dynamicConfig.basicInfo?.description) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
              <Text style={[styles.description, { color: colors.muted }]}>
                {event.description || event.about || dynamicConfig.description || dynamicConfig.basicInfo?.description}
              </Text>
            </RNView>
          )}

          {/* Organiser info */}
          {(event.organisers?.name || event.organiser || dynamicConfig.organiser?.name || dynamicConfig.organiser_name || dynamicConfig.basicInfo?.organizerContact) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Organised by</Text>
              <RNView style={[styles.organiserCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Users size={18} color={colors.tint} />
                <RNView>
                  <Text style={[styles.organiserName, { color: colors.text }]}>
                    {event.organisers?.name || event.organiser || dynamicConfig.organiser?.name || dynamicConfig.organiser_name || 'Organiser'}
                  </Text>
                  {dynamicConfig.basicInfo?.organizerContact && (
                    <Text style={[styles.organiserContact, { color: colors.muted }]}>{dynamicConfig.basicInfo.organizerContact}</Text>
                  )}
                </RNView>
              </RNView>
            </RNView>
          )}

          <RNView style={{ height: 120 }} />
        </MotiView>
      </ScrollView>

      {/* Floating Book Button */}
      <RNView style={[styles.bookBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <RNView>
          <Text style={[styles.bookPriceLabel, { color: colors.muted }]}>Starting from</Text>
          <Text style={[styles.bookPrice, { color: colors.tint }]}>{priceLabel}</Text>
        </RNView>
        <Pressable onPress={handleBook} style={styles.bookBtn}>
          <LinearGradient
            colors={colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            <Ticket size={18} color="#fff" />
            <Text style={styles.bookBtnText}>Book Now</Text>
            <ChevronRight size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </RNView>
    </RNView>
  );
}

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hrs: Math.floor((diff / (1000 * 60 * 60)) % 24),
        min: Math.floor((diff / 1000 / 60) % 60),
        sec: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <RNView style={styles.countdownRow}>
      <TimeUnit value={timeLeft.days} label="DAYS" />
      <TimeUnit value={timeLeft.hrs} label="HRS" />
      <TimeUnit value={timeLeft.min} label="MIN" />
      <TimeUnit value={timeLeft.sec} label="SEC" />
    </RNView>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <RNView style={styles.timeUnit}>
      <Text style={styles.timeValue}>{value}</Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </RNView>
  );
}

function AmenityIcon({ name, color }: { name: string; color: string }) {
  const iconSize = 20;
  const map: any = {
    'Ambulance': Activity,
    'First Aid': HeartPulse,
    'Certificate': FileText,
    'Medal': Award,
    'T-Shirt': Shirt,
    'Breakfast': Coffee,
    'Refreshments': Utensils,
    'Accommodation': Home,
    'Parking': Car,
    'Safety': ShieldCheck,
    'Family': Smile,
    'Cash Prize': DollarSign,
    'Trophy': Trophy,
    'Bib': Target,
    'Selfie': Camera,
    'Washroom': CheckCircle2,
  };
  const IconComp = map[name] || HelpCircle;
  return <IconComp size={iconSize} color={color} />;
}

function MetaRow({ icon, value, label, colors, isLast }: any) {
  return (
    <RNView
      style={[
        styles.metaRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      {icon}
      <RNView style={{ flex: 1 }}>
        <Text style={[styles.metaLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1 },
  skeletonHero: { height: 320 },
  skeletonLine: { height: 18, borderRadius: 8 },
  heroContainer: { height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  heroNav: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: { flexDirection: 'row', gap: 8 },
  heroCategoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroCategoryText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20, paddingTop: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  eventTitle: { flex: 1, fontSize: 22, fontWeight: '900', lineHeight: 28 },
  pricePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  priceText: { fontSize: 14, fontWeight: '900' },
  metaCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  metaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  description: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  categoryCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  categoryPrice: { fontSize: 18, fontWeight: '900' },
  prizeList: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 8 },
  prizeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prizeLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  prizeValue: { fontSize: 14, fontWeight: '800' },
  categoryFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
  categorySlots: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { width: '22%', alignItems: 'center', gap: 8 },
  amenityIcon: { width: 50, height: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  amenityLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  organiserCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1 },
  organiserName: { fontSize: 16, fontWeight: '800' },
  organiserContact: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  countdownContainer: { marginBottom: 24, borderRadius: 24, overflow: 'hidden' },
  countdownGradient: { padding: 20, alignItems: 'center' },
  countdownTitle: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  countdownRow: { flexDirection: 'row', gap: 20 },
  timeUnit: { alignItems: 'center' },
  timeValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  timeLabel: { color: '#fff', fontSize: 8, fontWeight: '800', marginTop: 2 },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  bookPriceLabel: { fontSize: 11, fontWeight: '600' },
  bookPrice: { fontSize: 20, fontWeight: '900' },
  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
