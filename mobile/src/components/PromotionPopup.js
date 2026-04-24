import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { resolveMobileBannerRedirect } from '../utils/bannerHelper';
import { Colors } from '../theme/Theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// TIMING CONSTANTS
const BRANDING_DURATION = 5000; // 5s for the initial branding
const ROTATION_DURATION = 5000; // 5s for each rotating banner

export default function PromotionPopup({ onFinish }) {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  
  const [step, setStep] = useState(0); // 0: Initial Branding, 1: Rotating Banners
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BRANDING_DURATION / 1000);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Data fetching
  const brandingRes = useSupabaseQuery('site_branding', (q) => q, [], { realtime: false });
  const brandingArr = brandingRes?.data || [];
  const branding = (brandingArr && brandingArr[0]) || {
    powered_by_logo_url: "https://www.bookmyticket.net/logo.png",
    mobile_splash_url: "https://yayrfycnmbpeeintfcvf.supabase.co/storage/v1/object/public/system-assets/branding_popup.png"
  };

  const eventsRes = useSupabaseQuery('events', (q) => 
    q.select('*').order('created_at', { ascending: false }).limit(3)
  );
  const latestEvents = eventsRes?.data || [];

  // Fetch professional services (vetted organisers)
  const servicesRes = useSupabaseQuery('service_providers', (q) => 
    q.select('*, profiles:organiser_id(full_name, username, avatar_url)').limit(3)
  );
  const topServices = servicesRes?.data || [];

  const turfsRes = useSupabaseQuery('turfs', (q) => 
    q.select('*').eq('status', 'Active').limit(2)
  );
  const topTurfs = turfsRes?.data || [];

  const banners = useMemo(() => {
    const list = [];

    // Add Branding (Splash) - Always First
    list.push({
        ...branding,
        type: branding.redirect_type || 'branding',
        displayType: 'Welcome',
        id: branding.redirect_id || branding.id || branding.redirect_url || branding.site_url || '',
        title: branding.name || 'BookMyTicket',
        image: branding.mobile_splash_url || "https://yayrfycnmbpeeintfcvf.supabase.co/storage/v1/object/public/system-assets/branding_popup.png",
        description: 'Discover and book the best events and services in your city.'
    });

    // Add Events
    latestEvents.forEach(e => {
      list.push({
        ...e,
        type: 'event', // Force type for redirect helper
        displayType: e.type || 'Event',
        id: e.id || e._id,
        title: e.title,
        image: e.image_url,
        description: e.description,
        date: e.date,
        price: e.price
      });
    });

    // Add Services
    topServices.forEach(s => {
      list.push({
        ...s,
        type: 'service', // Force type for redirect helper
        displayType: s.category || 'Service',
        id: s.id || s._id,
        title: s.service_name || s.profiles?.full_name,
        image: s.image_url || s.profiles?.avatar_url,
        description: s.description || 'Professional services for your events.'
      });
    });

    // Add Turfs
    topTurfs.forEach(t => {
      list.push({
        ...t,
        type: 'turf', // Force type for redirect helper
        displayType: 'Turf',
        id: t.id || t._id,
        title: t.name,
        image: t.image_url,
        description: t.description
      });
    });

    return list.filter(b => b.image);
  }, [branding, latestEvents, topServices, topTurfs]);

  useEffect(() => {
    // Only attempt to show if not already shown in this app session
    if (!global.bmtPromotionShownThisAppLaunch) {
      // Wait for banners to be ready before showing
      if (banners.length > 0) {
        setVisible(true);
        global.bmtPromotionShownThisAppLaunch = true;
      }
    } else {
      // Already shown this session, just trigger finish for next popups
      if (onFinish) onFinish();
    }
  }, [banners.length]); // Re-run when banners load

  // Coordination: Don't show if ad is active
  useEffect(() => {
    if (visible) {
      global.bmtPromotionActive = true;
    } else {
      global.bmtPromotionActive = false;
    }
    return () => { global.bmtPromotionActive = false; };
  }, [visible]);

    // Initial visible check and rotation
    // Initial visible check and rotation
    useEffect(() => {
        const getIndex = async () => {
            if (banners.length > 0 && visible) {
                try {
                    const storedIndex = await AsyncStorage.getItem('bmt_promotion_last_index');
                    let lastIdx = storedIndex ? parseInt(storedIndex, 10) : -1;
                    
                    // Increment for next time
                    const nextIdx = (lastIdx + 1) % banners.length;
                    
                    // Use nextIdx for current display
                    setCurrentIndex(nextIdx);
                    
                    // Save for the NEXT app launch
                    await AsyncStorage.setItem('bmt_promotion_last_index', String(nextIdx));
                } catch (err) {
                    console.error('[Promotion] Rotation error:', err);
                    setCurrentIndex(0);
                }
            }
        };
        
        if (visible && banners.length > 0) {
            getIndex();
        }
    }, [visible, banners.length]);

  // Timer and Rotation Logic
  useEffect(() => {
    if (!visible) return;

    let duration = step === 0 ? BRANDING_DURATION : ROTATION_DURATION;
    setCanClose(false);
    setTimeLeft(duration / 1000);

    // Reset progress bar
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Transition timer
    const timer = setTimeout(() => {
      handleNext();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [step, currentIndex, visible]);

  const handleNext = useCallback(() => {
    // Branding only - just finish
    setVisible(false);
    if (onFinish) onFinish();
  }, [onFinish]);

  const handleClose = () => {
    if (!canClose) return;
    setVisible(false);
    if (onFinish) onFinish();
  };

  const handleCTA = (banner) => {
    if (!visible) return;
    
    const current = banner || banners[currentIndex];
    if (!current) return;
    
    const { route, params, url, isExternal } = resolveMobileBannerRedirect(
      current.type,
      current.id
    );

    console.log('[Promotion] Redirection Resolved:', { route, params, url });

    // Close Modal FIRST for better stability
    setVisible(false);
    if (onFinish) onFinish();

    if (isExternal && url) {
      setTimeout(() => {
        require('react-native').Linking.openURL(url).catch(err => {
            require('react-native').Alert.alert("Error", "Could not open: " + url);
        });
      }, 250);
    } else if (route) {
      setTimeout(() => {
        try {
          navigation.navigate(route, params);
        } catch (err) {
          console.error("Navigation Error:", err);
          navigation.navigate('Events', { category: 'All' });
        }
      }, 250);
    } else {
      // Default fallback
      setTimeout(() => {
        navigation.navigate('Events', { category: 'All' });
      }, 250);
    }
  };

  if (!visible || banners.length === 0) return null;

  const currentBanner = banners[currentIndex] || banners[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Main Banner Image */}
          <Image
            source={{ uri: currentBanner.image }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
            style={styles.gradient}
          />

          {/* Banner Info */}
          <View style={styles.infoContainer}>
            {currentBanner.type !== 'branding' && (
               <View style={styles.badge}>
                  <Text style={styles.badgeText}>{(currentBanner.displayType || currentBanner.type).toUpperCase()}</Text>
               </View>
            )}
            <Text style={styles.title}>{currentBanner.title}</Text>
            <Text style={styles.description} numberOfLines={3}>{currentBanner.description}</Text>
            
            {currentBanner.type === 'event' && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color="#fbbf24" />
                <Text style={styles.metaText}>{currentBanner.date}</Text>
                <Text style={styles.metaText}> • ₹{currentBanner.price}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.ctaButton} onPress={() => handleCTA(currentBanner)}>
              <LinearGradient
                colors={Colors.gradient}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>BOOK NOW</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Progress Bar & Timer */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
               <Animated.View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]} 
               />
            </View>
            <Text style={styles.timerText}>{timeLeft > 0 ? `Closing in ${timeLeft}s` : 'Available to Skip'}</Text>
          </View>

          {/* Close Button (Disabled during countdown) */}
          <TouchableOpacity 
            style={[styles.closeBtn, !canClose && styles.closeBtnDisabled]} 
            onPress={handleClose}
            disabled={!canClose}
          >
            <Ionicons name="close" size={24} color={canClose ? "#fff" : "rgba(255,255,255,0.3)"} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
  },
  badge: {
    backgroundColor: Colors.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  metaText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },
  timerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
