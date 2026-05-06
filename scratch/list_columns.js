const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listColumns() {
    console.log("Listing columns for 'events' table...");
    const { data, error } = await supabaseAdmin
        .rpc('get_table_columns', { table_name: 'events' });
    
    if (error) {
        // Fallback: Try a raw query via a temporary table if RPC doesn't exist
        console.log("RPC failed, trying information_schema via query...");
        const { data: cols, error: err } = await supabaseAdmin
            .from('events')
            .select('*')
            .limit(1);
        
        if (err) {
            console.error("Query failed:", err);
        } else {
            console.log("Columns present in first record:", Object.keys(cols[0] || {}));
        }
    } else {
        console.log("Columns:", data);
    }
}

listColumns();
