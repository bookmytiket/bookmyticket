import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: eData, error } = await supabase.from('events').select('*').eq('id', '87e2f9b4-9e5f-4afc-a499-49cb72d2263e');
  console.log("EVENTS ERROR:", error);
  console.log("EVENTS TABLE:", eData);
  
  const { data: mData } = await supabase.from('marathon_events').select('*').eq('id', '87e2f9b4-9e5f-4afc-a499-49cb72d2263e');
  console.log("MARATHON_EVENTS TABLE:", mData);

  const { data: orgData } = await supabase.from('organisers').select('id, business_name, profiles(full_name)').ilike('business_name', '%TVK%');
  console.log("TVK ORGANISERS:", orgData);
  
  const { data: orgData2 } = await supabase.from('organisers').select('id, business_name, profiles(full_name)');
  console.log("ALL ORGANISERS:", orgData2);
}
check();
