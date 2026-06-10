import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  // Let's set the date to June 20, 2026 so it shows in Coming Soon
  const dateStr = '2026-06-20';
  
  await supabase.from('events').update({
    date: dateStr,
    start_date: dateStr,
    end_date: dateStr,
    district: 'Coimbatore', // Ensure it shows when Coimbatore is selected
    city: 'Coimbatore'
  }).eq('id', eventId);

  await supabase.from('marathon_events').update({
    date: dateStr,
    district: 'Coimbatore',
    city: 'Coimbatore'
  }).eq('id', eventId);

  console.log("Updated date and city");
}
check();
