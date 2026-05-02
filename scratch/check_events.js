import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('events').select('id, title, status, featured, trending').limit(10);
  console.log(JSON.stringify(data, null, 2));
}
test();
