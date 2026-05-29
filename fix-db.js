const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  // Find organisers with reupload_requested in digilocker_kyc_records
  const { data: records } = await supabase.from('digilocker_kyc_records').select('organizer_id').eq('kyc_status', 'reupload_requested');
  if (records && records.length > 0) {
    for (const r of records) {
      await supabase.from('organisers').update({ kyc_status: 'reupload_requested' }).eq('id', r.organizer_id);
      console.log(`Updated organiser ${r.organizer_id}`);
    }
  }
}
run();
