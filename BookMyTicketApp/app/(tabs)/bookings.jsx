import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { Redirect } from 'expo-router';

export default function BookingsScreen() {
  const { user, loading } = useAuth();
  const bookings = useQuery(api.bookings.getBookings) || [];

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/signin" />;

  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState(null);

  // Filter bookings for the current user
  const userBookings = React.useMemo(() => 
    bookings.filter(b => b.userId === user?.identifier || b.customerDetails?.email === user?.identifier), 
  [bookings, user]);

  const toggleModal = (booking = null) => {
    setSelectedBooking(booking);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status || 'Pending'}
          </Text>
        </View>
        <Text style={styles.bookingDate}>
          {new Date(item._creationTime).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.eventName}>{item.eventName || 'Event Booking'}</Text>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="ticket-outline" size={16} color="#64748b" />
            <Text style={styles.detailValue}>{item.ticketCount} Tickets</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="wallet-outline" size={16} color="#64748b" />
            <Text style={styles.detailValue}>₹{item.totalPrice}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewTicketButton}
        onPress={() => toggleModal(item)}
      >
        <Text style={styles.viewTicketText}>View E-Ticket</Text>
        <Ionicons name="qr-code-outline" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={userBookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBookingItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={80} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>Your tickets will appear here once you book them</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={!!selectedBooking}
        transparent={true}
        animationType="slide"
        onRequestClose={() => toggleModal()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeModal} onPress={() => toggleModal()}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>E-Ticket</Text>
            
            <View style={styles.qrContainer}>
              {selectedBooking && (
                <QRCode
                  value={selectedBooking._id}
                  size={200}
                  color="#000"
                  backgroundColor="#fff"
                />
              )}
            </View>

            <View style={styles.ticketDetails}>
              <Text style={styles.ticketEventName}>{selectedBooking?.eventName}</Text>
              <View style={styles.ticketInfoRow}>
                <View style={styles.ticketInfoItem}>
                  <Text style={styles.ticketInfoLabel}>Guest</Text>
                  <Text style={styles.ticketInfoValue}>{selectedBooking?.customerDetails?.name || user?.name}</Text>
                </View>
                <View style={styles.ticketInfoItem}>
                  <Text style={styles.ticketInfoLabel}>Tickets</Text>
                  <Text style={styles.ticketInfoValue}>{selectedBooking?.ticketCount}</Text>
                </View>
              </View>
              <View style={styles.ticketStatusRow}>
                <Text style={styles.ticketStatusLabel}>Status</Text>
                <Text style={[styles.ticketStatusValue, { color: getStatusColor(selectedBooking?.status) }]}>
                  {selectedBooking?.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.scanInstruction}>
              Show this QR code to the organiser at the entry point
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bookingDate: {
    fontSize: 13,
    color: '#64748b',
  },
  cardBody: {
    marginBottom: 20,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailValue: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  viewTicketButton: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  viewTicketText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    alignItems: 'center',
    minHeight: '70%',
  },
  closeModal: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 30,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 30,
  },
  ticketDetails: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  ticketEventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
    textAlign: 'center',
  },
  ticketInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ticketInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  ticketInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ticketInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ticketStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketStatusLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  ticketStatusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanInstruction: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
