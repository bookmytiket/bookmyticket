const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    const { data, error } = await supabase.from('seat_inventory').insert({
        event_id: '00000000-0000-0000-0000-000000000000',
        seat_number: 'VIP-A-1',
        status: 'temp_locked',
        locked_by: '00000000-0000-0000-0000-000000000000',
        lock_expires_at: new Date().toISOString()
    });
    console.log(error);
}

test();
