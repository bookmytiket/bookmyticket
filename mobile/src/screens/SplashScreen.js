import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Dynamic Splash Screen for BookMyTicket
export default function SplashScreen() {
  let navigation;
  try {
    navigation = useNavigation();
  } catch (e) {
    navigation = null;
  }
  
  // Animation Values
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Perform Entry Animations
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.1, // Slight overscale for pop effect
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-transition to Home after 2.5 seconds (only if navigation is available)
    const timer = setTimeout(() => {
      if (navigation) {
        navigation.replace('MainTabs');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Dynamic Logo Animated View */}
      <Animated.View style={[
        styles.logoContainer,
        {
          opacity: opacity,
          transform: [
            { scale: scale }
          ]
        }
      ]}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFDB00', // Premium Yellow
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: width * 0.8,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  }
});
