import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Theme';
import { ScrollView, Modal, Image, Alert } from 'react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [selectedTicket, setSelectedTicket] = React.useState(null);

  const eventBookingsList = useQuery(api.bookings.getByUser, user?.identifier ? { userId: user.identifier } : "skip");
  const vendorBookingsList = useQuery(api.vendorBookings.getByUser, user?.identifier ? { userId: user.identifier } : "skip");

  const userBookings = [
    ...(eventBookingsList || []),
    ...(vendorBookingsList || [])
  ].sort((a, b) => {
    const dateA = a.bookingDate || a._creationTime;
    const dateB = b.bookingDate || b._creationTime;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Sign in to manage your account</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <LinearGradient
              colors={Colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusDisplay = (booking) => {
    if (booking.status === 'Cancelled') return { text: 'Cancelled', color: '#991b1b', bg: '#fee2e2' };
    if (booking.scanned || booking.status === 'Scanned') return { text: 'Checked In', color: '#166534', bg: '#dcfce7' };
    if (booking.status === 'Confirmed') return { text: 'Confirmed', color: '#166534', bg: '#dcfce7' };
    return { text: 'Pending', color: '#92400e', bg: '#fef3c7' };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <LinearGradient
          colors={Colors.gradient}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{(user?.name || 'U')[0]}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.role}>{user?.role || 'user'}</Text>

        {(user?.role === 'admin' || user?.role === 'organiser' || user?.role === 'staff') && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Ionicons name="grid-outline" size={20} color={Colors.secondary} />
            <Text style={styles.actionText}>Go to Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Action bounds for normal users to become partners */}
        {(!user?.role || user?.role === 'user') && (
          <>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => navigation.navigate('BecomeOrganiser')}
            >
               <Ionicons name="megaphone-outline" size={20} color={Colors.secondary} />
               <Text style={styles.actionText}>Become an Organiser</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => navigation.navigate('BecomePartner')}
            >
               <Ionicons name="business-outline" size={20} color={Colors.secondary} />
               <Text style={styles.actionText}>Become a Partner</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Bookings</Text>
        {userBookings.length > 0 ? (
          userBookings.map((booking, index) => {
            const status = getStatusDisplay(booking);
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.bookingCard}
                onPress={() => booking.status !== 'Cancelled' && setSelectedTicket(booking)}
              >
                <View style={styles.bookingIcon}>
                  <Ionicons 
                    name={booking.status === 'Cancelled' ? "close-circle" : (booking.scanned ? "checkmark-circle" : (booking.isVendorBooking ? "sparkles" : "ticket"))} 
                    size={24} 
                    color={booking.status === 'Cancelled' ? Colors.error : (booking.isVendorBooking ? '#ec4899' : Colors.secondary)} 
                  />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.eventName}>{booking.eventName}</Text>
                  <Text style={styles.bookingDetails}>
                    {booking.isVendorBooking ? 'Service Session' : `${booking.ticketCount} Seats`} • ₹{booking.totalPrice}
                  </Text>
                  
                  {(booking.meetingUrl || booking.eventType === "Online" || booking.virtual) && (
                    <TouchableOpacity 
                      style={styles.inlineJoinBtn} 
                      onPress={() => {
                        const url = booking.meetingUrl;
                        // Identify if the URL is exclusively for organisers/admin/vendors
                        const isInternal = url?.toLowerCase().includes("organiser") || url?.toLowerCase().includes("admin") || url?.toLowerCase().includes("vendor");
                        
                        if (!url || isInternal) {
                          Alert.alert("Notice", "Meeting has not started yet or the link is still being prepared. Please check back in a few minutes.");
                          return;
                        }
                        
                        const baseUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL || 'https://bookmyticket.vercel.app';
                        const target = (url.startsWith("http://") || url.startsWith("https://")) ? url : `${baseUrl}/${url}`;
                        Linking.openURL(target).catch(err => console.error("Couldn't load meeting page", err));
                      }}
                    >
                      <LinearGradient
                        colors={['#059669', '#10b981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.inlineJoinGradient}
                      >
                        <Ionicons name="videocam" size={14} color="#fff" />
                        <Text style={styles.inlineJoinText}>Join Now</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        )}
      </View>

      {/* Ticket Modal */}
      <Modal
        visible={!!selectedTicket}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Digital Ticket</Text>
              <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              {selectedTicket && (
                <View style={{ opacity: selectedTicket.scanned ? 0.3 : 1 }}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedTicket._id}` }}
                    style={styles.qrCode}
                  />
                  {selectedTicket.scanned && (
                    <View style={styles.scannedOverlay}>
                      <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                      <Text style={styles.scannedText}>SCANNED</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <Text style={styles.modalEventName}>{selectedTicket?.eventName}</Text>
            <Text style={styles.modalBookingId}>Booking ID: {selectedTicket?._id}</Text>
            
            {(selectedTicket?.meetingUrl || selectedTicket?.eventType === "Online" || selectedTicket?.virtual) && (
              <TouchableOpacity 
                style={[styles.joinBtn, { marginTop: 20 }]} 
                onPress={() => {
                  const url = selectedTicket.meetingUrl;
                  const isInternal = url?.toLowerCase().includes("organiser") || url?.toLowerCase().includes("admin") || url?.toLowerCase().includes("vendor");
                  
                  if (!url || isInternal) {
                    Alert.alert("Notice", "Meeting has not started yet or the link is still being prepared. Please check back in a few minutes.");
                    return;
                  }
                  
                  const baseUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL || 'https://bookmyticket.vercel.app';
                  const target = (url.startsWith("http://") || url.startsWith("https://")) ? url : `${baseUrl}/${url}`;
                  Linking.openURL(target).catch(err => console.error("Couldn't load meeting page", err));
                }}
              >
                <LinearGradient
                  colors={['#059669', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Ionicons name="videocam" size={20} color="#fff" />
                  <Text style={styles.joinBtnText}>Join Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  role: { fontSize: 14, color: Colors.textMuted, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    width: '100%',
    justifyContent: 'center',
  },
  logoutText: { color: Colors.error, fontSize: 14, fontWeight: '800' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: { color: Colors.secondary, fontSize: 14, fontWeight: '800' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bookingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bookingInfo: { flex: 1 },
  eventName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  bookingDetails: { fontSize: 13, color: Colors.textMuted },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  emptyText: { marginTop: 12, fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  qrContainer: {
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: { width: 200, height: 200 },
  scannedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 2,
    marginTop: 10,
  },
  modalEventName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  modalBookingId: { fontSize: 14, color: Colors.textMuted, marginBottom: 24 },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 16,
  },
  modalInfoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  modalInfoValue: { fontSize: 14, fontWeight: '800', color: Colors.text },
  title: { fontSize: 18, color: Colors.textMuted, marginBottom: 28, textAlign: 'center', fontWeight: '600' },
  btn: { padding: 18, borderRadius: 14, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  joinBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  inlineJoinBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inlineJoinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  inlineJoinText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});

