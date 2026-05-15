const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log("Checking database...");

    // 1. Check Table
    const { count, error: reqsError } = await supabase
        .from('professional_service_requests')
        .select('*', { count: 'exact', head: true });
    
    if (reqsError) {
        console.error("Error fetching professional_service_requests:", reqsError);
    } else {
        console.log("professional_service_requests table exists. Count:", count);
    }

    // 2. List all profiles to find "Admin User"
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');
    
    if (profError) {
        console.error("Error fetching profiles:", profError);
    } else {
        console.log("Profiles in system:");
        profiles.forEach(p => {
            console.log(`- ${p.full_name} (${p.email}) - Role: ${p.role} - ID: ${p.id}`);
        });
    }
}

checkDb();
