const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/raja/bookmyticket/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const email = 'organiser@gmail.com';
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  console.log("Profile:", JSON.stringify(profile, null, 2));
  
  if (profile) {
    const { data: organiser } = await supabase.from('organisers').select('*').eq('id', profile.id).maybeSingle();
    console.log("Organiser Record:", JSON.stringify(organiser, null, 2));
  }
}
run();
