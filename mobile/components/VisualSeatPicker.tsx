import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { supabase } from '@/lib/supabase';
import { DataService } from '@/services/DataService';
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VisualSeatPickerProps {
    eventId: string;
    onSeatSelect: (seats: any[]) => void;
    selectedSeats: any[];
}

export default function VisualSeatPicker({ eventId, onSeatSelect, selectedSeats }: VisualSeatPickerProps) {
    const [layouts, setLayouts] = useState<any[]>([]);
    const [selectedLayout, setSelectedLayout] = useState<any>(null);
    const [selectedBlock, setSelectedBlock] = useState<any>(null);
    const [seats, setSeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seatsLoading, setSeatsLoading] = useState(false);

    useEffect(() => {
        fetchLayouts();
    }, [eventId]);

    const fetchLayouts = async () => {
        setLoading(true);
        try {
            const data = await DataService.getVenueLayouts(eventId);
            setLayouts(data || []);
            if (data && data.length > 0) {
                setSelectedLayout(data[0]);
            }
        } catch (err) {
            console.error('Error fetching layouts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSeats = async (blockId: string) => {
        setSeatsLoading(true);
        try {
            const data = await DataService.getSeats(blockId);
            setSeats(data || []);
        } catch (err) {
            console.error('Error fetching seats:', err);
        } finally {
            setSeatsLoading(false);
        }
    };

    const handleBlockSelect = (block: any) => {
        setSelectedBlock(block);
        fetchSeats(block.id);
    };

    const toggleSeat = (seat: any) => {
        if (seat.status !== 'available') return;
        
        const isSelected = selectedSeats.find(s => s.id === seat.id);
        if (isSelected) {
            onSeatSelect(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            onSeatSelect([...selectedSeats, seat]);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f84464" />
                <Text style={styles.loadingText}>Loading Seating Map...</Text>
            </View>
        );
    }

    if (layouts.length === 0) {
        return null; // Fallback to standard category booking
    }

    return (
        <View style={styles.container}>
            <AnimatePresence mode="wait">
                {!selectedBlock ? (
                    <MotiView
                        key="blocks"
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        exit={{ opacity: 0, translateX: 20 }}
                        style={styles.blocksContainer}
                    >
                        <Text style={styles.sectionTitle}>Select a Section</Text>
                        <View style={styles.blocksGrid}>
                            {selectedLayout?.seat_blocks?.map((block: any) => (
                                <Pressable
                                    key={block.id}
                                    onPress={() => handleBlockSelect(block)}
                                    style={[styles.blockCard, { borderColor: block.color_code || '#ccc' }]}
                                >
                                    <View style={[styles.blockColor, { backgroundColor: block.color_code || '#ccc' }]} />
                                    <View style={styles.blockInfo}>
                                        <Text style={styles.blockName}>{block.block_name}</Text>
                                        <Text style={styles.blockPrice}>₹{block.base_price}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </MotiView>
                ) : (
                    <MotiView
                        key="seats"
                        from={{ opacity: 0, translateX: 20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        exit={{ opacity: 0, translateX: -20 }}
                        style={styles.seatsContainer}
                    >
                        <View style={styles.seatsHeader}>
                            <Pressable onPress={() => setSelectedBlock(null)} style={styles.backBtn}>
                                <ChevronLeft size={20} color="#1e293b" />
                                <Text style={styles.backText}>Back to Sections</Text>
                            </Pressable>
                            <Text style={styles.blockTitle}>{selectedBlock.block_name}</Text>
                        </View>

                        {seatsLoading ? (
                            <ActivityIndicator size="large" color="#f84464" style={{ marginTop: 40 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seatsScroll}>
                                <View style={styles.seatsGrid}>
                                    {/* Simplified grid layout based on row/cols count */}
                                    {Array.from({ length: selectedBlock.rows_count || 1 }).map((_, rowIndex) => (
                                        <View key={rowIndex} style={styles.seatRow}>
                                            {seats.filter(s => s.row_name === String.fromCharCode(65 + rowIndex) || s.row_name === String(rowIndex + 1))
                                                .map(seat => {
                                                    const isSelected = selectedSeats.find(s => s.id === seat.id);
                                                    const isBooked = seat.status !== 'available';
                                                    
                                                    return (
                                                        <Pressable
                                                            key={seat.id}
                                                            onPress={() => toggleSeat(seat)}
                                                            style={[
                                                                styles.seat,
                                                                isBooked && styles.seatBooked,
                                                                isSelected && styles.seatSelected,
                                                                { borderColor: selectedBlock.color_code }
                                                            ]}
                                                        >
                                                            <Text style={[
                                                                styles.seatText,
                                                                (isSelected || isBooked) && { color: '#fff' }
                                                            ]}>
                                                                {seat.seat_number}
                                                            </Text>
                                                        </Pressable>
                                                    );
                                                })}
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        )}

                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.seat, { width: 16, height: 16 }]} />
                                <Text style={styles.legendText}>Available</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.seat, styles.seatSelected, { width: 16, height: 16 }]} />
                                <Text style={styles.legendText}>Selected</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.seat, styles.seatBooked, { width: 16, height: 16 }]} />
                                <Text style={styles.legendText}>Booked</Text>
                            </View>
                        </View>
                    </MotiView>
                )}
            </AnimatePresence>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        minHeight: 300,
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    blocksContainer: {
        flex: 1,
    },
    blocksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        gap: 10,
    },
    blockCard: {
        width: (SCREEN_WIDTH - 50) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    blockColor: {
        height: 6,
        width: '100%',
    },
    blockInfo: {
        padding: 12,
    },
    blockName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
    },
    blockPrice: {
        fontSize: 12,
        fontWeight: '700',
        color: '#f84464',
        marginTop: 4,
    },
    seatsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    seatsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    backText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    blockTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    seatsScroll: {
        paddingVertical: 10,
    },
    seatsGrid: {
        gap: 8,
    },
    seatRow: {
        flexDirection: 'row',
        gap: 8,
    },
    seat: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    seatSelected: {
        backgroundColor: '#f84464',
        borderColor: '#f84464',
    },
    seatBooked: {
        backgroundColor: '#94a3b8',
        borderColor: '#94a3b8',
    },
    seatText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1e293b',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    }
});
