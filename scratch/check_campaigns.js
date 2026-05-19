const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking campaigns...");
  const { data, error } = await supabase.from('partner_campaigns').select('*');
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Campaigns:", data);
  }
}
check();
