import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

function DataTable({ title, data, columns, renderItem }) {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>{title}</Text>
        <Text style={styles.tableCount}>{data?.length || 0} Total</Text>
      </View>
      <View style={styles.columnHeaders}>
        {columns.map((col, idx) => (
          <Text key={idx} style={[styles.columnHeader, { flex: col.flex || 1, textAlign: col.align || 'left' }]}>{col.label}</Text>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            {renderItem(item)}
          </View>
        )}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>No records found</Text>}
      />
    </View>
  );
}
export default function ManagementScreen() {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  
  // 1. CALL ALL HOOKS AT THE TOP LEVEL (Before any early returns)
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const isOrganiser = user?.role === 'organiser';
  
  const [activeTab, setActiveTab] = useState(isStaff ? 'scans' : 'events');

  // Use the new analytics query
  const eventsWithAnalytics = useQuery(api.events.getEventsWithAnalytics) || [];
  const bookings = useQuery(api.bookings.getBookings) || [];
  
  // Guard for scans query to prevent crashes with undefined organiserId
  const currentOrganiserId = user?.organiserId || user?.identifier || user?.id || "";
  const scans = useQuery(api.pwaScans.getScansByOrganiser, { 
    organiserId: currentOrganiserId
  }) || [];
  
  const confirmBookingMutation = useMutation(api.bookings.confirmBooking);
  // DIAGNOSTIC: Commenting out the problematic query to verify deployment
  // const internalMeetingPortalEnabled = useQuery(api.meetings.getInternalPortalStatus);
  const internalMeetingPortalEnabled = true; 
  const toggleInternalPortalMutation = useMutation(api.meetings.toggleInternalPortal);
  
  // Fix: Use a memoized or stable value for the 'since' time to prevent infinite query loops
  const sinceTime = React.useMemo(() => Date.now() - (24 * 60 * 60 * 1000), []);
  const failedLogins = useQuery(api.auth.getRecentFailedAttempts, { identifier: "", since: sinceTime }) || [];

  const handleConfirm = async (id) => {
    try {
      await confirmBookingMutation({ id });
      Alert.alert('Success', 'Booking confirmed successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to confirm booking');
    }
  };

  // 2. NOW APPLY LOADING/ACCESS GUARDS
  if (authLoading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading dashboard...</Text>
      </View>
    );
  }

  if (isOrganiser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Ionicons name="lock-closed" size={80} color={Colors.secondary} />
        <Text style={[styles.title, { textAlign: 'center', marginTop: 24, color: Colors.text }]}>Access Restricted</Text>
        <Text style={[styles.sub, { textAlign: 'center', marginTop: 12, fontSize: 16, color: '#64748b' }]}>
          Please log in through the Web Portal. Mobile access is currently not available for organisers.
        </Text>
        <TouchableOpacity 
          style={[styles.actionButtonSmall, { marginTop: 32, backgroundColor: Colors.primary, paddingHorizontal: 30 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredEvents = user?.role === 'admin' 
    ? eventsWithAnalytics 
    : eventsWithAnalytics.filter(e => 
        e.organiserId === user?.identifier || 
        e.organiserId === user?.id || 
        (user?.role === 'staff' && e.organiserId === user?.organiserId)
      );

  const filteredBookings = user?.role === 'admin'
    ? bookings
    : bookings.filter(b => 
        b.organiserId === user?.identifier || 
        b.organiserId === user?.id ||
        (user?.role === 'staff' && b.organiserId === user?.organiserId)
      );

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <DataTable 
            title="Active Events"
            data={filteredEvents}
            columns={[
              { label: 'Event Details', flex: 1.5 },
              { label: 'Scanned', flex: 0.8, align: 'center' },
              { label: 'Check-in Time', flex: 1.2, align: 'right' },
              { label: 'Status', flex: 1, align: 'right' },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.subCell}>{item.venue || item.city || 'TBA'}</Text>
                </View>
                <View style={{ flex: 0.8, alignItems: 'center' }}>
                  <Text style={styles.analyticsText}>{item.scannedCount || 0}</Text>
                  <Text style={styles.subCell}>Tickets</Text>
                </View>
                <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                  <Text style={styles.timeText}>
                    {item.lastScannedAt 
                      ? new Date(item.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </Text>
                  <Text style={styles.subCell}>
                    {item.lastScannedAt ? new Date(item.lastScannedAt).toLocaleDateString() : 'No Scans'}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Live' ? '#dcfce7' : '#fef9c3' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Live' ? '#166534' : '#854d0e' }]}>
                      {item.status || 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          />
        );
      case 'bookings':
        return (
          <DataTable 
            title="Recent Bookings"
            data={filteredBookings}
            columns={[
              { label: 'Customer', flex: 2 },
              { label: 'Qty', flex: 0.5 },
              { label: 'Status/Action', flex: 1.5 },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.customerDetails?.name || 'User'}</Text>
                  <Text style={styles.subCell} numberOfLines={1}>{item.customerDetails?.email}</Text>
                  <Text style={styles.eventLabel}>{item.eventName}</Text>
                </View>
                <Text style={[styles.cell, { flex: 0.5, textAlign: 'center' }]}>{item.ticketCount}</Text>
                <View style={{ flex: 1.5, alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#dcfce7' : item.status === 'Cancelled' ? '#fee2e2' : '#fef9c3' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#166534' : item.status === 'Cancelled' ? '#991b1b' : '#854d0e' }]}>
                      {item.status}
                    </Text>
                  </View>
                  {item.status === 'Pending' && (
                    <TouchableOpacity 
                      style={styles.actionButtonSmall} 
                      onPress={() => handleConfirm(item._id)}
                    >
                      <Text style={styles.actionButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          />
        );
      case 'scans':
        return (
          <DataTable 
            title="Live Scan History"
            data={scans}
            columns={[
              { label: 'Attendee', flex: 2 },
              { label: 'Scan Time', flex: 1.5 },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.userName || item.customerEmail || 'Guest'}</Text>
                  <Text style={styles.subCell} numberOfLines={1}>{item.eventName}</Text>
                  <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginTop: 4, backgroundColor: item.status === 'valid' ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'valid' ? '#166534' : '#991b1b' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <Text style={styles.timeText}>
                    {item.scannedAt 
                      ? new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </Text>
                  <Text style={styles.subCell}>
                    {item.scannedAt ? new Date(item.scannedAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </>
            )}
          />
        );
      case 'admin':
        return (
          <ScrollView>
            <View style={styles.adminCard}>
              <View style={styles.adminCardHeader}>
                <Ionicons name="settings" size={24} color={Colors.secondary} />
                <Text style={styles.adminCardTitle}>System Configuration</Text>
              </View>
              <View style={styles.configRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.configLabel}>Internal Meeting Portal</Text>
                  <Text style={styles.configSub}>Allow users to join internal WebRTC meetings</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.toggleBtn, internalMeetingPortalEnabled ? styles.toggleOn : styles.toggleOff]}
                  onPress={() => toggleInternalPortalMutation()}
                >
                  <Text style={styles.toggleText}>{internalMeetingPortalEnabled ? 'ENABLED' : 'DISABLED'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <DataTable 
              title="Failed Logins (24h)"
              data={failedLogins}
              columns={[
                { label: 'Identifier', flex: 1.5 },
                { label: 'Device / IP', flex: 2 },
                { label: 'Time', flex: 1, align: 'right' },
              ]}
              renderItem={(item) => (
                <>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.cell} numberOfLines={1}>{item.identifier}</Text>
                    <Text style={styles.subCell}>{item.ip}</Text>
                  </View>
                  <Text style={[styles.subCell, { flex: 2 }]} numberOfLines={2}>{item.userAgent}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </>
              )}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Management</Text>
        <Text style={styles.sub}>{user?.role?.toUpperCase()} Portal • Real-time Monitoring</Text>
      </View>

      <View style={styles.tabs}>
        {!isStaff && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons name="apps" size={20} color={activeTab === 'events' ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Events</Text>
          </TouchableOpacity>
        )}
        {!isStaff && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}
            onPress={() => setActiveTab('bookings')}
          >
            <Ionicons name="ticket" size={20} color={activeTab === 'bookings' ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'bookings' && styles.activeTabText]}>Bookings</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'scans' && styles.activeTab]}
          onPress={() => setActiveTab('scans')}
        >
          <Ionicons name="scan-circle" size={20} color={activeTab === 'scans' ? Colors.secondary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'scans' && styles.activeTabText]}>Live Scans</Text>
        </TouchableOpacity>
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'admin' && styles.activeTab]}
            onPress={() => setActiveTab('admin')}
          >
            <Ionicons name="shield-half" size={20} color={activeTab === 'admin' ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'admin' && styles.activeTabText]}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, backgroundColor: Colors.primary, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.text },
  sub: { fontSize: 13, color: Colors.text, opacity: 0.7, fontWeight: '700', marginTop: 4 },
  tabs: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 8, 
    marginTop: -25,
    backgroundColor: 'transparent',
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeTab: {
    backgroundColor: Colors.secondary,
  },
  tabText: { fontSize: 13, fontWeight: '800', color: Colors.textMuted },
  activeTabText: { color: '#fff' },
  tableContainer: { padding: 16, marginTop: 8 },
  tableHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tableTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  tableCount: { fontSize: 14, fontWeight: '700', color: Colors.secondary, backgroundColor: '#fff5f7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  columnHeaders: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginBottom: 10 
  },
  columnHeader: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cell: { fontSize: 15, fontWeight: '700', color: Colors.text },
  analyticsText: { fontSize: 16, fontWeight: '900', color: Colors.secondary },
  subCell: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  eventLabel: { fontSize: 10, color: Colors.secondary, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  timeText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  actionButtonSmall: {
    backgroundColor: Colors.secondary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 15, fontWeight: '600' },
  adminCard: { backgroundColor: '#fff', margin: 16, borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  adminCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  adminCardTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  configLabel: { fontSize: 15, fontWeight: '800', color: Colors.text },
  configSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  toggleOn: { backgroundColor: '#dcfce7' },
  toggleOff: { backgroundColor: '#fee2e2' },
  toggleText: { fontSize: 10, fontWeight: '900', color: Colors.text },
});

