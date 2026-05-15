const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkColumns() {
    const { data, error } = await supabase
        .from('tournament_events')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching tournament_events:", error);
    } else {
        console.log("Columns in tournament_events:", Object.keys(data[0] || {}));
    }
}

checkColumns();
