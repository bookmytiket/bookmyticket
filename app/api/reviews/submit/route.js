import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { event_id, booking_id, rating, title, content, user_id } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!event_id || !rating || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Use service role key to bypass RLS for inserting the review
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabaseAdmin.from('reviews').insert({
            user_id,
            event_id,
            booking_id: booking_id || null,
            rating,
            title: title || null,
            content,
            is_verified: !!booking_id
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Submit review error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
