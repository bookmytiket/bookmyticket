import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({ event, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Event Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: event.img }} style={styles.image} />

        {/* Wishlist icon */}
        <TouchableOpacity style={styles.wishIcon}>
          <Ionicons name="heart-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={13} color="#64748b" />
          <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={13} color="#64748b" />
          <Text style={styles.detailText}>{event.date}</Text>
        </View>

        {/* Price tag */}
        {event.price ? (
          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>Paid</Text>
          </View>
        ) : (
          <View style={[styles.paidBadge, styles.freeBadge]}>
            <Text style={[styles.paidText, styles.freeText]}>Free</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 220,
    marginRight: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 6,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 19,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  paidBadge: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#f84464',
    borderRadius: 4,
  },
  freeBadge: {
    backgroundColor: '#16a34a',
  },
  paidText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  freeText: {
    color: '#fff',
  },
});
