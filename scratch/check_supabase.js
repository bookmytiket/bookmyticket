const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    // Check if turfs table exists
    const { data: turfs, error: turfError } = await supabase.from('turfs').select('count', { count: 'exact', head: true });
    if (turfError) {
      console.log("Turfs table check failed:", turfError.message);
    } else {
      console.log("Turfs table exists. Count:", turfs);
    }

    // Check service_providers
    const { data: providers, error: providerError } = await supabase.from('service_providers').select('category').limit(10);
    if (!providerError) {
      console.log("Service providers categories sample:", [...new Set(providers.map(p => p.category))]);
    }
  } catch (e) {
    console.error("Error checking Supabase:", e.message);
  }
}

checkTables();
