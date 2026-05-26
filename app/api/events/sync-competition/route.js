import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase configuration is missing on server' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const body = await request.json();
        const { eventId, ageGroups, compEvents, formFields } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        // 1. Sync competition_categories
        if (ageGroups && ageGroups.length > 0) {
            await supabase.from("competition_categories").delete().eq("event_id", eventId);
            await supabase.from("competition_categories").insert(ageGroups.map(c => ({
                event_id: eventId, 
                category_name: c.name || c.category_name, 
                min_age: c.minAge || c.min_age || 0, 
                max_age: c.maxAge || c.max_age || 99, 
                gender: c.gender || 'All'
            })));
        }

        // 2. Sync competition_events
        if (compEvents && compEvents.length > 0) {
            await supabase.from("competition_events").delete().eq("event_id", eventId);
            await supabase.from("competition_events").insert(compEvents.map(e => ({
                event_id: eventId, 
                event_name: e.name || e.event_name, 
                distance: e.distance || "", 
                fee: e.price || e.fee || 0, 
                gender: e.gender || 'All'
            })));
        }

        // 3. Sync registration_fields
        if (formFields && formFields.length > 0) {
            await supabase.from("registration_fields").delete().eq("event_id", eventId);
            await supabase.from("registration_fields").insert(formFields.map((f, i) => ({
                event_id: eventId,
                field_key: f.label?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `field_${i}`,
                label: f.label || `Field ${i}`,
                field_type: f.type || 'text',
                options: Array.isArray(f.options) ? f.options.filter(Boolean) : (typeof f.options === 'string' ? f.options.split(',') : null),
                is_required: !!f.required,
                sort_order: i,
                is_active: true
            })));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sync Competition API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
