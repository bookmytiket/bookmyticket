const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('withdraw_requests').select('*');
  console.log("Service role:", data?.length);

  // Now create an authenticated client using an admin JWT
  // But wait, I don't have the admin's JWT. 
  // Let me just check if RLS is enabled on withdraw_requests using psql.
}
check();
