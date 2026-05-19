const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('event_coupon_mapping')
    .select('*, partner_campaigns(*, partners(*))')
    .eq('event_id', '4aba9725-9b4b-4df4-85d6-9741d95abea5')
    .eq('is_enabled', true);
  
  if (error) {
    console.error("Join query failed:", error.message);
  } else {
    console.log("Success! Count:", data.length);
    console.log("Data:", JSON.stringify(data, null, 2));
  }
}

check();
