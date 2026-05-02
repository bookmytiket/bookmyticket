const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/raja/bookmyticket/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('events').update({ 
    location: 'Coimbatore, Tamil Nadu',
    venue: 'Nehru Stadium',
    city: 'Coimbatore',
    status: 'Active',
    featured: true
  }).ilike('title', '%Marathon%');
  if (error) console.error(error);
  else console.log("Updated Marathon successfully!");
}
run();
