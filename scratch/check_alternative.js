const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPartnerRequests() {
    console.log("Checking partner_requests...");

    const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("partner_requests error:", error);
    } else {
        console.log("partner_requests found. Sample:", data);
    }
}

checkPartnerRequests();
