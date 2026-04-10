import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useToast } from '../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Toast = () => {
    const { toast, hideToast } = useToast();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (toast) {
            // Show
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: Platform.OS === 'ios' ? 60 : 40,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                })
            ]).start();

            // Auto-hide
            const timer = setTimeout(() => {
                dismiss();
            }, 3500);

            return () => clearTimeout(timer);
        }
    }, [toast]);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            hideToast();
        });
    };

    if (!toast) return null;

    const getColors = () => {
        switch (toast.type) {
            case 'success': return ['#10b981', '#059669'];
            case 'error': return ['#f43f5e', '#e11d48'];
            default: return ['#0ea5e9', '#0284c7'];
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'close-circle';
            default: return 'information-circle';
        }
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={dismiss}>
                <LinearGradient
                    colors={getColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.toast}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name={getIcon()} size={24} color="#fff" />
                    </View>
                    <View style={styles.content}>
                        <Text style={styles.title}>
                            {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notice'}
                        </Text>
                        <Text style={styles.message}>{toast.message}</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    toast: {
        width: width - 40,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    iconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    message: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        fontWeight: '500',
    },
});

export default Toast;
