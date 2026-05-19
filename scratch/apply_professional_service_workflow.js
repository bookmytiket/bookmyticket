const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const filePath = 'supabase/migrations/20260515_professional_service_workflow.sql';
    console.log(`Reading migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('Executing SQL via RPC exec_sql...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('Error applying migration:', error);
    } else {
        console.log('Migration applied successfully! Result:', data);
    }
}

applyMigration();
