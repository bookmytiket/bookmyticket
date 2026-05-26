import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase configuration is missing on server' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*, tournament_events!event_id(*), marathon_config!event_id(*), tournament_categories!event_id(*), sports_events!event_id(*), competition_categories!event_id(*), competition_events!event_id(*)')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('Event Detail API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
