const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log("Checking events table schema...");
    // We can't query information_schema directly via the client usually, 
    // but we can try to select the columns.
    const { data, error } = await supabaseAdmin.from('events').select('end_date, end_time').limit(1);
    
    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('column "end_date" does not exist')) {
            console.log("Migration NOT applied: columns 'end_date' or 'end_time' are missing.");
        } else {
            console.error("Error checking schema:", error);
        }
    } else {
        console.log("Migration ALREADY applied: columns exist.");
    }
}

checkSchema();
