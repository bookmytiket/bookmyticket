const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvents() {
    console.log("Fetching last 5 events with status...");
    const { data, error } = await supabaseAdmin
        .from('events')
        .select('id, title, date, end_date, end_time, status')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error("Error fetching events:", error);
    } else {
        console.table(data);
    }
}

checkEvents();
