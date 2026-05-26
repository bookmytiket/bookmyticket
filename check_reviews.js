import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT polname, polcmd, polroles, polqual, polwithcheck FROM pg_policy WHERE polrelid = 'reviews'::regclass"
  });
  console.log("RPC Error:", error);
  console.log("Policies:", data);
}
check();
