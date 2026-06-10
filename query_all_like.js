import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: eData } = await supabase.from('events').select('id, title, category, event_type').ilike('title', '%உடுமலை%');
  console.log("EVENTS Table:", eData);
}
check();
