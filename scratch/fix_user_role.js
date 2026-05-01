const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixUserRole() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const email = 'rajavasu97@gmail.com';
  console.log(`Updating role for: ${email}`);

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'branding_partner' })
    .eq('email', email)
    .select();

  if (error) {
    console.log(`Update Error: ${error.message}`);
  } else {
    console.log(`Update Success: `, data);
  }
}

fixUserRole();
