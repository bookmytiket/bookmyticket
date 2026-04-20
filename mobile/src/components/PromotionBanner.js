import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSupabaseQuery } from '../hooks/useSupabase';

export default function PromotionBanner() {
    const { data: activePromos } = useSupabaseQuery('promotions', (q) => q.select('*').eq('active', true));
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.6,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [fadeAnim]);

    if (!Array.isArray(activePromos) || activePromos.length === 0) return null;

    const promo = activePromos[0];

    return (
        <View style={styles.outerContainer}>
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                <Text style={styles.icon}>{promo.bogo ? "⚡" : "🏷️"}</Text>
                <View style={styles.textContainer}>
                    {promo.bogo ? (
                        <Text style={styles.promoText}>
                            BUY 1 GET 1 FREE! Code: <Text style={styles.code}>{promo.code}</Text>
                        </Text>
                    ) : (
                        <Text style={styles.promoText}>
                            GET {promo.type === "percent" ? `${promo.value}%` : `₹${promo.value}`} OFF! Code: <Text style={styles.code}>{promo.code}</Text>
                        </Text>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    container: {
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    icon: {
        fontSize: 18,
        marginRight: 8,
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    promoText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#65a30d', 
    },
    code: {
        color: '#2563eb',
        textDecorationLine: 'underline',
    },
});
