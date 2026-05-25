const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data: events, error } = await supabase.from('events').select('*').ilike('title', '%Pollachi Marathon%');
  const ev = events[0];
  console.log("Price:", ev.price, "Type:", typeof ev.price);
  console.log("Normal:", ev.normal_ticket_price, "Type:", typeof ev.normal_ticket_price);
}
run();
