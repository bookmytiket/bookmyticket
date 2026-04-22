import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView, Modal, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Theme';
import BrandingHeader from '../components/BrandingHeader';

import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [selectedTicket, setSelectedTicket] = React.useState(null);
  const [downloading, setDownloading] = React.useState(false);
  const ticketViewRef = React.useRef();

  const handleDownloadTicket = async () => {
    if (!ticketViewRef.current) return;
    try {
      setDownloading(true);
      const uri = await captureRef(ticketViewRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save your Ticket',
          UTI: 'public.jpeg',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (err) {
      console.error('Capture error:', err);
      Alert.alert('Error', 'Failed to save ticket image');
    } finally {
      setDownloading(false);
    }
  };

  // Migrated to Supabase
  const { data: eventBookingsList } = useSupabaseQuery('bookings', (q) => 
    q.select('*, events(*)').eq('user_id', user?.id), 
    [user?.id]
  );
  
  const { data: vendorBookingsList } = useSupabaseQuery('vendor_bookings', (q) => 
    q.select('*').eq('user_id', user?.id), 
    [user?.id]
  );

  const { data: turfBookingsList } = useSupabaseQuery('turf_bookings', (q) => 
    q.select('*, turfs(*)').eq('user_id', user?.id), 
    [user?.id]
  );

  const { data: brandingArr = [] } = useSupabaseQuery('site_branding', (q) => q, [], { realtime: false });
  const branding = (brandingArr && brandingArr[0]) || {
    powered_by_logo_url: "https://www.bookmyticket.net/logo.png",
    powered_by_link: "https://www.bookmyticket.net"
  };

  const userBookings = [
    ...(eventBookingsList || []).map(b => ({ 
      ...b, 
      bookingType: 'event', 
      eventName: b.events?.title || 'Event',
      date: b.events?.date || b.date,
      totalPrice: b.total_price || b.totalPrice || 0
    })),
    ...(vendorBookingsList || []).map(b => ({ 
      ...b, 
      bookingType: 'vendor', 
      eventName: b.service_type || 'Service',
      date: b.booking_date,
      totalPrice: b.total_amount || b.total_price || 0 
    })),
    ...(turfBookingsList || []).map(b => ({ 
      ...b, 
      bookingType: 'turf', 
      eventName: b.turfs?.name || 'Turf', 
      ticketCount: b.participant_count || 1,
      date: b.date || b.slot_time,
      totalPrice: b.totalPrice || b.amount || 0
    })),
  ].sort((a, b) => {
    const dateA = a.created_at;
    const dateB = b.created_at;
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
        {user?.username && <Text style={{ color: Colors.secondary, fontWeight: '700', marginBottom: 4 }}>@{user.username}</Text>}
        <Text style={styles.role}>{user?.role || 'public'}</Text>

        {(user?.role === 'admin' || user?.role === 'staff' || user?.role === 'vendor' || user?.role === 'organiser') && (
          <>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => navigation.navigate('Management')}
            >
              <Ionicons name="grid-outline" size={20} color={Colors.secondary} />
              <Text style={styles.actionText}>Professional Hub</Text>
            </TouchableOpacity>

            {(user?.role === 'admin' || user?.role === 'organiser' || user?.role === 'vendor') && (
              <TouchableOpacity 
                style={[styles.actionBtn, { borderColor: Colors.primary }]} 
                onPress={() => Linking.openURL('https://bookmyticket.net/organiser')}
              >
                <Ionicons name="globe-outline" size={20} color={Colors.primary} />
                <Text style={[styles.actionText, { color: Colors.primary }]}>Go to Web Portal</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Action bounds for normal users to become partners */}
        {(!user?.role || user?.role === 'public') && (
          <>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => navigation.navigate('BecomePartner')}
            >
               <Ionicons name="business-outline" size={20} color={Colors.secondary} />
               <Text style={styles.actionText}>Become a Partner</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => navigation.navigate('PartnerStatus')}
            >
               <Ionicons name="document-text-outline" size={20} color="#f59e0b" />
               <Text style={[styles.actionText, { color: '#f59e0b' }]}>Check Partner Status</Text>
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
                    name={
                      booking.status === 'Cancelled' ? "close-circle" :
                      booking.scanned ? "checkmark-circle" :
                      booking.bookingType === 'turf' ? "football-outline" :
                      booking.bookingType === 'vendor' ? "sparkles" : "ticket"
                    } 
                    size={24} 
                    color={
                      booking.status === 'Cancelled' ? Colors.error :
                      booking.bookingType === 'turf' ? '#10b981' :
                      booking.bookingType === 'vendor' ? '#ec4899' : Colors.secondary
                    } 
                  />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.eventName}>{booking.eventName}</Text>
                  <Text style={styles.bookingDetails}>
                    {booking.bookingType === 'turf'
                      ? `${booking.slot_time || booking.date || 'Slot booked'}`
                      : booking.bookingType === 'vendor'
                      ? 'Service Session'
                      : `${booking.ticket_count || booking.ticketCount} Seat${(booking.ticket_count || booking.ticketCount) !== 1 ? 's' : ''}`
                    } • ₹{booking.total_price || booking.totalPrice || booking.amount || 0}
                  </Text>
                  
                  {(booking.meeting_url || booking.meetingUrl || booking.event_type === "Online" || (booking.events && booking.events.virtual)) && (
                    <TouchableOpacity 
                      style={styles.inlineJoinBtn} 
                      onPress={() => {
                        const url = booking.meeting_url || booking.meetingUrl;
                        // Identify if the URL is exclusively for organisers/admin/vendors
                        const isInternal = url?.toLowerCase().includes("organiser") || url?.toLowerCase().includes("admin") || url?.toLowerCase().includes("vendor");
                        
                        if (!url || isInternal) {
                          Alert.alert("Notice", "Meeting has not started yet or the link is still being prepared. Please check back in a few minutes.");
                          return;
                        }
                        
                        const target = (url.startsWith("http://") || url.startsWith("https://")) ? url : `https://bookmyticket.net/${url}`;
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
              <Text style={styles.modalTitle}>Your E-Ticket</Text>
              <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Ticket Card for Capture */}
            <View style={styles.ticketCardWrapper}>
              <View 
                ref={ticketViewRef}
                collapsable={false}
                style={styles.ticketCardInner}
              >
                <View style={styles.ticketTop}>
                  <Image 
                    source={{ uri: selectedTicket?.img || (selectedTicket?.events && selectedTicket?.events.img) || "https://images.unsplash.com/photo-1540575467063-178a50c2df87" }} 
                    style={styles.ticketImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.ticketImageOverlay}
                  />
                  <View style={styles.ticketBadgeContainer}>
                    <View style={styles.ticketBadge}>
                      <Text style={styles.ticketBadgeText}>ACTIVE</Text>
                    </View>
                  </View>
                  <View style={styles.ticketHeaderInfo}>
                    <Text style={styles.ticketEventTitle} numberOfLines={2}>{selectedTicket?.eventName}</Text>
                  </View>
                </View>

                <View style={styles.ticketBody}>
                   <View style={styles.ticketInfoRow}>
                      <View style={styles.ticketInfoCol}>
                         <Text style={styles.ticketLabel}>DATE</Text>
                         <Text style={styles.ticketValue}>{selectedTicket?.date || selectedTicket?.events?.date || 'TBA'}</Text>
                      </View>
                      <View style={styles.ticketInfoCol}>
                         <Text style={styles.ticketLabel}>TIME</Text>
                         <Text style={styles.ticketValue}>{selectedTicket?.slot_time || selectedTicket?.events?.time || 'TBA'}</Text>
                      </View>
                   </View>
                   
                   <View style={[styles.ticketInfoRow, { marginTop: 15 }]}>
                      <View style={styles.ticketInfoCol}>
                         <Text style={styles.ticketLabel}>VENUE</Text>
                         <Text style={styles.ticketValue} numberOfLines={1}>{selectedTicket?.location || selectedTicket?.events?.location || 'Venue'}</Text>
                      </View>
                   </View>

                   <View style={styles.ticketDivider}>
                      <View style={styles.dividerDotLeft} />
                      <View style={styles.dividerLine} />
                      <View style={styles.dividerDotRight} />
                   </View>

                   <View style={styles.ticketFooter}>
                      <View style={styles.rectangularQrCard}>
                        <View style={styles.qrInner}>
                          <Image
                            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedTicket?.id}` }}
                            style={styles.ticketQr}
                          />
                        </View>
                        <View style={styles.idInner}>
                           <Text style={styles.idLabel}>BOOKING ID</Text>
                           <Text style={styles.idValue}>#{selectedTicket?.id?.slice(-8).toUpperCase()}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.brandSide}>
                          <Image 
                             source={{ uri: branding.powered_by_logo_url }} 
                             style={{ height: 30, width: 90 }} 
                             resizeMode="contain" 
                          />
                         <Text style={styles.statusLabel}>{selectedTicket?.status?.toUpperCase()}</Text>
                      </View>
                   </View>
                </View>
                
                <View style={styles.ticketWatermark}>
                   <Text style={styles.watermarkText}>POWERED BY BOOKMYTICKET</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.downloadBtn} 
                onPress={handleDownloadTicket}
                disabled={downloading}
              >
                <LinearGradient
                  colors={Colors.gradient}
                  style={styles.downloadGradient}
                >
                  <Ionicons name={downloading ? "refresh" : "download"} size={20} color="#fff" />
                  <Text style={styles.downloadBtnText}>{downloading ? "PREPARING..." : "SAVE AS IMAGE"}</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {(selectedTicket?.meeting_url || selectedTicket?.meetingUrl || selectedTicket?.event_type === "Online" || (selectedTicket?.events && selectedTicket?.events.virtual)) && (
                <TouchableOpacity 
                  style={styles.secondaryJoinBtn} 
                  onPress={() => {
                    const url = selectedTicket.meeting_url || selectedTicket.meetingUrl;
                    const target = (url.startsWith("http://") || url.startsWith("https://")) ? url : `https://bookmyticket.net/${url}`;
                    Linking.openURL(target).catch(err => console.error("Couldn't load meeting page", err));
                  }}
                >
                  <Ionicons name="videocam" size={20} color={Colors.secondary} />
                  <Text style={styles.secondaryJoinText}>Join Meeting</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <BrandingHeader style={{ marginTop: 24, marginBottom: 48 }} />
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  ticketCardWrapper: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCardInner: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  ticketTop: {
    height: 180,
    position: 'relative',
    backgroundColor: '#000',
  },
  ticketImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  ticketImageOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  ticketBadgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  ticketBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  ticketBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ticketHeaderInfo: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
  },
  ticketEventTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  ticketBody: {
    padding: 24,
    backgroundColor: '#fff',
  },
  ticketInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketInfoCol: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  ticketValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  ticketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: -24,
  },
  dividerDotLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginLeft: -32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 10,
  },
  dividerDotRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginRight: -32,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  rectangularQrCard: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  qrInner: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idInner: {
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  idValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
  },
  brandSide: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 10,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 1,
  },
  ticketQr: {
    width: 90,
    height: 90,
  },
  ticketWatermark: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  watermarkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    opacity: 0.5,
  },
  modalActions: {
    width: '100%',
    gap: 12,
  },
  downloadBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryJoinText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.secondary,
  },
  title: { fontSize: 18, color: Colors.textMuted, marginBottom: 28, textAlign: 'center', fontWeight: '600' },
});
