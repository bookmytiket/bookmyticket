import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vendorId } = route.params || {};

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date()); 
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const { user } = useAuth();
  
  const [bookingForm, setBookingForm] = useState({
    name: user?.name || user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date: new Date().toISOString().split('T')[0],
    address: ""
  });

  // Migrated to Supabase: Fetch full profile
  const { data: fullProfile, loading: loadingProfile } = useSupabaseQuery('service_providers', (q) => 
    q.select('*, profiles!organiser_id(*)').eq('id', vendorId).single(),
    [vendorId]
  );

  // Migrated to Supabase: Fetch availability
  const { data: availabilityData } = useSupabaseQuery('vendor_bookings', (q) => 
    vendorId ? q.select('booking_date').eq('vendor_id', vendorId).in('status', ['Confirmed', 'Scanned']) : q.select('*').limit(0),
    [vendorId]
  );

  // Migrated to Supabase: Fetch service tiers (Packages)
  const { data: packages = [] } = useSupabaseQuery('artistPackages', (q) => 
    vendorId ? q.select('*').eq('vendor_id', vendorId) : q.select('*').limit(0),
    [vendorId]
  );

  const availability = {
    blockedDates: fullProfile?.blocked_dates || [],
    confirmedBookings: availabilityData || []
  };

  // Migrated to Supabase: Create booking
  const { mutate: createBooking } = useSupabaseMutation((s, data) => s.from('vendor_bookings').insert(data));

  // Migrated to Supabase: Fetch reviews
  const { data: reviewsRaw = [], refresh: refreshReviews } = useSupabaseQuery('vendor_reviews', (q) => 
    vendorId 
      ? q.select('*')
         .eq('vendor_id', vendorId)
         .order('created_at', { ascending: false }) 
      : q.select('*').limit(0),
    [vendorId]
  );

  const [reviews, setReviews] = useState([]);

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

  // Migrated to Supabase: Submit review
  const { mutate: submitReview } = useSupabaseMutation((s, data) => s.from('vendor_reviews').insert(data));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload review images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to leave a review.");
      return;
    }
    if (!reviewForm.comment.trim()) {
      Alert.alert("Required", "Please share a brief comment about your experience.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      let uploadedUrl = null;

      if (selectedImage) {
        const fileExt = selectedImage.uri.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Use base64-arraybuffer to decode the base64 string from expo-image-picker
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(fileName, decode(selectedImage.base64), {
            contentType: `image/${fileExt}`
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(fileName);
        
        uploadedUrl = publicUrl;
      }

      await submitReview({
        vendor_id: vendorId,
        user_id: user.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        image_url: uploadedUrl
      });
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: "" });
      setSelectedImage(null);
      Alert.alert("Thank You!", "Your reflection has been published.");
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Failed to submit review. " + err.message);
    } finally {
      setIsSubmittingReview(false);
      refreshReviews();
    }
  };

  const handleBooking = async () => {
    if (!selectedPackage) {
      alert("Please select a package first.");
      return;
    }
    
    if (!bookingForm.name || !bookingForm.email || !bookingForm.phone || !bookingForm.address) {
      alert("Please fill in all personal and event details.");
      return;
    }

    setIsBooking(true);
    try {
      await createBooking({
        vendor_id: vendorId,
        user_id: user?.id || null,
        service_type: fullProfile?.category || "Professional Service",
        booking_date: bookingForm.date,
        total_amount: selectedPackage.price,
        customer_details: {
          name: bookingForm.name,
          phone: bookingForm.phone,
          email: bookingForm.email,
          address: bookingForm.address
        },
        status: 'Pending'
      });

      // Trigger Notification (Fire and Forget)
      if (bookingForm.phone && process.env.EXPO_PUBLIC_API_BASE_URL) {
        try {
          fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/comm/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: bookingForm.phone,
              type: 'BOOKING',
              data: {
                eventName: fullProfile?.category || "Professional Service",
                date: bookingForm.date,
                bookingId: "Request Sent"
              }
            })
          }).catch(e => console.warn("Background notification failed:", e.message));
        } catch (e) {
          console.warn("Notification system unavailable");
        }
      }

      alert("Booking Request Sent Successfully!");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert("Failed to request booking.");
    } finally {
      setIsBooking(false);
    }
  };

  if (loadingProfile || !fullProfile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  const { profiles: organiser } = fullProfile;
  const portfolio = Array.isArray(fullProfile?.portfolio) ? fullProfile.portfolio : [];
  const pricing = (packages || []).length > 0 ? packages.map(pkg => ({
    id: pkg.id,
    name: pkg.title || pkg.name,
    price: pkg.price,
    description: pkg.description
  })) : (Array.isArray(fullProfile?.pricing) ? fullProfile.pricing : []);
  const coverImage = (portfolio || [])?.[0]?.url || fullProfile?.image_url || 'https://images.unsplash.com/photo-1596704017254-9b1210630b65?w=800';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.hero}>
          <Image source={{ uri: coverImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Artist Info */}
          <View style={styles.artistHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.artistName}>{organiser?.name || "Professional Artist"}</Text>
              <Text style={styles.artistCategory}>{fullProfile?.category || organiser?.category} Professional</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#fff" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
              <Text style={styles.statText}>Verified Artist</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="location" size={18} color={Colors.secondary} />
              <Text style={styles.statText}>PAN India Service</Text>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Artist</Text>
            <Text style={styles.bioText}>
              {fullProfile?.bio || "Professional artist with years of experience in creating magical moments for events."}
            </Text>
          </View>

          {/* Calendar Logic Helpers */}
          {(() => {
            const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
            const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            
            const daysInMonth = getDaysInMonth(calendarDate.getMonth(), calendarDate.getFullYear());
            const firstDay = getFirstDayOfMonth(calendarDate.getMonth(), calendarDate.getFullYear());
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const blanks = Array.from({ length: firstDay }, (_, i) => i);

            return (
              <Modal visible={isCalendarOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                    <View style={styles.modalHeader}>
                      <View>
                        <Text style={styles.modalTitle}>{months[calendarDate.getMonth()]} {calendarDate.getFullYear()}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success }} />
                          <Text style={[styles.subCell, { marginTop: 0 }]}>Real-time Availability</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))}>
                          <Ionicons name="chevron-back" size={24} color={Colors.black} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))}>
                          <Ionicons name="chevron-forward" size={24} color={Colors.black} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsCalendarOpen(false)} style={{ marginLeft: 8 }}>
                          <Ionicons name="close" size={24} color={Colors.black} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.calendarGrid}>
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                        <Text key={`weekday-${d}-${idx}`} style={styles.weekdayText}>{d}</Text>
                      ))}
                      {blanks.map(b => <View key={`blank-${b}`} style={styles.dayBox} />)}
                      {days.map(d => {
                        const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSelected = bookingForm.date === dateStr;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const isBlocked = availability?.blockedDates?.includes(dateStr);
                        const isBooked = availability?.confirmedBookings?.some(b => b.booking_date === dateStr);
                        const isPast = new Date(dateStr) < new Date(new Date().setHours(0,0,0,0));
                        const isUnavailable = isBlocked || isBooked || isPast;

                        return (
                          <TouchableOpacity 
                            key={`date-${d}`} 
                            disabled={isUnavailable}
                            style={[
                              styles.dayBox, 
                              isToday && styles.todayDay,
                              isSelected && styles.selectedDay,
                              isUnavailable && styles.unavailableDay
                            ]}
                            onPress={() => {
                              setBookingForm({ ...bookingForm, date: dateStr });
                              setIsCalendarOpen(false);
                            }}
                          >
                            <Text style={[
                              styles.dayText, 
                              isToday && styles.todayDayText,
                              isSelected && styles.selectedDayText,
                              isUnavailable && styles.unavailableDayText
                            ]}>{d}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                        <Text style={styles.legendText}>Selected</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' }]} />
                        <Text style={styles.legendText}>Available</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#f1f5f9', opacity: 0.3 }]} />
                        <Text style={styles.legendText}>Unavailable</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>
            );
          })()}

          {/* Portfolio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
              {portfolio.map((item, idx) => (
                <View key={idx} style={styles.portfolioItem}>
                  <Image source={{ uri: item.url }} style={styles.portfolioImage} />
                </View>
              ))}
              {(portfolio || []).length === 0 && <Text style={styles.emptyText}>No portfolio images available.</Text>}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Package</Text>
            
            <TouchableOpacity 
              style={[styles.dropdown, selectedPackage && styles.dropdownActive]}
              onPress={() => setIsDropdownOpen(true)}
            >
              <View>
                <Text style={styles.dropdownLabel}>
                  {selectedPackage ? (selectedPackage.name || selectedPackage.label) : "Select a Service Tier"}
                </Text>
                {selectedPackage && <Text style={styles.dropdownSub}>{selectedPackage.type || 'Package Details'}</Text>}
              </View>
              <View style={styles.priceRow}>
                {selectedPackage && <Text style={styles.dropdownPrice}>₹{selectedPackage.price}</Text>}
                <Ionicons name="chevron-down" size={20} color={Colors.black} />
              </View>
            </TouchableOpacity>

            {selectedPackage && (
               <View style={styles.detailsBox}>
                 <Text style={styles.detailsHeader}>Included in {selectedPackage.name || selectedPackage.label}:</Text>
                 {(selectedPackage.description || "").length > 0 && (
                   <Text style={styles.detailsDesc}>{selectedPackage.description}</Text>
                 )}
               </View>
            )}
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Contact Information</Text>
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput 
                    style={styles.input}
                    value={bookingForm.name}
                    onChangeText={(v) => setBookingForm({ ...bookingForm, name: v })}
                    placeholder="Enter your name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput 
                    style={styles.input}
                    value={bookingForm.phone}
                    onChangeText={(v) => setBookingForm({ ...bookingForm, phone: v })}
                    placeholder="Mobile number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  style={styles.input}
                  value={bookingForm.email}
                  onChangeText={(v) => setBookingForm({ ...bookingForm, email: v })}
                  placeholder="name@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <View style={[styles.section, { paddingBottom: 60 }]}>
            <Text style={styles.sectionTitle}>Event Venue & Date</Text>
            <View style={styles.inputGroup}>
              <View>
                <Text style={styles.inputLabel}>Event Date</Text>
                <TouchableOpacity 
                   style={[styles.input, { justifyContent: 'center' }]} 
                   onPress={() => setIsCalendarOpen(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.black }}>
                      {bookingForm.date || "Select Date"}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Event Address</Text>
                <TextInput 
                  style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={bookingForm.address}
                  onChangeText={(v) => setBookingForm({ ...bookingForm, address: v })}
                  placeholder="Complete address of the event venue"
                  placeholderTextColor="#94a3b8"
                  multiline
                />
              </View>
            </View>
          </View>

          {/* Reviews Section */}
          <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 60 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
              <TouchableOpacity onPress={() => setIsReviewModalOpen(true)}>
                <Text style={{ color: Colors.secondary, fontWeight: '800', fontSize: 12 }}>Rate & Review</Text>
              </TouchableOpacity>
            </View>

            {(reviews || []).length > 0 ? (
              (reviews || []).map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarText}>
                        {(r.profiles?.full_name || r.profiles?.username || 'G')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewerName}>
                        {r.profiles?.full_name || r.profiles?.username || 'Guest'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons key={s} name="star" size={10} color={s <= r.rating ? "#f59e0b" : "#e2e8f0"} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.reviewText}>{r.comment}</Text>
                  
                  {r.image_url && (
                    <Image 
                      source={{ uri: r.image_url }} 
                      style={styles.reviewImage} 
                      resizeMode="cover"
                    />
                  )}

                  {r.response && (
                    <View style={styles.artistResponse}>
                      <Text style={styles.responseLabel}>Artist's Thought:</Text>
                      <Text style={styles.responseText}>{r.response}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Ionicons name="star-outline" size={32} color="#e2e8f0" />
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 8 }}>Be the first to leave a review!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Booking Action Bar */}
      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>₹ {selectedPackage?.price || 0}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, (!selectedPackage || !bookingForm.address) && styles.bookBtnDisabled]}
          disabled={!selectedPackage || isBooking}
          onPress={handleBooking}
        >
          {isBooking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Book Now</Text>}
        </TouchableOpacity>
      </View>

      {/* Package Selection Modal */}
      <Modal visible={isDropdownOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsDropdownOpen(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Service Tier</Text>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(pricing || []).map((pkg, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedPackage(pkg);
                    setIsDropdownOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionName}>{pkg.name}</Text>
                    {pkg.description && <Text style={styles.optionDesc} numberOfLines={2}>{pkg.description}</Text>}
                  </View>
                  <Text style={styles.optionPrice}>₹{pkg.price}</Text>
                </TouchableOpacity>
              ))}
              {(pricing || []).length === 0 && <Text style={styles.emptyText}>No packages available for this artist.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Review Submission Modal */}
      <Modal visible={isReviewModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsReviewModalOpen(false)} />
          <View style={[styles.modalContent, { height: 'auto' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Reflection</Text>
              <TouchableOpacity onPress={() => setIsReviewModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setReviewForm({ ...reviewForm, rating: s })}>
                    <Ionicons 
                      name={s <= reviewForm.rating ? "star" : "star-outline"} 
                      size={32} 
                      color={s <= reviewForm.rating ? "#fbbf24" : "#e2e8f0"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Describe your experience..."
              value={reviewForm.comment}
              onChangeText={(v) => setReviewForm({ ...reviewForm, comment: v })}
              multiline
            />

            <TouchableOpacity 
              style={styles.imagePickerBtn}
              onPress={pickImage}
            >
              {selectedImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                  <View style={styles.changeOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.changeText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons name="image-outline" size={24} color={Colors.secondary} />
                  <Text style={styles.pickerText}>Add a Photo (Optional)</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bookBtn, { marginTop: 24, width: '100%', alignItems: 'center' }]}
              onPress={handleReviewSubmit}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Post Reflection</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  backButton: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  content: { marginTop: -30, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  artistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  artistName: { fontSize: 28, fontWeight: '900', color: Colors.black, letterSpacing: -0.5 },
  artistCategory: { fontSize: 13, fontWeight: '700', color: Colors.secondary, textTransform: 'uppercase', marginTop: 4 },
  ratingBadge: { backgroundColor: Colors.black, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  divider: { width: 1, height: 16, backgroundColor: '#e2e8f0' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.black, marginBottom: 12, textTransform: 'uppercase', letterSpacing: -0.3 },
  bioText: { fontSize: 14, color: '#64748b', lineHeight: 22 },
  portfolioScroll: { gap: 12 },
  portfolioItem: { width: 140, height: 190, borderRadius: 16, overflow: 'hidden', marginRight: 12 },
  portfolioImage: { width: '100%', height: '100%' },
  emptyText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  
  dropdown: {
    height: 64,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  dropdownActive: { borderColor: Colors.black, backgroundColor: '#fff' },
  dropdownLabel: { fontSize: 15, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
  dropdownSub: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownPrice: { fontSize: 18, fontWeight: '900', color: Colors.black },
  
  detailsBox: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#fafafa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  detailsHeader: { fontSize: 13, fontWeight: '900', color: Colors.black, marginBottom: 10, textTransform: 'uppercase' },
  detailsDesc: { fontSize: 12, color: Colors.textMuted, marginBottom: 12, lineHeight: 18 },

  bookingBar: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  totalValue: { fontSize: 24, fontWeight: '900', color: Colors.black },
  bookBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
  
  inputGroup: { marginTop: 8 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 },
  input: { 
    height: 52, 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    fontSize: 14, 
    fontWeight: '700', 
    color: Colors.black, 
    borderWidth: 1.5, 
    borderColor: '#f1f5f9' 
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  weekdayText: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '900', color: '#94a3b8', marginBottom: 12 },
  dayBox: { width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  dayText: { fontSize: 14, fontWeight: '700', color: Colors.black },
  selectedDay: { backgroundColor: Colors.secondary },
  selectedDayText: { color: '#fff' },
  reviewCard: { backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarMini: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '900', color: Colors.secondary },
  reviewerName: { fontSize: 13, fontWeight: '800', color: Colors.black },
  reviewDate: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  reviewText: { fontSize: 13, color: '#475569', lineHeight: 18, fontStyle: 'italic' },
  emptyReviews: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#f8fafc', borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#f1f5f9' },
  artistResponse: { marginTop: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: Colors.secondary },
  responseLabel: { fontSize: 10, fontWeight: '900', color: Colors.secondary, marginBottom: 4, textTransform: 'uppercase' },
  responseText: { fontSize: 12, color: '#1e293b', fontWeight: '600' },
  unavailableDay: { opacity: 0.15 },
  unavailableDayText: { color: '#cbd5e1', fontWeight: '400' },
  todayDay: { borderWidth: 1.5, borderColor: Colors.secondary },
  todayDayText: { color: Colors.secondary, fontWeight: '900' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  modalOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  optionName: { fontSize: 14, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
  optionDesc: { fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 16 },
  optionPrice: { fontSize: 16, fontWeight: '900', color: Colors.secondary },
  reviewImage: { width: '100%', height: 140, borderRadius: 12, marginTop: 12 },
  imagePickerBtn: { marginTop: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#f1f5f9', borderStyle: 'dashed' },
  pickerPlaceholder: { height: 80, alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickerText: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  previewContainer: { height: 160, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  changeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', gap: 4 },
  changeText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
});
