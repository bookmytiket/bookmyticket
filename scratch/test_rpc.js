const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log("Testing exec_raw_sql RPC...");

    const sql = `SELECT 1 as test`;
    const { data, error } = await supabase.rpc('exec_raw_sql', { sql_query: sql }); // Note: check param name
    
    if (error) {
        console.log("exec_raw_sql failed (sql_query):", error.message);
        
        // Try 'sql' param name
        const { data: data2, error: error2 } = await supabase.rpc('exec_raw_sql', { sql });
        if (error2) {
            console.log("exec_raw_sql failed (sql):", error2.message);
        } else {
            console.log("exec_raw_sql success (sql):", data2);
        }
    } else {
        console.log("exec_raw_sql success (sql_query):", data);
    }
}

testRpc();
