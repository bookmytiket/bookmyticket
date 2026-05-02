import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { 
  Scissors, 
  Camera, 
  Palette, 
  Trophy, 
  Waves, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Star
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Mehendi Artist', icon: Scissors, color: '#f844a4', count: '12+ Pros' },
  { id: '2', name: 'Photographers', icon: Camera, color: '#8b5cf6', count: '8+ Pros' },
  { id: '3', name: 'Makeup Artist', icon: Palette, color: '#fb923c', count: '15+ Pros' },
  { id: '4', name: 'Turf Booking', icon: Trophy, color: '#22c55e', count: '6+ Venues' },
  { id: '5', name: 'Swimming Pools', icon: Waves, color: '#0ea5e9', count: '4+ Locations' },
];

export default function ServicesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <Pressable 
      style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: '/services', params: { category: item.name } })}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
        <item.icon size={24} color={item.color} />
      </View>
      <View style={styles.catInfo}>
        <Text style={[styles.catName, { color: colors.text }]}>{item.name}</Text>
        <Text style={styles.catCount}>{item.count}</Text>
      </View>
      <ChevronRight size={16} color={colors.muted} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Professional</Text>
            <Text style={[styles.title, { color: colors.text }]}>Services Marketplace</Text>
          </View>
          <View style={styles.badge}>
            <Sparkles size={14} color="#f844a4" />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        </View>

        <View style={styles.promoCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800' }} 
            style={StyleSheet.absoluteFill} 
          />
          <View style={styles.promoOverlay}>
            <Text style={styles.promoTag}>LIMITED OFFER</Text>
            <Text style={styles.promoTitle}>Up to 20% Off on Wedding Photographers</Text>
            <Pressable style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Explore Deals</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse by Category</Text>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>

        <View style={[styles.section, { marginBottom: 100 }]}>
          <View style={styles.trustHeader}>
            <ShieldCheck size={20} color="#22c55e" />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Why choose our Pros?</Text>
          </View>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <View style={styles.trustIcon}><Text>⭐</Text></View>
              <Text style={[styles.trustText, { color: colors.text }]}>Top Rated Only</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={styles.trustIcon}><Text>🛡️</Text></View>
              <Text style={[styles.trustText, { color: colors.text }]}>Verified Identity</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={styles.trustIcon}><Text>💰</Text></View>
              <Text style={[styles.trustText, { color: colors.text }]}>Best Price</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f844a4',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  promoCard: {
    margin: 20,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    justifyContent: 'center',
  },
  promoTag: {
    color: '#fde047',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  promoTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    width: '70%',
  },
  promoBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  listContent: {
    gap: 12,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
    marginLeft: 16,
  },
  catName: {
    fontSize: 16,
    fontWeight: '800',
  },
  catCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  trustText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  }
});
