const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const email = 'rajavasu97@gmail.com';
  console.log(`Checking user: ${email}`);

  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (pError) {
    console.log(`Profile Error: ${pError.message}`);
  } else if (profile) {
    console.log(`Profile Found: Role=${profile.role}, ID=${profile.id}`);
  } else {
    console.log(`Profile NOT Found.`);
  }

  const { data: authUser, error: aError } = await supabase.auth.admin.listUsers();
  if (aError) {
    console.log(`Auth Error: ${aError.message}`);
  } else {
    const user = authUser.users.find(u => u.email === email);
    if (user) {
      console.log(`Auth User Found: ID=${user.id}`);
    } else {
      console.log(`Auth User NOT Found.`);
    }
  }
}

checkUser();
