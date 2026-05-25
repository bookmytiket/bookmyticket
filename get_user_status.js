const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  try {
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const emailToFind = 'ajayrathinam1998@gmail.com';
    const user = users.users.find(u => u.email === emailToFind);
    if (!user) {
      console.log("User not found");
      return;
    }

    const { data: orgData } = await supabase.from('organisers').select('*').eq('id', user.id).single();
    console.log("ORGANISERS:", orgData);
    
    const { data: profData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    console.log("PROFILES:", profData);
  } catch (err) {
    console.log(err.message);
  }
}
run();
