
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'kloudinfotech.in@gmail.com';
  console.log(`Checking user: ${email}`);

  // 1. Auth check
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === email);
  
  if (!authUser) {
    console.log('Auth user not found');
    return;
  }
  console.log('Auth ID:', authUser.id);
  console.log('Auth User Role:', authUser.role);
  console.log('User Metadata Role:', authUser.user_metadata?.role);

  // 2. Profile check
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  console.log('Profile Role:', profile?.role);

  // 3. Service Provider check
  const { data: sp } = await supabase.from('service_providers').select('*').eq('id', authUser.id).maybeSingle();
  console.log('In service_providers:', !!sp);
  if (sp) console.log('SP Data:', sp);

  // 4. Vendors check
  const { data: vendor } = await supabase.from('vendors').select('*').eq('id', authUser.id).maybeSingle();
  console.log('In vendors:', !!vendor);

  // 5. Organisers check
  const { data: organiser } = await supabase.from('organisers').select('*').eq('id', authUser.id).maybeSingle();
  console.log('In organisers:', !!organiser);
}

checkUser().catch(console.error);
