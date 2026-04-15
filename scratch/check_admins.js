
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminsTable() {
    try {
        // Try to get one record to see if it even exists
        const { data, error } = await supabase.from('admins').select('*').limit(1);
        if (error) {
            console.error('Error selecting from admins table:', error.message);
        } else {
            console.log('Admins table exists. Sample record:', data);
        }

        // Try to run a raw SQL query to get table definition (if possible via RPC or just assume it works)
        // Since I can't run raw SQL directly via the client easily without an RPC, 
        // I'll try to insert a dummy and delete it if needed, or just trust the select.
    } catch (e) {
        console.error('Catch block error:', e.message);
    }
}

checkAdminsTable();
