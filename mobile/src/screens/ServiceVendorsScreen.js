import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';

export default function ServiceVendorsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params || {};
  
  // Normalize category name for query (e.g., "Mehendi Artists" vs "mehendi-artists")
  const displayCategory = category || "Professional Services";
  
  // Use listByCategory if category is provided, else get all active vendors
  const vendors = useQuery(api.vendors.getActiveVendors);
  
  // Filter locally by category if needed (until listByCategory is fully optimized for all slugs)
  const filteredVendors = vendors?.filter(v => 
    !category || v.category?.toLowerCase() === category.toLowerCase() || 
    category.toLowerCase().includes(v.category?.toLowerCase())
  ) || [];

  const renderVendorCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail', { vendorId: item.id })}
    >
      <View className="flex-row items-center p-4">
        <Image 
          source={{ uri: item.portfolio?.[0]?.url || 'https://images.unsplash.com/photo-1596704017254-9b1210630b65?w=500' }} 
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.category}>{item.category} Professional</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "4.8"}</Text>
            <Text style={styles.reviewsText}>({item.reviewsCount || 0} reviews)</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </View>
      
      {item.bio ? (
        <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      ) : null}
      
      <View style={styles.footer}>
        <Text style={styles.priceLabel}>Starting from</Text>
        <Text style={styles.priceValue}>₹{item.pricing?.[0]?.price || "1999"}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!vendors) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayCategory}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.id}
        renderItem={renderVendorCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Artists Found</Text>
            <Text style={styles.emptySub}>We couldn't find any professionals in this category yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.black,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  list: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    padding: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  info: { flex: 1, marginLeft: 16 },
  name: { fontSize: 18, fontWeight: '900', color: Colors.black, marginBottom: 2 },
  category: { fontSize: 12, fontWeight: '700', color: Colors.secondary, textTransform: 'uppercase' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 13, fontWeight: '800', color: Colors.black, marginLeft: 4 },
  reviewsText: { fontSize: 12, fontWeight: '500', color: Colors.textMuted, marginLeft: 4 },
  bio: { fontSize: 13, color: '#64748b', lineHeight: 18, marginVertical: 8, paddingHorizontal: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  priceValue: { fontSize: 18, fontWeight: '900', color: Colors.black },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.black, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
});
