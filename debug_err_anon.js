const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
      .from('withdraw_requests')
      .select('*, organisers:organiser_id(full_name, id, email), bank_details:bank_details_id(*)');
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
check();
