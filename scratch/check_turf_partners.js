
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTurfPartners() {
    console.log("🔍 Checking Turf-related partners and requests...");

    try {
        // Check organiser_details
        const { data: organisers, error: orgErr } = await supabase
            .from('organiser_details')
            .select('*')
            .ilike('category', '%turf%');
        
        if (orgErr) console.error("Error fetching organisers:", orgErr.message);
        else console.log(`Found ${organisers.length} organisers with 'turf' category.`);

        // Check partner_requests
        const { data: requests, error: reqErr } = await supabase
            .from('partner_requests')
            .select('*')
            .ilike('category', '%turf%');
        
        if (reqErr) console.error("Error fetching requests:", reqErr.message);
        else console.log(`Found ${requests.length} partner requests with 'turf' category.`);

        // Log types
        console.log("\nOrganisers types:");
        organisers.forEach(o => console.log(`- ID: ${o.id}, Category: ${o.category}, Type: ${o.type}`));

        console.log("\nRequests types:");
        requests.forEach(r => console.log(`- Email: ${r.email}, Category: ${r.category}, Type: ${r.type}`));

    } catch (e) {
        console.error("Catch error:", e.message);
    }
}

checkTurfPartners();
