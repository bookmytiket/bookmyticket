import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, Dimensions, Pressable, FlatList, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { ChevronRight, ArrowRight, Sparkles, MapPin, Ticket } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Discover Amazing Events',
    description: 'Find the best concerts, sports matches, and marathons happening near you.',
    icon: <Sparkles size={100} color="#fff" />,
    colors: ['#f844a4', '#a855f7'],
  },
  {
    id: '2',
    title: 'Professional Services',
    description: 'Book top-rated makeup artists, photographers, and mehendi artists for your special day.',
    icon: <MapPin size={100} color="#fff" />,
    colors: ['#a855f7', '#6366f1'],
  },
  {
    id: '3',
    title: 'Instant Booking & Entry',
    description: 'Get e-tickets instantly and enjoy seamless QR-based entry with our smart wallet.',
    icon: <Ticket size={100} color="#fff" />,
    colors: ['#6366f1', '#f844a4'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    await SecureStore.setItemAsync('hasOpenedApp', 'true');
    router.replace('/auth/sign-in');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ONBOARDING_DATA}
        renderItem={({ item }) => <OnboardingItem item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        <Paginator data={ONBOARDING_DATA} scrollX={scrollX} />
        
        <View style={styles.buttonContainer}>
          {currentIndex < ONBOARDING_DATA.length - 1 ? (
            <Pressable style={styles.skipBtn} onPress={finishOnboarding}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          ) : <View style={styles.skipBtn} />}

          <Pressable onPress={handleNext}>
            <LinearGradient
              colors={ONBOARDING_DATA[currentIndex].colors as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <ArrowRight size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const OnboardingItem = ({ item }) => {
  return (
    <View style={[styles.itemContainer, { width }]}>
      <LinearGradient
        colors={item.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <MotiView 
        from={{ opacity: 0, scale: 0.5, translateY: 50 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.imageContainer}
      >
        <View style={styles.iconCircle}>
          {item.icon}
        </View>
      </MotiView>

      <View style={styles.textContainer}>
        <MotiText 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 300 }}
          style={styles.title}
        >
          {item.title}
        </MotiText>
        <MotiText 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 500 }}
          style={styles.description}
        >
          {item.description}
        </MotiText>
      </View>
    </View>
  );
};

const Paginator = ({ data, scrollX }) => {
  return (
    <View style={styles.paginator}>
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 24, 10],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View 
            key={i.toString()} 
            style={[styles.dot, { width: dotWidth, opacity }]} 
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
  paginator: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  skipBtn: {
    padding: 15,
    minWidth: 80,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
