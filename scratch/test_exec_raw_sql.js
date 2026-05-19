const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Testing exec_raw_sql...");
  try {
    const { data, error } = await supabase.rpc('exec_raw_sql', { sql: 'SELECT 1 as test' });
    if (error) {
      console.error("exec_raw_sql failed:", error.message);
    } else {
      console.log("exec_raw_sql success!", data);
    }
  } catch (e) {
    console.error("exec_raw_sql error:", e.message);
  }
}

test();
