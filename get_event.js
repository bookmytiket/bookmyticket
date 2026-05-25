const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data: events, error } = await supabase.from('events').select('*').ilike('title', '%Pollachi Marathon%');
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(events, null, 2));
}
run();
