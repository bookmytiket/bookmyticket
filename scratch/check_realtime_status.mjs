import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the root .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealtime() {
  console.log('🔍 Checking Realtime status for tables...');

  // Query pg_publication_tables to see what is in the 'supabase_realtime' publication
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';"
  });

  if (error) {
    if (error.message.includes('function "execute_sql" does not exist')) {
        console.log('\n⚠️  Note: RPC "execute_sql" is not found. Trying alternative method via SQL query...');
        console.log('Please run the following in your Supabase SQL Editor to see enabled tables:');
        console.log("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';");
    } else {
        console.error('❌ Error checking Realtime status:', error.message);
    }
    return;
  }

  if (data && data.length > 0) {
    console.log('\n✅ Realtime is ENABLED for these tables:');
    data.forEach(row => console.log(` - ${row.tablename}`));
  } else {
    console.log('\n⚠️  No tables are currently enabled for Realtime.');
  }

  console.log('\n💡 To enable a table, run this in SQL Editor:');
  console.log("ALTER PUBLICATION supabase_realtime ADD TABLE your_table_name;");
}

checkRealtime();
