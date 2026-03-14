import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, Dimensions,
  StyleSheet, FlatList, Animated
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const SLIDE_INTERVAL = 3500;

const FEATURES = [
  { num: '01', title: 'Create Event Page', sub: 'Do-it-yourself approach' },
  { num: '02', title: 'Easy Sign-Up',      sub: 'Super quick activation' },
  { num: '03', title: 'Simple Registration', sub: 'No hassle, no paperwork' },
  { num: '04', title: 'Quick Setup',       sub: 'No setup cost, zero fee' },
];

function PromoSlide() {
  return (
    <LinearGradient
      colors={['#1a0a2e', '#2d1b69', '#0f172a']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.promoSlide}
    >
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <View style={styles.promoRow}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.promoTagline}>IT'S TIME TO</Text>
          <Text style={styles.promoTitle}>ROCK</Text>
          <Text style={styles.promoTitle}>
            EVEN<Text style={styles.titleHighlight}>TS</Text>
          </Text>
          <Text style={styles.promoCalendar}>Calendar</Text>
        </View>

        {/* Divider */}
        <View style={styles.promoDivider} />

        {/* Features */}
        <View style={styles.featuresList}>
          {FEATURES.map(f => (
            <View key={f.num} style={styles.featureRow}>
              <Text style={styles.featureNum}>{f.num}</Text>
              <View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <LinearGradient
        colors={['#f84464', '#c026d3']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaText}>🎫  ALL EVENTS START HERE</Text>
      </LinearGradient>
    </LinearGradient>
  );
}

function ImageSlide({ slide, onPress }) {
  return (
    <TouchableOpacity style={styles.imageSlide} onPress={onPress} activeOpacity={0.95}>
      <Image source={{ uri: slide.image }} style={styles.slideImage} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.slideGradient}
      />
      {(slide.title || slide.sub) && (
        <View style={styles.slideTextBlock}>
          {slide.title && <Text style={styles.slideTitle}>{slide.title}</Text>}
          {slide.sub   && <Text style={styles.slideSub}>{slide.sub}</Text>}
          <TouchableOpacity style={styles.getTicketBtn} onPress={onPress}>
            <Text style={styles.getTicketText}>Get Ticket</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HeroBannerMobile() {
  const router = useRouter();
  const activeAds = useQuery(api.banners.getActiveBanners) || [];

  const slides = React.useMemo(() => {
    const adSlides = activeAds.map(ad => ({
      image: ad.imageUrl,
      title: ad.title || '',
      sub: ad.subtitle || '',
      url: ad.link,
      isAd: true,
    }));
    // Always add PROMO slide first
    return [{ isPromo: true }, ...adSlides];
  }, [activeAds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef   = useRef(null);

  const goToSlide = (index) => {
    const safeIdx = Math.max(0, Math.min(index, slides.length - 1));
    setCurrentIndex(safeIdx);
    flatListRef.current?.scrollToIndex({ index: safeIdx, animated: true });
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, SLIDE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const renderSlide = ({ item, index }) => {
    if (item.isPromo) return <PromoSlide />;
    return (
      <ImageSlide
        slide={item}
        onPress={() => item.url && router.push(item.url)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Dot indicators */}
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View style={[styles.dot, i === currentIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },

  // ── Promo slide ──
  promoSlide: {
    width,
    padding: 20,
    paddingVertical: 24,
    position: 'relative',
  },
  glowOrb1: {
    position: 'absolute', top: -10, right: -10,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f84464', opacity: 0.2,
  },
  glowOrb2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#c026d3', opacity: 0.15,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleBlock: { flex: 1 },
  promoTagline: {
    fontSize: 9, fontWeight: '900',
    color: '#f84464', letterSpacing: 2, marginBottom: 2,
  },
  promoTitle: {
    fontSize: 32, fontWeight: '900',
    color: '#fff', lineHeight: 34,
  },
  titleHighlight: { color: '#f84464' },
  promoCalendar: {
    color: '#d8b4fe', fontSize: 15,
    fontStyle: 'italic', fontWeight: '700', marginTop: 4,
  },
  promoDivider: {
    width: 1, alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 14,
  },
  featuresList: { flex: 1.2, gap: 8 },
  featureRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureNum: {
    fontSize: 10, fontWeight: '900',
    color: '#f84464', width: 20, marginTop: 1,
  },
  featureTitle: {
    fontSize: 9, fontWeight: '800',
    color: '#e2e8f0', letterSpacing: 0.5,
  },
  featureSub: { fontSize: 9, color: '#94a3b8', marginTop: 1 },
  ctaButton: {
    borderRadius: 50, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: {
    color: '#fff', fontSize: 11,
    fontWeight: '900', letterSpacing: 1.5,
  },

  // ── Image slide ──
  imageSlide: {
    width,
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  slideImage: { width: '100%', height: '100%' },
  slideGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
  },
  slideTextBlock: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
  },
  slideTitle: {
    color: '#fff', fontSize: 22,
    fontWeight: '900', marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slideSub: {
    color: 'rgba(255,255,255,0.85)', fontSize: 13,
    fontWeight: '500', marginBottom: 12,
  },
  getTicketBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f84464',
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20,
  },
  getTicketText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── Dots ──
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 10, gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#f84464',
  },
});
