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
        const { eventId, seatId, userId } = body;

        if (!eventId || !seatId || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('seat_inventory')
            .update({
                status: 'available',
                locked_by: null,
                lock_expires_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('event_id', eventId)
            .eq('seat_number', seatId)
            .eq('locked_by', userId);

        if (!error) {
            supabase.from('seat_lock_logs').insert({
                seat_id: seatId,
                user_id: userId,
                action_type: 'released'
            }).then();
        }

        return NextResponse.json({ success: true, error: error ? error.message : null });
    } catch (error) {
        console.error('Unlock Seat API Error:', error);
        return NextResponse.json({ error: 'Failed to unlock seat' }, { status: 500 });
    }
}
