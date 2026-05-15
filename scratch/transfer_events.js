const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function transferOwnership() {
    const targetOrganiserId = '2e63bee1-0ca0-408a-83e9-bf4abb0b5782'; // Organiser Account ID
    
    console.log(`Transferring home page events to Organiser: ${targetOrganiserId}...`);
    
    const { data, error } = await supabase
        .from('events')
        .update({ organiser_id: targetOrganiserId })
        .in('title', ['Coimbatore Trophy', 'Pollachi Trophy 2026', 'Beyond Heights Vadavalli Marathon', 'Sunburn Arena ft. Alan Walker']);

    if (error) {
        console.error("Transfer failed:", error);
    } else {
        console.log("Transfer successful! Events should now appear in the Organiser Panel.");
    }
}

transferOwnership();
