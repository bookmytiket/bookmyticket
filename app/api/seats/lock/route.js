import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { eventId, seatId, userId, expiresAt } = body;

        if (!eventId || !seatId || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Check if seat exists
        const { data: existingSeat } = await supabase
            .from('seat_inventory')
            .select('*')
            .eq('event_id', eventId)
            .eq('seat_number', seatId)
            .maybeSingle();

        if (existingSeat) {
            // 2. Check if available
            const isAvailable = existingSeat.status === 'available' || (existingSeat.lock_expires_at && new Date(existingSeat.lock_expires_at) < new Date());
            if (!isAvailable && existingSeat.locked_by !== userId) {
                return NextResponse.json({ error: 'Seat already taken' }, { status: 409 });
            }

            // 3. Update existing
            const { error: updateError } = await supabase
                .from('seat_inventory')
                .update({
                    status: 'temp_locked',
                    locked_by: userId,
                    lock_expires_at: expiresAt,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingSeat.id);
            
            if (updateError) throw updateError;
        } else {
            // 4. Insert new dynamic seat
            const { error: insertError } = await supabase
                .from('seat_inventory')
                .insert({
                    event_id: eventId,
                    seat_number: seatId,
                    status: 'temp_locked',
                    locked_by: userId,
                    lock_expires_at: expiresAt
                });
            
            if (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    return NextResponse.json({ error: 'Seat already taken' }, { status: 409 });
                }
                throw insertError;
            }
        }

        // 5. Log action asynchronously (don't await)
        supabase.from('seat_lock_logs').insert({
            seat_id: seatId,
            user_id: userId,
            action_type: 'locked'
        }).then();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Lock Seat API Error:', error);
        return NextResponse.json({ error: 'Failed to lock seat' }, { status: 500 });
    }
}
