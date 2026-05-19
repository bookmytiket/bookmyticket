const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('service_providers').select('*');
  if (error) {
    console.error("Error fetching service providers:", error.message);
  } else {
    console.log("Total service providers in DB:", data.length);
    console.log("Sample service providers:", data);
  }
}

check();
