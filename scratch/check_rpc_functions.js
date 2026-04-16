const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctions() {
  console.log('Checking for available RPC functions...');
  
  // We can't query pg_proc directly via standard select if RLS is on and no view exists,
  // but we can try to find common names.
  
  const commonNames = ['exec_sql', 'execute_sql', 'run_sql', 'query', 'sql'];
  
  for (const name of commonNames) {
    const { error } = await supabase.rpc(name, { query: 'SELECT 1' }).catch(err => ({ error: err }));
    if (!error || !error.message.includes('not found')) {
      console.log(`Found potential function: ${name}`);
      console.log('Error hint:', error);
    }
  }
  
  console.log('Finished checking common names.');
}

checkFunctions();
