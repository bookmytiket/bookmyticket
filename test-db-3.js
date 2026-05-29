const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('profiles').select('id, full_name').limit(1);
  const { data: orgData, error } = await supabase.from('organisers').select('*');
  console.log("Organisers: ", orgData ? orgData.length : error);
  const { data: vStat } = await supabase.from('organizer_verification_status').select('*');
  console.log("VStat: ", vStat);
}
run();
