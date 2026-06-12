import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, useSupabaseQuery } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { Search, Download, Filter, FileText, ChevronLeft, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

export default function MarathonParticipants() {
  const { marathonId } = useLocalSearchParams<{ marathonId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    if (marathonId) fetchRegistrations();
  }, [marathonId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marathon_registrations')
        .select(`
          *,
          marathon_categories ( category_name, distance_km )
        `)
        .eq('marathon_id', marathonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not load participants");
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(registrations.map(r => r.marathon_categories?.category_name).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [registrations]);

  const filteredData = useMemo(() => {
    return registrations.filter(reg => {
      const s = searchTerm.toLowerCase();
      const matchSearch = 
        (reg.participant_name || '').toLowerCase().includes(s) ||
        (reg.bib_number || '').toLowerCase().includes(s) ||
        (reg.registration_id || '').toLowerCase().includes(s);

      const matchCategory = filterCategory === 'All' || reg.marathon_categories?.category_name === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [registrations, searchTerm, filterCategory]);

  const handleDownloadCSV = async () => {
    if (filteredData.length === 0) {
      Alert.alert("Empty", "No participants found to export.");
      return;
    }
    
    try {
      const headers = ['BIB Number', 'Registration ID', 'Name', 'Category', 'Phone', 'Payment Status', 'Date'];
      const rows = filteredData.map(reg => [
        reg.bib_number || 'N/A',
        reg.registration_id,
        reg.participant_name,
        reg.marathon_categories?.category_name || '-',
        reg.participant_phone || '-',
        reg.payment_status || '-',
        new Date(reg.created_at).toLocaleDateString()
      ]);
      
      const csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
      
      // In Expo we can share the text
      await Share.share({
        message: csvContent,
        title: 'Marathon Participants Report'
      });
      
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to generate or share report.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.tint, colors.background]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.2 }} opacity={0.1} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Participants Report</Text>
      </View>

      <View style={styles.tools}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={16} color={colors.muted} />
            <TextInput
              placeholder="Search BIB, Name, ID..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <Pressable style={[styles.exportBtn, { backgroundColor: colors.tint }]} onPress={handleDownloadCSV}>
            <Download size={16} color="#fff" />
          </Pressable>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {categories.map((cat: any) => (
            <Pressable 
              key={cat} 
              onPress={() => setFilterCategory(cat)}
              style={[
                styles.filterChip, 
                { backgroundColor: filterCategory === cat ? colors.tint : colors.card, borderColor: colors.border }
              ]}
            >
              <Text style={{ color: filterCategory === cat ? '#fff' : colors.text, fontSize: 12, fontWeight: '700' }}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.list}>
        {filteredData.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Calendar size={40} color={colors.muted} style={{ marginBottom: 16 }} />
            <Text style={{ color: colors.muted, fontWeight: '700' }}>No participants found.</Text>
          </View>
        ) : (
          filteredData.map(reg => (
            <View key={reg.id} style={[styles.participantCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.bibText, { color: colors.tint }]}>{reg.bib_number || 'NO BIB'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: reg.payment_status === 'Paid' ? '#22c55e20' : '#f59e0b20' }]}>
                  <Text style={[styles.statusText, { color: reg.payment_status === 'Paid' ? '#22c55e' : '#f59e0b' }]}>{reg.payment_status}</Text>
                </View>
              </View>
              <Text style={[styles.nameText, { color: colors.text }]}>{reg.participant_name}</Text>
              <Text style={[styles.idText, { color: colors.muted }]}>{reg.registration_id}</Text>
              
              <View style={styles.cardFooter}>
                <Text style={[styles.categoryText, { color: colors.text }]}>{reg.marathon_categories?.category_name || 'General'}</Text>
                <Text style={[styles.dateText, { color: colors.muted }]}>{new Date(reg.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { padding: 8, marginRight: 12, borderRadius: 12, backgroundColor: 'rgba(150,150,150,0.1)' },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  tools: { paddingHorizontal: 20, marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: 16, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontWeight: '600' },
  exportBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  filtersScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  list: { padding: 20 },
  participantCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bibText: { fontSize: 16, fontWeight: '900', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  nameText: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  idText: { fontSize: 12, fontFamily: 'monospace', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)' },
  categoryText: { fontSize: 14, fontWeight: '700' },
  dateText: { fontSize: 12, fontWeight: '600' }
});
