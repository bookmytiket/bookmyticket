const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/raja/bookmyticket/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('events').select('*').ilike('title', '%Marathon%').limit(1);
  console.log(JSON.stringify(data[0]));
}
run();
