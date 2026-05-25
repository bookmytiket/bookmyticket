const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const email = 'ajayrathinam1998@gmail.com';
  
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  if (!user) return console.log("User not found");

  await supabase.from('organisers').update({ kyc_status: 'Submitted' }).eq('id', user.id);
  await supabase.from('partner_requests').update({ status: 'KYC Submitted' }).eq('email', email);
  console.log("Updated legacy tables to Submitted");
}
run();
