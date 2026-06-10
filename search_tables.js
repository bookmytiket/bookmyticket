import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const tables = ['events', 'marathon_events', 'marathon_config', 'tournament_events', 'bookings', 'event_reviews'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').eq('id', '87e2f9b4-9e5f-4afc-a499-49cb72d2263e');
    if (data && data.length > 0) {
      console.log(`FOUND IN ${t}:`, data);
    }
    const { data: d2 } = await supabase.from(t).select('*').eq('event_id', '87e2f9b4-9e5f-4afc-a499-49cb72d2263e');
    if (d2 && d2.length > 0) {
      console.log(`FOUND IN ${t} (event_id):`, d2);
    }
  }
}
check();
