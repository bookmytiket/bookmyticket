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
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';

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
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const { user } = useAuth();
  
  const [bookingForm, setBookingForm] = useState({
    name: user?.name || user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date: new Date().toISOString().split('T')[0],
    address: ""
  });

  const fullProfile = useQuery(api.vendors.getFullProfile, { organiserId: vendorId });
  const availability = useQuery(api.vendorCalendar.getAvailability, { vendorId: vendorId });
  const createBooking = useMutation(api.vendorBookings.create);

  const reviews = useQuery(api.vendorReviews.getVendorReviews, { 
    vendorId: fullProfile?.organiser?.userId || vendorId 
  }) || [];
  const submitReview = useMutation(api.vendorReviews.submitReview);

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
      await submitReview({
        vendorId: organiser.userId,
        userId: user.email || user.identifier,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: "" });
      Alert.alert("Thank You!", "Your reflection has been published.");
    } catch (err) {
      Alert.alert("Error", "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
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
        vendorId: organiser.userId,
        userId: user?.email || "mobile_user@example.com",
        serviceType: organiser.category || "Professional Service",
        bookingDate: bookingForm.date,
        totalAmount: selectedPackage.price,
        customerDetails: {
          name: bookingForm.name,
          phone: bookingForm.phone,
          email: bookingForm.email,
          address: bookingForm.address
        },
      });
      alert("Booking Request Sent Successfully!");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert("Failed to request booking.");
    } finally {
      setIsBooking(false);
    }
  };

  if (!fullProfile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  const { organiser, vendorProfile } = fullProfile;
  const portfolio = vendorProfile?.portfolio || [];
  const pricing = vendorProfile?.pricing || [];
  const coverImage = portfolio?.[0]?.url || 'https://images.unsplash.com/photo-1596704017254-9b1210630b65?w=800';

  return (
    <SafeAreaView style={styles.container}>
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
              <Text style={styles.artistName}>{organiser.name}</Text>
              <Text style={styles.artistCategory}>{vendorProfile?.category || organiser.category} Professional</Text>
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
              {vendorProfile?.bio || "Professional artist with years of experience in creating magical moments for events."}
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
                        const isBooked = availability?.confirmedBookings?.some(b => b.bookingDate === dateStr);
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
              {portfolio.length === 0 && <Text style={styles.emptyText}>No portfolio images available.</Text>}
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

          {/* New Contact & Event Details Form */}
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
          <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 100 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Customer Reflections</Text>
              <TouchableOpacity onPress={() => setIsReviewModalOpen(true)}>
                <Text style={{ color: Colors.secondary, fontWeight: '800', fontSize: 12 }}>Rate & Review</Text>
              </TouchableOpacity>
            </View>

            {reviews.length > 0 ? (
              reviews.map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatarMini}><Text style={styles.avatarText}>{r.userId[0].toUpperCase()}</Text></View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewerName}>{r.userId}</Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons key={s} name="star" size={10} color={s <= r.rating ? "#f59e0b" : "#e2e8f0"} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.reviewText}>{r.comment}</Text>
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

      {/* Review Modal */}
      <Modal visible={isReviewModalOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsReviewModalOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setIsReviewModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
               <View style={{ flexDirection: 'row', gap: 12 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setReviewForm({ ...reviewForm, rating: s })}>
                      <Ionicons 
                        name={s <= reviewForm.rating ? "star" : "star-outline"} 
                        size={36} 
                        color={s <= reviewForm.rating ? "#f59e0b" : "#e2e8f0"} 
                      />
                    </TouchableOpacity>
                  ))}
               </View>
               <Text style={{ marginTop: 12, fontSize: 13, fontWeight: '900', color: Colors.secondary, textTransform: 'uppercase' }}>
                  {['Poor', 'Fair', 'Good', 'Excellent', 'Masterpiece'][reviewForm.rating - 1]}
               </Text>
            </View>

            <TextInput 
              style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="What was your experience with this artist?"
              placeholderTextColor="#94a3b8"
              multiline
              value={reviewForm.comment}
              onChangeText={(v) => setReviewForm({ ...reviewForm, comment: v })}
            />

            <TouchableOpacity 
              style={[styles.bookBtn, !reviewForm.comment.trim() && styles.bookBtnDisabled, { marginTop: 24, alignSelf: 'stretch' }]}
              onPress={handleReviewSubmit}
            >
              {isSubmittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Submit Reflection</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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

      {/* Dropdown Modal */}
      <Modal visible={isDropdownOpen} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Packages</Text>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={pricing}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.packageItem}
                  onPress={() => {
                    setSelectedPackage(item);
                    setIsDropdownOpen(false);
                  }}
                >
                  <View>
                    <Text style={styles.packageName}>{item.name || item.label}</Text>
                    <Text style={styles.packageType}>{item.type || 'Standard Package'}</Text>
                  </View>
                  <Text style={styles.packagePrice}>₹{item.price}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 260, position: 'relative' },
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
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  featureText: { fontSize: 12, fontWeight: '700', color: Colors.black },

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
  packageItem: { py: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  packageName: { fontSize: 16, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
  packageType: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginTop: 2 },
  packagePrice: { fontSize: 18, fontWeight: '900', color: Colors.black },
  modalDivider: { height: 1, backgroundColor: '#f1f5f9' },
  
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
  reviewCard: { backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, borderSize: 1, borderColor: '#f1f5f9' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarMini: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '900', color: Colors.secondary },
  reviewerName: { fontSize: 13, fontWeight: '800', color: Colors.black },
  reviewDate: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  reviewText: { fontSize: 13, color: '#475569', lineHeight: 18, fontStyle: 'italic' },
  emptyReviews: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#f8fafc', borderRadius: 24, borderSize: 2, borderStyle: 'dashed', borderColor: '#f1f5f9' },
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
});
