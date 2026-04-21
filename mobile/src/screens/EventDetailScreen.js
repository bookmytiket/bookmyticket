import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

function getEventById(id, convexEvents) {
  const sid = String(id);
  const fromConvex = (convexEvents || []).find((e) => String(e.id) === sid);
  if (!fromConvex) return null;
  return {
    ...fromConvex,
    img: fromConvex.img || fromConvex.banner_preview || DEFAULT_IMG,
    title: fromConvex.title || 'Event',
    date: fromConvex.date || 'TBA',
    time: fromConvex.time || '',
    location: fromConvex.location || fromConvex.venue || fromConvex.address || 'Venue',
    description: fromConvex.description || 'Join us for this event. Book your tickets now.',
    price: fromConvex.price ?? fromConvex.normal_ticket_price ?? 499,
    // Web Sync: Consistent flags
    featured: fromConvex.featured !== false,
    trending: fromConvex.trending !== false,
  };
}

export default function EventDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, addToRecentlyViewed } = useAuth();
  const { eventId, event: routeEvent } = route.params || {};
  const { data: convexEvents } = useSupabaseQuery('events', (q) => q.select('*').or('status.eq.Active,status.eq.published'), []);

  const event = useMemo(() => {
    if (routeEvent) return { ...routeEvent, id: routeEvent.id };
    return getEventById(eventId, convexEvents);
  }, [eventId, routeEvent, convexEvents]);

  const { data: access } = useSupabaseQuery('bookings', (q) => 
    event?.id && user?.id
      ? q.eq('event_id', event.id).eq('user_id', user.id).eq('status', 'Confirmed').maybeSingle()
      : q.eq('id', 'none'),
    [event?.id, user?.id]
  );

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
    
    const isSeating = (event.seating_enabled ?? event.seatingEnabled) !== false && 
                     Array.isArray(event.seat_categories || event.seatCategories) && 
                     (event.seat_categories || event.seatCategories).length > 0 && 
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
        
        {access ? (
          <TouchableOpacity 
            style={[styles.bookBtn, { backgroundColor: '#3b82f6' }]} 
            onPress={() => navigation.navigate('MeetingWaitingRoom', { eventId: String(event.id) })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.bookBtnText}>
                {event.meeting_status === 'live' ? 'Join Meeting Now' : 'Enter Waiting Room'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.bookBtn, event.meeting_status === 'expired' && styles.disabledBtn]} 
            onPress={handleBookNow}
            disabled={event.meeting_status === 'expired'}
          >
            <Text style={styles.bookBtnText}>
              {event.meeting_status === 'expired' ? 'Event Expired' : 'Book Now'}
            </Text>
          </TouchableOpacity>
        )}
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
  disabledBtn: { backgroundColor: '#94a3b8' },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
