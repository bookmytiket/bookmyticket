const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdateWithId() {
    console.log("Fetching first organiser...");
    const { data: orgs, error: fErr } = await supabase.from('organisers').select('*').limit(1);
    if (!orgs.length) return;
    const org = orgs[0];
    
    console.log("Attempting to update organiser WITH id in payload...");
    const payload = { id: org.id, kyc_status: 'Active' };
    
    // Simulate useSupabaseMutation behavior
    let query = supabase.from('organisers').update(payload).select();
    query = query.eq('id', payload.id);
    
    const { data, error } = await query;
    if (error) {
        console.error("❌ Update failed:", error);
    } else {
        console.log("✅ Update success:", data);
    }
}
testUpdateWithId();
