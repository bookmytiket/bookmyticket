import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function OrganiserDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const events = useQuery(api.events.getOrganiserEvents, { 
    organiserId: user?.identifier || "" 
  }) || [];

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status !== 'cancelled').length;

  const renderEventItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => {
        // Option to view specific event stats or manage it
      }}
    >
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.date} • {item.time}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color="#64748b" />
            <Text style={styles.statLabel}>Tickets Sold: </Text>
            <Text style={styles.statValue}>150</Text> 
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsHeader}>
        <LinearGradient
          colors={['#f84464', '#c026d3']}
          style={styles.statsGradient}
        >
          <View style={styles.statsOverview}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{totalEvents}</Text>
              <Text style={styles.mainStatLabel}>Total Events</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{activeEvents}</Text>
              <Text style={styles.mainStatLabel}>Active</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => router.push('/organiser/scanner')}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.scanGradient}
          >
            <Ionicons name="qr-code-outline" size={32} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Ticket</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Your Events</Text>
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={renderEventItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No events created yet</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsHeader: {
    padding: 16,
  },
  statsGradient: {
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#c026d3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  statsOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  mainStat: {
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  mainStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  scanButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 15,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
});
