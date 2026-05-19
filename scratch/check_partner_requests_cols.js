const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('partner_requests').select('*').limit(1);
  if (error) {
    console.error(error.message);
  } else {
    console.log("Column names:", Object.keys(data[0] || {}));
  }
}

check();
