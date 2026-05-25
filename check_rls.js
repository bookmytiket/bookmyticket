const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: policies, error: polErr } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'partner_requests');
  console.log("pg_policies for partner_requests:", JSON.stringify(policies, null, 2), polErr);
}

run();
