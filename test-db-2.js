const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('organisers').select('id, business_name, kyc_status, email').limit(5);
  console.log(data);
  const { data: records } = await supabase.from('digilocker_kyc_records').select('organizer_id, kyc_status').limit(5);
  console.log("Digilocker:", records);
}
run();
