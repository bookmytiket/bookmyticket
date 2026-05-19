import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get event mapping
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const { data: mappings, error } = await supabaseAdmin
            .from('event_coupon_mapping')
            .select('*, partner_campaigns(*)')
            .eq('event_id', eventId);

        if (error) throw error;
        return NextResponse.json({ success: true, mappings });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// Map event to a campaign
export async function POST(request) {
    try {
        const body = await request.json();
        const { event_id, campaign_id, is_enabled, allocation_limit } = body;

        if (!event_id || !campaign_id) {
            return NextResponse.json({ error: 'Missing event_id or campaign_id' }, { status: 400 });
        }

        const { data: mapping, error } = await supabaseAdmin
            .from('event_coupon_mapping')
            .upsert({
                event_id,
                campaign_id,
                is_enabled: is_enabled !== undefined ? is_enabled : true,
                allocation_limit: allocation_limit || 100
            }, { onConflict: 'event_id,campaign_id' })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, mapping });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
