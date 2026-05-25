const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('email_settings').select('*').limit(1);
  if (error) console.log("email_settings error:", error.message);
  else console.log("email_settings data:", data);
}
check();
