import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: eData } = await supabase.from('events').select('id, title, status, approval_status').ilike('title', '%உடுமலை பசுமை மாரத்தான்%');
  console.log("EVENTS:", eData);
  
  const { data: mData } = await supabase.from('marathon_events').select('id, title').ilike('title', '%உடுமலை பசுமை மாரத்தான்%');
  console.log("MARATHON_EVENTS:", mData);
}
check();
