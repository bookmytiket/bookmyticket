import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Calendar, Star, Ticket } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MotiView } from 'moti';

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
  const eventVenue = event.venue || event.location || event.city || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || "TBA";
  const rawDate = event.start_date || event.date || dynamicConfig.date || dynamicConfig.basicInfo?.date || dynamicConfig.basicInfo?.expiryDate;
  const rawTime = event.time || event.start_time || dynamicConfig.time || dynamicConfig.basicInfo?.time;
  const eventDate = [rawDate, rawTime].filter(Boolean).join(" ") || "TBA";

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
          <Image
            source={{ uri: event.image_url || event.img || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=660&fit=crop" }}
            style={styles.image}
            contentFit="cover"
            transition={1000}
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category || 'Event'}</Text>
          </View>
          
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
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {event.name || event.title || dynamicConfig?.basicInfo?.eventName || dynamicConfig?.title || 'Event'}
          </Text>
          
          <View style={styles.infoRow}>
            <MapPin size={12} color={colors.error} />
            <Text style={[styles.infoText, { color: colors.muted }]} numberOfLines={1}>
              {eventVenue}
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <Calendar size={12} color={colors.success} />
              <Text style={[styles.dateText, { color: colors.muted }]}>
                {eventDate}
              </Text>
            </View>
            <View style={[styles.priceBadge, { backgroundColor: colors.background }]}>
              <Text style={[styles.priceText, { color: colors.text }]}>
                {event.is_free || event.type === 'Free' ? "FREE" : "PAID"}
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
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
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
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
