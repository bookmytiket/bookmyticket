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
  const { category = "All" } = route.params || {};
  
  // Normalize category name for query
  const displayCategory = category === "All" ? "Professional Services" : category;
  
  // Use listByCategory for the selected category
  const vendors = useQuery(api.vendors.listByCategory, { 
    category: category === "All" ? "" : category 
  });
  
  const filteredVendors = vendors || [];

  const renderVendorCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ServiceDetail', { vendorId: item.id })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image 
          source={{ uri: item.portfolio?.[0]?.url || 'https://images.unsplash.com/photo-1596704017254-9b1210630b65?w=500' }} 
          style={styles.avatar}
        />
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#fbbf24" style={{ marginRight: 2 }} />
              <Text style={styles.ratingText}>{item.rating > 0 ? item.rating.toFixed(1) : "New"}</Text>
            </View>
          </View>
          
          <View style={styles.ratingRow}>
            <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
            <Text style={styles.verifiedText}>Verified Professional</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.reviewsText}>{item.reviewsCount || 0} reviews</Text>
          </View>
        </View>
      </View>
      
      {item.bio ? (
        <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      ) : null}
      
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>₹{item.pricing?.[0]?.price || "1,999"}</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewProfileBtn}
          onPress={() => navigation.navigate('ServiceDetail', { vendorId: item.id })}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (vendors === undefined) {
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
    justifyContent: 'space-between',
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
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    padding: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
  },
  info: { flex: 1, marginLeft: 16 },
  name: { fontSize: 18, fontWeight: '900', color: Colors.black, marginBottom: 2 },
  category: { fontSize: 10, fontWeight: '800', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingText: { fontSize: 12, fontWeight: '900', color: '#92400e' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verifiedText: { fontSize: 12, fontWeight: '600', color: '#059669', marginLeft: 4 },
  separator: { marginHorizontal: 6, color: '#cbd5e1' },
  reviewsText: { fontSize: 12, fontWeight: '500', color: '#64748b' },
  bio: { fontSize: 13, color: '#64748b', lineHeight: 18, marginVertical: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  priceLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  priceValue: { fontSize: 20, fontWeight: '900', color: Colors.black },
  viewProfileBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.black, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
});
