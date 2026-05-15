const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testUpdate() {
    console.log("Testing tournament_events update...");
    const { data, error } = await supabase
        .from('tournament_events')
        .insert({
            id: '00000000-0000-0000-0000-000000000000', // Dummy ID
            registration_end_date: new Date().toISOString()
        });

    if (error) {
        if (error.message.includes('column "registration_end_date" of relation "tournament_events" does not exist')) {
            console.error("CRITICAL: registration_end_date column is MISSING in DB!");
        } else if (error.code === '23503') {
            console.log("SUCCESS: Column exists (Foreign key error is expected for dummy ID)");
        } else {
            console.log("Update result:", error.message);
        }
    } else {
        console.log("SUCCESS: Insert worked (unexpectedly?)");
    }
}

testUpdate();
