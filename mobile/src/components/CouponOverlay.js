import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../theme/Theme';

export default function CouponOverlay({ visible, coupon, onClose }) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!coupon) return null;

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `https://bookmyticket.net${url}`;
  };

  const bannerUri = resolveUrl(coupon.bannerUrl);
  const logoUri = resolveUrl(coupon.logoUrl);

  const daysLeft = Math.max(0, Math.round((coupon.endDate - Date.now()) / (1000 * 60 * 60 * 24)));
  const expiryDate = new Date(coupon.endDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const code = coupon.couponCode || "COUPONCODE";

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = () => {
    if (coupon.redirectUrl) {
      Linking.openURL(coupon.redirectUrl).catch(() => {
        Alert.alert("Error", "Could not open the link.");
      });
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header / Banner */}
            <View style={styles.bannerContainer}>
              {bannerUri ? (
                <Image 
                  source={{ uri: bannerUri }} 
                  style={StyleSheet.absoluteFill} 
                  resizeMode="cover" 
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primary }]} />
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Brand Info */}
              <View style={styles.brandRow}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.brandLogo} />
                ) : null}
                <View style={styles.brandTextCol}>
                  <Text style={styles.brandName}>{coupon.brandName}</Text>
                  <Text style={styles.verifiedText}>✓ Verified Partner</Text>
                </View>
                <View style={styles.timerBadge}>
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text style={styles.timerText}>{daysLeft} days left</Text>
                </View>
              </View>

              <Text style={styles.title}>{coupon.title}</Text>
              <Text style={styles.description}>{coupon.description}</Text>

              <View style={styles.expiryRow}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.expiryText}>Expires on: <Text style={{fontWeight: '800'}}>{expiryDate}</Text></Text>
              </View>

              {/* Get Code Section */}
              <View style={styles.codeSection}>
                <Text style={styles.codeTitle}>Avail Your Coupon Code</Text>
                
                {!showCode ? (
                  <TouchableOpacity style={styles.getCodeBtn} onPress={() => setShowCode(true)}>
                    <Text style={styles.getCodeText}>Tap to Reveal Code</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.codeBox}>
                    <View style={styles.codeHeader}>
                      <Text style={styles.codeLabel}>COUPON CODE</Text>
                      <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                        <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={16} color={copied ? "#16a34a" : "#6366f1"} />
                        <Text style={[styles.copyText, { color: copied ? "#16a34a" : "#6366f1" }]}>
                          {copied ? "Copied" : "Copy"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.codeValue}>{code}</Text>
                  </View>
                )}
              </View>

              {/* Redeem Button */}
              <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
                <Text style={styles.redeemBtnText}>Redeem Now</Text>
                <Ionicons name="open-outline" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Additional Context */}
              <View style={styles.accordionContainer}>
                <Text style={styles.accordionTitle}>How To Redeem</Text>
                <Text style={styles.accordionText}>{coupon.howToRedeem || "1. Tap 'Reveal Code' and copy the unique code.\n2. Tap 'Redeem Now' to visit the partner site.\n3. Apply the code during checkout."}</Text>
              </View>

              <View style={styles.accordionContainer}>
                <Text style={styles.accordionTitle}>Terms {"&"} Conditions</Text>
                <Text style={styles.accordionText}>{coupon.termsAndConditions || "Valid for one-time use per user. Cannot be combined with other offers. See partner website for full details."}</Text>
              </View>
              
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 12,
    backgroundColor: '#fff'
  },
  brandTextCol: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  verifiedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 24,
  },
  expiryText: {
    fontSize: 13,
    color: '#4b5563',
  },
  codeSection: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center'
  },
  getCodeBtn: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  getCodeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeBox: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#f97316',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '800',
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f97316',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 4,
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 24,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  redeemBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  accordionContainer: {
    marginBottom: 20,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  accordionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  }
});
