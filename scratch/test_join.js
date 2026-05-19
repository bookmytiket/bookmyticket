const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('service_providers')
    .select('*, profiles!service_providers_id_fkey(selected_city, full_name, email, phone)')
    .ilike('status', 'active');
  
  if (error) {
    console.error("Join service_providers_id_fkey failed:", error.message);
    // Let's try with default 'profiles' name:
    const { data: data2, error: error2 } = await supabase
      .from('service_providers')
      .select('*, profiles(selected_city, full_name, email, phone)')
      .ilike('status', 'active');
    
    if (error2) {
      console.error("Join default profiles failed:", error2.message);
    } else {
      console.log("Success with default profiles! Count:", data2.length);
      console.log("Sample:", data2[0]);
    }
  } else {
    console.log("Success with service_providers_id_fkey! Count:", data.length);
    console.log("Sample:", data[0]);
  }
}

check();
