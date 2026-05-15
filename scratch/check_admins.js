const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmins() {
    console.log("Checking platform_admins table...");

    const { data: admins, error } = await supabase
        .from('platform_admins')
        .select('*, profiles:id(full_name, email, role)');
    
    if (error) {
        console.error("Error fetching platform_admins:", error);
    } else {
        console.log("Platform Admins found:", admins.length);
        admins.forEach(a => {
            console.log(`- ${a.profiles?.full_name || 'Unknown'} (${a.profiles?.email || 'N/A'}) - ID: ${a.id}`);
        });
    }

    // Also check the specific table policy target
    console.log("\nChecking RLS policy target table: professional_service_requests");
    const { count, error: reqError } = await supabase
        .from('professional_service_requests')
        .select('*', { count: 'exact', head: true });
    
    if (reqError) {
        console.error("Error with professional_service_requests:", reqError);
    } else {
        console.log("Table accessible with service role. Count:", count);
    }
}

checkAdmins();
