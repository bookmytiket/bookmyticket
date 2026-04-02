import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function VideoHeroBanner() {
  const video = React.useRef(null);

  // Fallback to local video if possible, otherwise use a high-quality placeholder
  // The find command confirmed videoplayback.mp4 exists in the mobile root.
  const videoSource = require('../../videoplayback.mp4');

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={videoSource}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted
      />
      
      {/* Dark Overlay for Text Readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.overlay}
      />

      <View style={styles.content}>
        <Text style={styles.title}>
          Discover Your Next{'\n'}
          <Text style={styles.highlight}>Unforgettable Experience</Text>
        </Text>
        <Text style={styles.subtitle}>
          Explore concerts, shows, nightlife, and exclusive experiences happening around you.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 480, // Taller hero section for premium feel
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    position: 'absolute',
    zIndex: 2,
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 42,
    letterSpacing: -1,
    marginBottom: 16,
  },
  highlight: {
    color: '#f84464', // Matches Colors.secondary
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: '90%',
  },
});
