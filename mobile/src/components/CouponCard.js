import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';

const { width } = Dimensions.get('window');

export default function CouponCard({ coupon, onPress }) {
  const daysLeft = Math.max(0, Math.round((coupon.endDate - Date.now()) / (1000 * 60 * 60 * 24)));
  
  // Robust discount label: If value > 100, it's almost certainly Flat even if DB says Percentage by mistake
  const isFlat = coupon.discountType === "Flat" || coupon.discountValue > 100;
  const discountLabel = isFlat 
        ? `₹${coupon.discountValue} OFF`
        : `${coupon.discountValue}% OFF`;

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `https://bookmyticket-nu.vercel.app${url}`;
  };

  const bannerUri = resolveUrl(coupon.bannerUrl);
  const logoUri = resolveUrl(coupon.logoUrl);

  return (
    <TouchableOpacity activeOpacity={0.95} style={styles.card} onPress={onPress}>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        {bannerUri ? (
          <Image 
            source={{ uri: bannerUri }} 
            style={[StyleSheet.absoluteFill, styles.banner]} 
            resizeMode="cover" 
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#a78bfa' }]} />
        )}
        
        {/* Discount Badge overlay */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountLabel}</Text>
        </View>
 
        {/* Logo overlay */}
        {logoUri && (
          <View style={styles.logoBadge}>
            <Image 
              source={{ uri: logoUri }} 
              style={StyleSheet.absoluteFill} 
              resizeMode="contain" 
            />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>{coupon.brandName}</Text>
          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
        </View>
        
        <Text style={styles.title} numberOfLines={2}>{coupon.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{coupon.description}</Text>

        <View style={styles.footer}>
          <Text style={styles.daysLeft}>{daysLeft > 0 ? `${daysLeft} days left` : "Ends today!"}</Text>
          <View style={[styles.methodBadge, { backgroundColor: coupon.redemptionMethod === "Online" ? "#eff6ff" : "#f0fdf4" }]}>
            <Text style={[styles.methodText, { color: coupon.redemptionMethod === "Online" ? "#2563eb" : "#16a34a" }]}>
              {coupon.redemptionMethod}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width * 0.75,
    maxWidth: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerContainer: {
    height: 130,
    width: '100%',
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#7c3aed',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -16,
    left: 16,
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    zIndex: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  daysLeft: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '800',
  }
});
