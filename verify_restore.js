import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  
  const { data: eData } = await supabase.from('events').select('id, title').eq('id', eventId);
  console.log("Events:", eData);
  
  const { data: mData } = await supabase.from('marathon_events').select('id, title').eq('id', eventId);
  console.log("Marathon Events:", mData);

  const { data: mcData } = await supabase.from('marathon_config').select('id').eq('id', eventId);
  console.log("Marathon Config:", mcData);
}
check();
