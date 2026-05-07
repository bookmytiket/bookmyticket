import React from 'react';
import { StyleSheet, ScrollView, Pressable, View, Text, FlatList, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Copy, Ticket, Sparkles, Tag, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Image } from 'expo-image';

export default function CouponsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Fetch both types of coupons
  const { data: brandingCoupons, loading: brandingLoading } = useSupabaseQuery('branding_coupons', (q) => q.eq('status', 'Active'), []);
  const { data: platformCoupons, loading: platformLoading } = useSupabaseQuery('coupons', (q) => q.eq('is_active', true), []);

  const copyToClipboard = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', `Coupon code ${code} copied to clipboard.`);
  };

  const renderCoupon = ({ item, type }: { item: any, type: 'brand' | 'platform' }) => {
    const isBrand = type === 'brand';
    const code = item.code || item.couponCode || 'N/A';
    const title = item.title || item.name || item.brandName || 'Special Discount';
    const description = item.description || item.sub_text || 'Save more on your next booking!';
    const discountText = isBrand 
      ? (item.discountType === 'Percentage' ? `${item.discountValue}% OFF` : (item.discountValue ? `₹${item.discountValue} OFF` : (item.discount || 'Special')))
      : (item.type === 'percent' ? `${item.value}% OFF` : `₹${item.value} OFF`);
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[styles.couponCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardHeader}>
          {isBrand ? (
            <Image source={{ uri: item.logoUrl || item.img || item.image_url || 'https://via.placeholder.com/40' }} style={styles.brandLogo} contentFit="contain" />
          ) : (
            <View style={[styles.platformIcon, { backgroundColor: colors.tint + '15' }]}>
              <Tag size={20} color={colors.tint} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.brandName, { color: colors.text }]}>{isBrand ? (item.brandName || 'Brand Offer') : 'Platform Coupon'}</Text>
            <Text style={[styles.couponTitle, { color: colors.muted }]} numberOfLines={2}>{title}</Text>
          </View>
        </View>

        <View style={[styles.codeSection, { backgroundColor: colors.background, borderStyle: 'dashed', borderColor: colors.border }]}>
          <View>
            <Text style={[styles.codeLabel, { color: colors.muted }]}>COUPON CODE</Text>
            <Text style={[styles.codeText, { color: colors.text }]}>{code}</Text>
          </View>
          <Pressable 
            onPress={() => copyToClipboard(code)}
            style={({ pressed }) => [styles.copyBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
          >
            <Copy size={14} color="#fff" />
            <Text style={styles.copyBtnText}>COPY</Text>
          </Pressable>
        </View>

        <View style={styles.cardFooter}>
           <View style={styles.benefitTag}>
              <Sparkles size={12} color="#f59e0b" />
              <Text style={styles.benefitText}>{discountText}</Text>
           </View>
           <Text style={[styles.expiryText, { color: colors.muted }]}>
             Valid till {new Date(item.endDate || item.expiry_date || item.expiryDate || Date.now() + 86400000 * 7).toLocaleDateString()}
           </Text>
        </View>
      </MotiView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Offers & Coupons</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Featured Banner */}
        <LinearGradient
          colors={[colors.tint, '#a855f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <Gift size={40} color="#fff" />
            <View>
              <Text style={styles.heroTitle}>Unlock Exclusive Savings</Text>
              <Text style={styles.heroSub}>Copy codes and apply them during checkout</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Brand Coupons */}
        {(brandingCoupons && brandingCoupons.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={18} color="#f59e0b" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Brand Offers</Text>
            </View>
            {brandingCoupons.map((item: any) => (
              <React.Fragment key={item.id}>
                {renderCoupon({ item, type: 'brand' })}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Platform Coupons */}
        {(platformCoupons && platformCoupons.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ticket size={18} color={colors.tint} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ticket Discounts</Text>
            </View>
            {platformCoupons.map((item: any) => (
              <React.Fragment key={item.id}>
                {renderCoupon({ item, type: 'platform' })}
              </React.Fragment>
            ))}
          </View>
        )}

        {(!brandingLoading && !platformLoading && (!brandingCoupons || brandingCoupons.length === 0) && (!platformCoupons || platformCoupons.length === 0)) && (
          <View style={styles.emptyState}>
            <Tag size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No active coupons available right now.</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>Check back later for fresh deals!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  scrollContent: { paddingBottom: 40 },
  heroBanner: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  couponCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  brandLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc' },
  platformIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  brandName: { fontSize: 16, fontWeight: '800' },
  couponTitle: { fontSize: 13, fontWeight: '500', marginTop: 4, lineHeight: 18 },
  codeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  codeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  codeText: { fontSize: 18, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  copyBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  benefitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7'
  },
  benefitText: { color: '#b45309', fontSize: 12, fontWeight: '900' },
  expiryText: { fontSize: 11, fontWeight: '600' },
  emptyState: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 20 },
  emptySub: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 8 },
});
