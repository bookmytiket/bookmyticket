import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Animated, Easing, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/Theme';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function PublicReviewsBanner() {
    const navigation = useNavigation();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReviews() {
            try {
                const { data: reviewsRaw, error: reviewError } = await supabase
                    .from('vendor_reviews')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (reviewError) throw reviewError;

                if (reviewsRaw && reviewsRaw.length > 0) {
                    const userIds = [...new Set(reviewsRaw.map(r => r.user_id))];
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, full_name, username')
                        .in('id', userIds);

                    const merged = reviewsRaw.map(r => ({
                        ...r,
                        profiles: profilesData?.find(p => p.id === r.user_id)
                    }));
                    setReviews(merged);
                }
            } catch (err) {
                console.error("Error fetching mobile reviews banner:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchReviews();
    }, []);

    if (loading || reviews.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.labelContainer}>
                <View style={styles.iconBox}>
                    <Ionicons name="chatbox-ellipses" size={14} color="#f84464" />
                </View>
                <View style={{ marginLeft: 8 }}>
                    <Text style={styles.labelText}>FEEDBACK</Text>
                    <Text style={styles.blinkText}>LIVE PULSE</Text>
                </View>
            </View>
            
            <FlatList
                horizontal
                data={[...reviews, ...reviews]}
                keyExtractor={(_, index) => `review-${index}`}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.reviewItem}
                        onPress={() => navigation.navigate('ServiceDetail', { id: item.vendor_id })}
                    >
                        <View style={styles.reviewerInfo}>
                            <Text style={styles.reviewerName}>
                                {item.profiles?.full_name || item.profiles?.username || 'User'}
                            </Text>
                            <View style={styles.stars}>
                                {[...Array(5)].map((_, i) => (
                                    <Ionicons 
                                        key={i} 
                                        name="star" 
                                        size={10} 
                                        color={i < item.rating ? "#fbbf24" : "#e2e8f0"} 
                                    />
                                ))}
                            </View>
                        </View>
                        <Text style={styles.comment} numberOfLines={1}>
                            "{item.comment}"
                        </Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Review</Text>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 54,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRightWidth: 2,
        borderRightColor: '#f1f5f9',
        height: '60%',
        backgroundColor: '#fff',
        zIndex: 10,
    },
    iconBox: {
        backgroundColor: '#fdf2f8',
        padding: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    labelText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 0.5,
        lineHeight: 12,
    },
    blinkText: {
        fontSize: 7,
        fontWeight: '900',
        color: '#f84464',
        letterSpacing: 1,
        marginTop: 1,
        opacity: 1, // Static opacity
    },
    listContent: {
        paddingLeft: 16,
        paddingRight: 100, // Extra space for "loop" feel
        alignItems: 'center',
    },
    reviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 40,
        gap: 10,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reviewerName: {
        fontSize: 12,
        fontWeight: '800',
        color: '#111827',
    },
    stars: {
        flexDirection: 'row',
        gap: 1,
    },
    comment: {
        fontSize: 12,
        color: '#475569',
        fontStyle: 'italic',
        fontWeight: '500',
        maxWidth: 200,
    },
    badge: {
        backgroundColor: '#fdf2f8',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fce7f3',
    },
    badgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#f84464',
        textTransform: 'uppercase',
    }
});
