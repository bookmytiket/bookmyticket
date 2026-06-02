require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('events').select('id, title, status, organiser_id, created_at, type').order('created_at', { ascending: false }).limit(5);
  console.log(error || data);
}
check();
