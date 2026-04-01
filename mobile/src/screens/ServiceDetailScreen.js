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
  SafeAreaView
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vendorId } = route.params || {};

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const fullProfile = useQuery(api.vendors.getFullProfile, { organiserId: vendorId });
  const createBooking = useMutation(api.vendorBookings.create);

  const handleBooking = async () => {
    if (!selectedPackage) {
      alert("Please select a package first.");
      return;
    }
    
    setIsBooking(true);
    try {
      // Mock booking for mobile until full form is implemented
      await createBooking({
        vendorId: organiser.userId,
        userId: "mobile_user@example.com", // Fallback for demo
        serviceType: organiser.category || "Professional Service",
        bookingDate: new Date().toISOString().split('T')[0],
        totalAmount: selectedPackage.price,
        customerDetails: {
          name: "Mobile User",
          phone: "9100000000",
          email: "mobile_user@example.com",
          address: "Mobile App Booking"
        },
      });
      alert("Booking Request Sent!");
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

          {/* Package Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Package</Text>
            
            {/* Custom Dropdown Trigger */}
            <TouchableOpacity 
              style={[styles.dropdown, selectedPackage && styles.dropdownActive]}
              onPress={() => setIsDropdownOpen(true)}
            >
              <View>
                <Text style={styles.dropdownLabel}>
                  {selectedPackage ? selectedPackage.name : "Select a Service Tier"}
                </Text>
                {selectedPackage && <Text style={styles.dropdownSub}>{selectedPackage.type}</Text>}
              </View>
              <View style={styles.priceRow}>
                {selectedPackage && <Text style={styles.dropdownPrice}>₹{selectedPackage.price}</Text>}
                <Ionicons name="chevron-down" size={20} color={Colors.black} />
              </View>
            </TouchableOpacity>

            {/* Package Details Overlay (if selected) */}
            {selectedPackage && (
               <View style={styles.detailsBox}>
                 <Text style={styles.detailsHeader}>Included in {selectedPackage.name}:</Text>
                 {selectedPackage.description && (
                   <Text style={styles.detailsDesc}>{selectedPackage.description}</Text>
                 )}
                 {(selectedPackage.features || []).slice(0, 5).map((f, i) => (
                   <View key={i} style={styles.featureRow}>
                     <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                     <Text style={styles.featureText}>{f}</Text>
                   </View>
                 ))}
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
          style={[styles.bookBtn, !selectedPackage && styles.bookBtnDisabled]}
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
                    <Text style={styles.packageName}>{item.name}</Text>
                    <Text style={styles.packageType}>{item.type}</Text>
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
});
