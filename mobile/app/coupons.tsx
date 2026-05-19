import React, { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, View, Text, Alert, ActivityIndicator, Share, Linking } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSupabaseQuery, useAuth } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Copy, Ticket, Sparkles, Tag, Gift, ExternalLink, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';

export default function CouponsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'discounts' | 'rewards'>('discounts');

  // Fetch direct checkout coupons
  const { data: brandingCoupons, loading: brandingLoading } = useSupabaseQuery('branding_coupons', (q) => q.eq('status', 'Active'), []);
  const { data: platformCoupons, loading: platformLoading } = useSupabaseQuery('coupons', (q) => q.eq('is_active', true), []);

  // Fetch unlocked post-booking rewards
  const { data: unlockedRewards, loading: rewardsLoading, refresh: refreshRewards } = useSupabaseQuery(
    'user_coupon_rewards',
    (q) => q.select('*, coupon_inventory(*, partner_campaigns(*, partners(*)))').eq('user_id', user?.id || ''),
    [user?.id]
  );

  const copyToClipboard = async (code: string) => {
    try {
      await Share.share({
        message: `Your Exclusive Reward Coupon Code: ${code}`,
        title: 'Unlock Coupon Code'
      });
    } catch (error) {
      Alert.alert('Coupon Code', code);
    }
  };

  const markAsRedeemed = async (rewardId: string, redeemUrl: string) => {
    try {
      await supabase
        .from('user_coupon_rewards')
        .update({ reward_status: 'redeemed' })
        .eq('id', rewardId);
      
      refreshRewards();
      if (redeemUrl) {
        Linking.openURL(redeemUrl);
      }
    } catch (error) {
      console.error("Error marking reward as redeemed:", error);
      if (redeemUrl) {
        Linking.openURL(redeemUrl);
      }
    }
  };

  const renderDirectCoupon = ({ item, type }: { item: any, type: 'brand' | 'platform' }) => {
    const isBrand = type === 'brand';
    const code = item.code || item.couponCode || 'N/A';
    const title = item.title || item.name || item.brandName || 'Special Discount';
    const description = item.description || item.sub_text || 'Save more on your next booking!';
    const discountText = isBrand 
      ? (item.discountType === 'Percentage' ? `${item.discountValue}% OFF` : (item.discountValue ? `₹${item.discountValue} OFF` : (item.discount || 'Special')))
      : (item.type === 'percent' ? `${item.value}% OFF` : `₹${item.value} OFF`);
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
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
            <Text style={styles.copyBtnText}>SHARE</Text>
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

  const renderRewardCoupon = (reward: any) => {
    const inv = reward.coupon_inventory || {};
    const camp = inv.partner_campaigns || {};
    const part = camp.partners || {};
    
    const isRedeemed = reward.reward_status === 'redeemed';
    const code = inv.coupon_code || 'CODE_UNAVAILABLE';
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        key={reward.id}
        style={[styles.couponCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {/* Brand Banner Strip */}
        <LinearGradient
          colors={['#ec4899', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rewardHeaderStrip}
        >
          <Text style={styles.rewardHeaderText}>UNLOCKED PREMIUM REWARD</Text>
        </LinearGradient>

        <View style={[styles.cardHeader, { marginTop: 12 }]}>
          {part.logo_url ? (
            <Image source={{ uri: part.logo_url }} style={styles.brandLogo} contentFit="contain" />
          ) : (
            <View style={[styles.platformIcon, { backgroundColor: '#8b5cf615' }]}>
              <Gift size={20} color="#8b5cf6" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.brandName, { color: colors.text }]}>{part.name || 'Partner Reward'}</Text>
            <Text style={[styles.couponTitle, { color: colors.muted }]} numberOfLines={2}>{camp.offer_title}</Text>
          </View>
        </View>

        <Text style={[styles.rewardDesc, { color: colors.muted }]}>{camp.offer_description}</Text>

        <View style={[styles.codeSection, { backgroundColor: colors.background, borderStyle: 'dashed', borderColor: colors.border }]}>
          <View>
            <Text style={[styles.codeLabel, { color: colors.muted }]}>CLAIM CODE</Text>
            <Text style={[styles.codeText, { color: colors.text, textDecorationLine: isRedeemed ? 'line-through' : 'none' }]}>{code}</Text>
          </View>
          <Pressable 
            onPress={() => copyToClipboard(code)}
            style={({ pressed }) => [styles.copyBtn, { backgroundColor: '#8b5cf6', opacity: pressed ? 0.8 : 1 }]}
          >
            <Copy size={14} color="#fff" />
            <Text style={styles.copyBtnText}>COPY</Text>
          </Pressable>
        </View>

        <View style={styles.cardFooter}>
          <Pressable
            onPress={() => markAsRedeemed(reward.id, camp.redeem_url)}
            style={({ pressed }) => [
              styles.redeemBtn,
              { 
                backgroundColor: isRedeemed ? '#10b981' : '#ec4899', 
                opacity: pressed ? 0.8 : 1,
                flex: 1,
                marginRight: 10
              }
            ]}
          >
            {isRedeemed ? <Check size={14} color="#fff" /> : <ExternalLink size={14} color="#fff" />}
            <Text style={styles.redeemBtnText}>
              {isRedeemed ? 'REDEEMED' : 'REDEEM NOW'}
            </Text>
          </Pressable>
          <Text style={[styles.expiryText, { color: colors.muted }]}>
            Unlocked {new Date(reward.unlocked_at).toLocaleDateString()}
          </Text>
        </View>
      </MotiView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Offers & Coupons</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Segment Tab Controls */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <Pressable 
          onPress={() => setActiveTab('discounts')} 
          style={[styles.tabBtn, activeTab === 'discounts' && { borderBottomColor: colors.tint }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'discounts' ? colors.tint : colors.muted }]}>
            Ticket Discounts
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setActiveTab('rewards')} 
          style={[styles.tabBtn, activeTab === 'rewards' && { borderBottomColor: '#8b5cf6' }]}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, { color: activeTab === 'rewards' ? '#8b5cf6' : colors.muted }]}>
              Unlocked Rewards
            </Text>
            {unlockedRewards && unlockedRewards.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{unlockedRewards.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Featured Banner */}
        <LinearGradient
          colors={activeTab === 'discounts' ? [colors.tint, '#a855f7'] : ['#ec4899', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <Gift size={40} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>
                {activeTab === 'discounts' ? 'Unlock Ticket Savings' : 'Premium Brand Rewards'}
              </Text>
              <Text style={styles.heroSub}>
                {activeTab === 'discounts' ? 'Get flat discounts on physical & virtual events' : 'Exclusive partner perks unlocked after successful booking'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {activeTab === 'discounts' ? (
          <>
            {/* Brand Coupons */}
            {(brandingCoupons && brandingCoupons.length > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles size={18} color="#f59e0b" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Sponsor Partner Deals</Text>
                </View>
                {brandingCoupons.map((item: any) => (
                  <React.Fragment key={item.id}>
                    {renderDirectCoupon({ item, type: 'brand' })}
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Platform Coupons */}
            {(platformCoupons && platformCoupons.length > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ticket size={18} color={colors.tint} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Checkout Promo Codes</Text>
                </View>
                {platformCoupons.map((item: any) => (
                  <React.Fragment key={item.id}>
                    {renderDirectCoupon({ item, type: 'platform' })}
                  </React.Fragment>
                ))}
              </View>
            )}

            {(brandingLoading || platformLoading) && (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            )}

            {(!brandingLoading && !platformLoading && (!brandingCoupons || brandingCoupons.length === 0) && (!platformCoupons || platformCoupons.length === 0)) && (
              <View style={styles.emptyState}>
                <Tag size={48} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No active checkout coupons available.</Text>
                <Text style={[styles.emptySub, { color: colors.muted }]}>Check back later for fresh deals!</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Unlocked Post Booking Rewards */}
            {unlockedRewards && unlockedRewards.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles size={18} color="#8b5cf6" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Partner Rewards</Text>
                </View>
                {unlockedRewards.map((reward: any) => renderRewardCoupon(reward))}
              </View>
            ) : (
              <>
                {rewardsLoading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Gift size={48} color={colors.muted} />
                    <Text style={[styles.emptyText, { color: colors.muted }]}>No post-booking rewards unlocked yet.</Text>
                    <Text style={[styles.emptySub, { color: colors.muted }]}>Book your next event ticket to unlock exclusive premium brand vouchers!</Text>
                  </View>
                )}
              </>
            )}
          </>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeCount: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: { paddingBottom: 40 },
  heroBanner: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 4, lineHeight: 16 },
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
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden'
  },
  rewardHeaderStrip: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingVertical: 6,
    alignItems: 'center',
  },
  rewardHeaderText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  brandLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc' },
  platformIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  brandName: { fontSize: 16, fontWeight: '800' },
  couponTitle: { fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 18 },
  rewardDesc: { fontSize: 12, fontWeight: '500', marginBottom: 16, lineHeight: 16 },
  codeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  codeLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  codeText: { fontSize: 17, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
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
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  redeemBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  expiryText: { fontSize: 11, fontWeight: '600' },
  emptyState: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 20 },
  emptySub: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 8, lineHeight: 18 },
});

