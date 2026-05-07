const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestEvents() {
    console.log("Creating test events for cities...");
    
    const events = [
        {
            title: 'Chennai Tech Summit 2026',
            city: 'Chennai',
            location: 'Chennai Trade Centre',
            district: 'Chennai',
            category: 'Concert',
            price: 500,
            date: '2026-06-15 10:00:00',
            img: 'https://images.unsplash.com/photo-1540575861501-7ce0e2204719?auto=format&fit=crop&w=800&q=80',
            status: 'active'
        },
        {
            title: 'Bengaluru Music Festival',
            city: 'Bengaluru',
            location: 'Palace Grounds',
            district: 'Bangalore',
            category: 'Music',
            price: 1500,
            date: '2026-07-20 18:00:00',
            img: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=800&q=80',
            status: 'active'
        },
        {
            title: 'Abohar Local Fair',
            city: 'Abohar',
            location: 'Main Ground',
            district: 'Fazilka',
            category: 'Community',
            price: 0,
            date: '2026-05-30 09:00:00',
            img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
            status: 'active'
        }
    ];

    for (const ev of events) {
        const { error } = await supabase.from('events').insert(ev);
        if (error) console.error(`Error inserting ${ev.title}:`, error);
        else console.log(`Inserted ${ev.title}`);
    }
    console.log("Test events creation complete.");
}

createTestEvents();
