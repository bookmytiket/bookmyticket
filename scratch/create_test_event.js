
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestEvent() {
    const id = '00000000-0000-0000-0000-000000000000'; // Or generate one
    const slug = 'test-event-v1';
    
    console.log('Creating test event with slug:', slug);

    const { data, error } = await supabase
        .from('events')
        .upsert({
            id: 'e6a8e8e8-e8e8-e8e8-e8e8-e6a8e8e8e8e8',
            title: 'Test Event V1',
            slug: slug,
            status: 'published',
            type: 'Physical',
            date: '2026-12-31',
            location: 'Test Location',
            city: 'Test City',
            price: 0
        })
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Test event created:', data[0].id);
    }
}

createTestEvent();
