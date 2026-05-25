const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'withdraw_requests');
  if (error) {
    // If we can't query pg_policies directly via API
    console.error("Error:", error);
  } else {
    console.log("Policies:", data);
  }
}
check();
