const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Starting Realtime Sync Migration...');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260508_enable_realtime_sync.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Supabase JS client doesn't have a direct 'run raw sql' method in the public API 
  // EXCEPT via the 'rpc' method if a wrapper exists, or via a hidden endpoint.
  // However, we can use the 'postgres' connection if we had it.
  
  // ALTERNATIVE: Use the REST API to run SQL (only works with service role and if enabled)
  // Actually, the best way is to instruct the user to run it in the SQL Editor if this fails.
  
  console.log('Attempting to enable Realtime via RPC if available...');
  
  try {
    // Try to execute the SQL parts individually using the REST API if possible, 
    // but most production Supabase instances restrict this.
    // So we will try to use the 'rpc' method if the user has a 'exec_sql' function.
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.warn('RPC exec_sql failed. This is expected if you haven\'t created the helper function.');
      console.log('------------------------------------------------------------');
      console.log('PLEASE MANUALY RUN THE SQL IN THE SUPABASE SQL EDITOR:');
      console.log('File: supabase/migrations/20260508_enable_realtime_sync.sql');
      console.log('------------------------------------------------------------');
      console.log(sql);
      console.log('------------------------------------------------------------');
    } else {
      console.log('✅ Migration applied successfully via RPC!');
    }
  } catch (err) {
    console.error('Migration execution failed:', err);
  }
}

applyMigration();
