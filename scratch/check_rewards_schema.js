const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const tables = ['partners', 'partner_campaigns', 'event_coupon_mapping', 'coupon_inventory', 'user_coupon_rewards'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error on ${table}:`, error.message);
    } else {
      console.log(`Columns for ${table}:`, data.length > 0 ? Object.keys(data[0]) : 'empty table');
      if (data.length > 0) {
        console.log(`Sample row for ${table}:`, data[0]);
      }
    }
  }
}

checkSchema();
