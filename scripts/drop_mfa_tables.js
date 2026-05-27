import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dropTables() {
  console.log("Dropping MFA tables...");
  
  // We can't use supabase-js to run raw DDL like DROP TABLE easily unless we use RPC
  // So we will just use the REST API to execute a SQL function, or if we don't have one,
  // we can't easily drop tables via JS unless we use the Postgres connection.
  // The easiest way is to use `psql`. Wait, `psql` wasn't available earlier.
  // I will just use the REST API to execute postgresql if we have an exec_sql rpc.
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'DROP TABLE IF EXISTS public.user_security_settings CASCADE;' });
  
  if (error) {
    console.error("RPC exec_sql failed (might not exist):", error);
    console.log("Cannot drop tables via RPC. Please drop `public.user_security_settings` manually in the Supabase Dashboard.");
  } else {
    console.log("Successfully dropped user_security_settings!");
  }
}

dropTables();
