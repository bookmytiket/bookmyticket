const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('organisers').select('*').limit(1);
  if (data && data[0]) {
    console.log("Columns:", Object.keys(data[0]));
    console.log("Organizer status value:", data[0].status);
  } else {
    console.log("No organizers found or error:", error);
  }
}
check();
