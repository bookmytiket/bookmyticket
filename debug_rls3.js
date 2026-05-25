const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_table_rls', { t_name: 'withdraw_requests' });
  if (error) {
    // try querying pg_class
    const { data: d2, error: e2 } = await supabase.from('pg_class').select('relrowsecurity').eq('relname', 'withdraw_requests');
    if (e2) console.error("Error", e2);
    else console.log("RLS Enabled?", d2);
  }
}
check();
