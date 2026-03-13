import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import EventCard from '../../components/EventCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const convexEvents = useQuery(api.events.getActiveEvents) || [];

  const normalizedEvents = useMemo(() => convexEvents.map((ev, idx) => ({
    ...ev,
    id: ev._id || `${idx}`,
    title: ev.title || "Event",
    img: ev.img || ev.bannerPreview || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop",
    date: [ev.date, ev.time].filter(Boolean).join(" ") || "TBA",
    location: ev.location || ev.venue || "Venue",
    price: ev.price || ev.normalTicketPrice || null,
  })).filter(ev => {
    const q = searchQuery.toLowerCase();
    return ev.title.toLowerCase().includes(q) || 
           (ev.location && ev.location.toLowerCase().includes(q)) ||
           (ev.category && ev.category.toLowerCase().includes(q));
  }), [convexEvents, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.input}
            placeholder="Search events, venues, cities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={normalizedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <EventCard 
              event={item} 
              onPress={() => router.push(`/event/${item.id}`)} 
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query</Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
});
