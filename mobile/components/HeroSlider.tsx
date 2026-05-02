import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.85;
const ITEM_SPACING = (width - ITEM_WIDTH) / 2;

interface HeroSliderProps {
  slides: any[];
  onPress: (slide: any) => void;
}

// Extracted into its own component so useAnimatedStyle is called at the
// top level of a function component (satisfies Rules of Hooks).
interface SlideItemProps {
  item: any;
  index: number;
  scrollX: ReturnType<typeof useSharedValue<number>>;
  onPress: (slide: any) => void;
  colors: { card: string };
}

function SlideItem({ item, index, scrollX, onPress, colors }: SlideItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (ITEM_WIDTH + 12),
      index * (ITEM_WIDTH + 12),
      (index + 1) * (ITEM_WIDTH + 12),
    ];
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9]);
    const opacity = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6]);
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[styles.slideContainer, animatedStyle]}>
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Image
          source={{ uri: item.img }}
          style={styles.image}
          contentFit="cover"
          transition={1000}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <View style={styles.textContainer}>
            <Text style={styles.subTitle}>{item.sub}</Text>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HeroSlider({ slides, onPress }: HeroSliderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  if (!slides || slides.length === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={slides}
        keyExtractor={(item, index) => item.id || index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: ITEM_SPACING }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SlideItem
            item={item}
            index={index}
            scrollX={scrollX}
            onPress={onPress}
            colors={colors}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  slideContainer: {
    width: ITEM_WIDTH,
    marginRight: 12,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  textContainer: {
    gap: 4,
  },
  subTitle: {
    color: '#fde047',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
});
