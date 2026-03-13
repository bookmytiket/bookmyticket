import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function BookingsScreen() {
  const { user } = useAuth();
  const bookings = useQuery(api.bookings.getBookings) || [];
  const [refreshing, setRefreshing] = React.useState(false);

  // Filter bookings for the current user
  const userBookings = React.useMemo(() => 
    bookings.filter(b => b.userId === user?.identifier), 
  [bookings, user]);

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

      <TouchableOpacity style={styles.viewTicketButton}>
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
});
