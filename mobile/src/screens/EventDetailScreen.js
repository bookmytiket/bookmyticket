import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import BrandingHeader from '../components/BrandingHeader';

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

  // Feature Parity: Fetch Event Reviews
  const { data: reviewsRaw = [], refresh: refreshReviews } = useSupabaseQuery('event_reviews', (q) => 
    event?.id 
      ? q.select('*')
         .eq('event_id', event.id)
         .order('created_at', { ascending: false }) 
      : q.select('*').limit(0),
    [event?.id]
  );

  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewImage, setReviewImage] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { mutate: submitReview } = useSupabaseMutation((s, data) => s.from('event_reviews').insert(data));

  React.useEffect(() => {
    if (!reviewsRaw || reviewsRaw.length === 0) {
      setReviews([]);
      return;
    }

    const fetchProfiles = async () => {
      const userIds = [...new Set(reviewsRaw.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      if (profilesData) {
        const merged = reviewsRaw.map(r => ({
          ...r,
          profiles: profilesData.find(p => p.id === r.user_id)
        }));
        setReviews(merged);
      } else {
        setReviews(reviewsRaw);
      }
    };

    fetchProfiles();
  }, [reviewsRaw]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload review images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setReviewImage(result.assets[0].uri);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      navigation.navigate('SignIn');
      return;
    }
    if (!reviewForm.comment.trim()) return;

    setIsSubmittingReview(true);
    try {
      let uploadedUrl = null;
      if (reviewImage) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append('file', {
          uri: reviewImage,
          name: fileName,
          type: 'image/jpeg',
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(fileName, formData);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(fileName);
        uploadedUrl = publicUrl;
      }

      await submitReview({
        event_id: event.id,
        user_id: user.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        image_url: uploadedUrl
      });

      setReviewForm({ rating: 5, comment: '' });
      setReviewImage(null);
      refreshReviews();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to post review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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

        {/* Feature Parity: Review Section */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          
          {/* Review Submission */}
          <View style={styles.reviewForm}>
            <Text style={styles.formLabel}>How was your experience?</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setReviewForm({ ...reviewForm, rating: s })}>
                  <Ionicons 
                    name={s <= reviewForm.rating ? "star" : "star-outline"} 
                    size={28} 
                    color={s <= reviewForm.rating ? "#fbbf24" : "#cbd5e1"} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review here..."
              multiline
              value={reviewForm.comment}
              onChangeText={(txt) => setReviewForm({ ...reviewForm, comment: txt })}
            />
            
            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={20} color="#64748b" />
                <Text style={styles.imagePickerText}>{reviewImage ? "Image Added" : "Add Image"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitReviewBtn, (!reviewForm.comment.trim() || isSubmittingReview) && styles.disabledBtn]} 
                onPress={handleReviewSubmit}
                disabled={!reviewForm.comment.trim() || isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitReviewText}>Post Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Review List */}
          <View style={styles.reviewList}>
            {reviews.map((rev, idx) => (
              <View key={rev.id || idx} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.userBadge}>
                    <Text style={styles.userInitial}>{(rev.profiles?.full_name || rev.profiles?.username || 'U')[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.userName}>{rev.profiles?.full_name || rev.profiles?.username || 'Anonymous'}</Text>
                    <View style={styles.miniRating}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons 
                          key={s} 
                          name={s <= rev.rating ? "star" : "star-outline"} 
                          size={12} 
                          color={s <= rev.rating ? "#fbbf24" : "#cbd5e1"} 
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.reviewText}>{rev.comment}</Text>
                {rev.image_url && (
                  <Image source={{ uri: rev.image_url }} style={styles.reviewImage} resizeMode="cover" />
                )}
              </View>
            ))}
            {reviews.length === 0 && (
              <Text style={styles.emptyReviews}>No reviews yet. Be the first to review!</Text>
            )}
          </View>
        </View>

        <BrandingHeader style={{ marginTop: 24, marginBottom: 48 }} />
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
  reviewSection: { marginTop: 32, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  reviewForm: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#4b5563', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reviewInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top', fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#f1f5f9' },
  reviewActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
  imagePickerText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  submitReviewBtn: { backgroundColor: '#F43F5E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  submitReviewText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  reviewList: { gap: 16 },
  reviewCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center' },
  userInitial: { fontSize: 14, fontWeight: '800', color: '#F43F5E' },
  reviewInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  miniRating: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 12, color: '#94a3b8' },
  reviewText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  reviewImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 12 },
  emptyReviews: { textAlign: 'center', color: '#94a3b8', fontSize: 14, fontStyle: 'italic', paddingVertical: 20 },
});
