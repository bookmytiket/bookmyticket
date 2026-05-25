const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  // Sync partner_requests status for all Active organisers
  const { data: orgs } = await supabase.from('organisers').select('id, kyc_status');
  const { data: users } = await supabase.auth.admin.listUsers();
  
  for (const org of orgs) {
    if (org.kyc_status === 'Active') {
      const user = users.users.find(u => u.id === org.id);
      if (user) {
        await supabase.from('partner_requests').update({ status: 'Active' }).eq('email', user.email);
      }
    }
  }
  console.log("Synced partner_requests");
}
run();
