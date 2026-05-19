const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'bookings' });
  if (error) {
    // If RPC doesn't exist, try querying pg_catalog or query direct SQL using a known endpoint
    // Wait, let's do query via pg_catalog or similar.
    // Let's write a simple query.
    console.error("RPC Error:", error.message);
    
    // Let's try raw SQL run script since we have test_exec_sql.js in scratch
  } else {
    console.log("Constraints:", data);
  }
}
check();
