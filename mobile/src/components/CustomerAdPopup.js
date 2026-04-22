import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { resolveMobileBannerRedirect } from '../utils/bannerHelper';
import { Colors } from '../theme/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_PREFIX = 'bmt_adpopup_';
const LAST_INDEX_KEY = `${STORAGE_PREFIX}last_index`;
const SESSION_SHOWN_KEY = 'bmt_ad_shown_this_session';
const INITIAL_DELAY_MS = 6000; // Show after splash/branding (6s)

const DEFAULT_GRADIENTS = [
  ['#f84464', '#c026d3'],
  ['#6366f1', '#8b5cf6'],
  ['#f97316', '#ef4444'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#0ea5e9'],
];

async function getNextIndex(total) {
  try {
    const raw = await AsyncStorage.getItem(LAST_INDEX_KEY);
    const lastIndex = raw ? parseInt(raw, 10) : -1;
    return (lastIndex + 1) % total;
  } catch {
    return 0;
  }
}

async function updateLastIndex(index) {
  try {
    await AsyncStorage.setItem(LAST_INDEX_KEY, String(index));
  } catch {}
}

export default function CustomerAdPopup() {
  const { data: activePopups } = useSupabaseQuery('ad_popups', (q) => q.select('*').eq('is_active', true));
  const [currentPopup, setCurrentPopup] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const progressAnim = React.useRef(new Animated.Value(1)).current;
  const [timeLeft, setTimeLeft] = useState(5);
  const isProcessing = useRef(false);

  const findAndShowNext = useCallback(
    async (popups) => {
      if (!popups?.length || isProcessing.current) return;
      
      // Ensure we only show one per session
      if (global.bmtAdShownThisSession) return;
      
      isProcessing.current = true;
      global.bmtAdShownThisSession = true;

      const nextIndex = await getNextIndex(popups.length);
      const selected = popups[nextIndex];
      
      if (!selected) return;

      setCurrentPopup(selected);
      setCurrentIndex(nextIndex);
      setVisible(true);
      global.bmtAdShownThisSession = true;
      await updateLastIndex(nextIndex);
      
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: false, // width/flex doesn't support native driver well for all properties, but we'll use scaleX or just a width interpolation
        })
      ]).start();

      setTimeLeft(5);
    },
    [slideAnim, progressAnim]
  );

  useEffect(() => {
    if (!activePopups?.length) return;
    
    const checkTimer = setInterval(() => {
      if (!global.bmtPromotionActive && !global.bmtAdShownThisSession) {
        findAndShowNext(activePopups);
        clearInterval(checkTimer);
      }
    }, 500); // Check every 500ms for faster handoff
    return () => clearInterval(checkTimer);
  }, [activePopups, findAndShowNext]);

  // Auto-close logic
  useEffect(() => {
    if (!visible) return;
    
    // Reset timer to 5s
    setTimeLeft(5);
    progressAnim.setValue(1);

    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // 5s duration

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 5000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();

    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [visible, handleClose]);

  const handleClose = useCallback(async () => {
    // Animate out
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      slideAnim.setValue(300);
      progressAnim.setValue(1);
    });
  }, [slideAnim, progressAnim]);


  const handleCTA = useCallback(async () => {
    const { url, isExternal } = resolveMobileBannerRedirect(
      currentPopup?.redirect_type,
      currentPopup?.redirect_id
    );

    const finalUrl = url || currentPopup?.redirect_url;

    if (finalUrl) {
      if (isExternal || finalUrl.startsWith('http')) {
        const canOpen = await Linking.canOpenURL(finalUrl).catch(() => false);
        if (canOpen) {
          Linking.openURL(finalUrl).catch(() =>
            Alert.alert('Error', 'Could not open the link.')
          );
        } else {
          Alert.alert('Error', 'Could not open the link.');
        }
      } else {
        // Handle internal navigation if needed
        // For now, we can try to open it as a deep link
        Linking.openURL(finalUrl).catch(() =>
          Alert.alert('Error', 'Internal navigation failed.')
        );
      }
    }
    handleClose();
  }, [currentPopup, handleClose]);

  if (!currentPopup || !visible) return null;

  const gradPair = DEFAULT_GRADIENTS[currentIndex % DEFAULT_GRADIENTS.length];
  const hasImage = !!currentPopup.image_url;

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
                source={{ uri: currentPopup.image_url }}
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
            {currentPopup.badge_text ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currentPopup.badge_text}</Text>
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
            {currentPopup.redirect_url || currentPopup.redirect_id ? (
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: gradPair[0] }]}
                onPress={handleCTA}
                activeOpacity={0.88}
              >
                <Text style={styles.ctaBtnText}>
                  {currentPopup.cta_text || 'Book Now'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={handleClose} style={styles.skipBtn}>
              <Text style={styles.skipText}>No thanks, maybe later</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <View style={styles.timerContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: gradPair[0],
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} 
              />
            </View>
            <Text style={styles.timerText}>Closing in {timeLeft}s</Text>
          </View>
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
  timerContainer: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
  },
  timerText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
});
