import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { Colors } from '../theme/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_PREFIX = 'bmt_adpopup_';
const LAST_ID_KEY = `${STORAGE_PREFIX}last_id`;
const INITIAL_DELAY_MS = 3000; // show 3s after mount

const DEFAULT_GRADIENTS = [
  ['#f84464', '#c026d3'],
  ['#6366f1', '#8b5cf6'],
  ['#f97316', '#ef4444'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#0ea5e9'],
];

async function getLastSeen(popupId) {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${popupId}`);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

async function markSeen(popupId) {
  try {
    const now = String(Date.now());
    await AsyncStorage.setItem(`${STORAGE_PREFIX}seen_${popupId}`, now);
    await AsyncStorage.setItem(LAST_ID_KEY, popupId);
  } catch {}
}

async function shouldShowPopup(popupId, showEveryMinutes) {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}seen_${popupId}`);
    if (!raw) return true; // never seen
    const lastSeen = parseInt(raw, 10);
    const ageMs = Date.now() - lastSeen;
    const intervalMs = showEveryMinutes * 60 * 1000;
    return ageMs >= intervalMs;
  } catch {
    return true;
  }
}

export default function CustomerAdPopup() {
  const { data: activePopups } = useSupabaseQuery('ad_popups', (q) => q.eq('status', 'Active'));
  const [currentPopup, setCurrentPopup] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  const findAndShowNext = useCallback(
    async (popups) => {
      if (!popups?.length) return;
      
      const lastId = await AsyncStorage.getItem(LAST_ID_KEY);
      
      // 1. Find all ads eligible to be shown based on their interval
      const eligible = [];
      for (const p of popups) {
        if (await shouldShowPopup(p._id, p.showEveryMinutes)) {
          eligible.push(p);
        }
      }
      
      if (!eligible.length) return;

      // 2. Mixing: Shuffle the eligible ads
      const shuffled = [...eligible].sort(() => Math.random() - 0.5);

      // 3. Rotation: Try to pick one that isn't the same as the lastShownId
      let selected = shuffled[0];
      if (shuffled.length > 1) {
        const different = shuffled.find(p => p._id !== lastId);
        if (different) selected = different;
      }

      const idxInOriginal = popups.findIndex(p => p._id === selected._id);
      setCurrentPopup(selected);
      setCurrentIndex(idxInOriginal);
      setVisible(true);
      
      // Animate in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
    },
    [slideAnim]
  );

  useEffect(() => {
    if (!activePopups.length) return;
    const timer = setTimeout(() => {
      findAndShowNext(activePopups);
    }, INITIAL_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePopups.length]);

  const handleClose = useCallback(async () => {
    // Animate out
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(async () => {
      if (currentPopup) {
        await markSeen(currentPopup._id);
      }
      setVisible(false);
      slideAnim.setValue(300);

      // Queue next ad
      setTimeout(() => {
        findAndShowNext(activePopups);
      }, 400);
    });
  }, [currentPopup, activePopups, currentIndex, findAndShowNext, slideAnim]);

  const handleCTA = useCallback(async () => {
    if (currentPopup?.redirectUrl) {
      const url = currentPopup.redirectUrl;
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        Linking.openURL(url).catch(() =>
          Alert.alert('Error', 'Could not open the link.')
        );
      } else {
        Alert.alert('Error', 'Could not open the link.');
      }
    }
    handleClose();
  }, [currentPopup, handleClose]);

  if (!currentPopup || !visible) return null;

  const gradPair = DEFAULT_GRADIENTS[currentIndex % DEFAULT_GRADIENTS.length];
  const hasImage = !!currentPopup.imageUrl;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>

          {/* Hero */}
          <View
            style={[
              styles.hero,
              !hasImage && {
                backgroundColor: gradPair[0],
              },
            ]}
          >
            {hasImage ? (
              <Image
                source={{ uri: currentPopup.imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.gradientFallback,
                  { backgroundColor: gradPair[0] },
                ]}
              >
                <Text style={styles.heroEmoji}>🎉</Text>
              </View>
            )}

            {/* Dim overlay on image */}
            {hasImage && <View style={styles.heroOverlay} />}

            {/* Badge */}
            {currentPopup.badgeText ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currentPopup.badgeText}</Text>
              </View>
            ) : null}

            {/* Title */}
            <View style={styles.heroBottom}>
              <Text style={styles.heroLabel}>Special Offer</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {currentPopup.title}
              </Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {currentPopup.description ? (
              <Text style={styles.description}>{currentPopup.description}</Text>
            ) : null}

            {/* CTA */}
            {currentPopup.redirectUrl ? (
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: gradPair[0] }]}
                onPress={handleCTA}
                activeOpacity={0.88}
              >
                <Text style={styles.ctaBtnText}>
                  {currentPopup.ctaText || 'Book Now'}
                </Text>
                <Ionicons name="open-outline" size={18} color="#fff" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={handleClose} style={styles.skipBtn}>
              <Text style={styles.skipText}>No thanks, maybe later</Text>
            </TouchableOpacity>
          </View>

          {/* Pagination Dots */}
          {activePopups.length > 1 && (
            <View style={styles.dots}>
              {activePopups.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  hero: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 64,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badge: {
    position: 'absolute',
    top: 18,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 16,
    left: 18,
    right: 50,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  body: {
    padding: 22,
  },
  description: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  skipText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#f84464',
  },
});
