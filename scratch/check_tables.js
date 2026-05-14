
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['event_pricing', 'event_media', 'event_sync_logs', 'cache_invalidation_logs'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table}:`, error ? 'Error or Not Found' : 'Exists');
    if (error) console.log(`  Error: ${error.message}`);
  }
}

checkTables();
