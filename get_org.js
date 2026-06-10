import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('events').select('organiser_id').eq('title', 'C3 RUN RIDERS CLUB').limit(1);
  if (data && data.length > 0) {
    const orgId = data[0].organiser_id;
    console.log("Organiser ID:", orgId);
    await supabase.from('events').update({ organiser_id: orgId }).eq('id', '87e2f9b4-9e5f-4afc-a499-49cb72d2263e');
    await supabase.from('marathon_events').update({ organiser_id: orgId }).eq('id', '87e2f9b4-9e5f-4afc-a499-49cb72d2263e');
    console.log("Updated organiser ID");
  }
}
check();
