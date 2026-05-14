
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvent() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .ilike('title', '%Pollachi%')
        .single();
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Event Title:', data.title);
    console.log('Event Type:', data.type);
    console.log('Sports Details:', JSON.stringify(data.sports_details, null, 2));
    console.log('Dynamic Config:', JSON.stringify(data.dynamic_config, null, 2));
}

checkEvent();
