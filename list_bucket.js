import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.storage.from('event-images').list('marathons/posters', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
  console.log(data);
}
check();
