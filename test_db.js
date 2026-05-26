import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('registration_fields').select('*').eq('event_id', '96d6f9ff-4604-41a7-bd1a-b13bf121be30');
  console.log("Data:", data, "Error:", error);
}
run();
