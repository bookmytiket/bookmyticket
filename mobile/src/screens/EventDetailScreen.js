import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { HOME_EVENTS } from '../data/homeEvents';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

function getEventById(id, convexEvents) {
  const sid = String(id);
  const fromHome = (HOME_EVENTS || []).find((e) => String(e.id) === sid);
  const fromConvex = (convexEvents || []).find((e) => String(e._id) === sid || String(e.id) === sid);
  const raw = fromHome || fromConvex;
  if (!raw) return null;
  return {
    ...raw,
    id: raw._id || raw.id,
    img: raw.img || raw.bannerPreview || DEFAULT_IMG,
    title: raw.title || 'Event',
    date: raw.date || 'TBA',
    time: raw.time || '',
    location: raw.location || raw.venue || raw.address || 'Venue',
    description: raw.description || 'Join us for this event. Book your tickets now.',
    price: raw.price ?? raw.normalTicketPrice ?? 499,
    // Web Sync: Consistent flags
    featured: raw.featured !== false,
    trending: raw.trending !== false,
  };
}

export default function EventDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, addToRecentlyViewed } = useAuth();
  const { eventId, event: routeEvent } = route.params || {};
  const convexEvents = useQuery(api.events.getActiveEvents) ?? [];

  const event = useMemo(() => {
    if (routeEvent) return { ...routeEvent, id: routeEvent._id || routeEvent.id };
    return getEventById(eventId, convexEvents);
  }, [eventId, routeEvent, convexEvents]);

  React.useEffect(() => {
    if (event) {
      addToRecentlyViewed(event);
    }
  }, [event, addToRecentlyViewed]);

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Event not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBookNow = () => {
    if (!user) {
      navigation.navigate('SignIn');
      return;
    }
    
    const isSeating = event.seatingEnabled !== false && 
                     Array.isArray(event.seatCategories) && 
                     event.seatCategories.length > 0 && 
                     Number(event.cols) > 0;

    if (isSeating) {
      navigation.navigate('Seating', { eventId: String(event.id), event });
    } else {
      navigation.navigate('Checkout', { eventId: String(event.id), event });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: event.img }} style={styles.cover} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.meta}>
          <Ionicons name="calendar-outline" size={18} color="#6b7280" />
          <Text style={styles.metaText}>{event.date}{event.time ? ` • ${event.time}` : ''}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={18} color="#6b7280" />
          <Text style={styles.metaText}>{event.location}</Text>
        </View>
        <Text style={styles.price}>₹{Number(event.price)}</Text>
        <Text style={styles.desc}>{event.description}</Text>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  notFound: { fontSize: 18, color: '#6b7280', marginBottom: 16 },
  backBtn: { padding: 12, backgroundColor: '#F43F5E', borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  cover: { width: '100%', height: 240, backgroundColor: '#0f172a' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  metaText: { fontSize: 14, color: '#6b7280', flex: 1 },
  price: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12, marginBottom: 16 },
  desc: { fontSize: 15, color: '#4b5563', lineHeight: 24, marginBottom: 24 },
  bookBtn: { backgroundColor: '#F43F5E', padding: 16, borderRadius: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
