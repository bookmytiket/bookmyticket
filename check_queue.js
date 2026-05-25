const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('notification_queue').select('*');
  console.log("Queue count:", data?.length);
  if (data?.length > 0) {
     console.log("Sample:", JSON.stringify(data[0], null, 2));
  }
}
check();
