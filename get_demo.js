const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'demo@gmail.com');
  if (!user) return console.log("User not found");

  const { data: orgData } = await supabase.from('organisers').select('*').eq('id', user.id).single();
  console.log("ORGANISERS:", orgData);
}
run();
