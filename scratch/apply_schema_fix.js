const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFix() {
    console.log("Applying missing expiry_date column...");
    // We use a raw SQL query if possible, or try to use the REST API to trigger a schema change (unlikely)
    // Actually, the best way is to use the RPC if it exists, or just try to insert it.
    // Since I can't run raw SQL easily without a specific RPC, I'll try to find if there's a 'exec_sql' RPC.
    
    const sql = `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS expiry_date DATE;`;
    
    // Most Supabase projects have a custom RPC for running SQL in dev
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (error) {
        console.error("RPC exec_sql failed:", error);
        console.log("Please apply this manually in Supabase SQL Editor:");
        console.log(sql);
    } else {
        console.log("Column added successfully via RPC.");
    }
}

applyFix();
