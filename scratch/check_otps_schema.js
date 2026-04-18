
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log("Checking 'otps' table columns...");
    // We can use RPC or a simple query to see if it fails
    const { data, error } = await supabase
        .from('otps')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching from 'otps':", error);
    } else {
        console.log("Columns found:", data.length > 0 ? Object.keys(data[0]) : "No data to determine columns");
        
        // Try to specifically select 'phone'
        const { error: phoneError } = await supabase
            .from('otps')
            .select('phone')
            .limit(1);
        
        if (phoneError) {
            console.error("Error selecting 'phone' column:", phoneError.message);
        } else {
            console.log("'phone' column exists and is accessible.");
        }
    }
}

checkSchema();
