import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const eventId = '87e2f9b4-9e5f-4afc-a499-49cb72d2263e';
  
  await supabase.from('events').update({
    is_deleted: false,
    featured: true,
    is_spotlight: true,
    is_exclusive: true
  }).eq('id', eventId);

  console.log("Updated booleans");
}
check();
