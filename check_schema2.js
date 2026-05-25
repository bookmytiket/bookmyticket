const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const tables = ['organizer_profiles', 'organizer_bank_details', 'organizer_kyc_documents', 'organizer_verification_status', 'kyc_details', 'organisers'];
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('id').limit(1);
      console.log(`Table ${t}:`, error ? error.message : 'Exists');
    } catch (err) {
      console.log(`Table ${t} error:`, err.message);
    }
  }
}
run();
