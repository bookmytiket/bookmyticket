const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAdminRole() {
  const adminId = 'adbfb83d-0081-436b-8cd1-bc57a6c3501d';
  console.log(`Updating role for admin: ${adminId}...`);
  
  const { data, error } = await supabase
    .from('admins')
    .update({ role: 'super_admin' })
    .eq('id', adminId);

  if (error) {
    console.error("Error updating role:", error.message);
    process.exit(1);
  }

  console.log("Master Admin role updated to 'super_admin' successfully!");
}

updateAdminRole();
