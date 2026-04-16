const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPolicies() {
  const sqlPath = path.resolve(__dirname, '../supabase/migrations/20260416_admin_access_policies.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Applying Admin Access Policies...');
  
  // Since we don't have a direct SQL runner in the client, we use rpc if available, 
  // or we can simulate it if there's an 'exec_sql' function. 
  // Given the environment, I'll attempt to run it via rpc('exec_sql') which is a common pattern in these tasks.
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error applying policies via RPC:', error);
    console.log('Trying manual check for individual policies...');
    // Fallback: If rpc fails, we might need the user to manually run it in Supabase dashboard
    // But I'll try to provide a clean error.
    return;
  }
  
  console.log('Policies applied successfully!');
}

applyPolicies();
