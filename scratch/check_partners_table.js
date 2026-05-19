const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking partners table using Service Role Key...");
  const { data, error } = await supabase.from('partners').select('*').limit(1);
  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Query succeeded! Data:", data);
  }
}

check();
