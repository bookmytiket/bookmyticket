const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
      .from('withdraw_requests')
      .select('*, organisers:organiser_id(*)').limit(1);
  if (error) console.error("Query Error:", error);
  else console.log(JSON.stringify(data, null, 2));
}
check();
