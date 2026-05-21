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
            .select('id, seat_number, status, locked_by, lock_expires_at')
            .eq('event_id', eventId)
            .or(`status.eq.locked,status.eq.temp_locked`);

        if (!error && data) {
            const others = data.filter(s => s.locked_by !== userId && new Date(s.lock_expires_at) > new Date());
            const mine = data.filter(s => s.locked_by === userId && new Date(s.lock_expires_at) > new Date());
            setLockedSeats(others.map(s => s.seat_number));
            setMyLocks(mine.map(s => s.seat_number));
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
                    setLockedSeats(prev => prev.filter(id => id !== newSeat.seat_number));
                    setMyLocks(prev => prev.filter(id => id !== newSeat.seat_number));
                } 
                // If seat was locked
                else if (newSeat.status === 'locked' || newSeat.status === 'temp_locked') {
                    if (newSeat.locked_by === userId) {
                        setMyLocks(prev => Array.from(new Set([...prev, newSeat.seat_number])));
                    } else {
                        setLockedSeats(prev => Array.from(new Set([...prev, newSeat.seat_number])));
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, userId, fetchLocks]);

    const lockSeat = useCallback(async (seatId) => {
        if (!userId) return { error: "Login required" };

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        try {
            const res = await fetch('/api/seats/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, seatId, userId, expiresAt })
            });
            const data = await res.json();
            
            if (!res.ok) {
                return { error: data.error || "Seat already taken or error occurred" };
            }
            return { success: true };
        } catch (err) {
            return { error: "Network error occurred" };
        }
    }, [eventId, userId]);

    const releaseSeat = useCallback(async (seatId) => {
        try {
            const res = await fetch('/api/seats/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, seatId, userId })
            });
            const data = await res.json();
            return { error: data.error };
        } catch (err) {
            return { error: "Network error" };
        }
    }, [eventId, userId]);

    return { lockedSeats, myLocks, loading, lockSeat, releaseSeat, refresh: fetchLocks };
}
