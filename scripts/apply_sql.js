const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const sql = fs.readFileSync('supabase/migrations/20260527_brand_kyc.sql', 'utf8');
    
    console.log("Attempting to run migration via exec_raw_sql RPC...");
    const { data, error } = await supabaseAdmin.rpc('exec_raw_sql', { sql: sql });
    
    if (error) {
        console.error("RPC Error:", error);
        
        console.log("\nAttempting fallback rpc 'exec_sql'...");
        const { data: d2, error: e2 } = await supabaseAdmin.rpc('exec_sql', { query: sql });
        if (e2) {
             console.error("Fallback RPC Error:", e2);
             console.log("\nPlease manually execute supabase/migrations/20260527_brand_kyc.sql in the Supabase Dashboard SQL Editor.");
        } else {
             console.log("Migration executed successfully via fallback RPC!");
        }
    } else {
        console.log("Migration executed successfully via exec_raw_sql!");
    }
}

run();
