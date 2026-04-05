import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SequentialVideoBanner() {
    const banners = useQuery(api.mobileBanners.getActive);
    const allConfig = useQuery(api.systemConfig.getAllConfig);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [playlist, setPlaylist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Config mode: "sequential" or "random"
    const playbackModeRaw = allConfig && allConfig["mobile_banner_playback_mode"];
    const playbackMode = playbackModeRaw ? (typeof playbackModeRaw === "string" ? JSON.parse(playbackModeRaw) : playbackModeRaw) : "sequential";

    const videoRef = useRef(null);

    // Initial configuration of audio to allow playback without ringtone interrupting
    useEffect(() => {
        const setAudioParams = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            } catch (e) {
                console.warn(e);
            }
        };
        setAudioParams();
    }, []);

    // Load and optionally shuffle playlist
    useEffect(() => {
        if (banners !== undefined) {
            // Setup playlist
            if (banners.length === 0) {
                setPlaylist([]);
                setIsLoading(false);
                return;
            }

            let newPlaylist = [...banners];
            if (playbackMode === "random") {
                // Fisher-Yates shuffle
                for (let i = newPlaylist.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newPlaylist[i], newPlaylist[j]] = [newPlaylist[j], newPlaylist[i]];
                }
            }
            setPlaylist(newPlaylist);
            setCurrentIndex(0);
            setIsLoading(false);
        }
    }, [banners, playbackMode]);

    // Handle Image display duration manually if it's an image
    useEffect(() => {
        if (!playlist || playlist.length === 0) return;
        
        const currentBanner = playlist[currentIndex];
        let timer;
        
        if (currentBanner.type === "image") {
            // Show image for 5 seconds before moving to next
            timer = setTimeout(() => {
                handleNext();
            }, 5000);
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [currentIndex, playlist]);

    const handleNext = () => {
        if (playlist.length <= 1) {
            // If only 1 item, and it's video, it will loop naturally.
            // If image, we re-trigger.
            setCurrentIndex(0);
            return;
        }
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
    };

    const handlePlaybackStatusUpdate = (status) => {
        if (!status.isLoaded) return;
        
        if (status.didJustFinish) {
            handleNext();
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={Colors.secondary} />
            </View>
        );
    }

    if (!playlist || playlist.length === 0) {
        return null;
    }

    const activeBanner = playlist[currentIndex];

    // Fallback if media is missing
    if (!activeBanner?.resolvedUrl) return null;

    return (
        <View style={styles.container}>
            <View style={styles.mediaContainer}>
                {activeBanner.type === "video" ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: activeBanner.resolvedUrl }}
                        style={styles.media}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isMuted={isMuted}
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                        isLooping={playlist.length === 1} // Loop if it's the only banner
                    />
                ) : (
                    <Image
                        source={{ uri: activeBanner.resolvedUrl }}
                        style={styles.media}
                        resizeMode="cover"
                    />
                )}

                {/* Optional Controls */}
                {activeBanner.type === "video" && (
                    <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                        <Ionicons 
                            name={isMuted ? "volume-mute" : "volume-high"} 
                            size={20} 
                            color="#fff" 
                        />
                    </TouchableOpacity>
                )}

                {/* Progress Indicators */}
                {playlist.length > 1 && (
                    <View style={styles.progressContainer}>
                        {playlist.map((_, i) => (
                            <View 
                                key={i} 
                                style={[
                                    styles.progressItem, 
                                    i === currentIndex && styles.progressItemActive
                                ]} 
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: 250, // Fixed height area for hero
        backgroundColor: '#000',
    },
    mediaContainer: {
        flex: 1,
        position: 'relative',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    muteButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    progressContainer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 6,
        zIndex: 10,
    },
    progressItem: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    progressItemActive: {
        backgroundColor: '#fff',
    }
});
