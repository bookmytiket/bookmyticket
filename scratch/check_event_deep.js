
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEvent() {
    const slug = 'pollachi-trophy-2026-2a6133';
    console.log('Checking event for slug:', slug);

    const { data, error } = await supabase
        .from('events')
        .select('*, tournament_events(*)')
        .eq('slug', slug)
        .maybeSingle();

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data) {
        console.log('Event NOT found.');
        return;
    }

    console.log('Event found:');
    console.log('ID:', data.id);
    console.log('Title:', data.title);
    console.log('Type:', data.type);
    console.log('Event Type:', data.event_type);
    console.log('Status:', data.status);
    console.log('Tournament Details:', data.tournament_events ? 'FOUND' : 'NOT FOUND');
}

checkEvent();
