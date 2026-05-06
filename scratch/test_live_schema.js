const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    console.log("Testing insert with end_date and end_time...");
    const { data, error } = await supabaseAdmin
        .from('events')
        .insert({
            title: 'Migration Test Event',
            end_date: '2026-12-31',
            end_time: '23:59'
        })
        .select();
    
    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert successful:", data[0]);
        // Cleanup
        await supabaseAdmin.from('events').delete().eq('id', data[0].id);
    }
}

testInsert();
