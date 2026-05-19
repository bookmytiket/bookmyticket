const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const tables = [
    'professional_service_requests',
    'professional_service_profiles',
    'provider_services',
    'provider_bookings',
    'provider_earnings',
    'provider_reviews'
  ];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${table} does NOT exist or has error:`, error.message);
    } else {
      console.log(`✅ Table ${table} EXISTS! Row count or success sample:`, data);
    }
  }
}

check();
