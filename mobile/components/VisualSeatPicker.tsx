import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { supabase } from '@/lib/supabase';
import UnifiedApi from '@/lib/unifiedApi';
import { ChevronLeft, CheckCircle2, XCircle, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VisualSeatPickerProps {
    eventId: string;
    onSeatSelect: (seats: any[]) => void;
    selectedSeats: any[];
    showtimeId?: string | null;
    eventBlocks?: any[];
}

export default function VisualSeatPicker({ eventId, onSeatSelect, selectedSeats, showtimeId, eventBlocks = [] }: VisualSeatPickerProps) {
    const [selectedBlock, setSelectedBlock] = useState<any>(null);
    const [seats, setSeats] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [seatsLoading, setSeatsLoading] = useState(false);

    const getRowLabel = (index: number, rowNaming: string) => {
        if (rowNaming === 'numeric') return String(index + 1);
        let label = '';
        let n = index;
        while (n >= 0) {
            label = String.fromCharCode((n % 26) + 65) + label;
            n = Math.floor(n / 26) - 1;
        }
        return label;
    };

    async function fetchInventoryAndGenerateSeats(block: any) {
        setSeatsLoading(true);
        try {
            // Generate static seats based on block properties (cols, rows)
            const generatedSeats = [];
            const rowCount = block.rows || block.rows_count || 1;
            const colCount = block.cols || 10;
            
            for (let rIdx = 0; rIdx < rowCount; rIdx++) {
                const rowLabel = getRowLabel(rIdx, block.rowNaming || 'alphabetic');
                for (let cIdx = 0; cIdx < colCount; cIdx++) {
                    const seatNum = block.numberingDirection === 'ltr' 
                        ? (cIdx + (block.startNumber || 1)) 
                        : (colCount - cIdx + (block.startNumber || 1) - 1);
                    const seatId = `${block.name || block.block_name}-${rowLabel}-${seatNum}`;
                    
                    generatedSeats.push({
                        id: seatId,
                        seat_number: seatId,
                        row_name: rowLabel,
                        column_number: seatNum,
                        price: block.price || block.base_price || 0,
                        status: 'available'
                    });
                }
            }
            setSeats(generatedSeats);
            
            const invData = await UnifiedApi.getSeatInventory(eventId, showtimeId || undefined);
            setInventory(Array.isArray(invData) ? invData : []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setSeatsLoading(false);
        }
    }

    useEffect(() => {
        if (selectedBlock) {
            queueMicrotask(() => fetchInventoryAndGenerateSeats(selectedBlock));
            
            // Subscribe to realtime updates for this showtime/event
            const subscription = supabase
                .channel(`inventory_mobile_${eventId}_${showtimeId || 'base'}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_inventory', filter: `event_id=eq.${eventId}` }, (payload) => {
                    const next = (payload.new || {}) as any;
                    // Filter by showtimeId if provided, otherwise only accept null showtime_id
                    if (showtimeId && next.showtime_id !== showtimeId) return;
                    if (!showtimeId && next.showtime_id !== null) return;
                    
                    setInventory(current => {
                        const safeCurrent = Array.isArray(current) ? current : [];
                        if (payload.eventType === 'INSERT') {
                            return [...safeCurrent, next];
                        }
                        const existingIdx = safeCurrent.findIndex(s => s.seat_number === next.seat_number);
                        if (existingIdx >= 0) {
                            const newArr = [...safeCurrent];
                            newArr[existingIdx] = next;
                            return newArr;
                        }
                        return [...safeCurrent, next];
                    });
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [selectedBlock, showtimeId]);

    const handleBlockSelect = (block: any) => {
        setSelectedBlock(block);
    };

    const toggleSeat = (seat: any) => {
        // If seat is booked/blocked, ignore
        const safeInventory = Array.isArray(inventory) ? inventory : [];
        const inv = safeInventory.find(i => i.seat_number === seat.seat_number);
        if (inv && ['sold', 'booked', 'blocked', 'maintenance', 'temp_locked', 'reserved'].includes(inv.status)) return;
        
        const isSelected = selectedSeats.find(s => s.id === seat.id);
        if (isSelected) {
            onSeatSelect(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            onSeatSelect([...selectedSeats, seat]);
        }
    };

    if (eventBlocks.length === 0) {
        return null; // Fallback to standard category booking
    }

    return (
        <View style={styles.container}>
            <AnimatePresence>
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
                            {eventBlocks.map((block: any) => (
                                <Pressable
                                    key={block.id}
                                    onPress={() => handleBlockSelect(block)}
                                    style={[styles.blockCard, { borderColor: block.color_code || '#fbcfe8' }]}
                                >
                                    <View style={[styles.blockColor, { backgroundColor: block.color_code || '#fbcfe8' }]} />
                                    <View style={styles.blockInfo}>
                                        <Text style={styles.blockName}>{block.name || block.block_name}</Text>
                                        <Text style={styles.blockPrice}>₹{block.price || block.base_price}</Text>
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
                            <Text style={styles.blockTitle}>{selectedBlock.name || selectedBlock.block_name}</Text>
                        </View>

                        {seatsLoading ? (
                            <ActivityIndicator size="large" color="#f84464" style={{ marginTop: 40 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seatsScroll}>
                                <View style={styles.seatsGrid}>
                                    {/* Simplified grid layout based on row/cols count */}
                                    {Array.from({ length: selectedBlock.rows || selectedBlock.rows_count || 1 }).map((_, rowIndex) => {
                                        const rowLabel = getRowLabel(rowIndex, selectedBlock.rowNaming || 'alphabetic');
                                        return (
                                        <View key={rowIndex} style={styles.seatRow}>
                                            <Text style={styles.rowLabel}>{rowLabel}</Text>
                                            {seats.filter(s => s.row_name === rowLabel)
                                                .map(seat => {
                                                    const isSelected = selectedSeats.find(s => s.id === seat.id);
                                                    const safeInventory = Array.isArray(inventory) ? inventory : [];
                                                    const inv = safeInventory.find(i => i.seat_number === seat.seat_number);
                                                    
                                                    const isSold = !isSelected && inv && ['sold', 'booked', 'blocked', 'maintenance', 'temp_locked', 'reserved'].includes(inv.status);
                                                    
                                                    return (
                                                        <Pressable
                                                            key={seat.id}
                                                            onPress={() => toggleSeat(seat)}
                                                            style={[
                                                                styles.seat,
                                                                isSold && styles.seatBooked,
                                                                isSelected && styles.seatSelected
                                                            ]}
                                                        >
                                                            {isSold ? (
                                                                <Text style={{ fontSize: 14, fontWeight: '900', color: '#166534' }}>X</Text>
                                                            ) : isSelected ? (
                                                                <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <View style={{ position: 'absolute' }}>
                                                                        <Heart size={26} color="#fff" fill="#fff" />
                                                                    </View>
                                                                    <Text style={[styles.seatText, { color: '#ef4444', zIndex: 1, marginTop: -2 }]}>{seat.column_number}</Text>
                                                                </View>
                                                            ) : (
                                                                <Text style={styles.seatText}>
                                                                    {seat.column_number}
                                                                </Text>
                                                            )}
                                                        </Pressable>
                                                    );
                                                })}
                                        </View>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        )}

                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.seat, { width: 16, height: 16 }]} />
                                <Text style={styles.legendText}>Available</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.seat, styles.seatSelected, { width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }]}>
                                    <View style={{position: 'absolute'}}>
                                        <Heart size={14} color="#fff" fill="#fff" />
                                    </View>
                                </View>
                                <Text style={styles.legendText}>Selected</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.seat, styles.seatBooked, { width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{fontSize: 8, fontWeight: '900', color: '#166534'}}>X</Text>
                                </View>
                                <Text style={styles.legendText}>Sold</Text>
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
        alignItems: 'center',
    },
    rowLabel: {
        width: 20,
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
        textAlign: 'center',
    },
    seat: {
        width: 36,
        height: 32,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#bfdbfe',
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    seatSelected: {
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
    },
    seatBooked: {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
    },
    seatText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1d4ed8',
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
