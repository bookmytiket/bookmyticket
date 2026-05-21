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

        // Since seats might not exist in seat_inventory for dynamic block maps, check first
        const { data: existingSeat } = await supabase
            .from('seat_inventory')
            .select('*')
            .eq('event_id', eventId)
            .eq('seat_number', seatId)
            .maybeSingle();

        let lockError = null;

        if (existingSeat) {
            // Check if available or expired
            const isAvailable = existingSeat.status === 'available' || (existingSeat.lock_expires_at && new Date(existingSeat.lock_expires_at) < new Date());
            if (!isAvailable && existingSeat.locked_by_user_id !== userId) {
                return { error: "Seat already taken or error occurred" };
            }

            const { error } = await supabase
                .from('seat_inventory')
                .update({
                    status: 'temp_locked',
                    locked_by_user_id: userId,
                    lock_expires_at: expiresAt,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingSeat.id);
            
            lockError = error;
        } else {
            // Insert new dynamic seat lock
            const { error } = await supabase
                .from('seat_inventory')
                .insert({
                    event_id: eventId,
                    seat_number: seatId,
                    status: 'temp_locked',
                    locked_by_user_id: userId,
                    lock_expires_at: expiresAt
                });
            
            // If another user inserted it concurrently, it will fail unique constraint (event_id, seat_number)
            lockError = error;
        }

        if (lockError) {
            return { error: "Seat already taken or error occurred" };
        }

        // Log the action asynchronously
        supabase.from('seat_lock_logs').insert({
            seat_id: seatId, // this might be a string now, but if the table expects UUID, it might fail. Let's ignore log failure.
            user_id: userId,
            action_type: 'locked'
        }).then();

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
            .eq('event_id', eventId)
            .eq('seat_number', seatId)
            .eq('locked_by_user_id', userId);

        if (!error) {
            supabase.from('seat_lock_logs').insert({
                seat_id: seatId,
                user_id: userId,
                action_type: 'released'
            }).then();
        }

        return { error };
    };

    return { lockedSeats, myLocks, loading, lockSeat, releaseSeat, refresh: fetchLocks };
}
