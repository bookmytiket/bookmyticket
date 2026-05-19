const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Testing exec_sql...");
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1 as test' });
    if (error) {
      console.error("exec_sql failed:", error.message);
    } else {
      console.log("exec_sql success!", data);
      return;
    }
  } catch (e) {
    console.error("exec_sql error:", e.message);
  }

  console.log("Testing exec_migration...");
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: 'SELECT 1 as test' })
    });
    if (res.ok) {
      console.log("exec_migration success!");
    } else {
      console.error("exec_migration failed:", await res.text());
    }
  } catch (e) {
    console.error("exec_migration error:", e.message);
  }
}

test();
