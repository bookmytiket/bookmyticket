const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log("Checking tournament_events columns...");
    const { data, error } = await supabase
        .from('tournament_events')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Available columns:", Object.keys(data[0] || {}));
    }
}

checkSchema();
