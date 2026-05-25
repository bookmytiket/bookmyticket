const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();

const supabase = createClient(url, key);

async function release() {
    const eventId = '3d6b43f6-2af4-47e7-87fc-e3a27bcb8bc4';
    
    // Delete the temp_locked seats
    const { data, error } = await supabase
        .from('seat_inventory')
        .delete()
        .eq('event_id', eventId)
        .eq('status', 'temp_locked');
        
    if (error) {
        console.error("Error releasing seats:", error);
    } else {
        console.log("Successfully released temp_locked seats.");
    }
}

release();
