
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .ilike('title', '%Test Marathon%');

    if (error) {
        console.error('Error fetching events:', error);
        return;
    }

    console.log('Test Marathon Events:');
    data.forEach(e =\u003e {
        console.log(`- ID: ${e.id}, Title: ${e.title}, Status: ${e.status}, Date: ${e.date}, Location: ${e.city || e.location || 'N/A'}`);
    });
}

checkEvents();
