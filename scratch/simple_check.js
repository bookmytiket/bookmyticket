const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleCheck() {
    console.log("Checking tables...");

    const { data: reqs, error: reqError } = await supabase
        .from('professional_service_requests')
        .select('*')
        .limit(1);
    
    if (reqError) {
        console.error("professional_service_requests table error:", reqError);
    } else {
        console.log("professional_service_requests table accessed. Rows found:", reqs?.length);
    }

    const { data: admins, error: adminError } = await supabase
        .from('platform_admins')
        .select('*')
        .limit(1);
    
    if (adminError) {
        console.error("platform_admins table error:", adminError);
    } else {
        console.log("platform_admins table accessed. Rows found:", admins?.length);
    }
}

simpleCheck();
