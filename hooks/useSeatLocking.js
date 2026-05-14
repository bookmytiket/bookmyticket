"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useSeatLocking Hook
 * Handles real-time temporary seat locking for BookMyTicket.
 */
export function useSeatLocking(eventId, userId) {
    const [lockedSeats, setLockedSeats] = useState([]); // Seats locked by other users
    const [myLocks, setMyLocks] = useState([]); // Seats locked by current user
    const [loading, setLoading] = useState(true);

    const fetchLocks = useCallback(async () => {
        if (!eventId) return;
        setLoading(true);
        
        const { data, error } = await supabase
            .from('seat_inventory')
            .select('id, status, locked_by_user_id, lock_expires_at')
            .eq('event_id', eventId)
            .or(`status.eq.locked,status.eq.temp_locked`);

        if (!error && data) {
            const others = data.filter(s => s.locked_by_user_id !== userId && new Date(s.lock_expires_at) > new Date());
            const mine = data.filter(s => s.locked_by_user_id === userId && new Date(s.lock_expires_at) > new Date());
            setLockedSeats(others.map(s => s.id));
            setMyLocks(mine.map(s => s.id));
        }
        setLoading(false);
    }, [eventId, userId]);

    useEffect(() => {
        fetchLocks();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`seat_locks_${eventId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'seat_inventory',
                filter: `event_id=eq.${eventId}`
            }, (payload) => {
                const { new: newSeat, old: oldSeat } = payload;
                
                // If seat was released or sold
                if (newSeat.status === 'available' || newSeat.status === 'sold') {
                    setLockedSeats(prev => prev.filter(id => id !== newSeat.id));
                    setMyLocks(prev => prev.filter(id => id !== newSeat.id));
                } 
                // If seat was locked
                else if (newSeat.status === 'locked' || newSeat.status === 'temp_locked') {
                    if (newSeat.locked_by_user_id === userId) {
                        setMyLocks(prev => Array.from(new Set([...prev, newSeat.id])));
                    } else {
                        setLockedSeats(prev => Array.from(new Set([...prev, newSeat.id])));
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, userId, fetchLocks]);

    const lockSeat = async (seatId) => {
        if (!userId) return { error: "Login required" };

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        const { data, error } = await supabase
            .from('seat_inventory')
            .update({
                status: 'temp_locked',
                locked_by_user_id: userId,
                lock_expires_at: expiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', seatId)
            .eq('status', 'available') // Optimistic locking check
            .select()
            .single();

        if (error || !data) {
            return { error: "Seat already taken or error occurred" };
        }

        // Log the action
        await supabase.from('seat_lock_logs').insert({
            seat_id: seatId,
            user_id: userId,
            action_type: 'locked'
        });

        return { success: true };
    };

    const releaseSeat = async (seatId) => {
        const { error } = await supabase
            .from('seat_inventory')
            .update({
                status: 'available',
                locked_by_user_id: null,
                lock_expires_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', seatId)
            .eq('locked_by_user_id', userId);

        if (!error) {
            await supabase.from('seat_lock_logs').insert({
                seat_id: seatId,
                user_id: userId,
                action_type: 'released'
            });
        }

        return { error };
    };

    return { lockedSeats, myLocks, loading, lockSeat, releaseSeat, refresh: fetchLocks };
}
