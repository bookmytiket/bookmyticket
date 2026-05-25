const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data, error } = await supabase.from('organisers').select('*').eq('id', 'bd2538b1-68ca-45b9-a9b3-952fdd998f7b');
  console.log("Organisers:", data, error);
}
run();
