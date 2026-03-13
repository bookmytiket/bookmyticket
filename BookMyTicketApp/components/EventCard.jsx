import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventCard({ event, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: event.img }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageGradient}
        />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₹{event.price || 'TBA'}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.category}>{event.category || 'Event'}</Text>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{event.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#64748b" />
            <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    width: 280,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f84464',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
});
