const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('organisers').select('id, business_name, kyc_status').eq('kyc_status', 'reupload_requested').limit(10);
  console.log(data);
}
run();
