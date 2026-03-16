import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop';

export default function EventCard({ event, onPress, compact }) {
  const img = event?.img || event?.bannerPreview || DEFAULT_IMG;
  const title = event?.title || 'Event';
  const date = event?.date || 'TBA';
  const location = event?.location || event?.venue || event?.address || 'Venue';
  const type = event?.type || 'Paid';
  const price = event?.price ?? event?.normalTicketPrice;

  const cardStyle = compact ? [styles.card, styles.cardCompact] : styles.card;

  return (
    <TouchableOpacity style={cardStyle} onPress={() => onPress(event)} activeOpacity={0.9}>
      <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <View style={styles.typeRow}>
          <Text style={styles.type}>{type}</Text>
          <View style={styles.typeLine} />
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {event?.verified && (
            <Ionicons name="checkmark-circle" size={16} color="#1d9bf0" style={styles.verifiedIcon} />
          )}
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={Colors.secondary} style={{ marginRight: 4 }} />
          <Text style={styles.location} numberOfLines={1}>{location}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.dateRow}>
             <Ionicons name="calendar-outline" size={14} color={Colors.success} style={{ marginRight: 4 }} />
             <Text style={styles.date}>{date}</Text>
          </View>
          {price != null && (
            <Text style={styles.price}>₹ {Number(price)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    width: 210,
    marginVertical: 4,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    width: 231, // Matching Web's width logic
  },
  cardCompact: {
    flex: 1,
    maxWidth: '48%',
    marginHorizontal: 0,
    width: 'auto',
  },
  image: {
    width: '100%',
    height: 300, // Matching Web's 2.3/3 aspect ratio approx
  },
  content: {
    padding: 14,
  },
  typeRow: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  type: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  typeLine: {
    height: 2,
    backgroundColor: Colors.secondary,
    width: '100%',
    marginTop: -2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
    flex: 1,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  dot: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  location: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
