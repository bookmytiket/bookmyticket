const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key to check policies
);

async function check() {
  const { data, error } = await supabase.rpc('query_sql', {
    sql: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'memories';"
  }).catch(() => ({error: 'RPC failed'}));
  
  if (error && error === 'RPC failed') {
      // If RPC query_sql doesn't exist, we can't easily check policies from JS without pg module.
      console.log("No query_sql RPC.");
  } else {
      console.log("Policies:", data);
  }
}

check();
