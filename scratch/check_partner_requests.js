const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('partner_requests').select('*');
  if (error) {
    console.error("Error fetching partner requests:", error.message);
  } else {
    console.log("Total partner requests in DB:", data.length);
    console.log("Sample partner requests:", data.slice(0, 3));
  }
}

check();
