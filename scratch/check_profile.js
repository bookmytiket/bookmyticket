const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: user, error: userError } = await supabase.auth.admin.getUserById('d9c3d7d2-e14f-42d8-ae75-9d5b30ce4d56');
  console.log("Auth User:", user, userError);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'd9c3d7d2-e14f-42d8-ae75-9d5b30ce4d56')
    .maybeSingle();
  console.log("Profile:", profile, profileError);
}

check();
