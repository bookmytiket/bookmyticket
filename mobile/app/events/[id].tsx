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
  const parsedTickets = safeParse(event.tickets) || dynamicConfig.tickets || [];
  
  const ticketTiers = Array.isArray(parsedTickets) ? parsedTickets : [];
  const minPrice = ticketTiers.length
    ? Math.min(...ticketTiers.map((t: any) => Number(t.price || 0)))
    : Number(event.price || 0);

  const isFree = event.is_free || minPrice === 0 || event.type === 'Free';
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

          {/* Description */}
          {(event.description || event.about || dynamicConfig.description) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
              <Text style={[styles.description, { color: colors.muted }]}>
                {event.description || event.about || dynamicConfig.description}
              </Text>
            </RNView>
          )}

          {/* Ticket Tiers */}
          {ticketTiers.length > 0 && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ticket Options</Text>
              {ticketTiers.map((tier: any, i: number) => (
                <RNView
                  key={i}
                  style={[
                    styles.tierRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <RNView style={styles.tierLeft}>
                    <Ticket size={16} color={colors.tint} />
                    <RNView>
                      <Text style={[styles.tierName, { color: colors.text }]}>
                        {tier.name || tier.type || 'General'}
                      </Text>
                      {tier.available !== undefined && (
                        <Text style={[styles.tierAvail, { color: colors.muted }]}>
                          {tier.available} seats left
                        </Text>
                      )}
                    </RNView>
                  </RNView>
                  <Text style={[styles.tierPrice, { color: colors.tint }]}>
                    {Number(tier.price) === 0 ? 'FREE' : `₹${Number(tier.price).toLocaleString('en-IN')}`}
                  </Text>
                </RNView>
              ))}
            </RNView>
          )}

          {/* Organiser info */}
          {(event.organisers?.name || event.organiser || dynamicConfig.organiser?.name || dynamicConfig.organiser_name) && (
            <RNView style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Organised by</Text>
              <RNView style={[styles.organiserCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Users size={18} color={colors.tint} />
                <Text style={[styles.organiserName, { color: colors.text }]}>{event.organisers?.name || event.organiser || dynamicConfig.organiser?.name || dynamicConfig.organiser_name}</Text>
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
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  description: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierName: { fontSize: 14, fontWeight: '800' },
  tierAvail: { fontSize: 11, fontWeight: '600' },
  tierPrice: { fontSize: 16, fontWeight: '900' },
  organiserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  organiserName: { fontSize: 15, fontWeight: '700' },
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
