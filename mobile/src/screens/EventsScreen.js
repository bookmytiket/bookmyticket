import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import { parseEventDate } from '../utils/eventUtils';

const CATEGORIES = ["All", "Concert", "Sports", "Comedy", "Theatre", "Music", "Workshop"];

export default function EventsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedCity } = useAuth();
  const convexEvents = useQuery(api.events.getActiveEvents) ?? [];
  const convexMeetings = useQuery(api.meetings.listAll) ?? [];
  const convexCategories = useQuery(api.homeSettings.getCategories) ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'All');

  const displayCategories = useMemo(() => {
    return ["All", ...convexCategories.map(c => c.name)];
  }, [convexCategories]);

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  const events = useMemo(() => {
    const combined = [
      ...(convexEvents || []),
      ...(convexMeetings || []).map(m => ({
        ...m,
        type: "Meeting",
        virtual: true,
        location: "Online Meeting"
      }))
    ];

    const now = new Date();

    // 1. Normalization Sync with HomeScreen
    const fromConvex = combined.filter(Boolean).map((ev, idx) => {
      const loc = ev?.location || ev?.venue || ev?.address || "Venue";
      const isMeeting = ev?.type === "Meeting";

      // Fix "TBA" for meetings
      let dateStr = ev?.date;
      let timeStr = ev?.time;

      if (isMeeting && !dateStr && ev?.createdAt) {
        const d = new Date(ev.createdAt);
        dateStr = d.toLocaleDateString('en-GB');
        timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }

      const isVirtual = ev?.virtual === true || 
               ev?.virtual === "true" ||
               String(ev?.type || '').toLowerCase().includes("online") || 
               String(ev?.type || '').toLowerCase().includes("virtual") ||
               loc.toLowerCase().includes("online") ||
               loc.toLowerCase().includes("virtual") ||
               loc.toLowerCase().includes("zoom") ||
               loc.toLowerCase().includes("meet") ||
               String(ev?.title || '').toLowerCase().includes("online meeting") ||
               String(ev?.title || '').toLowerCase().includes("virtual event");

      return {
        ...ev,
        id: ev?._id || ev?.id || `convex-list-${idx}`,
        title: ev?.title || "Event",
        img: ev?.img || ev?.bannerPreview || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop',
        rawDate: dateStr,
        rawTime: timeStr,
        date: [dateStr, timeStr].filter(Boolean).join(" ") || "TBA",
        location: loc,
        virtual: isVirtual,
        isMeeting,
      };
    });

    // 2. Expiration & De-duplication Logic
    const eventIds = new Set(fromConvex.filter(e => !e.isMeeting).map(e => String(e._id || e.id)));

    const active = fromConvex.filter(ev => {
      if (!ev) return false;

      // Duplicate Check
      if (ev.isMeeting && ev.eventId && eventIds.has(String(ev.eventId))) return false;

      // 1. Precise expiration check using Convex endDateTime
      if (ev.endDateTime && now.getTime() > ev.endDateTime) return false;

      // 24-hour expiration for standalone meetings
      if (ev.isMeeting && !ev.endDateTime && ev.createdAt) {
          const expirationTime = ev.createdAt + (24 * 60 * 60 * 1000); 
          if (now.getTime() > expirationTime) return false;
      }

      // 2. Fallback to parseEventDate logic
      const eventDate = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time);
      if (!eventDate) return true; 

      // Matches Web Portal: Today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const evDateOnly = new Date(eventDate);
      evDateOnly.setHours(0, 0, 0, 0);

      return evDateOnly >= today;
    });

    // 3. City Filter Sync (Consistent with Web)
    let filteredResults = active;
    if (selectedCity && selectedCity !== "All Cities") {
        const cityLower = selectedCity.toLowerCase();
        const cityVariations = {
          'bengaluru': ['bangalore', 'bengaluru'],
          'bangalore': ['bangalore', 'bengaluru'],
          'new delhi': ['delhi', 'new delhi', 'ncr'],
          'delhi': ['delhi', 'new delhi', 'ncr'],
          'mumbai': ['bombay', 'mumbai'],
          'chennai': ['madras', 'chennai'],
          'kochi': ['cochin', 'kochi'],
          'coimbatore': ['coimbatore', 'pollachi', 'tiruppur'],
        };
        
        const targetCities = cityVariations[cityLower] || [cityLower];

        filteredResults = active.filter(e => {
            if (e.virtual === true) return true;
            const evCity = (e.city || '').toLowerCase();
            const evLoc = (e.location || '').toLowerCase();
            const evVenue = (e.venue || '').toLowerCase();
            const evDistrict = (e.district || '').toLowerCase();

            return targetCities.some(tc => 
                evCity.includes(tc) || 
                evDistrict.includes(tc) || 
                evLoc.includes(tc) || 
                evVenue.includes(tc)
            ) || !e.city;
        });
    }

    // 4. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filteredResults = filteredResults.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.location.toLowerCase().includes(q)
      );
    }

    // 5. Category Filter
    if (selectedCategory !== 'All') {
      filteredResults = filteredResults.filter(e => 
        e.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return filteredResults;
  }, [convexEvents, convexMeetings, selectedCity, searchQuery, selectedCategory]);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: String(event._id || event.id), event });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Search events, venues..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {displayCategories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryBtn, selectedCategory === cat && styles.activeCategoryBtn]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <EventCard event={item} onPress={handleEventPress} layout="list" />
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No events found</Text>
            {(searchQuery !== '' || selectedCategory !== 'All') && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16, color: '#1e293b', fontWeight: '500' },
  categoryList: { gap: 8 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeCategoryBtn: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  categoryText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeCategoryText: { color: '#ffffff' },
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  row: { justifyContent: 'space-between' },
  cardWrapper: { width: '100%', marginBottom: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: '#94a3b8', fontWeight: '700', marginTop: 16 },
  clearBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9' },
  clearBtnText: { color: Colors.secondary, fontWeight: '800' },
});
