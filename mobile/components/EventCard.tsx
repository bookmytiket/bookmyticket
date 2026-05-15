import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Calendar, Star, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MotiView } from 'moti';
import LikeButton, { LikeButtonRef } from './LikeButton';

interface EventCardProps {
  event: any;
  onPress: () => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Safe JSON parse helper for dynamic configs
  const safeParse = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return null; }
    }
    return val;
  };

  const dynamicConfig = safeParse(event.dynamic_config) || {};
  const eventVenue = event.venue || event.location || dynamicConfig.location?.venueName || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || event.city || "TBA";
  const rawDate = event.start_date || event.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate;
  const rawTime = event.time || event.start_time || dynamicConfig.time || dynamicConfig.basicInfo?.time;

  const lastTap = React.useRef(0);
  const likeRef = React.useRef<LikeButtonRef>(null);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      if (likeRef.current) {
        likeRef.current.toggleLike();
      }
    } else {
      lastTap.current = now;
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
    >
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
        ]}
      >
        <View style={styles.imageContainer}>
          <Pressable onPress={handleDoubleTap} style={{ flex: 1 }}>
            <Image
              source={{ uri: event.image_url || event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=660&fit=crop" }}
              style={styles.image}
              contentFit="cover"
              transition={1000}
            />
          </Pressable>
          
          {event.featured && (
            <LinearGradient
              colors={colors.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.featuredBadge}
            >
              <Star size={10} color="#fff" fill="#fff" />
              <Text style={styles.featuredText}>TOP</Text>
            </LinearGradient>
          )}

          <View style={styles.likeButtonContainer}>
            <LikeButton 
              ref={likeRef}
              itemId={event.id} 
              type={event.business_name ? 'service' : 'event'} 
              size={18}
            />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event'}
          </Text>
          
          <View style={styles.infoRow}>
            <MapPin size={10} color={colors.error} />
            <Text style={[styles.infoText, { color: colors.muted }]} numberOfLines={1}>
              {eventVenue}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Calendar size={10} color={colors.success} />
              <Text style={[styles.dateText, { color: colors.muted }]}>{rawDate || 'TBA'}</Text>
            </View>
            {rawTime && (
              <View style={styles.dateItem}>
                <Clock size={10} color={colors.secondary} />
                <Text style={[styles.dateText, { color: colors.muted }]}>{rawTime}</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={[styles.priceBadge, { backgroundColor: colors.tint + '10' }]}>
              <Text style={[styles.priceText, { color: colors.tint }]}>
                {event.is_free || event.type === 'Free' || event.price === 0 ? "FREE" : `₹${event.price || event.tournament_data?.registration_fee || "BOOK"}`}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
              <Text style={[styles.typeText, { color: colors.muted }]}>
                {event.category || 'Event'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 170,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    height: 36,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  dateRow: {
    gap: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  likeButtonContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  }
});
