import React, { useState, useMemo } from 'react';
import { StyleSheet, FlatList, TextInput, Pressable, ScrollView, View, Text, Image, Dimensions, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import * as SecureStore from 'expo-secure-store';
import EventCard from '@/components/EventCard';
import { useRouter } from 'expo-router';
import { Search, X, SlidersHorizontal, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All', 'Music', 'Sports', 'Comedy', 'Workshop', 'Art', 'Food', 'Tech'];

export default function EventsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState<string | null>(null);

  React.useEffect(() => {
    SecureStore.getItemAsync('userLocation').then(loc => {
      if (loc && loc !== 'India' && loc !== 'Live Location') {
        setUserLocation(loc);
      }
    });
  }, []);

  const { data: events, loading, refresh } = useSupabaseQuery(
    'events',
    (q) => q.order('created_at', { ascending: false }),
    [],
    { realtime: true }
  );

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    let list = events.filter(ev => {
      const s = String(ev.status || '').toLowerCase();
      if (s === "draft" || s === "inactive") return false;
      
      const safeParse = (val: any) => {
        if (!val) return null;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch (e) { return null; }
        }
        return val;
      };
      const dynamicConfig = safeParse(ev.dynamic_config) || {};
      let dt = ev.date || ev.start_date || ev.startDate || ev.expiry_date || dynamicConfig?.basicInfo?.expiryDate || dynamicConfig?.date || dynamicConfig?.basicInfo?.date;
      if (!dt) return true;
      
      let eventDate: Date | null = null;
      try {
        if (dt.includes('/')) {
          const [d, m, y] = dt.split('/');
          eventDate = new Date(`${y}-${m}-${d}T23:59:59`);
        } else {
          eventDate = new Date(dt);
        }
      } catch (e) { return true; }

      if (eventDate && eventDate > now) return true;
      if (s === "expired") return false;
      return true;
    });

    if (userLocation) {
      list = list.filter(e => {
        const safeParse = (val: any) => {
          if (!val) return null;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return null; }
          }
          return val;
        };
        const dynamicConfig = safeParse(e.dynamic_config) || {};
        const loc = String(e.venue || e.location || e.city || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || '').toLowerCase();
        
        const isVirtual = e.virtual === true || 
                 String(e.type || '').toLowerCase() === "online" || 
                 String(e.type || '').toLowerCase() === "virtual" ||
                 loc.includes("online") || loc.includes("virtual");
                 
        if (!loc.includes(userLocation.toLowerCase()) && !isVirtual) {
          return false;
        }
        return true;
      });
    }

    if (selectedCategory !== 'All') {
      list = list.filter((e) => {
        const safeParse = (val: any) => {
          if (!val) return null;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (err) { return null; }
          }
          return val;
        };
        const dynamicConfig = safeParse(e.dynamic_config) || {};
        const cat = String(e.category || dynamicConfig.basicInfo?.category || '').toLowerCase();
        return cat === selectedCategory.toLowerCase();
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => {
        const safeParse = (val: any) => {
          if (!val) return null;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (err) { return null; }
          }
          return val;
        };
        const dynamicConfig = safeParse(e.dynamic_config) || {};
        const title = String(e.name || e.title || dynamicConfig.basicInfo?.eventName || dynamicConfig.title || '').toLowerCase();
        const venue = String(e.venue || e.location || e.city || dynamicConfig.venue?.name || dynamicConfig.basicInfo?.venue || '').toLowerCase();
        return title.includes(q) || venue.includes(q);
      });
    }
    return list;
  }, [events, selectedCategory, searchQuery, userLocation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={[styles.headerTopYellow, { backgroundColor: '#ffda00' }]}>
          <Text style={[styles.title, { color: '#000' }]}>Events</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.muted} />
            <TextInput
              placeholder="Search events, artists, venues..."
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable style={styles.searchBtn}>
              <LinearGradient
                colors={['#f844a4', '#a855f7']}
                style={styles.searchBtnGradient}
              >
                <Text style={styles.searchBtnText}>Search</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.text : colors.card,
                    borderColor: active ? colors.text : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.background : colors.muted },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid */}
      <FlatList
        data={loading ? Array(6).fill({}) : filteredEvents}
        numColumns={2}
        keyExtractor={(item, index) => item.id ?? `skeleton-${index}`}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onRefresh={refresh}
        refreshing={loading}
        renderItem={({ item }) =>
          loading ? (
            <View style={[styles.skeleton, { backgroundColor: colors.card, borderColor: colors.border }]} />
          ) : (
            <EventCard
              event={item}
              onPress={() =>
                router.push({
                  pathname: '/events/[id]',
                  params: { id: item.id },
                })
              }
            />
          )
        }
        ListHeaderComponent={() => (
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultCount, { color: colors.muted }]}>
              {filteredEvents.length} Experiences found
            </Text>
            <Pressable style={styles.filterBtn}>
              <SlidersHorizontal size={14} color={colors.text} />
              <Text style={[styles.filterText, { color: colors.text }]}>Filters</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
                <Search size={40} color={colors.muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>Try searching with different keywords or categories</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTopYellow: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffda00',
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14, fontWeight: '600' },
  searchBtn: { borderRadius: 20, overflow: 'hidden' },
  searchBtnGradient: { paddingHorizontal: 18, paddingVertical: 8 },
  searchBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  categories: { paddingHorizontal: 20, gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '800' },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  resultCount: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  filterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  filterText: { fontSize: 12, fontWeight: '800' },
  listContent: { paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 20 },
  skeleton: { 
    width: (width - 52) / 2, 
    height: 280, 
    borderRadius: 20, 
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  emptySub: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
});
