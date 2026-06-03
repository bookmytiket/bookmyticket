const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log("Checking memories table...");
  const { data, error } = await supabase.from('memories').select('*').limit(1);
  console.log("Select Error:", error);
  console.log("Data:", data);
}

check();
