const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const organiserId = 'd9c3d7d2-e14f-42d8-ae75-9d5b30ce4d56';
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, publish_status, event_end_at, date')
    .eq('organiser_id', organiserId);
  
  console.log("Current time (now):", new Date().toISOString());
  console.log("Events:", events);
}
check();
