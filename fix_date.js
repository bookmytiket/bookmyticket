import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  // Let's set the date to next month, July 10, 2026
  const dateStr = '2026-07-10';
  const timeStr = '06:00'; // 6 AM for marathon
  
  await supabase.from('events').update({
    date: dateStr,
    time: timeStr,
    start_date: dateStr,
    end_date: dateStr,
    featured: true // Feature it so it shows up at the top
  }).eq('id', eventId);

  await supabase.from('marathon_events').update({
    date: dateStr,
    time: timeStr
  }).eq('id', eventId);

  console.log("Updated date for Udumalpet Marathon");
}
check();
