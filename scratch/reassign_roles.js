const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function reassignRoles() {
  const normalUserId = 'adbfb83d-0081-436b-8cd1-bc57a6c3501d'; // rajavasu97@gmail.com
  const superAdminId = '0631f4a4-5735-430b-99d6-f5795c6f3934'; // hello@bookmyticket.net

  console.log("Reassigning roles...");

  // 1. Promote hello@bookmyticket.net
  console.log(`Setting ${superAdminId} as super_admin in admins table...`);
  const { error: insErr } = await supabase
    .from('admins')
    .upsert({ id: superAdminId, role: 'super_admin' });
  
  if (insErr) console.error("Error promoting new admin:", insErr.message);

  console.log(`Setting ${superAdminId} as staff in profiles table...`);
  const { error: profAdminErr } = await supabase
    .from('profiles')
    .update({ role: 'staff' })
    .eq('id', superAdminId);
  
  if (profAdminErr) console.error("Error updating new admin profile:", profAdminErr.message);

  // 2. Demote rajavasu97@gmail.com
  console.log(`Removing ${normalUserId} from admins table...`);
  const { error: delErr } = await supabase
    .from('admins')
    .delete()
    .eq('id', normalUserId);
  
  if (delErr) console.error("Error demoting old admin:", delErr.message);

  console.log(`Setting ${normalUserId} as user in profiles table...`);
  const { error: profUserErr } = await supabase
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', normalUserId);
  
  if (profUserErr) console.error("Error updating old admin profile:", profUserErr.message);

  console.log("Role reassignment complete!");
}

reassignRoles();
