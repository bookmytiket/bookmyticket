import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { HOME_EVENTS } from '../data/homeEvents';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ["All", "Concert", "Sports", "Comedy", "Theatre", "Music", "Workshop"];

export default function EventsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedCity } = useAuth();
  const convexEvents = useQuery(api.events.getActiveEvents) ?? [];
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
    // 1. Normalization Sync with HomeScreen
    const fromConvex = (convexEvents || []).filter(Boolean).map((ev, idx) => {
      const loc = ev?.location || ev?.venue || ev?.address || "Venue";
      const isVirtual = ev?.virtual === true || 
               String(ev?.type || '').toLowerCase().includes("online") || 
               String(ev?.type || '').toLowerCase().includes("virtual") ||
               loc.toLowerCase().includes("online") ||
               loc.toLowerCase().includes("virtual") ||
               String(ev?.title || '').toLowerCase().includes("online meeting");
      return {
        ...ev,
        id: ev?._id || ev?.id || `convex-list-${idx}`,
        title: ev?.title || "Event",
        img: ev?.img || ev?.bannerPreview || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop',
        rawDate: ev?.date,
        rawTime: ev?.time,
        date: [ev?.date, ev?.time].filter(Boolean).join(" ") || "TBA",
        location: loc,
        virtual: isVirtual,
      };
    });

    const fromHome = (HOME_EVENTS || []).filter(Boolean).map(h => ({ 
      ...h, 
      id: String(h.id),
      rawDate: h.date,
      rawTime: h.time
    }));
    const eventMap = new Map();
    fromConvex.forEach(e => { if (e?.id) eventMap.set(String(e.id), e); });
    fromHome.forEach(h => { if (h?.id && !eventMap.has(String(h.id))) eventMap.set(String(h.id), h); });

    const merged = Array.from(eventMap.values());
    // 2. Expiry Filter Sync
    const parseEventDate = (dateStr, timeStr) => {
      if (!dateStr) return null;
      try {
        let dt = String(dateStr).trim();
        if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
          const parts = dt.split(/[-/]/);
          dt = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        if (dt.includes('T') || dt.includes(' ')) {
          const d = new Date(dt.replace(' ', 'T'));
          return isNaN(d.getTime()) ? null : d;
        }

        let normalizedTime = "23:59";
        if (timeStr) {
          let t = String(timeStr).trim().toUpperCase();
          const ampmMatch = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
          if (ampmMatch) {
            let [_, hours, mins = "00", ampm] = ampmMatch;
            hours = parseInt(hours);
            if (ampm === "PM" && hours < 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
            normalizedTime = `${String(hours).padStart(2, '0')}:${mins}`;
          } else {
            normalizedTime = t.includes(':') ? t : `${t}:00`;
          }
        }
        
        const eventDate = new Date(`${dt}T${normalizedTime}`);
        return isNaN(eventDate.getTime()) ? null : eventDate;
      } catch (_) { return null; }
    };

    const now = new Date();
    const active = merged.filter(ev => {
      if (!ev) return false;
      const eventDate = parseEventDate(ev.rawDate || ev.date, ev.rawTime || ev.time);
      if (!eventDate) return true;
      return eventDate >= now;
    });

    // 3. City Filter Sync (Broad matching + Virtual always shown)
    let filteredResults = active;
    if (selectedCity && selectedCity !== "All Cities") {
      filteredResults = active.filter(e => 
        e.virtual === true ||
        !e.city ||
        (e.city && e.city.toLowerCase() === selectedCity.toLowerCase()) ||
        (e.district && e.district.toLowerCase() === selectedCity.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(selectedCity.toLowerCase())) ||
        (e.venue && e.venue.toLowerCase().includes(selectedCity.toLowerCase()))
      );
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
  }, [convexEvents, selectedCity, searchQuery, selectedCategory]);

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
            <EventCard event={item} onPress={handleEventPress} compact />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
  list: { padding: 16, paddingBottom: 40 },
  row: { justifyContent: 'space-between' },
  cardWrapper: { width: '48.5%', marginBottom: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: '#94a3b8', fontWeight: '700', marginTop: 16 },
  clearBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9' },
  clearBtnText: { color: Colors.secondary, fontWeight: '800' },
});
