const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  try {
    const sql = fs.readFileSync('scratch/20260524_wallet_settlement_system.sql', 'utf8');
    console.log("Executing SQL...");
    const { data, error } = await supabase.rpc('exec_raw_sql', { sql });
    if (error) {
      console.error("exec_raw_sql failed:", error.message);
    } else {
      console.log("exec_raw_sql success!");
    }
  } catch (e) {
    console.error("exec_raw_sql error:", e.message);
  }
}

run();
