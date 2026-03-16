import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { HOME_EVENTS } from '../data/homeEvents';

export default function EventsScreen() {
  const navigation = useNavigation();
  const { selectedCity } = useAuth();
  const convexEvents = useQuery(api.events.getActiveEvents) ?? [];

  const events = useMemo(() => {
    const fromConvex = (convexEvents || []).map((e) => ({
      ...e,
      id: e._id,
      location: e.location || e.venue || e.address,
    }));
    const fromHome = HOME_EVENTS || [];
    const merged = [...fromConvex];
    fromHome.forEach((h) => {
      if (!merged.some((m) => String(m._id || m.id) === String(h.id))) merged.push(h);
    });

    if (!selectedCity) return merged;

    return merged.filter(e => 
      e.city?.toLowerCase() === selectedCity.toLowerCase() ||
      e.location?.toLowerCase().includes(selectedCity.toLowerCase())
    );
  }, [convexEvents, selectedCity]);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: String(event._id || event.id), event });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => <EventCard event={item} onPress={handleEventPress} compact />}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No events found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  row: { justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  list: { paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 16 },
});
