const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();

const supabase = createClient(url, key); // Anon key might fail RLS, let's just see if we can read the schema correctly. Or let's see what happens

async function testLock() {
    const expiresAt = new Date(Date.now() + 600000).toISOString();
    const { data, error } = await supabase
        .from('seat_inventory')
        .insert({
            event_id: '3d6b43f6-2af4-47e7-87fc-e3a27bcb8bc4',
            seat_number: 'VIP-G-11',
            showtime_id: null,
            status: 'temp_locked',
            locked_by: 'f831918a-b902-4037-90f5-19042d5f876e',
            lock_expires_at: expiresAt
        });
    console.log("Error:", error);
}

testLock();
