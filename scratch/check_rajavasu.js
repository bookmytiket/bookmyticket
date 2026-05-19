const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'rajavasu97@gmail.com');
  console.log("Auth User:", user);

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    console.log("Profile:", profile, profileError);
  }
}

check();
