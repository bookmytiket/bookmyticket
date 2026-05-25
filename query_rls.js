const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'partner_requests' }).catch(() => ({}));
  console.log("Policies via RPC:", data, error);
  
  // Or just query pg_policies
  const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'partner_requests').catch(() => ({}));
  console.log("pg_policies:", policies, polErr);
}

run();
