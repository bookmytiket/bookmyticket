import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: eData } = await supabase.from('events').select('id, title, category, event_type').in('title', ['உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1', 'C3 RUN RIDERS CLUB']);
  console.log("EVENTS Table:", eData);
  
  const { data: mData } = await supabase.from('marathon_events').select('id, title').in('title', ['உடுமலை பசுமை மாரத்தான் - அத்தியாயம் 1', 'C3 RUN RIDERS CLUB']);
  console.log("MARATHON_EVENTS Table:", mData);
}
check();
