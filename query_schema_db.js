import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: eCols } = await supabase.rpc('get_columns', { table_name: 'events' });
  const { data: mCols } = await supabase.rpc('get_columns', { table_name: 'marathon_events' });
  const { data: mcCols } = await supabase.rpc('get_columns', { table_name: 'marathon_config' });
  
  if (eCols) console.log("Events cols:", eCols.map(c => c.column_name));
  else {
    // If RPC doesn't exist, just select one row to get keys
    const { data } = await supabase.from('events').select('*').limit(1);
    console.log("Events keys:", Object.keys(data[0]));
    
    const { data: d2 } = await supabase.from('marathon_events').select('*').limit(1);
    console.log("Marathon events keys:", Object.keys(d2[0]));
    
    const { data: d3 } = await supabase.from('marathon_config').select('*').limit(1);
    console.log("Marathon config keys:", Object.keys(d3[0]));
  }
}
check();
