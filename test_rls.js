import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  const { data, error } = await supabase.from('events').delete().eq('id', eventId);
  console.log("Delete error:", error);
  console.log("Delete data:", data);
}
test();
